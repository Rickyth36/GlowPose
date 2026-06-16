import { EFFECTS, EFFECT_TRACK, NO_SKELETON_EFFECTS, SINGLE_ANCHOR_EFFECTS } from '../data/effects.js';
import { state, hctx, resizeHero, resetHeroState } from './heroState.js';
import { trackedAnchors } from './tracking.js';
import { updateFistInteractions, updateAndDrawFistFX } from './fistCharge.js';
import { updateGestureFX, resetGestureFX } from './gestureFX.js';
import { drawEffectAtAnchor, drawLightningEffect } from './effectsRenderer.js';
import { drawHandSkeleton } from './particles.js';

function renderHero(time){
  try {
    state.heroFrame++;
    state.currentWind = Math.sin(time*0.0006)*0.35 + Math.sin(time*0.0013)*0.15;
    hctx.clearRect(0,0,state.heroW,state.heroH);
    if(!state.cameraActive){
      // subtle bg for the simulated preview (camera mode leaves canvas transparent over video)
      hctx.fillStyle = '#05050a';
      hctx.fillRect(0,0,state.heroW,state.heroH);
    }

    const fx = state.currentEffect;
    const anchors = trackedAnchors(time, fx);

    if(fx === 'lightning'){
      drawLightningEffect(time, anchors);
    } else if(SINGLE_ANCHOR_EFFECTS.has(fx)){
      drawEffectAtAnchor(fx, anchors[0], time);
    } else {
      anchors.forEach(tip => drawEffectAtAnchor(fx, tip, time));
    }

    // a clenched fist charges up particles matching the active effect, then blasts them
    // outward toward the viewer on release; joining both fists combines the charge into
    // one bigger combo blast
    if(EFFECT_TRACK[fx] !== 'eye'){
      updateFistInteractions(anchors, fx);
      updateGestureFX(anchors);
    }
    updateAndDrawFistFX();

    // overlay simplified hand skeleton (simulated mode only — real camera shows the actual hand)
    if(!state.cameraActive && !NO_SKELETON_EFFECTS.has(fx) && EFFECT_TRACK[fx] !== 'eye'){
      anchors.forEach(tip => drawHandSkeleton(hctx, tip));
    }
  } catch(err){
    // never let a single bad frame (e.g. a transient NaN from a fast effect switch) kill
    // the whole animation loop — log it and keep going
    console.warn('GlowPose: render frame error', err);
  } finally {
    requestAnimationFrame(renderHero);
  }
}

export function selectHeroEffect(type){
  state.currentEffect = type;
  resetHeroState();
  resetGestureFX();
  document.querySelectorAll('#heroTabs .effect-tab').forEach(b=>{
    b.classList.toggle('active', b.dataset.effect === type);
  });
  document.getElementById('demo').scrollIntoView({ behavior:'smooth', block:'center' });
}

function buildHeroTabs(){
  // build hero tabs from the same EFFECTS list used by the showcase grid
  const heroTabsEl = document.getElementById('heroTabs');
  EFFECTS.forEach(fx=>{
    const btn = document.createElement('button');
    btn.className = 'effect-tab' + (fx.type === state.currentEffect ? ' active' : '');
    btn.dataset.effect = fx.type;
    btn.textContent = fx.name;
    btn.addEventListener('click', ()=> selectHeroEffect(fx.type));
    heroTabsEl.appendChild(btn);
  });
}

export function initHeroEngine(){
  buildHeroTabs();
  resizeHero();
  requestAnimationFrame(renderHero);
}
