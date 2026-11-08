/* ============================================================
   PhotoShield Pro - Ultimate EXIF, Camera Settings & OSINT Engine
   ============================================================ */

const MAX_FILES = 20;
const state = { files: [], metadata: [], cleanedBlobs: [] };

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const resultsSection = document.getElementById('resultsSection');
const metadataOutput = document.getElementById('metadataOutput');
const aiOutput = document.getElementById('aiOutput');
const aiStatusText = document.getElementById('aiStatusText');
const aiStatusDot = document.getElementById('aiStatusDot');
const hashOutput = document.getElementById('hashOutput');
const gpsSection = document.getElementById('gpsSection');
const gpsLink = document.getElementById('gpsLink');

// Drag & Drop Events
['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('dropzone-hover'); }));
['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('dropzone-hover'); }));
dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => handleFiles(e.target.files));

// Tabs Logic
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
  });
});

// ==========================================
// 1. FILE HANDLING & EXTRACTION
// ==========================================
async function handleFiles(fileList) {
  const files = Array.from(fileList).slice(0, MAX_FILES);
  if (!files.length) return;

  state.files = files;
  state.metadata = [];
  
  resultsSection.classList.remove('hidden');
  metadataOutput.innerHTML = '<div class="flex items-center gap-3 text-purple-400"><i class="fa-solid fa-spinner fa-spin"></i> Deep Scanning all EXIF blocks...</div>';

  for (const file of files) {
    try {
      const data = await exifr.parse(file, {
        tiff: true, exif: true, gps: true, iptc: true, xmp: true, 
        jfif: true, ihdr: true, ifd0: true, ifd1: true, interop: true,
        makerNote: true, userComment: true, skip: [], 
        mergeOutput: true, translateKeys: true, translateValues: true, reviveValues: true
      }) || {};
      
      state.metadata.push({ name: file.name, data });
      
      const sha256 = await generateHashes(file);
      renderOSINT(data, sha256);
      
    } catch (err) {
      state.metadata.push({ name: file.name, error: err.message });
    }
  }

  renderAdvancedMetadata();
  runAIAnalysis();
}

// ==========================================
// 2. UTILITIES (Formatting EXIF values)
// ==========================================
function analyzeImageType(md) {
  const make = md.Make || '';
  const software = md.Software || '';
  
  if (!make && !software) return { type: 'Screenshot / Stripped', icon: 'fa-mobile-screen', color: 'text-yellow-400' };
  if (software.toLowerCase().includes('whatsapp') || software.toLowerCase().includes('instagram')) return { type: 'Social Media (Compressed)', icon: 'fa-hashtag', color: 'text-blue-400' };
  if (software.toLowerCase().includes('photoshop') || software.toLowerCase().includes('snapseed')) return { type: 'Edited (Photoshop/Snapseed)', icon: 'fa-wand-magic-sparkles', color: 'text-pink-400' };
  return { type: 'Original Camera Photo', icon: 'fa-camera', color: 'text-green-400' };
}

function formatShutter(exposureTime) {
  if (!exposureTime) return 'N/A';
  if (exposureTime >= 1) return `${exposureTime}s`;
  return `1/${Math.round(1 / exposureTime)}s`;
}

function formatFlash(flash) {
  if (flash === undefined) return 'N/A';
  return flash === 0 ? 'No Flash' : 'Flashed';
}

