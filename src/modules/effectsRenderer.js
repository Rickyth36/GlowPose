import { PARTICLE_EFFECT_TYPES, WIND_HEAVY_TYPES, PARTICLE_COLORS } from '../data/effects.js';
import { state, hctx } from './heroState.js';
import { spawnParticle, drawParticles, drawSilhouette, drawLightningBolt } from './particles.js';

export function drawLightningEffect(time, anchors){
  if(anchors.length >= 2){
    const a = anchors[0], b = anchors[1];
    if(state.heroFrame % 50 < 5) drawLightningBolt(hctx, a.x, a.y, b.x, b.y, '#7F77DD');
  } else {
    const tip = anchors[0];
    if(state.heroFrame % 50 < 5) drawLightningBolt(hctx, state.heroW*0.1, tip.y, tip.x, tip.y, '#7F77DD');
  }
}

export function drawEffectAtAnchor(fx, tip, time){
  if(fx === 'burst'){
    if(Math.random() < 0.9) state.heroParticles.push(spawnParticle(tip.x, tip.y, { color: PARTICLE_COLORS[Math.floor(Math.random()*PARTICLE_COLORS.length)], gravity:0.01, decay:0.018 }));
  } else if(fx === 'fire'){
    if(Math.random() < 0.9){
      const flicker = Math.random();
      const flameColor = flicker<0.25 ? '#fff5cc' : flicker<0.65 ? '#d8a13a' : '#D85A30';
      state.heroParticles.push(spawnParticle(tip.x, tip.y, { angle:-Math.PI/2+(Math.random()-0.5)*0.9, speed:0.8+Math.random()*1.8, color: flameColor, gravity:-0.018-Math.random()*0.01, decay:0.02+Math.random()*0.015, size:5+Math.random()*9, growth:-0.02 }));
    }
  } else if(fx === 'confetti'){
    if(Math.random() < 0.9) state.heroParticles.push(spawnParticle(tip.x, tip.y, { speed:1+Math.random()*3, color: PARTICLE_COLORS[Math.floor(Math.random()*PARTICLE_COLORS.length)], gravity:0.05, decay:0.012, shape:'ellipse', rot:Math.random()*Math.PI*2, spin:(Math.random()-0.5)*0.3, size:3+Math.random()*2 }));
  } else if(fx === 'ink'){
    if(Math.random() < 0.7) state.heroParticles.push(spawnParticle(tip.x, tip.y, { speed:0.3+Math.random()*1.2, color:'#1D9E75', gravity:0, decay:0.02, size:2+Math.random()*4 }));
  } else if(fx === 'smoke'){
    if(state.heroFrame % 3 === 0) state.heroParticles.push(spawnParticle(tip.x+(Math.random()-0.5)*16, tip.y, { vx:(Math.random()-0.5)*0.4, vy:-0.8-Math.random()*0.6, color:'#888780', decay:0.012, growth:0.08, size:4+Math.random()*5 }));
  } else if(fx === 'ice'){
    if(state.heroFrame % 40 === 0){
      for(let i=0;i<8;i++){
        const angle = (i/8)*Math.PI*2;
        state.heroParticles.push(spawnParticle(tip.x, tip.y, { angle, speed:1.6, color:'#4a8fd8', decay:0.022, shape:'cross', rot:angle, size:5 }));
      }
    }
  } else if(fx === 'bubble'){
    if(state.heroFrame % 6 === 0) state.heroParticles.push(spawnParticle(tip.x+(Math.random()-0.5)*40, tip.y, { vx:(Math.random()-0.5)*0.3, vy:-(0.7+Math.random()*0.9), color:'#1D9E75', decay:0.01, shape:'ring', size:4+Math.random()*6 }));
  } else if(fx === 'petal'){
    if(state.heroFrame % 8 === 0) state.heroParticles.push(spawnParticle(Math.random()*state.heroW, -5, { vx:(Math.random()-0.5)*0.6, vy:0.7+Math.random()*0.7, color:'#D85A30', decay:0.008, shape:'ellipse', rot:Math.random()*Math.PI*2, spin:0.03, size:6 }));
  } else if(fx === 'saiyan'){
    if(state.heroFrame % 2 === 0){
      const ang = Math.random()*Math.PI*2;
      state.heroParticles.push(spawnParticle(tip.x+Math.cos(ang)*40, tip.y+Math.sin(ang)*40, { vx:Math.cos(ang)*1.4, vy:Math.sin(ang)*1.4-0.6, color:'#fff', decay:0.03, size:1.5 }));
    }
  } else if(fx === 'snap'){
    if(state.heroFrame % 2 === 0) state.heroParticles.push(spawnParticle(tip.x+(Math.random()-0.5)*70, tip.y+(Math.random()-0.5)*70, { vx:(Math.random()-0.5)*1.2, vy:-0.5-Math.random()*0.9, color:'#D85A30', decay:0.016, size:1+Math.random()*2 }));
  }

  if(PARTICLE_EFFECT_TYPES.includes(fx)){
    // lighter particles (smoke, petals, bubbles) drift more in the ambient wind
    const windFactor = WIND_HEAVY_TYPES.includes(fx) ? 1 : 0.35;
    state.heroParticles.forEach(p=>{
      p.x += p.vx + state.currentWind*windFactor; p.y += p.vy; p.vy += p.gravity; p.life -= p.decay; p.size = Math.max(0.3, p.size + p.growth); p.rot += p.spin;
    });
    state.heroParticles = state.heroParticles.filter(p=> p.life>0 && p.y < state.heroH+20 && p.y > -20);
    drawParticles(hctx, state.heroParticles);
  }

  if(fx === 'trail'){
    state.heroTrail.push({x:tip.x, y:tip.y, life:1, color:'#D85A30'});
    if(state.heroTrail.length > 140) state.heroTrail.shift();
  } else if(fx === 'rainbow'){
    state.heroTrail.push({x:tip.x, y:tip.y, life:1, color:`hsl(${(state.heroFrame*4)%360},85%,65%)`});
    if(state.heroTrail.length > 100) state.heroTrail.shift();
  }
  if(fx === 'trail' || fx === 'rainbow'){
    state.heroTrail.forEach(p=> p.life -= 0.008);
    state.heroTrail = state.heroTrail.filter(p=>p.life>0);
    hctx.lineCap='round'; hctx.lineJoin='round';
    for(let i=1;i<state.heroTrail.length;i++){
      const a = state.heroTrail[i-1], b = state.heroTrail[i];
      hctx.globalAlpha = b.life;
      hctx.strokeStyle = b.color;
      hctx.lineWidth = 3 + b.life*4;
      hctx.beginPath(); hctx.moveTo(a.x,a.y); hctx.lineTo(b.x,b.y); hctx.stroke();
    }
    hctx.globalAlpha = 1;
  }

  if(fx === 'ripple'){
    if(state.heroFrame % 28 === 0) state.heroRipples.push({x:tip.x, y:tip.y, r:4, life:1, color:'#1D9E75', maxLine:2.5});
  } else if(fx === 'shockwave'){
    if(state.heroFrame % 70 === 0) state.heroRipples.push({x:tip.x, y:tip.y, r:4, life:1, color:'#D85A30', maxLine:5});
  }
  if(fx === 'ripple' || fx === 'shockwave'){
    state.heroRipples.forEach(r=>{ r.r += fx==='shockwave'?3.6:2.4; r.life -= fx==='shockwave'?0.018:0.014; });
    state.heroRipples = state.heroRipples.filter(r=>r.life>0);
    state.heroRipples.forEach(r=>{
      hctx.globalAlpha = r.life;
      hctx.strokeStyle = r.color;
      hctx.lineWidth = r.maxLine * r.life + 1;
      hctx.beginPath(); hctx.arc(r.x,r.y,r.r,0,Math.PI*2); hctx.stroke();
    });
    hctx.globalAlpha = 1;
  }

  if(fx === 'stars'){
    if(state.heroStars.length < 120){
      state.heroStars.push({x:Math.random()*state.heroW, y:Math.random()*state.heroH, size:Math.random()*1.6+0.5, tw:Math.random()*Math.PI*2});
    }
    state.heroStars.forEach(s=>{
      s.tw += 0.04;
      hctx.globalAlpha = 0.4 + Math.sin(s.tw)*0.4;
      hctx.fillStyle = '#fff';
      hctx.beginPath(); hctx.arc(s.x,s.y,s.size,0,Math.PI*2); hctx.fill();
    });
    hctx.globalAlpha = 1;
    hctx.fillStyle = '#4a8fd8';
    hctx.beginPath(); hctx.arc(tip.x,tip.y,5,0,Math.PI*2); hctx.fill();
  }

  if(fx === 'orbit'){
    const count = 6;
    hctx.fillStyle = '#4a8fd8';
    for(let i=0;i<count;i++){
      const ang = time*0.0022 + (i/count)*Math.PI*2;
      const r = 36 + Math.sin(time*0.002+i)*6;
      const ox = tip.x + Math.cos(ang)*r*1.6;
      const oy = tip.y + Math.sin(ang)*r;
      hctx.globalAlpha = 0.5 + Math.sin(time*0.003+i)*0.3;
      hctx.beginPath(); hctx.arc(ox,oy,4,0,Math.PI*2); hctx.fill();
    }
    hctx.globalAlpha = 1;
    hctx.fillStyle = '#fff';
    hctx.beginPath(); hctx.arc(tip.x,tip.y,4,0,Math.PI*2); hctx.fill();
  }

  if(fx === 'grid'){
    const spacing = 26;
    hctx.strokeStyle = '#D4537E'; hctx.globalAlpha = 0.35; hctx.lineWidth = 1;
    for(let gx=0; gx<=state.heroW; gx+=spacing){
      hctx.beginPath();
      for(let gy=0; gy<=state.heroH; gy+=6){
        const d = Math.hypot(gx-tip.x, gy-tip.y);
        const offset = Math.sin(d*0.04 - time*0.006) * 6;
        gy===0 ? hctx.moveTo(gx+offset, gy) : hctx.lineTo(gx+offset, gy);
      }
      hctx.stroke();
    }
    hctx.globalAlpha = 1;
  }

  if(fx === 'silhouette'){
    drawSilhouette(hctx, state.heroW, state.heroH, '#D4537E', Math.sin(time*0.0012)*14);
  }

  if(fx === 'aura'){
    const pulse = 0.5 + Math.sin(time*0.003)*0.5;
    hctx.save();
    const grad = hctx.createRadialGradient(tip.x,tip.y,6,tip.x,tip.y,state.heroH*0.3);
    grad.addColorStop(0, '#7F77DDcc');
    grad.addColorStop(1, '#7F77DD00');
    hctx.fillStyle = grad;
    hctx.globalAlpha = 0.4 + pulse*0.3;
    hctx.beginPath(); hctx.arc(tip.x,tip.y,state.heroH*0.28,0,Math.PI*2); hctx.fill();
    hctx.globalAlpha = 1;
    hctx.restore();
    drawSilhouette(hctx, state.heroW, state.heroH, '#7F77DD', 0);
  }

  if(fx === 'kamehameha'){
    const charge = 0.5 + Math.sin(time*0.006)*0.5;
    const grad = hctx.createRadialGradient(tip.x,tip.y,2,tip.x,tip.y,18+charge*10);
    grad.addColorStop(0,'#fff'); grad.addColorStop(0.4,'#4a8fd8'); grad.addColorStop(1,'#4a8fd800');
    hctx.fillStyle = grad;
    hctx.beginPath(); hctx.arc(tip.x,tip.y,20+charge*10,0,Math.PI*2); hctx.fill();
    const dir = tip.x > state.heroW/2 ? -1 : 1;
    const beamLen = state.heroW*0.55;
    const bgrad = hctx.createLinearGradient(tip.x,tip.y,tip.x+beamLen*dir,tip.y);
    bgrad.addColorStop(0,'#fff'); bgrad.addColorStop(0.3,'#4a8fd8'); bgrad.addColorStop(1,'#4a8fd800');
    hctx.fillStyle = bgrad;
    hctx.beginPath();
    hctx.moveTo(tip.x,tip.y-10); hctx.lineTo(tip.x+beamLen*dir,tip.y-5+Math.sin(time*0.02)*3);
    hctx.lineTo(tip.x+beamLen*dir,tip.y+5+Math.sin(time*0.02)*3); hctx.lineTo(tip.x,tip.y+10);
    hctx.fill();
  }

  if(fx === 'sharingan'){
    hctx.save(); hctx.translate(tip.x,tip.y);
    hctx.fillStyle = '#D85A30'; hctx.beginPath(); hctx.arc(0,0,38,0,Math.PI*2); hctx.fill();
    hctx.fillStyle = '#0a0a0a'; hctx.beginPath(); hctx.arc(0,0,11,0,Math.PI*2); hctx.fill();
    hctx.rotate(time*0.0015);
    for(let i=0;i<3;i++){
      const ang = (i/3)*Math.PI*2;
      hctx.fillStyle = '#0a0a0a';
      hctx.beginPath(); hctx.arc(Math.cos(ang)*22,Math.sin(ang)*22,8,0,Math.PI*2); hctx.fill();
    }
    hctx.restore();
  }

  if(fx === 'rasengan'){
    hctx.save(); hctx.translate(tip.x,tip.y);
    for(let i=0;i<4;i++){
      hctx.rotate(time*0.006 + i*0.3);
      hctx.strokeStyle = '#1D9E75'; hctx.globalAlpha = 0.6; hctx.lineWidth = 3;
      hctx.beginPath(); hctx.ellipse(0,0,38,18,0,0,Math.PI*1.4); hctx.stroke();
    }
    hctx.globalAlpha = 1;
    const grad = hctx.createRadialGradient(0,0,2,0,0,20);
    grad.addColorStop(0,'#fff'); grad.addColorStop(1,'#1D9E75');
    hctx.fillStyle = grad; hctx.beginPath(); hctx.arc(0,0,18,0,Math.PI*2); hctx.fill();
    hctx.restore();
  }

  if(fx === 'demonbreath'){
    hctx.save(); hctx.translate(tip.x,tip.y);
    for(let i=0;i<3;i++){
      hctx.rotate(0.5);
      hctx.strokeStyle = '#1D9E75'; hctx.globalAlpha = 0.7 - i*0.2; hctx.lineWidth = 3.5-i*0.7;
      hctx.beginPath();
      for(let a=0; a<Math.PI*1.6; a+=0.2){
        const r = 8 + a*16;
        const px = Math.cos(a+time*0.003)*r, py = Math.sin(a+time*0.003)*r;
        a===0 ? hctx.moveTo(px,py) : hctx.lineTo(px,py);
      }
      hctx.stroke();
    }
    hctx.restore(); hctx.globalAlpha = 1;
  }

  if(fx === 'repulsor'){
    const charge = 0.5+Math.sin(time*0.008)*0.5;
    const grad = hctx.createRadialGradient(tip.x,tip.y,2,tip.x,tip.y,40);
    grad.addColorStop(0,'#fff'); grad.addColorStop(0.5,'#d8a13a'); grad.addColorStop(1,'#d8a13a00');
    hctx.fillStyle = grad;
    hctx.beginPath(); hctx.arc(tip.x,tip.y,30+charge*8,0,Math.PI*2); hctx.fill();
    if(state.heroFrame % 60 < 5) state.heroParticles.push(spawnParticle(tip.x, tip.y, { vx:5, vy:0, color:'#fff', decay:0.035, size:6 }));
  }

  if(fx === 'web'){
    state.heroTrail.push({x:tip.x, y:tip.y, life:1, color:'#f0f0f0'});
    if(state.heroTrail.length>40) state.heroTrail.shift();
    state.heroTrail.forEach(p=>p.life-=0.018);
    state.heroTrail = state.heroTrail.filter(p=>p.life>0);
    hctx.strokeStyle = '#f0f0f0'; hctx.lineWidth=1.4;
    for(let i=1;i<state.heroTrail.length;i++){
      hctx.globalAlpha = state.heroTrail[i].life;
      hctx.beginPath(); hctx.moveTo(state.heroTrail[i-1].x,state.heroTrail[i-1].y); hctx.lineTo(state.heroTrail[i].x,state.heroTrail[i].y); hctx.stroke();
      if(i % 3 === 0){
        hctx.beginPath(); hctx.moveTo(state.heroTrail[i].x-6,state.heroTrail[i].y-6); hctx.lineTo(state.heroTrail[i].x+6,state.heroTrail[i].y+6); hctx.stroke();
      }
    }
    hctx.globalAlpha = 1;
  }

  if(fx === 'mjolnir'){
    if(state.heroFrame % 45 < 5) drawLightningBolt(hctx, tip.x, 0, tip.x, tip.y, '#7F77DD', 1.2);
    hctx.fillStyle = '#7F77DD';
    hctx.fillRect(tip.x-16,tip.y-8,32,16);
  }

  if(fx === 'shield'){
    hctx.save(); hctx.translate(tip.x,tip.y); hctx.rotate(time*0.004);
    hctx.fillStyle = '#4a8fd8'; hctx.beginPath(); hctx.arc(0,0,36,0,Math.PI*2); hctx.fill();
    hctx.fillStyle = '#fff'; hctx.beginPath(); hctx.arc(0,0,26,0,Math.PI*2); hctx.fill();
    hctx.fillStyle = '#D85A30'; hctx.beginPath(); hctx.arc(0,0,16,0,Math.PI*2); hctx.fill();
    hctx.fillStyle = '#fff'; hctx.beginPath(); hctx.arc(0,0,6,0,Math.PI*2); hctx.fill();
    hctx.restore();
  }

  if(fx === 'saiyan'){
    hctx.fillStyle = '#d8a13a'; hctx.globalAlpha = 0.4 + Math.sin(time*0.01)*0.25;
    hctx.beginPath(); hctx.arc(tip.x,tip.y,46,0,Math.PI*2); hctx.fill();
    hctx.globalAlpha = 1;
  }
}
