/* ============================================================
   PhotoShield Pro - Core Logic (Updated)
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

// Drag & Drop
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

// File Handling
async function handleFiles(fileList) {
  const files = Array.from(fileList).slice(0, MAX_FILES);
  if (!files.length) return;

  state.files = files;
  state.metadata = [];
  
  resultsSection.classList.remove('hidden');
  metadataOutput.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Extracting metadata...';

  for (const file of files) {
    try {
      const data = await extractMetadata(file);
      state.metadata.push({ name: file.name, data });
      
      // OSINT: Generate Hashes
      const hashes = await generateHashes(file);
      renderOSINT(data, hashes);
      
    } catch (err) {
      state.metadata.push({ name: file.name, error: err.message });
    }
  }

  renderMetadata();
  runAIAnalysis();
}

// Extract Metadata (exifr)
async function extractMetadata(file) {
  const data = await exifr.parse(file, {
    tiff: true, exif: true, gps: true, iptc: true, xmp: true, icc: true,
    jfif: true, ihdr: true, mergeOutput: true, translateValues: true, reviveValues: true,
  });
  return data || { _info: 'No metadata found.' };
}

// Render Metadata
function renderMetadata() {
  metadataOutput.innerHTML = state.metadata.map(entry => {
    if (entry.error) return `<div class="text-red-400">❌ ${entry.name}: ${entry.error}</div>`;
    return `<div class="mb-4"><span class="text-purple-400 font-bold">// ${entry.name}</span>\n${JSON.stringify(entry.data, null, 2)}</div>`;
  }).join('\n');
}

// OSINT Logic (Hashes & GPS)
async function generateHashes(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function renderOSINT(metadata, sha256) {
  // Render Hash
  hashOutput.innerHTML = `
    <div><span class="text-purple-400">SHA-256:</span><br/>${sha256}</div>
    <div class="text-xs text-slate-500 mt-2">* Iska use karke image verify kar sakte hain.</div>
  `;

  // Render GPS if found
  if (metadata && metadata.latitude && metadata.longitude) {
    gpsSection.style.display = 'block';
    gpsLink.href = `https://www.google.com/maps?q=${metadata.latitude},${metadata.longitude}`;
  } else {
    gpsSection.style.display = 'none';
  }
}

// AI Logic (Transformers.js - WASM based, no WebGPU required)
let aiPipeline = null;
async function runAIAnalysis() {
  aiStatusText.innerText = "Loading AI Model (Works on mobile/wasm)...";
  aiStatusDot.className = "w-3 h-3 rounded-full bg-yellow-500 animate-pulse";
  aiOutput.innerHTML = "<span class='text-slate-500'>Please wait, initializing AI model in browser. Ye pehli baar mein 10-20MB download karega...</span>";

  try {
    // Dynamic import from CDN
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
    env.allowLocalModels = false;

    // Using a very small instruction model (LaMini-Flan-T5-77M) - works via WASM
    if (!aiPipeline) {
      aiPipeline = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-77M');
    }

    aiStatusText.innerText = "AI Model Ready. Analyzing...";
    aiStatusDot.className = "w-3 h-3 rounded-full bg-green-500";
    
    // Prepare prompt based on metadata
    const firstMeta = state.metadata[0]?.data || {};
    const metaString = JSON.stringify(firstMeta);
    
    const prompt = `Analyze this photo metadata and list privacy risks: ${metaString}. Give short bullet points.`;

    const result = await aiPipeline(prompt, { max_new_tokens: 150 });
    
    aiOutput.innerHTML = `
      <div class="text-green-400 font-bold mb-2">🤖 AI Analysis Complete:</div>
      <div class="bg-slate-900 p-4 rounded-lg border border-slate-700">${result[0].generated_text}</div>
    `;

  } catch (err) {
    aiStatusText.innerText = "AI Failed to Load.";
    aiStatusDot.className = "w-3 h-3 rounded-full bg-red-500";
    aiOutput.innerHTML = `<span class="text-red-400">Error: ${err.message}. (Browser ne WASM block kiya ho sakta hai, ya internet slow hai).</span>`;
  }
}

// Protect Logic
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
    
    outputDiv.innerHTML = '✅ Metadata Removed! File Downloaded.';
    outputDiv.classList.add('animate-bounce');
    setTimeout(() => outputDiv.classList.remove('animate-bounce'), 1000);
  } catch (err) {
    outputDiv.innerHTML = `❌ Failed: ${err.message}`;
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
  
  // Canvas fallback for PNG/WebP
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob); }, file.type, 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

// JSON Download
document.getElementById('downloadJsonBtn')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.metadata, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'metadata.json';
  a.click();
});