// ==========================================
// 3. SMART METADATA UI (Fully Loaded)
// ==========================================
function renderAdvancedMetadata() {
  metadataOutput.innerHTML = state.metadata.map(entry => {
    if (entry.error) return `<div class="text-red-400">❌ ${entry.name}: ${entry.error}</div>`;
    
    const md = entry.data;
    const analysis = analyzeImageType(md);

    // Device Info
    const make = md.Make || 'Unknown';
    const model = md.Model || 'Unknown';
    const lens = md.LensModel || md.LensInfo || 'Unknown';
    
    // Camera Settings
    const iso = md.ISO || md.ISOSpeedRatings || 'N/A';
    const aperture = md.FNumber ? `f/${md.FNumber}` : 'N/A';
    const shutter = formatShutter(md.ExposureTime);
    const focal = md.FocalLength ? `${md.FocalLength}mm` : 'N/A';
    const flash = formatFlash(md.Flash);
    
    // Image Meta
    const width = md.ExifImageWidth || md.ImageWidth || 'N/A';
    const height = md.ExifImageHeight || md.ImageHeight || 'N/A';
    const software = md.Software || 'None';
    const date = md.DateTimeOriginal || md.CreateDate || 'Unknown';
    
    // GPS & OSINT Info
    const gps = (md.latitude && md.longitude) ? `${md.latitude.toFixed(6)}, ${md.longitude.toFixed(6)}` : 'Not Found';
    const artist = md.Artist || md.Creator;
    const copyright = md.Copyright;

    // If data is practically empty (Screenshot)
    if(Object.keys(md).length < 5) {
      return `
        <div class="bg-slate-800 rounded-lg p-5 mb-4 border border-slate-700">
          <h3 class="text-lg font-bold text-slate-300 mb-2"><i class="fa-solid fa-triangle-exclamation text-yellow-500"></i> ${entry.name}</h3>
          <p class="text-slate-400 text-sm">No EXIF data found. Ye ek <b>Screenshot</b> ya download ki gayi photo hai jiska metadata pehle hi delete ho chuka hai.</p>
        </div>
      `;
    }

    return `
      <div class="bg-slate-800/80 rounded-xl p-5 mb-6 border border-slate-700 shadow-lg fade-in">
        <div class="flex justify-between items-center border-b border-slate-600 pb-3 mb-4">
          <h3 class="text-lg font-bold text-purple-400 break-all"><i class="fa-regular fa-image"></i> ${entry.name}</h3>
          <span class="${analysis.color} font-bold text-xs bg-slate-900 px-3 py-1 rounded-full"><i class="fa-solid ${analysis.icon}"></i> ${analysis.type}</span>
        </div>
        
        <!-- DEVICE & SOFTWARE -->
        <div class="mb-4">
          <h4 class="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Device Info</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
             <div class="bg-slate-900 p-2 rounded-lg border border-slate-700">
                <p class="text-[10px] text-slate-500">Brand / Model</p>
                <p class="text-white text-sm truncate">${make} ${model}</p>
             </div>
             <div class="bg-slate-900 p-2 rounded-lg border border-slate-700">
                <p class="text-[10px] text-slate-500">Lens</p>
                <p class="text-white text-sm truncate">${lens}</p>
             </div>
             <div class="bg-slate-900 p-2 rounded-lg border border-slate-700">
                <p class="text-[10px] text-slate-500">Software</p>
                <p class="text-white text-sm truncate">${software}</p>
             </div>
             <div class="bg-slate-900 p-2 rounded-lg border border-slate-700">
                <p class="text-[10px] text-slate-500">Resolution</p>
                <p class="text-white text-sm truncate">${width} x ${height}</p>
             </div>
          </div>
        </div>

        <!-- CAMERA SETTINGS -->
        <div class="mb-4">
          <h4 class="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Camera Settings</h4>
          <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
             <div class="bg-slate-900 p-2 rounded-lg border border-slate-700 text-center">
                <p class="text-[10px] text-slate-500">ISO</p>
                <p class="text-white text-sm font-bold">${iso}</p>
             </div>
             <div class="bg-slate-900 p-2 rounded-lg border border-slate-700 text-center">
                <p class="text-[10px] text-slate-500">Aperture</p>
                <p class="text-white text-sm font-bold">${aperture}</p>
             </div>
             <div class="bg-slate-900 p-2 rounded-lg border border-slate-700 text-center">
                <p class="text-[10px] text-slate-500">Shutter</p>
                <p class="text-white text-sm font-bold">${shutter}</p>
             </div>
             <div class="bg-slate-900 p-2 rounded-lg border border-slate-700 text-center">
                <p class="text-[10px] text-slate-500">Focal Length</p>
                <p class="text-white text-sm font-bold">${focal}</p>
             </div>
             <div class="bg-slate-900 p-2 rounded-lg border border-slate-700 text-center">
                <p class="text-[10px] text-slate-500">Flash</p>
                <p class="text-white text-sm font-bold">${flash}</p>
             </div>
          </div>
        </div>

        <!-- DATE & LOCATION -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <div class="bg-slate-900 p-3 rounded-lg border border-slate-700">
            <p class="text-[10px] text-slate-500 uppercase">Date & Time Taken</p>
            <p class="text-white text-sm"><i class="fa-regular fa-calendar text-purple-400"></i> ${date}</p>
          </div>
          
          <div class="bg-slate-900 p-3 rounded-lg border border-slate-700">
            <p class="text-[10px] text-slate-500 uppercase">GPS Location</p>
            <p class="text-white text-sm"><i class="fa-solid fa-location-dot text-red-400"></i> ${gps}</p>
            ${md.latitude ? `<a href="https://www.google.com/maps?q=${md.latitude},${md.longitude}" target="_blank" class="text-xs text-blue-400 hover:underline">Open Map &nearr;</a>` : ''}
          </div>
        </div>

        <!-- ADVANCED OSINT (Artist/Copyright) -->
        ${(artist || copyright) ? `
        <div class="bg-purple-900/20 p-3 rounded-lg border border-purple-500/30 mb-4">
           <p class="text-xs font-semibold text-purple-300 mb-1"><i class="fa-solid fa-user-secret"></i> Identity Found in Metadata</p>
           ${artist ? `<p class="text-sm text-white">Artist: <a href="https://www.google.com/search?q=${encodeURIComponent(artist)}" target="_blank" class="text-blue-400 hover:underline">${artist}</a></p>` : ''}
           ${copyright ? `<p class="text-sm text-white">Copyright: <a href="https://www.google.com/search?q=${encodeURIComponent(copyright)}" target="_blank" class="text-blue-400 hover:underline">${copyright}</a></p>` : ''}
        </div>
        ` : ''}

        <!-- RAW JSON -->
        <details class="mt-4">
          <summary class="cursor-pointer text-xs text-slate-400 hover:text-purple-300 font-semibold"><i class="fa-solid fa-code"></i> View All Raw Technical Tags</summary>
          <div class="mt-2 bg-black/60 p-4 rounded-lg overflow-x-auto max-h-60 text-[10px] font-mono text-green-400">
            <pre>${JSON.stringify(md, null, 2)}</pre>
          </div>
        </details>
      </div>
    `;
  }).join('');
}

