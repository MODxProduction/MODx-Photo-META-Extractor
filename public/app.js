/* ============================================================
   MODx OSINT - Inbuilt Intelligence Engine
   ============================================================ */

const homePage = document.getElementById('homePage');
const modulePage = document.getElementById('modulePage');
const moduleContent = document.getElementById('moduleContent');

function showHome() {
  homePage.classList.remove('hidden');
  modulePage.classList.add('hidden');
  window.scrollTo(0, 0);
}

function openModule(type) {
  homePage.classList.add('hidden');
  modulePage.classList.remove('hidden');
  window.scrollTo(0, 0);
  
  switch(type) {
    case 'phone': renderPhoneModule(); break;
    case 'photo': renderPhotoModule(); break;
    case 'email': renderEmailModule(); break;
    case 'ip': renderIPModule(); break;
    case 'username': renderUsernameModule(); break;
  }
}

// ==========================================
// 1. INBUILT PHONE MODULE (Offline Parsing + Free API)
// ==========================================
function renderPhoneModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
      <div class="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
        <i class="fa-solid fa-phone text-green-400 text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-white">Phone Number Intel</h2>
        <p class="text-sm text-slate-400">Inbuilt parsing & validation via libphonenumber-js.</p>
      </div>
    </div>
    
    <div class="flex flex-col md:flex-row gap-3 mb-6">
      <input type="tel" id="phoneInput" placeholder="+91 9876543210" class="flex-1 bg-[#0B0F19] border border-slate-600 rounded-xl py-3 px-4 text-white font-mono placeholder-slate-500 focus:border-green-500">
      <button onclick="scanPhone()" class="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-900/30">Analyze</button>
    </div>
    <div id="phoneResult" class="mt-6"></div>
  `;
}

async function scanPhone() {
  const input = document.getElementById('phoneInput').value.trim();
  const resultDiv = document.getElementById('phoneResult');
  
  if (!input) return alert('Please enter a phone number with country code (e.g. +919876543210).');
  
  resultDiv.innerHTML = '<div class="text-center text-green-400 mt-4 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Parsing Number...</div>';

  try {
    // 1. Inbuilt Parsing using libphonenumber-js
    const phoneNumber = libphonenumber.parsePhoneNumber(input);
    
    if (!phoneNumber.isValid()) throw new Error('Invalid phone number format.');

    const country = phoneNumber.country || 'Unknown';
    const carrier = phoneNumber.getCarrier() || 'Unknown';
    const type = phoneNumber.getType() || 'Unknown';
    const intlFormat = phoneNumber.formatInternational();
    const nationalFormat = phoneNumber.formatNational();

    // 2. Try Carrier Lookup via free API (omkar.cloud)
    let apiCarrier = carrier;
    let apiType = type;
    try {
      const res = await fetch(`https://carrier-lookup-api.omkar.cloud/lookup?phone=${encodeURIComponent(intlFormat)}`);
      if (res.ok) {
        const data = await res.json();
        apiCarrier = data.carrier || apiCarrier;
        apiType = data.line_type || apiType;
      }
    } catch (e) {
      // Fallback to offline data if API fails
    }

    resultDiv.innerHTML = `
      <div class="bg-slate-900/80 rounded-xl p-6 border border-slate-700 fade-in">
        <h3 class="text-green-400 font-bold mb-4 flex items-center gap-2"><i class="fa-solid fa-circle-check"></i> Valid Number</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">Formatted</p>
            <p class="text-white font-medium font-mono">${intlFormat}</p>
          </div>
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">Country</p>
            <p class="text-white font-medium">${country}</p>
          </div>
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">Carrier</p>
            <p class="text-white font-medium">${apiCarrier}</p>
          </div>
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">Line Type</p>
            <p class="text-white font-medium capitalize">${apiType}</p>
          </div>
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700 md:col-span-2">
            <p class="text-xs text-slate-400 uppercase">National Format</p>
            <p class="text-white font-medium font-mono">${nationalFormat}</p>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 mt-4 bg-red-900/20 p-4 rounded-xl border border-red-500/50">Error: ${err.message}</div>`;
  }
}

