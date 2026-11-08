/* ============================================================
   PhotoShield Pro — Advanced Metadata Extractor & Protector
   ============================================================
   - EXIF Extraction: exifr (supports JPEG, PNG, HEIC, WebP, TIFF)
   - Metadata Removal: piexifjs (binary-level stripping)
   - Local AI: @nearstack-dev/ai + WebLLM (no API key, runs in browser)
   ============================================================ */

const MAX_FILES = 20;
const state = { files: [], metadata: [], cleanedBlobs: [] };

// ---------- DOM Elements ----------
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const resultsSection = document.getElementById('resultsSection');
const metadataOutput = document.getElementById('metadataOutput');
const aiOutput = document.getElementById('aiOutput');
const aiStatus = document.getElementById('aiStatus');
const protectOutput = document.getElementById('protectOutput');
const fileCount = document.getElementById('fileCount');

// ---------- Drag & Drop ----------
['dragenter', 'dragover'].forEach(ev => {
  dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach(ev => {
  dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => handleFiles(e.target.files));

// ---------- File Handling ----------
async function handleFiles(fileList) {
  const files = Array.from(fileList).slice(0, MAX_FILES);
  if (!files.length) return;

  state.files = files;
  state.metadata = [];
  state.cleanedBlobs = [];

  resultsSection.style.display = 'block';
  fileCount.textContent = `${files.length} file(s)`;
  metadataOutput.innerHTML = '<p style="color:var(--muted)">Extracting metadata...</p>';

  for (const file of files) {
    try {
      const data = await extractMetadata(file);
      state.metadata.push({ file: file.name, size: formatBytes(file.size), type: file.type, metadata: data });
    } catch (err) {
      state.metadata.push({ file: file.name, error: err.message });
    }
  }

  renderMetadata();
  await runAIAnalysis();
}

// ---------- EXIF Extraction (exifr) ----------
async function extractMetadata(file) {
  // exifr.parse() returns a flat object with all EXIF/IPTC/XMP/GPS tags
  const data = await exifr.parse(file, {
    tiff: true, exif: true, gps: true, iptc: true, xmp: true, icc: true,
    jfif: true, ihdr: true,
    mergeOutput: true,
    translateValues: true,
    reviveValues: true,
  });
  return data || { _info: 'No metadata found in this file.' };
}

// ---------- Render Metadata ----------
function renderMetadata() {
  if (!state.metadata.length) return;
  metadataOutput.innerHTML = state.metadata.map((entry, i) => {
    if (entry.error) {
      return `<div class="meta-file"><h3>❌ ${escapeHtml(entry.file)}</h3><p style="color:var(--danger)">${escapeHtml(entry.error)}</p></div>`;
    }
    const json = JSON.stringify(entry.metadata, null, 2);
    const gps = entry.metadata?.latitude ? `⚠️ GPS: ${entry.metadata.latitude.toFixed(4)}, ${entry.metadata.longitude.toFixed(4)}` : '✅ No GPS';
    return `
      <div class="meta-file">
        <h3>📄 ${escapeHtml(entry.file)} <span class="badge">${entry.size}</span></h3>
        <p style="margin:0.3rem 0;color:var(--muted)">${gps}</p>
        <pre>${escapeHtml(json)}</pre>
      </div>
    `;
  }).join('<hr style="border-color:var(--border);margin:1rem 0">');
}

// ---------- Local AI (WebLLM via @nearstack-dev/ai) ----------
let aiReady = false;

async function initAI() {
  if (aiReady) return;
  try {
    // Dynamically import ES module from CDN
    const { ai } = await import('https://cdn.jsdelivr.net/npm/@nearstack-dev/ai@0.1.1/+esm');
    const webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm');

    await ai.ready();
    // Use a small, fast model suitable for browser (SmolLM2 360M ~240MB)
    await ai.models.download('SmolLM2-360M-Instruct-q4f16_1-MLC');
    await ai.models.use('SmolLM2-360M-Instruct-q4f16_1-MLC');
    aiReady = true;
    aiStatus.textContent = '✅ Local AI ready (SmolLM2 360M — runs entirely in your browser)';
    aiStatus.style.borderColor = 'var(--success)';
    aiStatus.style.background = 'rgba(46, 204, 113, 0.1)';
  } catch (err) {
    aiStatus.textContent = `⚠️ AI unavailable: ${err.message}. Metadata features still work.`;
    console.error('AI init failed:', err);
  }
}

// ---------- AI Analysis ----------
async function runAIAnalysis() {
  await initAI();
  if (!aiReady) {
    aiOutput.innerHTML = '<p style="color:var(--muted)">AI could not initialize. (WebGPU may not be supported on this device.)</p>';
    return;
  }

  const summary = state.metadata.map(m => {
    if (m.error) return `File ${m.file}: error`;
    const md = m.metadata || {};
    return `File: ${m.file}
- GPS: ${md.latitude ? `${md.latitude}, ${md.longitude}` : 'None'}
- Device: ${md.Make || 'Unknown'} ${md.Model || ''}
- Date: ${md.CreateDate || md.DateTimeOriginal || 'Unknown'}
- Software: ${md.Software || 'Unknown'}
- Orientation: ${md.Orientation || 'Unknown'}`;
  }).join('\n\n');

  const prompt = `You are a privacy expert. Analyze the following photo metadata and give a concise privacy risk report in bullet points. Highlight GPS leaks, device fingerprinting, and any sensitive fields.\n\n${summary}`;

  aiOutput.innerHTML = '<p style="color:var(--muted)">🧠 AI is thinking...</p>';
  try {
    const response = await ai.chat(prompt);
    aiOutput.innerHTML = `<pre>${escapeHtml(response)}</pre>`;
  } catch (err) {
    aiOutput.innerHTML = `<p style="color:var(--danger)">AI analysis failed: ${escapeHtml(err.message)}</p>`;
  }
}

// ---------- AI Chat ----------
document.getElementById('askBtn')?.addEventListener('click', async () => {
  const q = document.getElementById('aiQuestion').value.trim();
  if (!q || !aiReady) return;
  const context = JSON.stringify(state.metadata[0]?.metadata || {});
  aiOutput.innerHTML += `\n\n<div class="chat-msg"><b>You:</b> ${escapeHtml(q)}</div>`;
  try {
    const resp = await ai.chat(`Metadata context: ${context}\n\nQuestion: ${q}`);
    aiOutput.innerHTML += `<div class="chat-msg"><b>AI:</b> ${escapeHtml(resp)}</div>`;
    aiOutput.scrollTop = aiOutput.scrollHeight;
  } catch (err) {
    aiOutput.innerHTML += `<div class="chat-msg" style="color:var(--danger)">Error: ${escapeHtml(err.message)}</div>`;
  }
});

// ---------- Metadata Removal (piexifjs) ----------
document.getElementById('cleanAllBtn')?.addEventListener('click', async () => {
  if (!state.files.length) return;
  protectOutput.innerHTML = '<p style="color:var(--muted)">🧹 Cleaning metadata...</p>';
  state.cleanedBlobs = [];

  for (const file of state.files) {
    try {
      const cleanedBlob = await removeMetadata(file);
      state.cleanedBlobs.push({ name: `clean_${file.name}`, blob: cleanedBlob });
    } catch (err) {
      protectOutput.innerHTML += `<p style="color:var(--danger)">❌ ${escapeHtml(file.name)}: ${escapeHtml(err.message)}</p>`;
    }
  }

  if (state.cleanedBlobs.length) {
    protectOutput.innerHTML = `<p style="color:var(--success)">✅ ${state.cleanedBlobs.length} file(s) cleaned.</p>`;
    for (const item of state.cleanedBlobs) {
      const url = URL.createObjectURL(item.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      a.textContent = `⬇️ Download ${item.name}`;
      a.className = 'btn btn-primary';
      a.style.display = 'block';
      a.style.margin = '0.5rem 0';
      protectOutput.appendChild(a);
      // Auto-trigger download after a short delay
      setTimeout(() => a.click(), 300);
    }
  }
});

async function removeMetadata(file) {
  // piexifjs works on JPEG only. For PNG/WebP, use Canvas fallback.
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    const jpegData = await fileToBinaryString(file);
    const cleanedData = piexif.remove(jpegData);
    const uint8 = new Uint8Array(cleanedData.length);
    for (let i = 0; i < cleanedData.length; i++) uint8[i] = cleanedData.charCodeAt(i);
    return new Blob([uint8], { type: 'image/jpeg' });
  }

  // Canvas fallback for PNG/WebP (re-encodes, stripping all metadata)
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      }, file.type, 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

function fileToBinaryString(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// ---------- Utility Functions ----------
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// ---------- Tabs ----------
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
  });
});

// ---------- Copy / Download JSON ----------
document.getElementById('copyBtn')?.addEventListener('click', () => {
  navigator.clipboard.writeText(JSON.stringify(state.metadata, null, 2)).then(() => {
    alert('✅ Metadata copied to clipboard!');
  });
});

document.getElementById('downloadJsonBtn')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.metadata, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'photoshield-metadata.json';
  a.click();
  URL.revokeObjectURL(url);
});
