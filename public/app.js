/* ============================================================
   MODx OSINT - Core Logic
   ============================================================ */

const homePage = document.getElementById('homePage');
const modulePage = document.getElementById('modulePage');
const moduleContent = document.getElementById('moduleContent');
const toolDirectory = document.getElementById('toolDirectory');

// ==========================================
// NAVIGATION
// ==========================================
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
    case 'instagram': renderInstagramModule(); break;
    case 'email': renderEmailModule(); break;
    case 'ip': renderIPModule(); break;
    case 'username': renderUsernameModule(); break;
  }
}

// ==========================================
// TOOLS DIRECTORY
// ==========================================
const TOOLS = [
  { name: 'Sherlock', desc: 'Hunt usernames across 400+ sites.', url: 'https://sherlock-project.github.io/' },
  { name: 'PhoneInfoga', desc: 'Advanced phone number OSINT.', url: 'https://github.com/sundowndev/phoneinfoga' },
  { name: 'Holehe', desc: 'Check which sites an email is registered on.', url: 'https://github.com/megadose/holehe' },
  { name: 'Picuki', desc: 'View Instagram profiles anonymously.', url: 'https://www.picuki.com/' },
  { name: 'Yandex Images', desc: 'Reverse image search for faces and places.', url: 'https://yandex.com/images/' },
  { name: 'Shodan', desc: 'Search engine for IoT devices.', url: 'https://www.shodan.io/' },
  { name: 'HaveIBeenPwned', desc: 'Check email breaches.', url: 'https://haveibeenpwned.com/' },
  { name: 'ViewDNS', desc: 'DNS and IP history tools.', url: 'https://viewdns.info/' }
];

function renderTools() {
  toolDirectory.innerHTML = TOOLS.map(tool => `
    <a href="${tool.url}" target="_blank" class="block bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-purple-500 transition-colors group">
      <h4 class="font-bold text-white group-hover:text-purple-400 transition-colors mb-1">${tool.name} <i class="fa-solid fa-arrow-up-right-from-square text-xs ml-1"></i></h4>
      <p class="text-xs text-slate-400">${tool.desc}</p>
    </a>
  `).join('');
}

// ==========================================
// 1. PHONE MODULE (randomapi.dev)
// ==========================================
function renderPhoneModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center"><i class="fa-solid fa-phone text-green-400"></i></div>
      <h2 class="text-2xl font-bold text-white">Phone Number Intel</h2>
    </div>
    <p class="text-slate-400 mb-6 text-sm">Enter number in international format. Example: <span class="text-green-400 font-mono">+91 9876543210</span> or <span class="text-green-400 font-mono">+1 2025550143</span></p>
    
    <div class="flex gap-2">
      <input type="tel" id="phoneInput" placeholder="+91 98765 43210" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white font-mono focus:outline-none focus:border-green-500 transition-colors">
      <button onclick="scanPhone()" class="bg-green-600 hover:bg-green-500 text-white px-6 rounded-xl font-bold transition-colors">Scan</button>
    </div>
    <div id="phoneResult" class="mt-6"></div>
  `;
}

async function scanPhone() {
  const input = document.getElementById('phoneInput').value.trim();
  const resultDiv = document.getElementById('phoneResult');
  
  if (!input) return alert('Please enter a phone number.');
  
  // Format: ensure single space after country code if user typed without it
  let formatted = input.replace(/(\+\d+)\s*/, '$1 ');
  
  resultDiv.innerHTML = '<div class="spinner mx-auto mt-4"></div>';
  
  try {
    // RandomAPI.dev - Free, No Key, CORS enabled
    const res = await fetch(`https://randomapi.dev/api/phone-numbers/parse?value=${encodeURIComponent(formatted)}`);
    const data = await res.json();
    
    if (data.error) throw new Error(data.error);
    
    const info = data.data || data;
    
    resultDiv.innerHTML = `
      <div class="bg-slate-900 rounded-xl p-6 border border-slate-700 fade-in">
        <h3 class="text-green-400 font-bold mb-4 font-mono"><i class="fa-solid fa-circle-check"></i> Valid Number</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-slate-800 p-3 rounded-lg">
            <p class="text-xs text-slate-500">Formatted</p>
            <p class="text-white font-mono">${info.internationalFormat || formatted}</p>
          </div>
          <div class="bg-slate-800 p-3 rounded-lg">
            <p class="text-xs text-slate-500">Country</p>
            <p class="text-white font-mono">${info.countryCode || 'N/A'}</p>
          </div>
          <div class="bg-slate-800 p-3 rounded-lg">
            <p class="text-xs text-slate-500">Type</p>
            <p class="text-white font-mono">${info.numberType || 'N/A'}</p>
          </div>
          <div class="bg-slate-800 p-3 rounded-lg">
            <p class="text-xs text-slate-500">Carrier</p>
            <p class="text-white font-mono">${info.carrier || 'N/A'}</p>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 text-sm mt-4">Error: ${err.message}</div>`;
  }
}

