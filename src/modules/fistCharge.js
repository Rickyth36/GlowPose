import { EFFECT_COLOR, BLAST_STYLE, getChargeShape } from '../data/effects.js';
import { state, hctx } from './heroState.js';
import { drawParticles, drawLightningBolt } from './particles.js';

// fist-charge system: while a hand is clenched, particles matching the active effect's
// own color/shape get pulled inward toward the fist with a jittery "vibration"; releasing
// the fist blasts everything that accumulated outward, styled to match that effect — a
// jagged lightning burst for Mjolnir/Lightning, a bright energy nova for Kamehameha/Repulsor,
// shattering shards for Ice, a flame plume for Fire/Saiyan, web threads for Web, an
// expanding tri-ring for Shield, and a spiral burst for Rasengan/Sharingan/Demon Breath.
// Bringing both fists together combines their charge into one bigger combo blast.

function chargeGlow(x, y, charge, color, radiusBase){
  hctx.save();
  hctx.globalCompositeOperation = 'lighter';
  const grad = hctx.createRadialGradient(x,y,2,x,y, radiusBase+charge*28);
  grad.addColorStop(0,'#fff'); grad.addColorStop(0.45,color); grad.addColorStop(1,'transparent');
  hctx.fillStyle = grad;
  // softer than a solid fill — reads as a haze of light rather than an opaque disc
  hctx.globalAlpha = 0.22 + charge*0.18;
  hctx.beginPath(); hctx.arc(x,y,radiusBase+charge*28,0,Math.PI*2); hctx.fill();
  hctx.globalAlpha = 1;
  hctx.restore();
}

function triggerEffectBlast(tip, fx, charge){
  const color = EFFECT_COLOR[fx] || '#7F77DD';
  const style = BLAST_STYLE[fx] || 'radial';
  const count = Math.round(18 + charge*70);

  if(style === 'bolt'){
    const boltCount = 5 + Math.round(charge*6);
    for(let i=0;i<boltCount;i++){
      const angle = Math.random()*Math.PI*2;
      const len = 60+charge*100;
      state.blastExtras.push({ kind:'bolt', x:tip.x, y:tip.y, x2: tip.x+Math.cos(angle)*len, y2: tip.y+Math.sin(angle)*len, life:1, decay:0.16, color:'#7F77DD' });
    }
  } else if(style === 'nova'){
    state.blastExtras.push({ kind:'nova', x:tip.x, y:tip.y, maxR: 90+charge*150, life:1, decay:0.05, color });
    for(let i=0;i<count;i++){
      const ang = Math.random()*Math.PI*2;
      const speed = 4+Math.random()*4+charge*5;
      state.fistParticles.push({ x:tip.x, y:tip.y, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed, life:1, decay:0.03, size:2+Math.random()*2.5, color: Math.random()<0.5?'#fff':color, shape:'circle', rot:0 });
    }
  } else if(style === 'shatter'){
    state.blastExtras.push({ kind:'frostring', x:tip.x, y:tip.y, maxR: 80+charge*110, life:1, decay:0.045 });
    for(let i=0;i<count;i++){
      const ang = Math.random()*Math.PI*2;
      const speed = 3+Math.random()*4+charge*4;
      state.fistParticles.push({ x:tip.x, y:tip.y, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed, life:1, decay:0.02, size:2+Math.random()*3, color:'#4a8fd8', shape:'cross', rot:ang });
    }
  } else if(style === 'flame'){
    for(let i=0;i<count;i++){
      const ang = -Math.PI/2 + (Math.random()-0.5)*1.5;
      const speed = 3+Math.random()*4+charge*4;
      const flicker = Math.random();
      const flameColor = flicker<0.25 ? '#fff5cc' : flicker<0.65 ? '#d8a13a' : '#D85A30';
      state.fistParticles.push({ x:tip.x, y:tip.y, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed-1, life:1, decay:0.025, size:2.5+Math.random()*3, color: flameColor, shape:'circle', rot:0, gravity:-0.02, growth:-0.025 });
    }
  } else if(style === 'thread'){
    const threadCount = 6 + Math.round(charge*7);
    for(let i=0;i<threadCount;i++){
      state.blastExtras.push({ kind:'thread', x:tip.x, y:tip.y, angle: Math.random()*Math.PI*2, len: 50+charge*100, life:1, decay:0.1 });
    }
  } else if(style === 'ringburst'){
    state.blastExtras.push({ kind:'shieldring', x:tip.x, y:tip.y, maxR: 90+charge*130, life:1, decay:0.04 });
  } else if(style === 'spiral'){
    for(let i=0;i<count;i++){
      const ang = (i/count)*Math.PI*8;
      const speed = 2+charge*3.5;
      state.fistParticles.push({ x:tip.x, y:tip.y, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed, life:1, decay:0.02, size:2+Math.random()*2, color, shape:'circle', rot:0 });
    }
  } else {
    const shape = getChargeShape(fx);
    for(let i=0;i<count;i++){
      const ang = Math.random()*Math.PI*2;
      const speed = 3.5 + Math.random()*4 + charge*4;
      state.fistParticles.push({ x:tip.x, y:tip.y, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed, life:1, decay:0.022+Math.random()*0.02, size:2+Math.random()*3+charge*2.5, color: Math.random()<0.4 ? '#fff' : color, shape, rot:0 });
    }
  }
  state.fistFlashes.push({ x:tip.x, y:tip.y, r:8, life:1 });
}