// ==========================================
// 2. INBUILT PHOTO MODULE (Client-Side EXIF)
// ==========================================
function renderPhotoModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
      <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
        <i class="fa-solid fa-camera text-purple-400 text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-white">Photo EXIF Extractor</h2>
        <p class="text-sm text-slate-400">Extract GPS, camera details, and raw metadata.</p>
      </div>
    </div>
    
    <div class="border-2 border-dashed border-slate-600 rounded-xl p-10 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all" onclick="document.getElementById('photoInput').click()">
      <i class="fa-solid fa-cloud-arrow-up text-4xl text-purple-500 mb-4"></i>
      <p class="text-white font-semibold mb-1">Click to upload target image</p>
      <p class="text-xs text-slate-400">JPG, PNG, WEBP, HEIC</p>
      <input type="file" id="photoInput" class="hidden" accept="image/*" onchange="scanPhoto(this)">
    </div>
    <div id="photoResult" class="mt-6"></div>
  `;
}

async function scanPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  
  const resultDiv = document.getElementById('photoResult');
  resultDiv.innerHTML = '<div class="text-center text-purple-400 mt-4 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Extracting Metadata...</div>';
  
  try {
    const md = await exifr.parse(file, true) || {};
    
    if(Object.keys(md).length < 3) {
      resultDiv.innerHTML = `<div class="bg-yellow-900/30 border border-yellow-500/50 text-yellow-400 p-4 rounded-xl mt-4 text-sm fade-in"><i class="fa-solid fa-triangle-exclamation"></i> No EXIF data found. This image has likely been stripped.</div>`;
      return;
    }
    
    const make = md.Make || 'Unknown';
    const model = md.Model || 'Unknown';
    const gps = (md.latitude && md.longitude) ? `${md.latitude.toFixed(6)}, ${md.longitude.toFixed(6)}` : 'Not Found';
    const date = md.DateTimeOriginal || md.CreateDate || 'Unknown';
    
    resultDiv.innerHTML = `
      <div class="bg-slate-900/80 rounded-xl p-6 border border-slate-700 fade-in">
        <h3 class="text-purple-400 font-bold mb-4 flex items-center gap-2"><i class="fa-solid fa-circle-check"></i> Metadata Extracted</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">Device</p>
            <p class="text-white font-medium">${make} ${model}</p>
          </div>
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">Date Taken</p>
            <p class="text-white font-medium">${date}</p>
          </div>
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700 md:col-span-2">
            <p class="text-xs text-slate-400 uppercase">GPS Location</p>
            <p class="text-white font-medium font-mono">${gps}</p>
            ${md.latitude ? `<a href="https://www.google.com/maps?q=${md.latitude},${md.longitude}" target="_blank" class="text-xs text-blue-400 hover:underline mt-1 inline-block"><i class="fa-solid fa-map-location-dot"></i> Open in Maps</a>` : ''}
          </div>
        </div>

        <details class="bg-[#0B0F19] rounded-lg border border-slate-700 overflow-hidden">
          <summary class="cursor-pointer p-3 text-sm text-slate-300 font-mono hover:text-white"><i class="fa-solid fa-code"></i> View Raw JSON Payload</summary>
          <pre class="p-4 text-xs font-mono text-green-400 overflow-auto max-h-60 border-t border-slate-700">${JSON.stringify(md, null, 2)}</pre>
        </details>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 mt-4 bg-red-900/20 p-4 rounded-xl border border-red-500/50">Error: ${err.message}</div>`;
  }
}

