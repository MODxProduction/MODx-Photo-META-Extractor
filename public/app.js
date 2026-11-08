/* ============================================================
   MODx OSINT - Inbuilt Intelligence Engine (All Modules Fixed)
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
// 1. PHONE MODULE (Inbuilt Parsing + Deep Details)
// ==========================================
function renderPhoneModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
      <div class="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
        <i class="fa-solid fa-phone text-green-400 text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-white">Phone Number Intel</h2>
        <p class="text-sm text-slate-400">Inbuilt offline parsing with E.164 validation.</p>
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
  
  resultDiv.innerHTML = '<div class="text-center text-green-400 mt-4 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Analyzing Number...</div>';

  try {
    const phoneNumber = libphonenumber.parsePhoneNumberFromString(input);
    
    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error('Invalid phone number format or country code.');
    }

    const country = phoneNumber.country || 'Unknown';
    const type = phoneNumber.getType() || 'Unknown';
    const intlFormat = phoneNumber.formatInternational();
    const nationalFormat = phoneNumber.formatNational();

    resultDiv.innerHTML = `
      <div class="bg-slate-900/80 rounded-xl p-6 border border-slate-700 fade-in">
        <h3 class="text-green-400 font-bold mb-4 flex items-center gap-2"><i class="fa-solid fa-circle-check"></i> Valid Number</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">International Format</p>
            <p class="text-white font-medium font-mono text-lg">${intlFormat}</p>
          </div>
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">National Format</p>
            <p class="text-white font-medium font-mono text-lg">${nationalFormat}</p>
          </div>
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">Country Code</p>
            <p class="text-white font-medium">${country}</p>
          </div>
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">Line Type</p>
            <p class="text-white font-medium capitalize">${type}</p>
          </div>
        </div>
        <div class="mt-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400"><i class="fa-solid fa-info-circle mr-1"></i> Data parsed locally via open-source telecom standards.</p>
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
// 3. EMAIL MODULE (Multi-Engine Fallback)
// ==========================================
function renderEmailModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
      <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
        <i class="fa-solid fa-envelope text-blue-400 text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-white">Email Breach Analytics</h2>
        <p class="text-sm text-slate-400">Multi-engine breach checking.</p>
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
    // Attempt 1: HackMyIP
    const res = await fetch(`https://hackmyip.com/api/breach?email=${encodeURIComponent(email)}`);
    if (res.ok) {
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
            return;
        }
    }
    
    // Attempt 2: XposedOrNot Fallback
    const res2 = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`);
    if (res2.ok) {
        const data2 = await res2.json();
        if (data2.breaches && data2.breaches.length > 0) {
            resultDiv.innerHTML = `
                <div class="bg-red-900/20 border border-red-500/50 rounded-xl p-6 fade-in">
                <h3 class="text-red-400 font-bold mb-2 flex items-center gap-2"><i class="fa-solid fa-triangle-exclamation"></i> Compromised!</h3>
                <p class="text-white text-sm mb-4">This email was found in <strong>${data2.breaches.length}</strong> data breaches.</p>
                <div class="flex flex-wrap gap-2">
                    ${data2.breaches.map(b => `<span class="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs border border-red-500/30">${b}</span>`).join('')}
                </div>
                </div>
            `;
            return;
        }
    }

    // Clean
    resultDiv.innerHTML = `
        <div class="bg-green-900/20 border border-green-500/50 rounded-xl p-6 fade-in">
        <h3 class="text-green-400 font-bold mb-2 flex items-center gap-2"><i class="fa-solid fa-shield-check"></i> No Breaches Found</h3>
        <p class="text-slate-300 text-sm">Good news! This email was not found in any known public data breaches.</p>
        </div>
    `;

  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 mt-4 bg-red-900/20 p-4 rounded-xl border border-red-500/50">Error: All scanning engines failed. Please try again later.</div>`;
  }
}

// ==========================================
// 4. INBUILT IP MODULE (ipwho.is)
// ==========================================
function renderIPModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
      <div class="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
        <i class="fa-solid fa-network-wired text-orange-400 text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-white">IP Address Lookup</h2>
        <p class="text-sm text-slate-400">Extract full geolocation, ISP, and network details.</p>
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
    const res = await fetch(`https://ipwho.is/${ip}`);
    const data = await res.json();
    
    if (!data.success) throw new Error(data.message || 'Invalid IP');
    
    resultDiv.innerHTML = `
      <div class="bg-slate-900/80 rounded-xl p-6 border border-slate-700 fade-in">
        <h3 class="text-orange-400 font-bold mb-4 flex items-center gap-2"><i class="fa-solid fa-location-dot"></i> Deep IP Intelligence</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">IP Address</p>
            <p class="text-white font-medium font-mono text-lg">${data.ip}</p>
            <p class="text-xs text-slate-400 mt-1">Type: ${data.type}</p>
          </div>
          
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">Location</p>
            <p class="text-white font-medium">${data.city || 'N/A'}, ${data.region || 'N/A'}</p>
            <p class="text-slate-400 text-sm">${data.country || 'N/A'} (${data.country_code || 'N/A'})</p>
          </div>
          
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">Coordinates</p>
            <p class="text-white font-medium font-mono">Lat: ${data.latitude} <br> Lon: ${data.longitude}</p>
          </div>
          
          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p class="text-xs text-slate-400 uppercase">Timezone</p>
            <p class="text-white font-medium">${data.timezone?.id || 'N/A'}</p>
            <p class="text-slate-400 text-sm">UTC: ${data.timezone?.utc || 'N/A'}</p>
          </div>

          <div class="bg-slate-800 p-4 rounded-lg border border-slate-700 md:col-span-2">
            <p class="text-xs text-slate-400 uppercase mb-2">Network / ISP Details</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div><span class="text-slate-400 text-xs">ISP:</span> <span class="text-white text-sm">${data.connection?.isp || 'N/A'}</span></div>
                <div><span class="text-slate-400 text-xs">Organization:</span> <span class="text-white text-sm">${data.connection?.org || 'N/A'}</span></div>
                <div><span class="text-slate-400 text-xs">ASN:</span> <span class="text-white text-sm font-mono">${data.connection?.asn || 'N/A'}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 mt-4 bg-red-900/20 p-4 rounded-xl border border-red-500/50">Error: ${err.message}</div>`;
  }
}

// ==========================================
// 5. UNIVERSAL USERNAME SEARCH (Instagram, Telegram, GitHub)
// ==========================================
function renderUsernameModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
      <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
        <i class="fa-solid fa-user-secret text-cyan-400 text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-white">Username Search</h2>
        <p class="text-sm text-slate-400">Deep search across Instagram, Telegram, and GitHub.</p>
      </div>
    </div>

    <div class="flex gap-2 mb-4 p-1 bg-slate-800 rounded-xl w-max">
        <button id="tab-ig" onclick="switchPlatform('ig')" class="px-4 py-2 rounded-lg font-medium text-sm transition-all bg-pink-600 text-white shadow-md">
            <i class="fa-brands fa-instagram mr-1"></i> Instagram
        </button>
        <button id="tab-tg" onclick="switchPlatform('tg')" class="px-4 py-2 rounded-lg font-medium text-sm transition-all text-slate-400 hover:text-white">
            <i class="fa-brands fa-telegram mr-1"></i> Telegram
        </button>
        <button id="tab-gh" onclick="switchPlatform('gh')" class="px-4 py-2 rounded-lg font-medium text-sm transition-all text-slate-400 hover:text-white">
            <i class="fa-brands fa-github mr-1"></i> GitHub
        </button>
    </div>
    
    <div class="flex flex-col md:flex-row gap-3 mb-6">
      <input type="text" id="usernameInput" placeholder="Enter username (without @)" class="flex-1 bg-[#0B0F19] border border-slate-600 rounded-xl py-3 px-4 text-white font-mono placeholder-slate-500 focus:border-cyan-500">
      <button onclick="scanUsername()" class="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/30">Search</button>
    </div>
    <div id="usernameResult" class="mt-6"></div>
  `;
}

window.currentPlatform = 'ig';

function switchPlatform(platform) {
    window.currentPlatform = platform;
    const tabs = ['ig', 'tg', 'gh'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (t === platform) {
            btn.className = "px-4 py-2 rounded-lg font-medium text-sm transition-all bg-cyan-600 text-white shadow-md";
        } else {
            btn.className = "px-4 py-2 rounded-lg font-medium text-sm transition-all text-slate-400 hover:text-white";
        }
    });
}

async function scanUsername() {
  const username = document.getElementById('usernameInput').value.trim().replace('@', '');
  const resultDiv = document.getElementById('usernameResult');
  const platform = window.currentPlatform;
  
  if (!username) return alert('Please enter a username.');
  
  resultDiv.innerHTML = '<div class="text-center text-cyan-400 mt-4 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Searching...</div>';
  
  try {
    if (platform === 'gh') {
        // GitHub API
        const res = await fetch(`https://api.github.com/users/${username}`);
        if (!res.ok) throw new Error('User not found on GitHub.');
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

    } else if (platform === 'ig') {
        // Instagram Public Data (via Proxy)
        const targetUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`, {
            headers: { 'User-Agent': 'Instagram 219.0.0.12.117 Android' }
        });
        if (!res.ok) throw new Error('Profile not found or private.');
        const data = await res.json();
        const user = data.data?.user;
        if (!user) throw new Error('Could not parse profile data.');

        resultDiv.innerHTML = `
          <div class="bg-slate-900/80 rounded-xl p-6 border border-slate-700 fade-in flex flex-col md:flex-row gap-6 items-center">
            <img src="${user.profile_pic_url_hd || user.profile_pic_url}" class="w-28 h-28 rounded-full border-4 border-pink-500 shadow-lg shadow-pink-500/20">
            <div class="flex-1 text-center md:text-left">
              <h3 class="text-2xl font-bold text-white">${user.full_name || user.username}</h3>
              <p class="text-pink-400 font-mono text-sm mb-2">@${user.username}</p>
              <p class="text-slate-300 text-sm mb-4">${user.biography || 'No bio available.'}</p>
              <div class="flex gap-4 justify-center md:justify-start text-sm">
                <div class="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700"><strong class="text-white">${user.edge_followed_by?.count || 0}</strong> <span class="text-slate-400">Followers</span></div>
                <div class="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700"><strong class="text-white">${user.edge_owner_to_timeline_media?.count || 0}</strong> <span class="text-slate-400">Posts</span></div>
              </div>
            </div>
          </div>
        `;

    } else if (platform === 'tg') {
        // Telegram Public Data (via Limzo free API)
        const res = await fetch(`https://api.limzo.com/v1/telegram/${username}`);
        if (!res.ok) throw new Error('Telegram profile not found or private.');
        const data = await res.json();
        
        resultDiv.innerHTML = `
          <div class="bg-slate-900/80 rounded-xl p-6 border border-slate-700 fade-in flex flex-col md:flex-row gap-6 items-center">
            <div class="w-28 h-28 rounded-full border-4 border-blue-500 bg-slate-800 flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden">
                ${data.image ? `<img src="${data.image}" class="w-full h-full object-cover">` : `<i class="fa-brands fa-telegram text-5xl text-blue-400"></i>`}
            </div>
            <div class="flex-1 text-center md:text-left">
              <h3 class="text-2xl font-bold text-white">${data.name || data.title || 'Telegram User'}</h3>
              <p class="text-blue-400 font-mono text-sm mb-2">@${username}</p>
              <p class="text-slate-300 text-sm mb-4">${data.bio || data.description || 'No bio available.'}</p>
              <div class="flex gap-4 justify-center md:justify-start text-sm">
                <div class="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700"><strong class="text-white">${data.members || 'N/A'}</strong> <span class="text-slate-400">Members/Subs</span></div>
              </div>
            </div>
          </div>
        `;
    }

  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 mt-4 bg-red-900/20 p-4 rounded-xl border border-red-500/50">Error: ${err.message}</div>`;
  }
}
