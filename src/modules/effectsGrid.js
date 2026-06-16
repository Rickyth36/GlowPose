import { EFFECTS } from '../data/effects.js';
import { io } from './reveal.js';
import { selectHeroEffect } from './heroEngine.js';

export function initEffectsGrid(){
  const grid = document.getElementById('effectsGrid');

  EFFECTS.forEach((fx) => {
    const card = document.createElement('div');
    card.className = 'effect-card reveal';
    card.style.borderTopColor = fx.color;
    card.dataset.effect = fx.type;
    card.innerHTML = `
      <canvas data-type="${fx.type}" data-color="${fx.color}"></canvas>
      <div class="effect-card-body">
        <span class="badge-tag" style="background:${fx.color}22; color:${fx.color};">${fx.tag}</span>
        <h3 style="margin-top:10px;">${fx.name}</h3>
        <p>${fx.desc}</p>
        <span class="try-live-btn" style="color:${fx.color};">▶ Try it live</span>
      </div>
    `;
    card.addEventListener('click', () => selectHeroEffect(fx.type));
    grid.appendChild(card);
  });

  const moreCard = document.createElement('div');
  moreCard.className = 'more-card reveal';
  moreCard.innerHTML = `<h3>2 more effects →</h3><p style="color:var(--muted); font-size:14px;">Explore the full effect library and pick what fits your app.</p><a href="#code-section" class="pill-btn">View full library</a>`;
  grid.appendChild(moreCard);
  io.observe(moreCard);

  document.querySelectorAll('.effect-card').forEach(c => io.observe(c));
  document.querySelectorAll('.effect-card canvas').forEach(initMiniCanvas);
}