// ==========================================
// 3. INBUILT EMAIL MODULE (HackMyIP API - CORS Enabled)
// ==========================================
function renderEmailModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
      <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
        <i class="fa-solid fa-envelope text-blue-400 text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-white">Email Breach Check</h2>
        <p class="text-sm text-slate-400">Check if an email has been compromised in known breaches.</p>
      </div>
    </div>
    
    <div class="flex flex-col md:flex-row gap-3 mb-6">
      <input type="email" id="emailInput" placeholder="target@example.com" class="flex-1 bg-[#0B0F19] border border-slate-600 rounded-xl py-3 px-4 text-white font-mono placeholder-slate-500 focus:border-blue-500">
      <button onclick="scanEmail()" class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/30">Check</button>
    </div>
    <div id="emailResult" class="mt-6"></div>
  `;
}

async function scanEmail() {
  const email = document.getElementById('emailInput').value.trim();
  const resultDiv = document.getElementById('emailResult');
  
  if (!email) return alert('Please enter an email address.');
  
  resultDiv.innerHTML = '<div class="text-center text-blue-400 mt-4 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Scanning Breaches...</div>';
  
  try {
    // HackMyIP API - Free, no key, CORS enabled
    const res = await fetch(`https://hackmyip.com/api/breach?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('API limit reached or invalid email.');
    
    const data = await res.json();
    
    if (data.breaches && data.breaches.length > 0) {
      resultDiv.innerHTML = `
        <div class="bg-red-900/20 border border-red-500/50 rounded-xl p-6 fade-in">
          <h3 class="text-red-400 font-bold mb-2 flex items-center gap-2"><i class="fa-solid fa-triangle-exclamation"></i> Compromised!</h3>
          <p class="text-white text-sm mb-4">This email was found in <strong>${data.breaches.length}</strong> data breaches.</p>
          <div class="flex flex-wrap gap-2">
            ${data.breaches.map(b => `<span class="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs border border-red-500/30">${b}</span>`).join('')}
          </div>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `
        <div class="bg-green-900/20 border border-green-500/50 rounded-xl p-6 fade-in">
          <h3 class="text-green-400 font-bold mb-2 flex items-center gap-2"><i class="fa-solid fa-shield-check"></i> No Breaches Found</h3>
          <p class="text-slate-300 text-sm">Good news! This email was not found in any known public data breaches.</p>
        </div>
      `;
    }
  } catch (err) {
    // Fallback to XposedOrNot if HackMyIP fails
    try {
      const res = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('No breaches found or API limit.');
      const data = await res.json();
      
      if (data.breaches && data.breaches.length > 0) {
         resultDiv.innerHTML = `
          <div class="bg-red-900/20 border border-red-500/50 rounded-xl p-6 fade-in">
            <h3 class="text-red-400 font-bold mb-2"><i class="fa-solid fa-triangle-exclamation"></i> Compromised (XposedOrNot)</h3>
            <p class="text-white text-sm mb-4">Found in <strong>${data.breaches.length}</strong> breaches.</p>
            <div class="flex flex-wrap gap-2">
              ${data.breaches.map(b => `<span class="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs border border-red-500/30">${b}</span>`).join('')}
            </div>
          </div>
        `;
      } else {
         resultDiv.innerHTML = `<div class="text-green-400 mt-4 bg-green-900/20 p-4 rounded-xl border border-green-500/50">No breaches found.</div>`;
      }
    } catch (err2) {
      resultDiv.innerHTML = `<div class="text-red-400 mt-4 bg-red-900/20 p-4 rounded-xl border border-red-500/50">Error: ${err.message}</div>`;
    }
  }
}

// ==========================================
// 4. INBUILT IP MODULE (ipwho.is - CORS Enabled)
// ==========================================
function renderIPModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
      <div class="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
        <i class="fa-solid fa-network-wired text-orange-400 text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-white">IP Address Lookup</h2>
        <p class="text-sm text-slate-400">Geolocate any IP address, fetch ISP and timezone.</p>
      </div>
    </div>
    
    <div class="flex flex-col md:flex-row gap-3 mb-6">
      <input type="text" id="ipInput" placeholder="8.8.8.8" class="flex-1 bg-[#0B0F19] border border-slate-600 rounded-xl py-3 px-4 text-white font-mono placeholder-slate-500 focus:border-orange-500">
      <button onclick="scanIP()" class="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-900/30">Lookup</button>
    </div>
    <div id="ipResult" class="mt-6"></div>
  `;
}

