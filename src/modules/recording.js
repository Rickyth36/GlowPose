import { state, heroCanvas, stageEl, webcamVideo } from './heroState.js';

/* ============================================================
   RECORD & SHARE: capture a short clip of the camera + effect overlay
   (or just the effect animation in simulated mode) so people can
   download it and share it — this is what brings repeat visitors.
============================================================ */

const MAX_CLIP_MS = 30000;
const RECORD_BITRATE = 16_000_000; // 16 Mbps — high enough that the clip isn't visibly recompressed

// every format the browser actually supports gets offered — nothing is faked, since a format
// the browser can't encode can't be produced without server-side transcoding
const FORMAT_CANDIDATES = [
  { mime:'video/mp4;codecs=h264', label:'MP4 (H.264) — most compatible', ext:'mp4' },
  { mime:'video/mp4', label:'MP4', ext:'mp4' },
  { mime:'video/webm;codecs=vp9', label:'WebM (VP9) — best quality', ext:'webm' },
  { mime:'video/webm;codecs=vp8', label:'WebM (VP8)', ext:'webm' },
  { mime:'video/webm', label:'WebM', ext:'webm' }
];

const recordCanvas = document.createElement('canvas');
const rctx = recordCanvas.getContext('2d');

let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let recordCompositeLoop = null;
let lastClipUrl = null;
let recordTimerId = null;
let recordStartTime = 0;

function populateFormatOptions(formatSelect){
  const supported = FORMAT_CANDIDATES.filter(f => window.MediaRecorder && MediaRecorder.isTypeSupported(f.mime));
  const list = supported.length ? supported : [{ mime:'video/webm', label:'WebM', ext:'webm' }];
  formatSelect.innerHTML = list.map(f => `<option value="${f.mime}" data-ext="${f.ext}">${f.label}</option>`).join('');
}

function compositeRecordFrame(){
  const rect = stageEl.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = Math.round(rect.width * dpr), targetH = Math.round(rect.height * dpr);
  if(recordCanvas.width !== targetW || recordCanvas.height !== targetH){
    recordCanvas.width = targetW;
    recordCanvas.height = targetH;
  }
  const w = recordCanvas.width, h = recordCanvas.height;
  rctx.clearRect(0,0,w,h);
  // the live preview is mirrored (selfie-style) for natural on-screen feel, but the saved
  // clip should show your true left/right — like a normal video, not a mirror reflection.
  // the video is drawn un-mirrored here; the effect canvas's coordinate data is already
  // mirrored internally, so it gets flipped back once to cancel that out and stay aligned.
  if(state.cameraActive && webcamVideo.readyState >= 2){
    // smooth upscaling matters most when the camera's native resolution is lower than the canvas
    rctx.imageSmoothingEnabled = true;
    rctx.imageSmoothingQuality = 'high';
    rctx.drawImage(webcamVideo, 0,0, w,h);
  } else {
    rctx.fillStyle = '#05050a';
    rctx.fillRect(0,0,w,h);
  }
  rctx.save();
  rctx.translate(w,0); rctx.scale(-1,1);
  rctx.drawImage(heroCanvas, 0,0, w,h);
  rctx.restore();
  recordCompositeLoop = requestAnimationFrame(compositeRecordFrame);
}

export function initRecording(){
  const recordBtn = document.getElementById('recordBtn');
  const recIndicator = document.getElementById('recIndicator');
  const recResult = document.getElementById('recResult');
  const recPreview = document.getElementById('recPreview');
  const downloadClipBtn = document.getElementById('downloadClipBtn');
  const discardClipBtn = document.getElementById('discardClipBtn');
  const formatSelect = document.getElementById('formatSelect');
  const recTimeText = document.getElementById('recTimeText');

  populateFormatOptions(formatSelect);

  function startRecording(){
    if(isRecording) return;
    const rect = stageEl.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    recordCanvas.width = Math.round(rect.width * dpr);
    recordCanvas.height = Math.round(rect.height * dpr);
    compositeRecordFrame();

    const stream = recordCanvas.captureStream(30);
    const chosenOption = formatSelect.options[formatSelect.selectedIndex];
    const chosenMime = chosenOption ? chosenOption.value : 'video/webm';
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: chosenMime, videoBitsPerSecond: RECORD_BITRATE });
    formatSelect.disabled = true;
    mediaRecorder.ondataavailable = (e) => { if(e.data && e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      cancelAnimationFrame(recordCompositeLoop);
      const ext = chosenOption ? chosenOption.dataset.ext : 'webm';
      const blob = new Blob(recordedChunks, { type: chosenMime.split(';')[0] });
      if(lastClipUrl) URL.revokeObjectURL(lastClipUrl);
      lastClipUrl = URL.createObjectURL(blob);
      recPreview.src = lastClipUrl;
      downloadClipBtn.href = lastClipUrl;
      downloadClipBtn.download = `glowpose-clip.${ext}`;
      recResult.style.display = 'block';
      recResult.scrollIntoView({ behavior:'smooth', block:'nearest' });
      formatSelect.disabled = false;
    };
    mediaRecorder.start();
    isRecording = true;
    recordStartTime = performance.now();
    recordBtn.textContent = '■ Stop recording';
    recordBtn.classList.add('recording');
    recIndicator.classList.add('show');
    recTimeText.textContent = ` Recording… ${Math.ceil(MAX_CLIP_MS/1000)}s left`;
    recordTimerId = setInterval(()=>{
      const remaining = Math.max(0, MAX_CLIP_MS - (performance.now() - recordStartTime));
      recTimeText.textContent = ` Recording… ${Math.ceil(remaining/1000)}s left`;
      if(remaining <= 0) stopRecording();
    }, 250);
  }

  function stopRecording(){
    if(!isRecording) return;
    isRecording = false;
    if(recordTimerId){ clearInterval(recordTimerId); recordTimerId = null; }
    recordBtn.textContent = '⏺ Record a clip';
    recordBtn.classList.remove('recording');
    recIndicator.classList.remove('show');
    if(mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  }

  recordBtn.addEventListener('click', () => { isRecording ? stopRecording() : startRecording(); });

  discardClipBtn.addEventListener('click', () => {
    recResult.style.display = 'none';
    if(lastClipUrl){ URL.revokeObjectURL(lastClipUrl); lastClipUrl = null; }
    recPreview.removeAttribute('src');
  });
}