// ==========================================
// 2. PHOTO EXIF MODULE
// ==========================================
function renderPhotoModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center"><i class="fa-solid fa-camera text-purple-400"></i></div>
      <h2 class="text-2xl font-bold text-white">Photo EXIF Extractor</h2>
    </div>
    
    <div class="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors" onclick="document.getElementById('photoInput').click()">
      <i class="fa-solid fa-cloud-arrow-up text-3xl text-purple-500 mb-3"></i>
      <p class="text-slate-300 font-semibold">Click to upload a photo</p>
      <input type="file" id="photoInput" class="hidden" accept="image/*" onchange="scanPhoto(this)">
    </div>
    <div id="photoResult" class="mt-6"></div>
  `;
}

async function scanPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  
  const resultDiv = document.getElementById('photoResult');
  resultDiv.innerHTML = '<div class="spinner mx-auto mt-4"></div>';
  
  try {
    const md = await exifr.parse(file, true) || {};
    
    const make = md.Make || 'Unknown';
    const model = md.Model || 'Unknown';
    const gps = (md.latitude && md.longitude) ? `${md.latitude.toFixed(5)}, ${md.longitude.toFixed(5)}` : 'Not Found';
    const date = md.DateTimeOriginal || md.CreateDate || 'Unknown';
    
    if(Object.keys(md).length < 3) {
      resultDiv.innerHTML = '<div class="text-yellow-400 mt-4">No EXIF data found. This may be a screenshot or stripped image.</div>';
      return;
    }
    
    resultDiv.innerHTML = `
      <div class="bg-slate-900 rounded-xl p-6 border border-slate-700 fade-in">
        <h3 class="text-purple-400 font-bold mb-4"><i class="fa-regular fa-image"></i> Metadata Found</h3>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="bg-slate-800 p-3 rounded-lg"><p class="text-xs text-slate-500">Device</p><p class="text-white text-sm">${make} ${model}</p></div>
          <div class="bg-slate-800 p-3 rounded-lg"><p class="text-xs text-slate-500">Date</p><p class="text-white text-sm">${date}</p></div>
          <div class="bg-slate-800 p-3 rounded-lg col-span-2"><p class="text-xs text-slate-500">GPS</p><p class="text-white text-sm font-mono">${gps}</p></div>
        </div>
        <details class="mt-4">
          <summary class="cursor-pointer text-sm text-slate-400 hover:text-white">View Raw JSON</summary>
          <pre class="mt-2 bg-black/50 p-4 rounded-lg text-xs font-mono text-green-400 overflow-auto max-h-60">${JSON.stringify(md, null, 2)}</pre>
        </details>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 mt-4">Error: ${err.message}</div>`;
  }
}

