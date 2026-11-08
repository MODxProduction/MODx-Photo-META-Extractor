/* ============================================================
   MODx OSINT - Ultimate Intelligence Engine
   ============================================================ */

const state = { file: null, input: '', extractedData: {}, tools: [] };

// DOM Elements
const osintInput = document.getElementById('osintInput');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const scanBtn = document.getElementById('scanBtn');
const resultsSection = document.getElementById('resultsSection');
const extractedOutput = document.getElementById('extractedOutput');
const aiOutput = document.getElementById('aiOutput');
const aiStatusText = document.getElementById('aiStatusText');
const aiStatusDot = document.getElementById('aiStatusDot');
const toolsOutput = document.getElementById('toolsOutput');
const globalToolsList = document.getElementById('globalToolsList');

// Massive OSINT Tools Database
const TOOLS_DB = {
  username: [
    { name: 'Sherlock', desc: 'Hunt down social media accounts by username across 400+ sites.', url: 'https://sherlock-project.github.io/' },
    { name: 'WhatsMyName', desc: 'Web-based tool that checks for username existence on hundreds of platforms.', url: 'https://whatsmyname.app/' },
    { name: 'Maigret', desc: 'Deep profiling of a username across 2500+ websites.', url: 'https://maigret.readthedocs.io/' },
    { name: 'Namechk', desc: 'Check username availability across domains and social networks.', url: 'https://namechk.com/' }
  ],
  phone: [
    { name: 'PhoneInfoga', desc: 'Advanced OSINT framework for scanning international phone numbers.', url: 'https://github.com/sundowndev/phoneinfoga' },
    { name: 'TrueCaller', desc: 'Global caller ID and spam blocking (Web version).', url: 'https://www.truecaller.com/search/global' },
    { name: 'ThatsThem', desc: 'Free reverse phone lookup and people search engine.', url: 'https://thatsthem.com/' },
    { name: 'NumVerify', desc: 'Free phone number validation and carrier lookup API.', url: 'https://numverify.com/' }
  ],
  email: [
    { name: 'Holehe', desc: 'Check if an email is registered on 120+ sites (Twitter, Instagram, etc).', url: 'https://github.com/megadose/holehe' },
    { name: 'HaveIBeenPwned', desc: 'Check if an email has been compromised in data breaches.', url: 'https://haveibeenpwned.com/' },
    { name: 'Hunter.io', desc: 'Find professional email addresses associated with a domain.', url: 'https://hunter.io/' },
    { name: 'Epieos', desc: 'Advanced email and phone number OSINT tool.', url: 'https://epieos.com/' }
  ],
  social: [
    { name: 'Picuki', desc: 'View Instagram profiles, stories, and posts anonymously.', url: 'https://www.picuki.com/' },
    { name: 'Imginn', desc: 'Instagram viewer and downloader without an account.', url: 'https://imginn.com/' },
    { name: 'Osintgram', desc: 'Interactive shell to perform analysis on Instagram accounts.', url: 'https://github.com/Datalux/Osintgram' },
    { name: 'Social Analyzer', desc: 'Scan 500+ sites for a profile link with a confidence score.', url: 'https://github.com/qeeqbox/social-analyzer' }
  ],
  ip_domain: [
    { name: 'IPinfo.io', desc: 'Fast IP geolocation and ASN lookup.', url: 'https://ipinfo.io/' },
    { name: 'ViewDNS.info', desc: 'Collection of DNS and IP tools (Reverse IP, DNS history).', url: 'https://viewdns.info/' },
    { name: 'Shodan', desc: 'Search engine for Internet-connected devices.', url: 'https://www.shodan.io/' },
    { name: 'SecurityTrails', desc: 'Historical DNS and domain intelligence.', url: 'https://securitytrails.com/' }
  ],
  image: [
    { name: 'Google Lens', desc: 'Reverse image search to find where an image appears online.', url: 'https://lens.google.com/' },
    { name: 'Yandex Images', desc: 'Powerful reverse image search (especially for faces/locations).', url: 'https://yandex.com/images/' },
    { name: 'TinEye', desc: 'Reverse image search to find exact matches and modifications.', url: 'https://tineye.com/' },
    { name: 'Forensically', desc: 'Image forensics tool (error level analysis, clone detection).', url: 'https://29a.ch/photo-forensics/' }
  ]
};