function updateFistChargeForHand(tip, idx, fx){
  if(!state.handCharge[idx]) state.handCharge[idx] = { charge: 0, prevFist: false };
  const hc = state.handCharge[idx];
  const isFist = tip.power > 1;
  const color = EFFECT_COLOR[fx] || '#7F77DD';
  const shape = getChargeShape(fx);

  if(isFist){
    // no hard cap — the longer you hold the fist, the bigger the eventual blast.
    // growth slows as charge climbs so it still feels like it's "maxing out" without ever truly stopping
    hc.charge += 0.03 / (1 + hc.charge * 0.6);

    // jittery glow at the fist — the "vibration" intensifies as charge builds
    const jitter = 2 + Math.min(hc.charge, 3) * 6;
    chargeGlow(tip.x + (Math.random()-0.5)*jitter, tip.y + (Math.random()-0.5)*jitter, Math.min(hc.charge, 3), color, 14);

    // particles drift in from a shrinking ring around the fist, converging on it
    if(state.heroFrame % 2 === 0){
      const ang = Math.random()*Math.PI*2;
      const startR = Math.max(15, 70 - hc.charge*20) + Math.random()*30;
      const sx = tip.x + Math.cos(ang)*startR;
      const sy = tip.y + Math.sin(ang)*startR;
      const speed = 1.2 + Math.min(hc.charge, 3)*2.4;
      state.fistParticles.push({
        x:sx, y:sy,
        vx:(tip.x-sx)/startR*speed, vy:(tip.y-sy)/startR*speed,
        life:1, decay:0.012, size:1.5+Math.random()*2.2, color, shape, rot:0
      });
    }
  } else if(hc.prevFist && hc.charge > 0.05){
    triggerEffectBlast(tip, fx, Math.min(hc.charge, 6));
    hc.charge = 0;
  } else {
    hc.charge = Math.max(0, hc.charge - 0.025);
  }
  hc.prevFist = isFist;
}

export function updateFistInteractions(anchors, fx){
  const bothFisted = anchors.length >= 2 && anchors[0].power > 1 && anchors[1].power > 1;
  const handDist = anchors.length >= 2 ? Math.hypot(anchors[0].x-anchors[1].x, anchors[0].y-anchors[1].y) : Infinity;
  const joined = bothFisted && handDist < state.heroW * 0.16;

  if(joined){
    if(!state.comboActive){
      state.comboCharge = (state.handCharge[0]?.charge || 0) + (state.handCharge[1]?.charge || 0);
      if(state.handCharge[0]) state.handCharge[0].charge = 0;
      if(state.handCharge[1]) state.handCharge[1].charge = 0;
    }
    state.comboActive = true;
    // no hard cap here either — keep holding the joined fists together for an even bigger payoff
    state.comboCharge += 0.05 / (1 + state.comboCharge * 0.5);
    state.lastComboMid = { x:(anchors[0].x+anchors[1].x)/2, y:(anchors[0].y+anchors[1].y)/2 };

    const color = EFFECT_COLOR[fx] || '#7F77DD';
    const visualCharge = Math.min(state.comboCharge, 4);
    const jitter = 3 + visualCharge*8;
    chargeGlow(state.lastComboMid.x + (Math.random()-0.5)*jitter, state.lastComboMid.y + (Math.random()-0.5)*jitter, visualCharge, color, 26);

    if(state.heroFrame % 2 === 0){
      const ang = Math.random()*Math.PI*2;
      const startR = Math.max(20, 95 - visualCharge*20) + Math.random()*40;
      const sx = state.lastComboMid.x + Math.cos(ang)*startR;
      const sy = state.lastComboMid.y + Math.sin(ang)*startR;
      const speed = 1.5 + visualCharge*2.6;
      state.fistParticles.push({
        x:sx, y:sy,
        vx:(state.lastComboMid.x-sx)/startR*speed, vy:(state.lastComboMid.y-sy)/startR*speed,
        life:1, decay:0.01, size:2+Math.random()*2.6, color, shape:getChargeShape(fx), rot:0
      });
    }
  } else if(state.comboActive && bothFisted){
    // hands pulled apart while still both clenched — split the combined charge back into
    // two independent charges instead of blasting, so the combo can be broken apart cleanly
    const half = state.comboCharge / 2;
    if(!state.handCharge[0]) state.handCharge[0] = { charge: 0, prevFist: true };
    if(!state.handCharge[1]) state.handCharge[1] = { charge: 0, prevFist: true };
    state.handCharge[0].charge = half;
    state.handCharge[1].charge = half;
    state.handCharge[0].prevFist = true;
    state.handCharge[1].prevFist = true;
    state.comboActive = false;
    state.comboCharge = 0;
    anchors.forEach((tip, idx) => updateFistChargeForHand(tip, idx, fx));
  } else {
    if(state.comboActive && state.comboCharge > 0.1 && state.lastComboMid){
      // a fist actually opened — combined power makes for one much bigger blast than either fist alone
      triggerEffectBlast(state.lastComboMid, fx, Math.min(state.comboCharge * 1.7, 9));
      state.fistFlashes.push({ x:state.lastComboMid.x, y:state.lastComboMid.y, r:14, life:1 });
      state.screenFlash = 0.45;
    }
    state.comboActive = false;
    state.comboCharge = 0;
    anchors.forEach((tip, idx) => updateFistChargeForHand(tip, idx, fx));
  }
}

