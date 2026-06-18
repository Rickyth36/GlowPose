import { EFFECT_TRACK } from '../data/effects.js';
import { state, webcamVideo, camStatus } from './heroState.js';

// MediaPipe is loaded dynamically (not bundled) so it doesn't block the initial page render.
// These are populated on first camera use and reused for the session.
let FilesetResolver, HandLandmarker, FaceLandmarker;
async function loadMediaPipe(){
  if(FilesetResolver) return;
  ({ FilesetResolver, HandLandmarker, FaceLandmarker } = await import('@mediapipe/tasks-vision'));
}

function simulatedEyePos(time){
  const cx = state.heroW * 0.5, cy = state.heroH * 0.4;
  const rx = state.heroW * 0.1, ry = state.heroH * 0.06;
  return {
    x: cx + Math.sin(time * 0.0013) * rx,
    y: cy + Math.sin(time * 0.0021) * ry * 0.6 + Math.cos(time*0.0009)*ry*0.4
  };
}

function simulatedHands(time){
  // simulate two hands moving in a loose figure-8, with one periodically "clenching" into a fist
  // and the other flashing a peace sign, to demo the gesture system even before the camera is on
  const cx = state.heroW * 0.5, cy = state.heroH * 0.5;
  const rx = state.heroW * 0.28, ry = state.heroH * 0.22;
  const hand1 = {
    x: cx + Math.sin(time * 0.0013) * rx,
    y: cy + Math.sin(time * 0.0021) * ry * 0.6 + Math.cos(time*0.0009)*ry*0.4
  };
  const hand2 = {
    x: cx - Math.sin(time * 0.0011 + 1.4) * rx * 0.85,
    y: cy + Math.cos(time * 0.0017 + 1.4) * ry * 0.7
  };
  const fistCycle = (time % 3400);
  hand1.fist = fistCycle > 2400 && fistCycle < 3000;
  hand1.gesture = hand1.fist ? 'fist' : 'none';
  hand2.fist = false;
  const gestureCycle = (time + 2000) % 5000;
  hand2.gesture = gestureCycle > 3800 && gestureCycle < 4300 ? 'peace' : 'none';
  return [hand1, hand2];
}

function trackedHands(time){
  if(state.cameraActive){
    return state.liveHands.map(h => ({ x: (1 - h.x) * state.heroW, y: h.y * state.heroH, fist: h.fist, gesture: h.gesture }));
  }
  return simulatedHands(time);
}

function trackedEye(time){
  if(state.cameraActive && state.liveEyeNorm){
    return { x: (1 - state.liveEyeNorm.x) * state.heroW, y: state.liveEyeNorm.y * state.heroH };
  }
  return simulatedEyePos(time);
}

// returns an array of {x,y,power,gesture} anchors for the active effect's track type.
// power > 1 means "fist clenched" — used to trigger the power-charge/blast system.
// gesture is one of 'none' | 'fist' | 'peace' | 'thumbsup' | 'pointing' | 'openpalm'.
export function trackedAnchors(time, fx){
  const trackType = EFFECT_TRACK[fx] || 'hand';
  if(trackType === 'eye'){
    const eye = trackedEye(time);
    return [{ x: eye.x, y: eye.y, power: 1, gesture: 'none' }];
  }
  return trackedHands(time).map(h => ({ x: h.x, y: h.y, power: h.fist ? 2.2 : 1, gesture: h.gesture || 'none' }));
}

/* ============================================================
   Real tracking via MediaPipe Tasks Vision. The library itself is bundled by Vite (no CDN
   dependency for the JS); only the WASM runtime is fetched at runtime, from our own
   /mediapipe/wasm (copied from node_modules by scripts/copy-mediapipe-wasm.js) rather than
   jsdelivr — so a CDN outage can't take down camera tracking. The .task model files still
   come from Google's official model hosting, which is the intended way to serve them.
============================================================ */
let visionFileset = null;
async function getVisionFileset(){
  if(!visionFileset){
    await loadMediaPipe();
    visionFileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
  }
  return visionFileset;
}

let handLandmarker = null;
let handLoading = false;
async function ensureHandLandmarker(){
  if(handLandmarker || handLoading) return;
  handLoading = true;
  const vision = await getVisionFileset();
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions:{
      modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate:'GPU'
    },
    runningMode:'VIDEO',
    numHands:2
  });
  handLoading = false;
}

