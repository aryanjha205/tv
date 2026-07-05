let currentPin = '';

async function login() {
    const pin = document.getElementById('pin-input').value.trim();
    if (!pin) {
        alert('Enter your PIN');
        return;
    }
    try {
        const res = await fetch(`/api/admin/login?pin=${encodeURIComponent(pin)}`, { method: 'POST' });
        if (res.ok) {
            currentPin = pin;
            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            loadDashboard();
        } else if (res.status === 401) {
            alert('Invalid PIN');
        } else {
            alert(`Server error (${res.status}). Please try again.`);
        }
    } catch (e) {
        alert('Login failed');
    }
}

async function loadDashboard() {
    // Load Settings (Logo)
    fetch('/api/settings/logo_url').then(res => res.json()).then(data => {
        if (data && data.value) document.getElementById('logo-url').value = data.value;
    });

    // Load Playlist
    fetch('/api/videos').then(res => res.json()).then(videos => {
        const list = document.getElementById('playlist-list');
        list.innerHTML = '';
        videos.forEach(v => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="info"><strong>${v.title}</strong><small>Order: ${v.playlist_order} • Type: ${v.type}</small></div> <button class="danger" onclick="deleteVideo(${v.id})">Delete</button>`;
            list.appendChild(li);
        });
    });

    // Load Ads
    fetch('/api/ads').then(res => res.json()).then(ads => {
        const list = document.getElementById('ads-list');
        list.innerHTML = '';
        ads.forEach(ad => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="info"><strong>Ad #${ad.id}</strong><small style="word-break: break-all; max-width: 200px;">${ad.url}</small></div> <button class="danger" onclick="deleteAd(${ad.id})">Delete</button>`;
            list.appendChild(li);
        });
    });
}

async function updateLogo() {
    await apiPost('/api/settings', {
        key: 'logo_url',
        value: document.getElementById('logo-url').value
    });
}

async function addVideo() {
    await apiPost('/api/videos', {
        title: document.getElementById('vid-title').value,
        url: document.getElementById('vid-url').value,
        type: document.getElementById('vid-type').value,
        playlist_order: parseInt(document.getElementById('vid-order').value) || 0
    });
}

async function addAd() {
    await apiPost('/api/ads', {
        url: document.getElementById('ad-url').value,
        active: true
    });
}

async function deleteVideo(id) {
    if(!confirm('Delete video?')) return;
    await apiDelete(`/api/videos/${id}`);
}

async function deleteAd(id) {
    if(!confirm('Delete ad?')) return;
    await apiDelete(`/api/ads/${id}`);
}

async function apiPost(url, data) {
    try {
        const res = await fetch(`${url}?pin=${currentPin}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            alert('Success');
            loadDashboard();
        } else {
            alert('Failed: ' + await res.text());
        }
    } catch (e) {
        alert('Error occurred');
    }
}

async function apiDelete(url) {
    try {
        const res = await fetch(`${url}?pin=${currentPin}`, { method: 'DELETE' });
        if (res.ok) {
            loadDashboard();
        } else {
            alert('Delete failed');
        }
    } catch (e) {
        alert('Error occurred');
    }
}