function updateAndDrawBlastExtras(){
  state.blastExtras.forEach(e => { e.life -= e.decay; });
  state.blastExtras = state.blastExtras.filter(e => e.life > 0);
  state.blastExtras.forEach(e=>{
    hctx.save();
    hctx.globalAlpha = Math.max(e.life, 0);
    if(e.kind === 'bolt'){
      drawLightningBolt(hctx, e.x, e.y, e.x2, e.y2, e.color, e.life);
    } else if(e.kind === 'nova'){
      const r = e.maxR * (1 - e.life);
      const grad = hctx.createRadialGradient(e.x,e.y,2,e.x,e.y,Math.max(r,2));
      grad.addColorStop(0,'#fff'); grad.addColorStop(0.4, e.color); grad.addColorStop(1, e.color+'00');
      hctx.fillStyle = grad;
      hctx.beginPath(); hctx.arc(e.x,e.y,Math.max(r,2),0,Math.PI*2); hctx.fill();
    } else if(e.kind === 'frostring'){
      const r = e.maxR * (1 - e.life);
      hctx.strokeStyle = '#4a8fd8'; hctx.lineWidth = 3;
      hctx.beginPath(); hctx.arc(e.x,e.y,r,0,Math.PI*2); hctx.stroke();
    } else if(e.kind === 'thread'){
      hctx.strokeStyle = '#f0f0f0'; hctx.lineWidth = 1.4;
      const ex = e.x + Math.cos(e.angle)*e.len, ey = e.y + Math.sin(e.angle)*e.len;
      hctx.beginPath(); hctx.moveTo(e.x,e.y); hctx.lineTo(ex,ey); hctx.stroke();
    } else if(e.kind === 'shieldring'){
      const r = e.maxR * (1 - e.life);
      const ringColors = ['#4a8fd8','#fff','#D85A30'];
      hctx.strokeStyle = ringColors[Math.floor(r/14) % ringColors.length]; hctx.lineWidth = 4;
      hctx.beginPath(); hctx.arc(e.x,e.y,r,0,Math.PI*2); hctx.stroke();
    }
    hctx.restore();
  });
  hctx.globalAlpha = 1;
}

export function updateAndDrawFistFX(){
  state.fistParticles.forEach(p=>{ p.x += p.vx + state.currentWind*0.3; p.y += p.vy; p.vy += (p.gravity||0); p.life -= p.decay; p.size = Math.max(0.3, p.size + (p.growth||0)); });
  state.fistParticles = state.fistParticles.filter(p=>p.life>0);
  drawParticles(hctx, state.fistParticles);

  updateAndDrawBlastExtras();

  state.fistFlashes.forEach(f=>{ f.r += 7; f.life -= 0.05; });
  state.fistFlashes = state.fistFlashes.filter(f=>f.life>0);
  state.fistFlashes.forEach(f=>{
    hctx.globalAlpha = f.life;
    hctx.strokeStyle = '#fff';
    hctx.lineWidth = 3*f.life + 1;
    hctx.beginPath(); hctx.arc(f.x,f.y,f.r,0,Math.PI*2); hctx.stroke();
  });
  hctx.globalAlpha = 1;

  if(state.screenFlash > 0){
    hctx.globalAlpha = state.screenFlash;
    hctx.fillStyle = '#fff';
    hctx.fillRect(0,0,state.heroW,state.heroH);
    hctx.globalAlpha = 1;
    state.screenFlash -= 0.08;
  }
}