// Initialize Global Tools
function renderGlobalTools() {
  const allTools = [...TOOLS_DB.username, ...TOOLS_DB.phone, ...TOOLS_DB.social].slice(0, 6);
  globalToolsList.innerHTML = allTools.map(tool => `
    <a href="${tool.url}" target="_blank" class="tool-card slide-up">
      <h4 class="text-purple-400 font-bold mb-1">${tool.name} <i class="fa-solid fa-arrow-up-right-from-square text-xs ml-1"></i></h4>
      <p class="text-xs text-slate-400">${tool.desc}</p>
    </a>
  `).join('');
}

// Tabs Logic
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
  });
});

// File Upload
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    state.file = e.target.files[0];
    osintInput.value = state.file.name;
  }
});

// Input Type Detection & Scanning
scanBtn.addEventListener('click', async () => {
  const input = osintInput.value.trim();
  if (!input && !state.file) return alert('Please enter a target or upload an image.');

  resultsSection.classList.remove('hidden');
  extractedOutput.innerHTML = '<div class="text-purple-400 font-mono animate-pulse"><i class="fa-solid fa-circle-notch fa-spin"></i> Scanning Target...</div>';
  
  const type = state.file ? 'image' : detectType(input);
  
  if (type === 'image') {
    await handleImage(state.file);
  } else if (type === 'username') {
    await handleUsername(input);
  } else if (type === 'email') {
    await handleEmail(input);
  } else if (type === 'phone') {
    await handlePhone(input);
  } else if (type === 'ip') {
    await handleIP(input);
  } else {
    extractedOutput.innerHTML = '<div class="text-yellow-400">Unknown input type. Please provide a valid username, email, phone, IP, or image.</div>';
  }
});

// Type Detection
function detectType(input) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) return 'email';
  if (/^(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/.test(input)) return 'phone';
  if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(input)) return 'ip';
  return 'username';
}

// ==========================================
// 1. IMAGE HANDLING (ADVANCED EXIF)
// ==========================================
async function handleImage(file) {
  try {
    // Extract everything
    const md = await exifr.parse(file, true) || {};
    state.extractedData = md;
    
    // Generate Hash
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const sha256 = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Format Data
    const make = md.Make || 'Unknown';
    const model = md.Model || 'Unknown';
    const lens = md.LensModel || 'Unknown';
    const date = md.DateTimeOriginal || md.CreateDate || 'Unknown';
    const software = md.Software || 'None';
    const iso = md.ISO || md.ISOSpeedRatings || 'N/A';
    const fnum = md.FNumber ? `f/${md.FNumber}` : 'N/A';
    const exposure = md.ExposureTime ? (md.ExposureTime < 1 ? `1/${Math.round(1/md.ExposureTime)}s` : `${md.ExposureTime}s`) : 'N/A';
    const focal = md.FocalLength ? `${md.FocalLength}mm` : 'N/A';
    const gps = (md.latitude && md.longitude) ? `${md.latitude.toFixed(6)}, ${md.longitude.toFixed(6)}` : 'Not Found';
    const artist = md.Artist || md.Creator || 'None';

    extractedOutput.innerHTML = `
      <div class="space-y-6 fade-in">
        <!-- Header Info -->
        <div class="glass-panel p-4 rounded-xl flex justify-between items-center">
          <div>
            <h3 class="text-lg font-bold text-white"><i class="fa-regular fa-image text-purple-400"></i> ${file.name}</h3>
            <p class="text-xs text-slate-400 font-mono break-all">SHA-256: ${sha256}</p>
          </div>
          <span class="bg-green-900/50 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold">${software === 'None' ? 'Original' : 'Processed'}</span>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="data-card">
            <p class="text-xs text-purple-400 font-bold uppercase mb-2">Device Info</p>
            <p class="text-white text-sm font-semibold">${make} ${model}</p>
            <p class="text-slate-400 text-xs mt-1">Lens: ${lens}</p>
          </div>
          
          <div class="data-card">
            <p class="text-xs text-purple-400 font-bold uppercase mb-2">Camera Settings</p>
            <div class="grid grid-cols-2 gap-2 text-sm text-white">
              <div>ISO: <span class="font-mono text-purple-300">${iso}</span></div>
              <div>Aperture: <span class="font-mono text-purple-300">${fnum}</span></div>
              <div>Shutter: <span class="font-mono text-purple-300">${exposure}</span></div>
              <div>Focal: <span class="font-mono text-purple-300">${focal}</span></div>
            </div>
          </div>

          <div class="data-card">
            <p class="text-xs text-purple-400 font-bold uppercase mb-2">Date & Software</p>
            <p class="text-white text-sm">${date}</p>
            <p class="text-slate-400 text-xs mt-1">Software: ${software}</p>
          </div>

          <div class="data-card md:col-span-2">
            <p class="text-xs text-purple-400 font-bold uppercase mb-2">Location (GPS)</p>
            <p class="text-white text-sm font-mono">${gps}</p>
            ${md.latitude ? `<a href="https://www.google.com/maps?q=${md.latitude},${md.longitude}" target="_blank" class="text-xs text-blue-400 hover:underline mt-2 inline-block"><i class="fa-solid fa-map-location-dot"></i> Open Google Maps</a>` : ''}
          </div>

          <div class="data-card">
            <p class="text-xs text-purple-400 font-bold uppercase mb-2">Identity / Ownership</p>
            <p class="text-white text-sm">Artist: ${artist}</p>
            ${md.Copyright ? `<p class="text-slate-400 text-xs mt-1">Copyright: ${md.Copyright}</p>` : ''}
          </div>
        </div>

        <!-- Raw JSON Dropdown -->
        <details class="bg-slate-900/80 rounded-xl border border-slate-700 overflow-hidden">
          <summary class="cursor-pointer p-4 text-sm font-bold text-slate-300 hover:text-purple-400 transition-colors"><i class="fa-solid fa-code"></i> View Complete Raw Metadata (JSON)</summary>
          <div class="p-4 bg-black/50 overflow-x-auto max-h-80 text-xs font-mono text-green-400">
            <pre>${JSON.stringify(md, null, 2)}</pre>
          </div>
        </details>
      </div>
    `;

    renderToolsTab('image');
    runAI(`Analyze this image metadata: Camera ${make} ${model}, GPS: ${gps}, Software: ${software}. Identify privacy risks.`);

  } catch (err) {
    extractedOutput.innerHTML = `<div class="text-red-400">Failed to parse image: ${err.message}</div>`;
  }
}