/* mini canvas animations for each showcase card — a small, self-contained preview loop per type */
function initMiniCanvas(canvas){
  const ctx = canvas.getContext('2d');
  const type = canvas.dataset.type;
  const color = canvas.dataset.color;
  let w, h;

  function resize(){
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = r.width; h = r.height;
  }
  resize();
  window.addEventListener('resize', resize);

  let particles = [];
  let trail = [];
  let frame = 0;

  function loop(time){
    frame++;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, w, h);
    const cx = w/2 + Math.sin(time*0.0017)*w*0.25;
    const cy = h/2 + Math.cos(time*0.0013)*h*0.2;

    if(type==='burst' || type==='confetti' || type==='fire' || type==='ink'){
      if(frame % 2 === 0){
        const angle = Math.random()*Math.PI*2;
        const speed = 0.6 + Math.random()*2;
        particles.push({x:cx,y:cy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1, size:1.5+Math.random()*2.5});
      }
      particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.life-=0.02; if(type==='fire') p.vy -= 0.02; });
      particles = particles.filter(p=>p.life>0);
      particles.forEach(p=>{
        ctx.globalAlpha = Math.max(p.life,0);
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    } else if(type==='trail'){
      trail.push({x:cx,y:cy,life:1});
      if(trail.length>60) trail.shift();
      trail.forEach(p=>p.life-=0.02);
      trail = trail.filter(p=>p.life>0);
      for(let i=1;i<trail.length;i++){
        ctx.strokeStyle = `${color}`;
        ctx.globalAlpha = trail[i].life;
        ctx.lineWidth = 2+trail[i].life*3;
        ctx.beginPath(); ctx.moveTo(trail[i-1].x,trail[i-1].y); ctx.lineTo(trail[i].x,trail[i].y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if(type==='ripple'){
      if(frame % 40 === 0) particles.push({x:cx,y:cy,r:2,life:1});
      particles.forEach(p=>{p.r+=1.6; p.life-=0.018;});
      particles = particles.filter(p=>p.life>0);
      particles.forEach(p=>{
        ctx.strokeStyle = color; ctx.globalAlpha = p.life; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    } else if(type==='silhouette'){
      ctx.save();
      ctx.translate(w/2, h/2);
      ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur=12; ctx.lineWidth=2.5;
      ctx.beginPath();
      ctx.arc(0,-h*0.26,h*0.08,0,Math.PI*2);
      ctx.moveTo(0,-h*0.18); ctx.lineTo(0,h*0.15);
      ctx.moveTo(-w*0.15,-h*0.02); ctx.lineTo(0,-h*0.08); ctx.lineTo(w*0.15,-h*0.02);
      ctx.moveTo(0,h*0.15); ctx.lineTo(-w*0.1,h*0.35);
      ctx.moveTo(0,h*0.15); ctx.lineTo(w*0.1,h*0.35);
      ctx.stroke();
      ctx.restore();
    } else if(type==='stars'){
      if(particles.length < 60){
        particles.push({x:Math.random()*w, y:Math.random()*h, life:1, size:Math.random()*1.5+0.5, tw:Math.random()*Math.PI*2});
      }
      particles.forEach(p=>{ p.tw += 0.05; });
      particles.forEach(p=>{
        ctx.globalAlpha = 0.4 + Math.sin(p.tw)*0.4;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha=1;
      ctx.fillStyle = color; ctx.globalAlpha=.8;
      ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
    } else if(type==='orbit'){
      const count = 5;
      ctx.fillStyle = color;
      for(let i=0;i<count;i++){
        const ang = time*0.0022 + (i/count)*Math.PI*2;
        const r = 22 + Math.sin(time*0.002+i)*4;
        const ox = cx + Math.cos(ang)*r*1.6;
        const oy = cy + Math.sin(ang)*r;
        ctx.globalAlpha = 0.5 + Math.sin(time*0.003+i)*0.3;
        ctx.beginPath(); ctx.arc(ox,oy,3,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=1;
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx,cy,3,0,Math.PI*2); ctx.fill();
    } else if(type==='shockwave'){
      if(frame % 55 === 0) particles.push({x:cx,y:cy,r:2,life:1});
      particles.forEach(p=>{p.r+=3.4; p.life-=0.02;});
      particles = particles.filter(p=>p.life>0);
      particles.forEach(p=>{
        ctx.strokeStyle = color; ctx.globalAlpha = p.life; ctx.lineWidth=4*p.life+1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.stroke();
      });
      ctx.globalAlpha=1;
    } else if(type==='rainbow'){
      trail.push({x:cx,y:cy,life:1,hue:(frame*4)%360});
      if(trail.length>60) trail.shift();
      trail.forEach(p=>p.life-=0.02);
      trail = trail.filter(p=>p.life>0);
      for(let i=1;i<trail.length;i++){
        ctx.strokeStyle = `hsla(${trail[i].hue},85%,65%,${trail[i].life})`;
        ctx.lineWidth = 2+trail[i].life*3;
        ctx.beginPath(); ctx.moveTo(trail[i-1].x,trail[i-1].y); ctx.lineTo(trail[i].x,trail[i].y); ctx.stroke();
      }
    } else if(type==='smoke'){
      if(frame % 3 === 0){
        particles.push({x:cx+(Math.random()-0.5)*10, y:cy, vx:(Math.random()-0.5)*0.3, vy:-0.6-Math.random()*0.5, life:1, size:4+Math.random()*5});
      }
      particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.size+=0.06; p.life-=0.013; });
      particles = particles.filter(p=>p.life>0);
      particles.forEach(p=>{
        ctx.globalAlpha = p.life*0.5; ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha=1;
    } else if(type==='ice'){
      if(frame % 45 === 0){
        for(let i=0;i<6;i++){
          const ang = (i/6)*Math.PI*2;
          particles.push({x:cx,y:cy,vx:Math.cos(ang)*1.4,vy:Math.sin(ang)*1.4,life:1,rot:ang});
        }
      }
      particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.life-=0.025; });
      particles = particles.filter(p=>p.life>0);
      particles.forEach(p=>{
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.life; ctx.strokeStyle = color; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(-5,0); ctx.lineTo(5,0); ctx.moveTo(0,-5); ctx.lineTo(0,5); ctx.stroke();
        ctx.restore();
      });
      ctx.globalAlpha=1;
    } else if(type==='lightning'){
      if(frame % 35 < 4){
        ctx.strokeStyle = color; ctx.lineWidth=2; ctx.globalAlpha=0.9;
        ctx.beginPath();
        let lx=w*0.15, ly=h*0.5;
        ctx.moveTo(lx,ly);
        while(lx < w*0.85){
          lx += 14+Math.random()*10;
          ly = h*0.5 + (Math.random()-0.5)*30;
          ctx.lineTo(lx,ly);
        }
        ctx.stroke();
      }
      ctx.globalAlpha=1;
    } else if(type==='bubble'){
      if(frame % 8 === 0){
        particles.push({x:cx+(Math.random()-0.5)*30, y:h, vy:-(0.6+Math.random()*0.8), life:1, size:3+Math.random()*5});
      }
      particles.forEach(p=>{ p.y+=p.vy; p.life-=0.012; });
      particles = particles.filter(p=>p.life>0);
      particles.forEach(p=>{
        ctx.globalAlpha = p.life*0.7; ctx.strokeStyle = color; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.stroke();
      });
      ctx.globalAlpha=1;
    } else if(type==='grid'){
      const spacing = 16;
      ctx.strokeStyle = color; ctx.globalAlpha=0.35; ctx.lineWidth=1;
      for(let gx=0; gx<=w; gx+=spacing){
        ctx.beginPath();
        for(let gy=0; gy<=h; gy+=4){
          const d = Math.hypot(gx-cx, gy-cy);
          const offset = Math.sin(d*0.05 - time*0.006) * 4;
          gy===0 ? ctx.moveTo(gx+offset, gy) : ctx.lineTo(gx+offset, gy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha=1;
    } else if(type==='petal'){
      if(frame % 10 === 0){
        particles.push({x:Math.random()*w, y:-5, vx:(Math.random()-0.5)*0.6, vy:0.6+Math.random()*0.6, rot:Math.random()*Math.PI*2, life:1});
      }
      particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.rot+=0.03; p.life-=0.012; });
      particles = particles.filter(p=>p.life>0 && p.y<h+10);
      particles.forEach(p=>{
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.life; ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(0,0,5,2.5,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
      });
      ctx.globalAlpha=1;
    } else if(type==='aura'){
      const pulse = 0.5 + Math.sin(time*0.003)*0.5;
      ctx.save();
      ctx.translate(w/2,h/2);
      const grad = ctx.createRadialGradient(0,0,4,0,0,h*0.4);
      grad.addColorStop(0, color+'cc');
      grad.addColorStop(1, color+'00');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.4 + pulse*0.3;
      ctx.beginPath(); ctx.arc(0,0,h*0.35,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      ctx.strokeStyle = color; ctx.lineWidth=2.5; ctx.shadowColor=color; ctx.shadowBlur=10;
      ctx.beginPath();
      ctx.arc(0,-h*0.22,h*0.07,0,Math.PI*2);
      ctx.moveTo(0,-h*0.15); ctx.lineTo(0,h*0.18);
      ctx.moveTo(-w*0.12,0); ctx.lineTo(0,-h*0.06); ctx.lineTo(w*0.12,0);
      ctx.moveTo(0,h*0.18); ctx.lineTo(-w*0.08,h*0.36);
      ctx.moveTo(0,h*0.18); ctx.lineTo(w*0.08,h*0.36);
      ctx.stroke();
      ctx.restore();
    } else if(type==='kamehameha'){
      const hx = w*0.18, hy = h*0.55;
      const charge = 0.5 + Math.sin(time*0.006)*0.5;
      const grad = ctx.createRadialGradient(hx,hy,2,hx,hy,10+charge*6);
      grad.addColorStop(0,'#fff'); grad.addColorStop(0.4,color); grad.addColorStop(1,color+'00');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(hx,hy,12+charge*6,0,Math.PI*2); ctx.fill();
      const beamLen = w*0.7;
      const bgrad = ctx.createLinearGradient(hx,hy,hx+beamLen,hy);
      bgrad.addColorStop(0,'#fff'); bgrad.addColorStop(0.3,color); bgrad.addColorStop(1,color+'00');
      ctx.fillStyle = bgrad;
      ctx.beginPath();
      ctx.moveTo(hx,hy-6); ctx.lineTo(hx+beamLen,hy-3+Math.sin(time*0.02)*2);
      ctx.lineTo(hx+beamLen,hy+3+Math.sin(time*0.02)*2); ctx.lineTo(hx,hy+6);
      ctx.fill();
    } else if(type==='sharingan'){
      ctx.save(); ctx.translate(cx,cy);
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0,0,h*0.22,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(0,0,h*0.06,0,Math.PI*2); ctx.fill();
      ctx.rotate(time*0.0015);
      for(let i=0;i<3;i++){
        const ang = (i/3)*Math.PI*2;
        const tx = Math.cos(ang)*h*0.13, ty = Math.sin(ang)*h*0.13;
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath(); ctx.arc(tx,ty,h*0.045,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    } else if(type==='rasengan'){
      ctx.save(); ctx.translate(cx,cy);
      for(let i=0;i<4;i++){
        ctx.rotate(time*0.006 + i*0.3);
        ctx.strokeStyle = color; ctx.globalAlpha = 0.6; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(0,0,h*0.22,h*0.1,0,0,Math.PI*1.4); ctx.stroke();
      }
      ctx.globalAlpha=1;
      const grad = ctx.createRadialGradient(0,0,2,0,0,h*0.12);
      grad.addColorStop(0,'#fff'); grad.addColorStop(1,color);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0,0,h*0.1,0,Math.PI*2); ctx.fill();
      ctx.restore();
    } else if(type==='saiyan'){
      if(frame % 4 === 0){
        const ang = Math.random()*Math.PI*2;
        particles.push({x:cx+Math.cos(ang)*h*0.15, y:cy+Math.sin(ang)*h*0.15, vx:Math.cos(ang)*1.2, vy:Math.sin(ang)*1.2-0.6, life:1, size:1.5});
      }
      particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.life-=0.03; });
      particles = particles.filter(p=>p.life>0);
      ctx.fillStyle = color; ctx.globalAlpha=0.5+Math.sin(time*0.01)*0.3;
      ctx.beginPath(); ctx.arc(cx,cy,h*0.2,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      particles.forEach(p=>{ ctx.fillStyle='#fff'; ctx.globalAlpha=p.life; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); });
      ctx.globalAlpha=1;
    } else if(type==='demonbreath'){
      ctx.save(); ctx.translate(cx,cy);
      for(let i=0;i<3;i++){
        ctx.rotate(0.5);
        ctx.strokeStyle = color; ctx.globalAlpha = 0.7 - i*0.2; ctx.lineWidth = 3-i*0.6;
        ctx.beginPath();
        for(let a=0; a<Math.PI*1.6; a+=0.2){
          const r = h*0.05 + a*h*0.04;
          const px = Math.cos(a+time*0.003)*r, py = Math.sin(a+time*0.003)*r;
          a===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
        }
        ctx.stroke();
      }
      ctx.restore(); ctx.globalAlpha=1;
    } else if(type==='repulsor'){
      const charge = 0.5+Math.sin(time*0.008)*0.5;
      const grad = ctx.createRadialGradient(cx,cy,2,cx,cy,h*0.22);
      grad.addColorStop(0,'#fff'); grad.addColorStop(0.5,color); grad.addColorStop(1,color+'00');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx,cy,h*0.16+charge*4,0,Math.PI*2); ctx.fill();
      if(frame % 50 < 4){
        particles.push({x:cx,y:cy,vx:4,vy:0,life:1,size:5});
      }
      particles.forEach(p=>{ p.x+=p.vx; p.life-=0.04; });
      particles = particles.filter(p=>p.life>0);
      particles.forEach(p=>{ ctx.globalAlpha=p.life; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); });
      ctx.globalAlpha=1;
    } else if(type==='web'){
      trail.push({x:cx,y:cy,life:1});
      if(trail.length>20) trail.shift();
      ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth=1.2; ctx.globalAlpha=0.8;
      for(let i=1;i<trail.length;i++){
        ctx.beginPath(); ctx.moveTo(trail[i-1].x,trail[i-1].y); ctx.lineTo(trail[i].x,trail[i].y); ctx.stroke();
        if(i % 3 === 0){
          ctx.beginPath(); ctx.moveTo(trail[i].x-4,trail[i].y-4); ctx.lineTo(trail[i].x+4,trail[i].y+4); ctx.stroke();
        }
      }
      ctx.globalAlpha=1;
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(cx,cy,3,0,Math.PI*2); ctx.fill();
    } else if(type==='mjolnir'){
      if(frame % 30 < 4){
        ctx.strokeStyle = color; ctx.lineWidth=2; ctx.globalAlpha=0.9; ctx.shadowColor=color; ctx.shadowBlur=10;
        ctx.beginPath();
        let lx=cx, ly=0;
        ctx.moveTo(lx,ly);
        while(ly<cy){ ly+=10+Math.random()*8; lx+=(Math.random()-0.5)*14; ctx.lineTo(lx,ly); }
        ctx.stroke(); ctx.shadowBlur=0;
      }
      ctx.globalAlpha=1; ctx.fillStyle=color;
      ctx.fillRect(cx-8,cy-4,16,8);
    } else if(type==='shield'){
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(time*0.004);
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0,0,h*0.2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0,0,h*0.14,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0,0,h*0.08,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0,0,h*0.03,0,Math.PI*2); ctx.fill();
      ctx.restore();
    } else if(type==='snap'){
      if(frame % 2 === 0) particles.push({x:cx+(Math.random()-0.5)*h*0.3, y:cy+(Math.random()-0.5)*h*0.3, vx:(Math.random()-0.5)*1.2, vy:-0.4-Math.random()*0.8, life:1, size:1+Math.random()*2});
      particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.life-=0.018; });
      particles = particles.filter(p=>p.life>0);
      particles.forEach(p=>{ ctx.globalAlpha=p.life; ctx.fillStyle=color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); });
      ctx.globalAlpha=1;
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