// ==========================================
// 3. INSTAGRAM MODULE (Private API via CORS proxy)
// ==========================================
function renderInstagramModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center"><i class="fa-brands fa-instagram text-pink-400"></i></div>
      <h2 class="text-2xl font-bold text-white">Instagram Profile Intel</h2>
    </div>
    <div class="flex gap-2">
      <input type="text" id="igInput" placeholder="Enter username (without @)" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white font-mono focus:outline-none focus:border-pink-500 transition-colors">
      <button onclick="scanInstagram()" class="bg-pink-600 hover:bg-pink-500 text-white px-6 rounded-xl font-bold transition-colors">Scan</button>
    </div>
    <div id="igResult" class="mt-6"></div>
  `;
}

async function scanInstagram() {
  const username = document.getElementById('igInput').value.trim().replace('@', '');
  const resultDiv = document.getElementById('igResult');
  
  if (!username) return alert('Please enter an Instagram username.');
  
  resultDiv.innerHTML = '<div class="spinner mx-auto mt-4"></div>';
  
  try {
    // Use private API endpoint via CORS proxy
    const targetUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    
    const res = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Instagram 219.0.0.12.117 Android'
      }
    });
    
    if (!res.ok) throw new Error('Profile not found or private.');
    
    const data = await res.json();
    const user = data.data?.user;
    
    if (!user) throw new Error('Could not parse profile data.');
    
    resultDiv.innerHTML = `
      <div class="bg-slate-900 rounded-xl p-6 border border-slate-700 fade-in flex flex-col md:flex-row gap-6 items-center">
        <img src="${user.profile_pic_url_hd || user.profile_pic_url}" class="w-24 h-24 rounded-full border-4 border-pink-500">
        <div class="flex-1 text-center md:text-left">
          <h3 class="text-xl font-bold text-white">${user.full_name || user.username}</h3>
          <p class="text-pink-400 font-mono text-sm">@${user.username}</p>
          <p class="text-slate-400 text-sm mt-2">${user.biography || 'No bio available.'}</p>
          <div class="flex gap-4 justify-center md:justify-start mt-3 text-sm">
            <span><strong class="text-white">${user.edge_followed_by?.count || 0}</strong> <span class="text-slate-500">Followers</span></span>
            <span><strong class="text-white">${user.edge_owner_to_timeline_media?.count || 0}</strong> <span class="text-slate-500">Posts</span></span>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 text-sm mt-4">Error: ${err.message}. The profile may be private or the API is temporarily rate-limited.</div>`;
  }
}

// ==========================================
// 4. EMAIL MODULE (HackMyIP Breach Check)
// ==========================================
function renderEmailModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><i class="fa-solid fa-envelope text-blue-400"></i></div>
      <h2 class="text-2xl font-bold text-white">Email Breach Check</h2>
    </div>
    <div class="flex gap-2">
      <input type="email" id="emailInput" placeholder="target@example.com" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white font-mono focus:outline-none focus:border-blue-500 transition-colors">
      <button onclick="scanEmail()" class="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-bold transition-colors">Check</button>
    </div>
    <div id="emailResult" class="mt-6"></div>
  `;
}

async function scanEmail() {
  const email = document.getElementById('emailInput').value.trim();
  const resultDiv = document.getElementById('emailResult');
  
  if (!email) return alert('Please enter an email address.');
  
  resultDiv.innerHTML = '<div class="spinner mx-auto mt-4"></div>';
  
  try {
    // HackMyIP - Free, No Key, CORS enabled
    const res = await fetch(`https://hackmyip.com/api/breach?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    
    if (data.breached) {
      resultDiv.innerHTML = `
        <div class="bg-red-900/30 border border-red-500/50 rounded-xl p-6 fade-in">
          <h3 class="text-red-400 font-bold mb-2"><i class="fa-solid fa-triangle-exclamation"></i> Breached!</h3>
          <p class="text-white text-sm">This email was found in <strong>${data.count || 'multiple'}</strong> data breaches.</p>
          <ul class="mt-3 text-xs text-slate-400 list-disc pl-5">
            ${(data.breaches || []).slice(0, 5).map(b => `<li>${b.name || b}</li>`).join('')}
          </ul>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `
        <div class="bg-green-900/30 border border-green-500/50 rounded-xl p-6 fade-in">
          <h3 class="text-green-400 font-bold mb-2"><i class="fa-solid fa-circle-check"></i> No Breaches Found</h3>
          <p class="text-white text-sm">Good news! This email was not found in any known data breaches.</p>
        </div>
      `;
    }
  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 mt-4">Error: ${err.message}</div>`;
  }
}