// ==========================================
// 2. USERNAME HANDLING (GitHub API)
// ==========================================
async function handleUsername(username) {
  try {
    // Fetch public data from GitHub as a free API example
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) throw new Error('User not found on GitHub (404)');
    const data = await res.json();

    state.extractedData = data;
    extractedOutput.innerHTML = `
      <div class="glass-panel p-6 rounded-xl fade-in flex flex-col md:flex-row items-center gap-6">
        <img src="${data.avatar_url}" alt="Avatar" class="w-32 h-32 rounded-full border-4 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
        <div class="flex-1 text-center md:text-left">
          <h2 class="text-2xl font-bold text-white">${data.name || data.login}</h2>
          <p class="text-purple-400 font-mono">@${data.login}</p>
          <p class="text-slate-400 text-sm mt-2">${data.bio || 'No bio available.'}</p>
          
          <div class="grid grid-cols-3 gap-4 mt-4 text-center">
            <div class="bg-slate-900 p-2 rounded-lg"><span class="block text-white font-bold">${data.public_repos}</span><span class="text-xs text-slate-500">Repos</span></div>
            <div class="bg-slate-900 p-2 rounded-lg"><span class="block text-white font-bold">${data.followers}</span><span class="text-xs text-slate-500">Followers</span></div>
            <div class="bg-slate-900 p-2 rounded-lg"><span class="block text-white font-bold">${data.following}</span><span class="text-xs text-slate-500">Following</span></div>
          </div>
          <div class="mt-4 text-xs text-slate-500">
            <p><i class="fa-solid fa-location-dot"></i> ${data.location || 'Unknown Location'}</p>
            <p><i class="fa-solid fa-link"></i> <a href="${data.html_url}" target="_blank" class="text-blue-400 hover:underline">${data.html_url}</a></p>
          </div>
        </div>
      </div>
    `;

    renderToolsTab('username');
    runAI(`Analyze GitHub profile: Name ${data.name}, Repos: ${data.public_repos}, Bio: ${data.bio}. What can an OSINT investigator deduce?`);

  } catch (err) {
    extractedOutput.innerHTML = `<div class="text-red-400">GitHub API Error: ${err.message}. Try searching other platforms in the Tools tab.</div>`;
    renderToolsTab('username');
  }
}

// ==========================================
// 3. EMAIL & PHONE (Links & AI)
// ==========================================
async function handleEmail(email) {
  extractedOutput.innerHTML = `
    <div class="glass-panel p-6 rounded-xl fade-in">
      <h3 class="text-xl font-bold text-white mb-2"><i class="fa-solid fa-envelope text-purple-400"></i> Email Target: ${email}</h3>
      <p class="text-slate-400 text-sm">Direct API lookups for emails often require paid keys. Use the <b>Advanced Tools</b> tab to run this email through Holehe and HaveIBeenPwned.</p>
    </div>
  `;
  renderToolsTab('email');
  runAI(`Email OSINT target: ${email}. What are the best tools to use and what risks exist?`);
}

