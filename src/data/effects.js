// EFFECTS is the single source of truth, shared by the hero demo and the showcase grid.
export const EFFECTS = [
  { name:'Particle Burst', color:'#7F77DD', tag:'PARTICLES', desc:'Colorful particles explode from fingertips', type:'burst' },
  { name:'Air Draw', color:'#D85A30', tag:'DRAWING', desc:'Draw glowing trails with your index finger', type:'trail' },
  { name:'Ripple Wave', color:'#1D9E75', tag:'TRACKING', desc:'Expanding color rings from hand position', type:'ripple' },
  { name:'Body Silhouette', color:'#D4537E', tag:'POSE', desc:'Glowing outline traces your full body pose', type:'silhouette' },
  { name:'Fire Trail', color:'#D85A30', tag:'PARTICLES', desc:'Fiery stream follows finger movement', type:'fire' },
  { name:'Confetti Burst', color:'#7F77DD', tag:'GESTURE', desc:'Clap gesture triggers confetti explosion', type:'confetti' },
  { name:'Star Field', color:'#4a8fd8', tag:'AMBIENT', desc:'Hand parts the stars as it moves', type:'stars' },
  { name:'Ink Splash', color:'#1D9E75', tag:'POSE', desc:'Pose triggers ink-style paint splash', type:'ink' },
  { name:'Glow Orbit', color:'#4a8fd8', tag:'AMBIENT', desc:'Glowing orbs orbit around your hand', type:'orbit' },
  { name:'Shockwave Pulse', color:'#D85A30', tag:'GESTURE', desc:'Fist pump sends out a single energy ring', type:'shockwave' },
  { name:'Rainbow Trail', color:'#D4537E', tag:'DRAWING', desc:'Multicolor trail follows your fingertip', type:'rainbow' },
  { name:'Smoke Wisp', color:'#1D9E75', tag:'AMBIENT', desc:'Soft smoke rises from your hand position', type:'smoke' },
  { name:'Ice Crystal', color:'#4a8fd8', tag:'PARTICLES', desc:'Crystalline shards form and shatter on cue', type:'ice' },
  { name:'Lightning Arc', color:'#7F77DD', tag:'GESTURE', desc:'Jagged lightning bolt snaps between hands', type:'lightning' },
  { name:'Bubble Float', color:'#1D9E75', tag:'AMBIENT', desc:'Soap bubbles drift up and pop near fingers', type:'bubble' },
  { name:'Neon Grid', color:'#D4537E', tag:'TRACKING', desc:'A neon grid warps as your hand passes over', type:'grid' },
  { name:'Petal Fall', color:'#D85A30', tag:'POSE', desc:'Flower petals fall and scatter from movement', type:'petal' },
  { name:'Aura Glow', color:'#7F77DD', tag:'POSE', desc:'A pulsing aura halo surrounds your silhouette', type:'aura' },
  { name:'Kamehameha Blast', color:'#4a8fd8', tag:'ANIME', desc:'Charge and fire a roaring energy beam from cupped hands', type:'kamehameha' },
  { name:'Sharingan Eye', color:'#D85A30', tag:'ANIME', desc:'A crimson eye with spinning tomoe locks onto your real eye', type:'sharingan', track:'eye' },
  { name:'Rasengan Swirl', color:'#1D9E75', tag:'ANIME', desc:'A spiraling chakra orb spins to life in your palm', type:'rasengan' },
  { name:'Super Saiyan Aura', color:'#d8a13a', tag:'ANIME', desc:'Golden aura erupts with crackling energy sparks', type:'saiyan' },
  { name:'Demon Breath', color:'#1D9E75', tag:'ANIME', desc:'Elemental breathing technique swirls around your strike', type:'demonbreath' },
  { name:'Repulsor Blast', color:'#d8a13a', tag:'MARVEL', desc:'Palm-mounted repulsor charges and fires a energy bolt', type:'repulsor' },
  { name:'Web Sling', color:'#D4537E', tag:'MARVEL', desc:'A web shoots from your wrist and sticks with a trail', type:'web' },
  { name:'Mjolnir Lightning', color:'#7F77DD', tag:'MARVEL', desc:'Thunder crackles and lightning arcs around your fist', type:'mjolnir' },
  { name:'Shield Throw', color:'#4a8fd8', tag:'MARVEL', desc:'A vibranium shield spins and ricochets across the scene', type:'shield' },
  { name:'Infinity Snap', color:'#D85A30', tag:'MARVEL', desc:'Particles disintegrate to ash and drift away on a snap', type:'snap' },
];

// which body landmark each effect anchors to: 'hand' (palm center) or 'eye' (iris center). Defaults to 'hand'.
export const EFFECT_TRACK = {};
EFFECTS.forEach(fx => { EFFECT_TRACK[fx.type] = fx.track || 'hand'; });

export const EFFECT_COLOR = {};
EFFECTS.forEach(e => { EFFECT_COLOR[e.type] = e.color; });

export const EFFECT_CHARGE_SHAPE = { ice:'cross', confetti:'ellipse', petal:'ellipse', bubble:'ring', web:'ring' };
export function getChargeShape(fx){ return EFFECT_CHARGE_SHAPE[fx] || 'circle'; }

// release-blast visual style per effect — everything else falls back to a generic radial burst
export const BLAST_STYLE = {
  lightning:'bolt', mjolnir:'bolt',
  kamehameha:'nova', repulsor:'nova',
  ice:'shatter',
  fire:'flame', saiyan:'flame',
  web:'thread',
  shield:'ringburst',
  rasengan:'spiral', sharingan:'spiral', demonbreath:'spiral'
};

export const NO_SKELETON_EFFECTS = new Set(['silhouette','aura','grid','orbit','sharingan','shield','saiyan','rasengan']);
export const SINGLE_ANCHOR_EFFECTS = new Set(['stars','grid','silhouette']);

export const PARTICLE_EFFECT_TYPES = ['burst','fire','confetti','ink','smoke','ice','bubble','petal','saiyan','snap'];
export const WIND_HEAVY_TYPES = ['smoke','petal','bubble'];

export const PARTICLE_COLORS = ['#7F77DD','#D85A30','#1D9E75','#D4537E'];