let faceLandmarker = null;
let faceLoading = false;
async function ensureFaceLandmarker(){
  if(faceLandmarker || faceLoading) return;
  faceLoading = true;
  const vision = await getVisionFileset();
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions:{
      modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate:'GPU'
    },
    runningMode:'VIDEO',
    numFaces:1,
    outputFaceBlendshapes:false,
    outputFacialTransformationMatrixes:false
  });
  faceLoading = false;
}

function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }

// a finger is "extended" when its tip sits meaningfully farther from the wrist than its
// own knuckle (MCP) does — curled fingers fold back in toward the wrist instead.
// Each finger is checked individually (not averaged) so a single extended finger — like
// the index in "pointing" or the thumb in "thumbs up" — can't get smoothed away by the
// other three curled fingers and misread as a full fist.
function fingerExtended(lm, tipIdx, mcpIdx){
  return dist(lm[tipIdx], lm[0]) > dist(lm[mcpIdx], lm[0]) * 1.15;
}

function classifyGesture(lm){
  const indexExt = fingerExtended(lm, 8, 5);
  const middleExt = fingerExtended(lm, 12, 9);
  const ringExt = fingerExtended(lm, 16, 13);
  const pinkyExt = fingerExtended(lm, 20, 17);
  // the thumb moves sideways rather than up, so it's checked against the pinky's knuckle
  // (a thumb tucked into the palm stays close to it; an extended thumb swings away)
  const thumbExt = dist(lm[4], lm[17]) > dist(lm[2], lm[17]) * 1.1;

  const fourCurled = !indexExt && !middleExt && !ringExt && !pinkyExt;

  // "fist" and "thumbs up" look identical across all four fingers — the thumb is the
  // only thing that tells them apart, so it has to be checked first, not after
  if(fourCurled && thumbExt) return 'thumbsup';
  if(fourCurled) return 'fist';
  if(indexExt && middleExt && !ringExt && !pinkyExt) return 'peace';
  if(indexExt && !middleExt && !ringExt && !pinkyExt) return 'pointing';
  if(indexExt && middleExt && ringExt && pinkyExt) return 'openpalm';
  return 'none';
}

function palmCenter(lm){
  const palmPoints = [0, 5, 9, 13, 17].map(i => lm[i]);
  const x = palmPoints.reduce((s,p)=>s+p.x,0) / palmPoints.length;
  const y = palmPoints.reduce((s,p)=>s+p.y,0) / palmPoints.length;
  return { x, y };
}


// MediaPipe's detectForVideo() requires a strictly increasing timestamp per landmarker
// instance — two calls with the same (or an out-of-order) timestamp throw. That's rare but
// real, and without guarding against it, a single bad frame permanently kills the
// requestAnimationFrame loop, which looks exactly like "tracking just stops after a while."
let lastHandTs = 0;
let lastFaceTs = 0;
function nextTimestamp(last){
  const now = performance.now();
  return now > last ? now : last + 1;
}

// if a landmarker starts failing repeatedly (e.g. its GPU/WebGL context got lost after the
// tab sat open a long time), tear it down so ensureHandLandmarker/ensureFaceLandmarker
// rebuilds it fresh instead of staying permanently broken
const MAX_CONSECUTIVE_FAILURES = 5;
let handFailures = 0;
let faceFailures = 0;