// ==========================================
// 5. IP MODULE (ipwho.org)
// ==========================================
function renderIPModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center"><i class="fa-solid fa-network-wired text-orange-400"></i></div>
      <h2 class="text-2xl font-bold text-white">IP Address Lookup</h2>
    </div>
    <div class="flex gap-2">
      <input type="text" id="ipInput" placeholder="8.8.8.8" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white font-mono focus:outline-none focus:border-orange-500 transition-colors">
      <button onclick="scanIP()" class="bg-orange-600 hover:bg-orange-500 text-white px-6 rounded-xl font-bold transition-colors">Lookup</button>
    </div>
    <div id="ipResult" class="mt-6"></div>
  `;
}

async function scanIP() {
  const ip = document.getElementById('ipInput').value.trim();
  const resultDiv = document.getElementById('ipResult');
  
  if (!ip) return alert('Please enter an IP address.');
  
  resultDiv.innerHTML = '<div class="spinner mx-auto mt-4"></div>';
  
  try {
    // ipwho.org - Free, No Key, CORS enabled
    const res = await fetch(`https://ipwho.org/${ip}`);
    const data = await res.json();
    
    if (data.success === false) throw new Error(data.message || 'Invalid IP');
    
    resultDiv.innerHTML = `
      <div class="bg-slate-900 rounded-xl p-6 border border-slate-700 fade-in">
        <h3 class="text-orange-400 font-bold mb-4"><i class="fa-solid fa-location-dot"></i> ${ip}</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-slate-800 p-3 rounded-lg"><p class="text-xs text-slate-500">City</p><p class="text-white text-sm">${data.city || 'N/A'}</p></div>
          <div class="bg-slate-800 p-3 rounded-lg"><p class="text-xs text-slate-500">Country</p><p class="text-white text-sm">${data.country || 'N/A'}</p></div>
          <div class="bg-slate-800 p-3 rounded-lg"><p class="text-xs text-slate-500">ISP</p><p class="text-white text-sm">${data.connection?.isp || 'N/A'}</p></div>
          <div class="bg-slate-800 p-3 rounded-lg"><p class="text-xs text-slate-500">Timezone</p><p class="text-white text-sm">${data.timezone?.id || 'N/A'}</p></div>
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 mt-4">Error: ${err.message}</div>`;
  }
}

// ==========================================
// 6. USERNAME MODULE (GitHub + Links)
// ==========================================
function renderUsernameModule() {
  moduleContent.innerHTML = `
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center"><i class="fa-solid fa-user-secret text-cyan-400"></i></div>
      <h2 class="text-2xl font-bold text-white">Username Enumeration</h2>
    </div>
    <div class="flex gap-2">
      <input type="text" id="usernameInput" placeholder="johndoe" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors">
      <button onclick="scanUsername()" class="bg-cyan-600 hover:bg-cyan-500 text-white px-6 rounded-xl font-bold transition-colors">Search</button>
    </div>
    <div id="usernameResult" class="mt-6"></div>
  `;
}

async function scanUsername() {
  const username = document.getElementById('usernameInput').value.trim();
  const resultDiv = document.getElementById('usernameResult');
  
  if (!username) return alert('Please enter a username.');
  
  resultDiv.innerHTML = '<div class="spinner mx-auto mt-4"></div>';
  
  try {
    // GitHub API (free, CORS enabled)
    const res = await fetch(`https://api.github.com/users/${username}`);
    
    if (!res.ok) {
      resultDiv.innerHTML = `<div class="text-yellow-400 mt-4">Username "${username}" not found on GitHub. Try checking other platforms in the Tools directory.</div>`;
      return;
    }
    
    const data = await res.json();
    
    resultDiv.innerHTML = `
      <div class="bg-slate-900 rounded-xl p-6 border border-slate-700 fade-in flex flex-col md:flex-row gap-6 items-center">
        <img src="${data.avatar_url}" class="w-24 h-24 rounded-full border-4 border-cyan-500">
        <div class="flex-1 text-center md:text-left">
          <h3 class="text-xl font-bold text-white">${data.name || data.login}</h3>
          <p class="text-cyan-400 font-mono text-sm">@${data.login}</p>
          <p class="text-slate-400 text-sm mt-2">${data.bio || 'No bio available.'}</p>
          <div class="flex gap-4 justify-center md:justify-start mt-3 text-sm">
            <span><strong class="text-white">${data.public_repos}</strong> <span class="text-slate-500">Repos</span></span>
            <span><strong class="text-white">${data.followers}</strong> <span class="text-slate-500">Followers</span></span>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-400 mt-4">Error: ${err.message}</div>`;
  }
}

// ==========================================
// INIT
// ==========================================
renderTools();
