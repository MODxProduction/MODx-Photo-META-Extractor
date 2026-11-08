/* ============================================================
   PhotoShield Pro - Advanced OSINT, EXIF & Geolocation Engine
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
// 1. FILE HANDLING & DEEP EXTRACTION
// ==========================================
async function handleFiles(fileList) {
  const files = Array.from(fileList).slice(0, MAX_FILES);
  if (!files.length) return;

  state.files = files;
  state.metadata = [];
  
  resultsSection.classList.remove('hidden');
  metadataOutput.innerHTML = '<div class="flex items-center gap-3 text-purple-400"><i class="fa-solid fa-spinner fa-spin"></i> Deep Scanning Metadata...</div>';

  for (const file of files) {
    try {
      // ICC (Color Profiles) ko band kar diya taaki raw bytes na aayein
      const data = await exifr.parse(file, {
        tiff: true, exif: true, gps: true, iptc: true, xmp: true, icc: false,
        jfif: false, ihdr: true, ifd0: true, ifd1: true, interop: true,
        makerNote: true, userComment: true, skip: [], 
        mergeOutput: true, translateKeys: true, translateValues: true, reviveValues: true
      }) || {};
      
      state.metadata.push({ name: file.name, data });
      
      // OSINT: Hashes Generate karein
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
// 2. SMART METADATA UI (Human-Readable)
// ==========================================
function analyzeImageType(md) {
  const make = md.Make || md.make || '';
  const model = md.Model || md.model || '';
  const software = md.Software || md.software || '';
  
  if (!make && !model && !software) return { type: 'Screenshot / Stripped', icon: 'fa-mobile-screen', color: 'text-yellow-400' };
  if (software.toLowerCase().includes('whatsapp') || software.toLowerCase().includes('instagram')) return { type: 'Social Media Compressed', icon: 'fa-hashtag', color: 'text-blue-400' };
  if (software.toLowerCase().includes('photoshop') || software.toLowerCase().includes('snapseed') || software.toLowerCase().includes('lightroom')) return { type: 'Edited / Processed', icon: 'fa-wand-magic-sparkles', color: 'text-pink-400' };
  return { type: 'Original Camera Photo', icon: 'fa-camera', color: 'text-green-400' };
}

function renderAdvancedMetadata() {
  metadataOutput.innerHTML = state.metadata.map(entry => {
    if (entry.error) return `<div class="text-red-400">❌ ${entry.name}: ${entry.error}</div>`;
    
    const md = entry.data;
    const analysis = analyzeImageType(md);

    // Extract human-readable fields
    const make = md.Make || md.make || 'Unknown';
    const model = md.Model || md.model || 'Unknown';
    const date = md.DateTimeOriginal || md.CreateDate || 'Unknown';
    const gps = (md.latitude && md.longitude) ? `${md.latitude.toFixed(4)}, ${md.longitude.toFixed(4)}` : 'Not Found';
    const software = md.Software || 'None';
    const lens = md.LensModel || md.LensInfo || 'Unknown';

    // Agar file me koi kaam ka data nahi hai
    if(Object.keys(md).length < 5) {
      return `
        <div class="bg-slate-800 rounded-lg p-5 mb-4 border border-slate-700">
          <h3 class="text-lg font-bold text-slate-300 mb-2"><i class="fa-solid fa-triangle-exclamation text-yellow-500"></i> ${entry.name}</h3>
          <p class="text-slate-400 text-sm">Is image me koi advanced EXIF data nahi mila. Ye ek <b>Screenshot</b> ya <b>WhatsApp/Instagram</b> se download ki gayi photo ho sakti hai, jisme metadata pehle hi delete ho chuka hota hai.</p>
        </div>
      `;
    }

    return `
      <div class="bg-slate-800/80 rounded-xl p-5 mb-6 border border-slate-700 shadow-lg">
        <div class="flex justify-between items-center border-b border-slate-600 pb-3 mb-4">
          <h3 class="text-lg font-bold text-purple-400 break-all"><i class="fa-regular fa-image"></i> ${entry.name}</h3>
          <span class="${analysis.color} font-bold text-sm bg-slate-900 px-3 py-1 rounded-full"><i class="fa-solid ${analysis.icon}"></i> ${analysis.type}</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- Device Info -->
          <div class="bg-slate-900 p-3 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Device / Camera</p>
            <p class="text-white font-medium text-sm"><i class="fa-solid fa-mobile-screen-button text-purple-400"></i> ${make} ${model}</p>
            <p class="text-slate-400 text-xs mt-1">Lens: ${lens}</p>
          </div>
          
          <!-- Date Info -->
          <div class="bg-slate-900 p-3 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Date & Time</p>
            <p class="text-white font-medium text-sm"><i class="fa-regular fa-calendar text-purple-400"></i> ${date}</p>
            <p class="text-slate-400 text-xs mt-1">Software: ${software}</p>
          </div>

          <!-- GPS Info -->
          <div class="bg-slate-900 p-3 rounded-lg border border-slate-700 md:col-span-2">
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Location (GPS)</p>
            <p class="text-white font-medium text-sm"><i class="fa-solid fa-location-dot text-red-400"></i> ${gps}</p>
          </div>
        </div>

        <!-- Advanced Raw Data Toggle -->
        <details class="mt-4">
          <summary class="cursor-pointer text-sm text-purple-400 hover:text-purple-300 font-semibold"><i class="fa-solid fa-code"></i> View Raw Technical Tags (For Experts)</summary>
          <div class="mt-2 bg-black/50 p-4 rounded-lg overflow-x-auto max-h-60 text-xs font-mono text-green-400">
            <pre>${JSON.stringify(md, null, 2)}</pre>
          </div>
        </details>
      </div>
    `;
  }).join('');
}

// ==========================================
// 3. OSINT TOOLS (Hashes & Search)
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
      <span class="text-white text-xs select-all break-all">${sha256}</span>
    </div>
    <div class="text-xs text-slate-500">Image integrity verify karne ke liye.</div>
  `;

  if (metadata && metadata.latitude && metadata.longitude) {
    gpsSection.style.display = 'block';
    gpsLink.href = `https://www.google.com/maps?q=${metadata.latitude},${metadata.longitude}`;
  } else {
    gpsSection.style.display = 'none';
  }
}

// ==========================================
// 4. LOCAL AI (WASM Engine)
// ==========================================
let aiPipeline = null;
async function runAIAnalysis() {
  aiStatusText.innerText = "Loading AI Model (WASM)...";
  aiStatusDot.className = "w-3 h-3 rounded-full bg-yellow-500 animate-pulse";
  aiOutput.innerHTML = "<span class='text-slate-500'>AI model load ho raha hai. Mobile par isme 15-20 seconds lag sakte hain...</span>";

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
       Make: firstMeta.Make || 'Unknown',
       Model: firstMeta.Model || 'Unknown',
       GPS: firstMeta.latitude ? 'Present' : 'None',
       Software: firstMeta.Software || 'Unknown'
    });
    
    const prompt = `You are an OSINT investigator. Analyze these photo metadata findings: ${metaString}. Give 3 short bullet points outlining the privacy and security risks (like device tracking, location leaks). Keep it very brief.`;

    const result = await aiPipeline(prompt, { max_new_tokens: 100 });
    
    aiOutput.innerHTML = `
      <div class="bg-slate-900 p-4 rounded-lg border border-purple-500/30">
         <div class="text-green-400 font-bold mb-2"><i class="fa-solid fa-shield-check"></i> AI Privacy Report:</div>
         <div class="text-slate-300 whitespace-pre-wrap">${result[0].generated_text}</div>
      </div>
    `;

  } catch (err) {
    aiStatusText.innerText = "AI Failed to Load.";
    aiStatusDot.className = "w-3 h-3 rounded-full bg-red-500";
    aiOutput.innerHTML = `<span class="text-red-400">Error: ${err.message}. Check your internet connection.</span>`;
  }
}

// ==========================================
// 5. PROTECT & CLEAN (Remove EXIF)
// ==========================================
document.getElementById('cleanBtn')?.addEventListener('click', async () => {
  if (!state.files.length) return;
  const outputDiv = document.getElementById('protectOutput');
  outputDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cleaning Metadata...';

  try {
    const file = state.files[0];
    const cleanedBlob = await removeMetadata(file);
    const url = URL.createObjectURL(cleanedBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `clean_${file.name}`;
    a.click();
    
    outputDiv.innerHTML = '<i class="fa-solid fa-check-circle text-green-500"></i> Metadata Removed! File Downloaded.';
    outputDiv.classList.add('animate-bounce');
    setTimeout(() => outputDiv.classList.remove('animate-bounce'), 1500);
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

// Download Raw JSON
document.getElementById('downloadJsonBtn')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.metadata, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'PhotoShield_Metadata.json';
  a.click();
});
