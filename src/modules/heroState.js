// DOM references for the hero/demo stage — queried once, never reassigned.
export const heroCanvas = document.getElementById('heroCanvas');
export const hctx = heroCanvas.getContext('2d');
export const stageEl = document.getElementById('stage');
export const webcamVideo = document.getElementById('webcamVideo');
export const camStatus = document.getElementById('camStatus');

// Mutable, shared engine state. Every hero submodule reads/writes properties on this single
// object instead of module-local `let` bindings, since ES module imports of reassigned
// primitives wouldn't stay in sync across files.
export const state = {
  currentEffect: 'burst',
  heroW: 0,
  heroH: 0,
  heroFrame: 0,
  currentWind: 0,

  cameraActive: false,
  liveHands: [],      // [{x,y,fist}] normalized 0-1 palm centers, from HandLandmarker (up to 2 hands)
  liveEyeNorm: null,  // {x,y} normalized 0-1 eye/iris center, from FaceLandmarker

  // generic particle stores reused across multiple effect types
  heroParticles: [],  // burst, fire, confetti, ink, smoke, ice, bubble, petal, saiyan, snap
  heroTrail: [],       // trail, rainbow, web
  heroRipples: [],     // ripple, shockwave
  heroStars: [],       // stars

  // fist-charge / blast / combo system
  handCharge: [],      // per-hand-index {charge: 0..1, prevFist: bool}
  fistParticles: [],   // converging-then-blasting particles, independent of the per-effect pools
  fistFlashes: [],      // bright release-flash rings
  blastExtras: [],      // styled one-shot blast visuals: bolts, novas, shatter rings, threads...
  comboCharge: 0,        // charge meter when both fists are joined together
  comboActive: false,
  lastComboMid: null,
  screenFlash: 0,         // brief whole-canvas flash for the big combo release

  // universal gesture reactions (peace sign, thumbs up, open palm, pointing) — layered on
  // top of whatever effect is active, independent of the per-effect particle pools
  gestureParticles: [],
  forceRings: [],

  trackingLoopRunning: false
};

export function sizeCanvas(c, ctx){
  const rect = c.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // capped to match the recording canvas's resolution
  c.width = rect.width * dpr;
  c.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: rect.width, h: rect.height };
}

export function resizeHero(){
  const s = sizeCanvas(heroCanvas, hctx);
  state.heroW = s.w; state.heroH = s.h;
}

window.addEventListener('resize', resizeHero);

export function resetHeroState(){
  state.heroParticles = []; state.heroTrail = []; state.heroRipples = [];
  state.fistParticles = []; state.fistFlashes = []; state.handCharge = [];
  state.blastExtras = []; state.comboCharge = 0; state.comboActive = false;
  state.lastComboMid = null; state.screenFlash = 0;
  state.gestureParticles = []; state.forceRings = [];
}