async function scanIP() {
  const ip = document.getElementById('ipInput').value.trim();
  const resultDiv = document.getElementById('ipResult');
  
  if (!ip) return alert('Please enter an IP address.');
  
  resultDiv.innerHTML = '<div class="text-center text-orange-400 mt-4 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Locating IP...</div>';
  
  try {
    // ipwho.is - Free, no key, CORS enabled
    const res = await fetch(`https://ipwho.is/${ip}`);
    const data = await res.json();
    
    if (!data.success) throw new Error(data.message || 'Invalid IP');
    
    resultDiv.innerHTML = `
      <div class="bg-slate-900/80 rounded-xl p-6 border border-slate-700 fade-in">
        <h3 class="text-orange-400 font-bold mb-4 flex items-center gap-2"><i class="fa-solid fa-location-dot"></i> Location Data</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700"><p class="text-xs text-slate-400 uppercase">City / Region</p><p class="text-white font-medium">${data.city || 'N/A'}, ${data.region || 'N/A'}</p></div>
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700"><p class="text-xs text-slate-400 uppercase">Country</p><p class="text-white font-medium">${data.country || 'N/A'}</p></div>
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700"><p class="text-xs text-slate-400 uppercase">ISP / Organization</p><p class="text-white font-medium">${data.connection?.isp || 'N/A'}</p></div>
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700"><p class="text-xs text-slate-400 uppercase">Timezone</p><p class="text-white font-medium">${data.timezone?.id || 'N/A'}</p></div>
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 mt-4 bg-red-900/20 p-4 rounded-xl border border-red-500/50">Error: ${err.message}</div>`;
  }
}

// ==========================================
// 5. INBUILT USERNAME MODULE (GitHub API)
// ==========================================
function renderUsernameModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
      <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
        <i class="fa-solid fa-user-secret text-cyan-400 text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-white">Username Enumeration</h2>
        <p class="text-sm text-slate-400">Fetch public GitHub profile data instantly.</p>
      </div>
    </div>
    
    <div class="flex flex-col md:flex-row gap-3 mb-6">
      <input type="text" id="usernameInput" placeholder="johndoe" class="flex-1 bg-[#0B0F19] border border-slate-600 rounded-xl py-3 px-4 text-white font-mono placeholder-slate-500 focus:border-cyan-500">
      <button onclick="scanUsername()" class="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/30">Search</button>
    </div>
    <div id="usernameResult" class="mt-6"></div>
  `;
}

async function scanUsername() {
  const username = document.getElementById('usernameInput').value.trim();
  const resultDiv = document.getElementById('usernameResult');
  
  if (!username) return alert('Please enter a username.');
  
  resultDiv.innerHTML = '<div class="text-center text-cyan-400 mt-4 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Searching GitHub...</div>';
  
  try {
    const res = await fetch(`https://api.github.com/users/${username}`);
    
    if (!res.ok) {
      resultDiv.innerHTML = `<div class="text-yellow-400 mt-4 bg-yellow-900/20 p-4 rounded-xl border border-yellow-500/50">User "${username}" not found on GitHub.</div>`;
      return;
    }
    
    const data = await res.json();
    
    resultDiv.innerHTML = `
      <div class="bg-slate-900/80 rounded-xl p-6 border border-slate-700 fade-in flex flex-col md:flex-row gap-6 items-center">
        <img src="${data.avatar_url}" class="w-28 h-28 rounded-full border-4 border-cyan-500 shadow-lg shadow-cyan-500/20">
        <div class="flex-1 text-center md:text-left">
          <h3 class="text-2xl font-bold text-white">${data.name || data.login}</h3>
          <p class="text-cyan-400 font-mono text-sm mb-2">@${data.login}</p>
          <p class="text-slate-300 text-sm mb-4">${data.bio || 'No bio available.'}</p>
          <div class="flex gap-4 justify-center md:justify-start text-sm">
            <div class="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700"><strong class="text-white">${data.public_repos}</strong> <span class="text-slate-400">Repos</span></div>
            <div class="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700"><strong class="text-white">${data.followers}</strong> <span class="text-slate-400">Followers</span></div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 mt-4 bg-red-900/20 p-4 rounded-xl border border-red-500/50">Error: ${err.message}</div>`;
  }
}
