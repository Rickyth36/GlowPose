import { PARTICLE_COLORS } from '../data/effects.js';
import { state, hctx } from './heroState.js';
import { drawParticles } from './particles.js';

// Universal gesture reactions — layered on top of whatever effect is active, independent
// of the fist-charge system and the per-effect particle pools:
//   ✌️ peace sign   → one-shot confetti burst
//   👍 thumbs up    → a few hearts float upward
//   ✋ open palm    → a single fast "force push" ring
//   👉 pointing     → a laser beam, drawn continuously while held
const prevGesture = [];

function triggerConfetti(tip){
  for(let i=0;i<26;i++){
    const ang = Math.random()*Math.PI*2;
    const speed = 1.5 + Math.random()*3.5;
    state.gestureParticles.push({
      x:tip.x, y:tip.y, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed,
      life:1, decay:0.014, gravity:0.05, size:3+Math.random()*2,
      color: PARTICLE_COLORS[Math.floor(Math.random()*PARTICLE_COLORS.length)],
      shape:'ellipse', rot:Math.random()*Math.PI*2, spin:(Math.random()-0.5)*0.3
    });
  }
}

function triggerHearts(tip){
  for(let i=0;i<8;i++){
    state.gestureParticles.push({
      x:tip.x+(Math.random()-0.5)*30, y:tip.y, vx:(Math.random()-0.5)*0.4, vy:-1.2-Math.random()*0.8,
      life:1, decay:0.012, gravity:0, size:4+Math.random()*3, color:'#D4537E', shape:'circle', rot:0
    });
  }
}

function triggerForcePush(tip){
  state.forceRings.push({ x:tip.x, y:tip.y, r:6, life:1, color:'#fff' });
}

function drawLaser(tip){
  const dir = tip.x > state.heroW/2 ? -1 : 1;
  const len = state.heroW*0.6;
  hctx.save();
  hctx.globalCompositeOperation = 'lighter';
  const grad = hctx.createLinearGradient(tip.x, tip.y, tip.x+len*dir, tip.y);
  grad.addColorStop(0,'#fff'); grad.addColorStop(0.4,'#D85A30'); grad.addColorStop(1,'#D85A3000');
  hctx.fillStyle = grad;
  hctx.beginPath();
  hctx.moveTo(tip.x, tip.y-3); hctx.lineTo(tip.x+len*dir, tip.y-1.5);
  hctx.lineTo(tip.x+len*dir, tip.y+1.5); hctx.lineTo(tip.x, tip.y+3);
  hctx.fill();
  hctx.restore();
}

export function updateGestureFX(anchors){
  anchors.forEach((tip, idx) => {
    const gesture = tip.gesture || 'none';
    const prev = prevGesture[idx] || 'none';

    if(gesture === 'pointing'){
      drawLaser(tip);
    }

    if(gesture !== prev){
      if(gesture === 'peace') triggerConfetti(tip);
      else if(gesture === 'thumbsup') triggerHearts(tip);
      else if(gesture === 'openpalm') triggerForcePush(tip);
    }
    prevGesture[idx] = gesture;
  });

  // converging/diverging particle pool, independent of the per-effect and fist-charge pools
  state.gestureParticles.forEach(p=>{
    p.x += p.vx + state.currentWind*0.3; p.y += p.vy; p.vy += (p.gravity||0); p.life -= p.decay;
  });
  state.gestureParticles = state.gestureParticles.filter(p=>p.life>0);
  drawParticles(hctx, state.gestureParticles);

  state.forceRings.forEach(r=>{ r.r += 10; r.life -= 0.025; });
  state.forceRings = state.forceRings.filter(r=>r.life>0);
  state.forceRings.forEach(r=>{
    hctx.globalAlpha = r.life;
    hctx.strokeStyle = r.color;
    hctx.lineWidth = 4*r.life + 1;
    hctx.beginPath(); hctx.arc(r.x,r.y,r.r,0,Math.PI*2); hctx.stroke();
  });
  hctx.globalAlpha = 1;
}

export function resetGestureFX(){
  prevGesture.length = 0;
}