// ==========================================
// 4. OSINT TOOLS (Hashes & Search)
// ==========================================
async function generateHashes(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function renderOSINT(metadata, sha256) {
  hashOutput.innerHTML = `
    <div class="bg-slate-900 p-3 rounded-lg mb-2">
      <span class="text-purple-400 font-bold text-xs">SHA-256 Hash:</span><br/>
      <span class="text-white text-[10px] select-all break-all font-mono">${sha256}</span>
    </div>
  `;

  if (metadata && metadata.latitude && metadata.longitude) {
    gpsSection.style.display = 'block';
    gpsLink.href = `https://www.google.com/maps?q=${metadata.latitude},${metadata.longitude}`;
  } else {
    gpsSection.style.display = 'none';
  }
}

// ==========================================
// 5. LOCAL AI ENGINE
// ==========================================
let aiPipeline = null;
async function runAIAnalysis() {
  aiStatusText.innerText = "Loading AI...";
  aiStatusDot.className = "w-3 h-3 rounded-full bg-yellow-500 animate-pulse";
  aiOutput.innerHTML = "<span class='text-slate-500'>AI text-model load ho raha hai (WASM). Mobile par 15-20s lagenge...</span>";

  try {
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
    env.allowLocalModels = false;

    if (!aiPipeline) {
      aiPipeline = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-77M');
    }

    aiStatusText.innerText = "AI Ready. Analyzing...";
    aiStatusDot.className = "w-3 h-3 rounded-full bg-green-500";
    
    const firstMeta = state.metadata[0]?.data || {};
    const metaString = JSON.stringify({
       Device: (firstMeta.Make || '') + ' ' + (firstMeta.Model || ''),
       GPS: firstMeta.latitude ? 'Yes' : 'No',
       Date: firstMeta.DateTimeOriginal || 'Unknown'
    });
    
    const prompt = `You are a cybersecurity AI. Give a 2-line privacy warning for a photo taken with: ${metaString}.`;

    const result = await aiPipeline(prompt, { max_new_tokens: 60 });
    
    aiOutput.innerHTML = `
      <div class="bg-slate-900 p-4 rounded-lg border border-purple-500/30">
         <div class="text-green-400 font-bold mb-2"><i class="fa-solid fa-shield-check"></i> AI Report:</div>
         <div class="text-slate-300 whitespace-pre-wrap text-sm">${result[0].generated_text}</div>
      </div>
    `;

  } catch (err) {
    aiStatusText.innerText = "AI Failed.";
    aiStatusDot.className = "w-3 h-3 rounded-full bg-red-500";
    aiOutput.innerHTML = `<span class="text-red-400 text-sm">Error: ${err.message}.</span>`;
  }
}

// ==========================================
// 6. PROTECT & CLEAN
// ==========================================
document.getElementById('cleanBtn')?.addEventListener('click', async () => {
  if (!state.files.length) return;
  const outputDiv = document.getElementById('protectOutput');
  outputDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cleaning...';

  try {
    const file = state.files[0];
    const cleanedBlob = await removeMetadata(file);
    const url = URL.createObjectURL(cleanedBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `clean_${file.name}`;
    a.click();
    
    outputDiv.innerHTML = '<i class="fa-solid fa-check-circle text-green-500"></i> Cleaned & Downloaded!';
  } catch (err) {
    outputDiv.innerHTML = `<i class="fa-solid fa-xmark text-red-500"></i> Failed: ${err.message}`;
  }
});

async function removeMetadata(file) {
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const cleanedData = piexif.remove(e.target.result);
        const uint8 = new Uint8Array(cleanedData.length);
        for (let i = 0; i < cleanedData.length; i++) uint8[i] = cleanedData.charCodeAt(i);
        resolve(new Blob([uint8], { type: 'image/jpeg' }));
      };
      reader.readAsBinaryString(file);
    });
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; 
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob); }, file.type, 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

document.getElementById('downloadJsonBtn')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.metadata, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'PhotoShield_Data.json';
  a.click();
});
