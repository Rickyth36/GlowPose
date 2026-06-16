export function spawnParticle(x, y, opts){
  const angle = opts.angle !== undefined ? opts.angle : Math.random()*Math.PI*2;
  const speed = opts.speed !== undefined ? opts.speed : 0.5 + Math.random()*2.2;
  return Object.assign({
    x, y,
    vx: Math.cos(angle)*speed,
    vy: Math.sin(angle)*speed,
    life: 1,
    decay: 0.018,
    gravity: 0,
    growth: 0,
    rot: 0,
    spin: 0,
    size: 1.5 + Math.random()*2.5,
    color: '#7F77DD',
    shape: 'circle'
  }, opts);
}

export function drawParticles(ctx, list){
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; // additive blending — overlapping particles glow brighter, like real light/embers
  list.forEach(p=>{
    ctx.globalAlpha = Math.max(p.life,0);
    if(p.shape === 'cross'){
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.strokeStyle = p.color; ctx.lineWidth = 1.5;
      ctx.shadowColor = p.color; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(-p.size,0); ctx.lineTo(p.size,0); ctx.moveTo(0,-p.size); ctx.lineTo(0,p.size); ctx.stroke();
      ctx.restore();
    } else if(p.shape === 'ellipse'){
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.ellipse(0,0,p.size,p.size*0.5,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
    } else if(p.shape === 'ring'){
      ctx.strokeStyle = p.color; ctx.lineWidth = 1.5;
      ctx.shadowColor = p.color; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.stroke();
    } else {
      // soft radial glow instead of a flat dot — looks like a glowing ember/spark, not a sticker
      const r = Math.max(p.size*2.4, 1);
      const grad = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
      grad.addColorStop(0, p.color);
      grad.addColorStop(0.45, p.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill();
    }
  });
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawSilhouette(ctx, w, h, color, sway){
  const cx = w/2, cy = h/2;
  ctx.save();
  ctx.translate(cx+sway, cy);
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -h*0.28, h*0.07, 0, Math.PI*2);
  ctx.moveTo(0, -h*0.21); ctx.lineTo(0, h*0.12);
  ctx.moveTo(-w*0.12, -h*0.05); ctx.lineTo(0, -h*0.1); ctx.lineTo(w*0.12, -h*0.05);
  ctx.moveTo(0, h*0.12); ctx.lineTo(-w*0.09, h*0.3);
  ctx.moveTo(0, h*0.12); ctx.lineTo(w*0.09, h*0.3);
  ctx.stroke();
  ctx.restore();
}

export function drawHandSkeleton(ctx, tip){
  // a stylized simplified hand: wrist + 4 finger chains converging near tip
  const wrist = { x: tip.x - 40, y: tip.y + 90 };
  ctx.strokeStyle = 'rgba(127,119,221,0.6)';
  ctx.fillStyle = 'rgba(127,119,221,0.6)';
  ctx.lineWidth = 2;
  const fingers = 4;
  for(let i=0;i<fingers;i++){
    const spread = (i - (fingers-1)/2) * 18;
    const midx = wrist.x + spread*1.6 + (tip.x-wrist.x)*0.5;
    const midy = wrist.y + (tip.y-wrist.y)*0.5 - 10;
    const endx = tip.x + spread;
    const endy = tip.y + (i===1? -6: i*2);
    ctx.beginPath();
    ctx.moveTo(wrist.x, wrist.y);
    ctx.quadraticCurveTo(midx, midy, endx, endy);
    ctx.stroke();
    [[wrist.x,wrist.y],[midx,midy],[endx,endy]].forEach(p=>{
      ctx.beginPath(); ctx.arc(p[0],p[1],3,0,Math.PI*2); ctx.fill();
    });
  }
  ctx.beginPath(); ctx.arc(wrist.x, wrist.y, 5,0,Math.PI*2); ctx.fill();
}

// a proper "thunder" look: a soft violet halo underneath a jagged white-hot core, with a
// couple of stray forks branching off — instead of a single flat line
export function drawLightningBolt(ctx, x1, y1, x2, y2, color, intensity){
  intensity = intensity === undefined ? 1 : intensity;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const segs = 9;
  const pts = [{x:x1,y:y1}];
  for(let i=1;i<segs;i++){
    const t = i/segs;
    pts.push({
      x: x1 + (x2-x1)*t + (Math.random()-0.5)*26,
      y: y1 + (y2-y1)*t + (Math.random()-0.5)*26
    });
  }
  pts.push({x:x2,y:y2});

  const tracePath = () => {
    ctx.beginPath();
    pts.forEach((p,i)=> i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
  };

  // soft glow halo underneath
  ctx.shadowColor = color; ctx.shadowBlur = 22;
  ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.globalAlpha = 0.22 * intensity;
  tracePath(); ctx.stroke();

  // bright violet core
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2.4; ctx.globalAlpha = 0.65 * intensity;
  tracePath(); ctx.stroke();

  // white-hot center line
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.85 * intensity;
  tracePath(); ctx.stroke();

  // a couple of stray forks branching off the main bolt
  for(let b=0; b<2; b++){
    const idx = 2 + Math.floor(Math.random()*(pts.length-4));
    const origin = pts[idx];
    const bx = origin.x + (Math.random()-0.5)*50;
    const by = origin.y + (Math.random()-0.5)*50;
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.4 * intensity;
    ctx.beginPath(); ctx.moveTo(origin.x,origin.y); ctx.lineTo(bx,by); ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