async function handlePhone(phone) {
  extractedOutput.innerHTML = `
    <div class="glass-panel p-6 rounded-xl fade-in">
      <h3 class="text-xl font-bold text-white mb-2"><i class="fa-solid fa-phone text-purple-400"></i> Phone Target: ${phone}</h3>
      <p class="text-slate-400 text-sm">Use the <b>Advanced Tools</b> tab to trace this number via PhoneInfoga, TrueCaller, and reverse lookup services.</p>
    </div>
  `;
  renderToolsTab('phone');
  runAI(`Phone OSINT target: ${phone}. Explain how to trace a phone number using OSINT.`);
}

// ==========================================
// 4. IP HANDLING (Free API)
// ==========================================
async function handleIP(ip) {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) throw new Error('Invalid IP or API limit reached');
    const data = await res.json();

    extractedOutput.innerHTML = `
      <div class="glass-panel p-6 rounded-xl fade-in">
        <h3 class="text-xl font-bold text-white mb-4"><i class="fa-solid fa-network-wired text-purple-400"></i> IP Target: ${ip}</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="data-card"><p class="text-xs text-slate-500">City / Region</p><p class="text-white">${data.city}, ${data.region}</p></div>
          <div class="data-card"><p class="text-xs text-slate-500">Country</p><p class="text-white">${data.country_name}</p></div>
          <div class="data-card"><p class="text-xs text-slate-500">ISP / Org</p><p class="text-white">${data.org}</p></div>
          <div class="data-card"><p class="text-xs text-slate-500">Timezone</p><p class="text-white">${data.timezone}</p></div>
        </div>
      </div>
    `;
    renderToolsTab('ip_domain');
    runAI(`Analyze IP data: Location ${data.city}, ${data.country_name}, ISP: ${data.org}.`);

  } catch (err) {
    extractedOutput.innerHTML = `<div class="text-red-400">IP API Error: ${err.message}</div>`;
    renderToolsTab('ip_domain');
  }
}

// ==========================================
// 5. RENDER ADVANCED TOOLS TAB
// ==========================================
function renderToolsTab(category) {
  const tools = TOOLS_DB[category] || [];
  toolsOutput.innerHTML = tools.map(tool => `
    <a href="${tool.url}" target="_blank" class="tool-card">
      <h4 class="text-purple-400 font-bold mb-1 flex justify-between items-center">
        ${tool.name} <i class="fa-solid fa-external-link-alt text-xs"></i>
      </h4>
      <p class="text-xs text-slate-400">${tool.desc}</p>
    </a>
  `).join('');
  
  // Auto-switch to tools tab if it's not an image result
  if (category !== 'image') {
    document.querySelector('[data-tab="tools"]').click();
  }
}

// ==========================================
// 6. LOCAL AI ENGINE (WASM)
// ==========================================
let aiPipeline = null;
async function runAI(prompt) {
  aiStatusText.innerText = "Loading AI Model (WASM)...";
  aiStatusDot.className = "w-3 h-3 rounded-full bg-yellow-500 animate-pulse";
  aiOutput.innerHTML = "<span class='text-slate-500 font-mono text-xs'>Initializing local language model. First run downloads ~20MB...</span>";

  try {
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
    env.allowLocalModels = false;

    if (!aiPipeline) {
      aiPipeline = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-77M');
    }

    aiStatusText.innerText = "AI Ready. Analyzing...";
    aiStatusDot.className = "w-3 h-3 rounded-full bg-green-500";
    
    const result = await aiPipeline(prompt, { max_new_tokens: 120 });
    
    aiOutput.innerHTML = `
      <div class="bg-slate-900 p-4 rounded-lg border border-purple-500/30">
         <div class="text-green-400 font-bold mb-2"><i class="fa-solid fa-shield-check"></i> Intelligence Report:</div>
         <div class="text-slate-300 whitespace-pre-wrap text-sm">${result[0].generated_text}</div>
      </div>
    `;

  } catch (err) {
    aiStatusText.innerText = "AI Failed to Load.";
    aiStatusDot.className = "w-3 h-3 rounded-full bg-red-500";
    aiOutput.innerHTML = `<span class="text-red-400 font-mono text-xs">Error: ${err.message}. Check internet connection.</span>`;
  }
}

// Initialize on Load
renderGlobalTools();