function trackLandmarks(){
  if(!state.cameraActive){ state.trackingLoopRunning = false; return; }

  try {
    // load whichever landmarker the active effect needs, on demand
    const trackType = EFFECT_TRACK[state.currentEffect] || 'hand';
    if(trackType === 'eye') ensureFaceLandmarker();
    else ensureHandLandmarker();

    if(webcamVideo.readyState >= 2){
      if(handLandmarker){
        try {
          lastHandTs = nextTimestamp(lastHandTs);
          const result = handLandmarker.detectForVideo(webcamVideo, lastHandTs);
          if(result.landmarks && result.landmarks.length > 0){
            state.liveHands = result.landmarks.map(lm => {
              const center = palmCenter(lm);
              const gesture = classifyGesture(lm);
              return { x: center.x, y: center.y, fist: gesture === 'fist', gesture };
            });
          } else {
            state.liveHands = [];
          }
          handFailures = 0;
        } catch(handErr){
          console.warn('GlowPose: hand tracking frame skipped', handErr);
          handFailures++;
          if(handFailures >= MAX_CONSECUTIVE_FAILURES){
            console.warn('GlowPose: hand landmarker failing repeatedly, rebuilding it');
            try { handLandmarker.close(); } catch(_){ /* already broken, nothing to clean up */ }
            handLandmarker = null;
            handFailures = 0;
          }
        }
      }
      if(faceLandmarker){
        try {
          lastFaceTs = nextTimestamp(lastFaceTs);
          const result = faceLandmarker.detectForVideo(webcamVideo, lastFaceTs);
          if(result.faceLandmarks && result.faceLandmarks.length > 0){
            const lm = result.faceLandmarks[0];
            const rightIris = lm[468], leftIris = lm[473]; // iris centers (refined face mesh)
            state.liveEyeNorm = { x: (rightIris.x + leftIris.x) / 2, y: (rightIris.y + leftIris.y) / 2 };
          } else {
            state.liveEyeNorm = null;
          }
          faceFailures = 0;
        } catch(faceErr){
          console.warn('GlowPose: eye tracking frame skipped', faceErr);
          faceFailures++;
          if(faceFailures >= MAX_CONSECUTIVE_FAILURES){
            console.warn('GlowPose: face landmarker failing repeatedly, rebuilding it');
            try { faceLandmarker.close(); } catch(_){ /* already broken, nothing to clean up */ }
            faceLandmarker = null;
            faceFailures = 0;
          }
        }
      }
    }
    updateCamStatusLabel();
  } catch(err){
    // whatever else goes wrong, never let it kill the loop silently
    console.warn('GlowPose: tracking frame error', err);
  } finally {
    requestAnimationFrame(trackLandmarks);
  }
}

function updateCamStatusLabel(){
  const trackType = EFFECT_TRACK[state.currentEffect] || 'hand';
  let label;
  if(trackType === 'eye'){
    label = state.liveEyeNorm ? 'Live tracking — eye' : 'Looking for your eyes…';
  } else if(state.liveHands.length === 0){
    label = 'Looking for your hands…';
  } else {
    const fistCount = state.liveHands.filter(h=>h.fist).length;
    const activeGesture = state.liveHands.map(h=>h.gesture).find(g => g && g !== 'none' && g !== 'fist');
    const GESTURE_LABELS = { peace:'✌️ peace', thumbsup:'👍 thumbs up', pointing:'👉 pointing', openpalm:'✋ open palm' };
    label = `Live tracking — ${state.liveHands.length} hand${state.liveHands.length>1?'s':''}`
      + (fistCount>0 ? ' · power!' : '')
      + (activeGesture ? ` · ${GESTURE_LABELS[activeGesture]}` : '');
  }
  camStatus.lastChild.textContent = ' ' + label;
}

export function initCameraButton(){
  document.getElementById('enableCamBtn').addEventListener('click', async () => {
    const btn = document.getElementById('enableCamBtn');
    btn.textContent = '⏳ Starting camera…';
    try{
      // the stage displays 9:16 portrait on phones — request a matching portrait stream
      // there so the feed isn't cropped down from a landscape capture
      const isMobileStage = window.matchMedia('(max-width: 680px)').matches;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isMobileStage ? {
          facingMode:'user',
          width: { min: 720, ideal: 1080, max: 1080 },
          height: { min: 1280, ideal: 1920, max: 1920 },
          aspectRatio: { ideal: 9/16 }
        } : {
          facingMode:'user',
          width: { min: 1280, ideal: 1920, max: 1920 },
          height: { min: 720, ideal: 1080, max: 1080 },
          aspectRatio: { ideal: 16/9 }
        }
      });
      // "ideal" is only a hint — hardware may cap lower, so surface what we actually got
      const settings = stream.getVideoTracks()[0]?.getSettings();
      const resLabel = settings ? `${settings.width}×${settings.height}` : '';
      if(settings) console.log(`GlowPose: camera resolution negotiated at ${resLabel}`);
      webcamVideo.srcObject = stream;
      await webcamVideo.play();
      webcamVideo.classList.add('active');
      state.cameraActive = true;
      camStatus.classList.add('show');
      btn.textContent = resLabel ? `✅ Camera enabled at ${resLabel}` : '✅ Camera enabled — live tracking active';
      btn.disabled = true;
      if(!state.trackingLoopRunning){
        state.trackingLoopRunning = true;
        trackLandmarks();
      }
    }catch(err){
      btn.textContent = '⚠️ Camera permission denied';
    }
  });
}
