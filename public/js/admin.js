let currentPin = '';

async function login() {
    const pin = document.getElementById('pin-input').value;
    try {
        const res = await fetch(`/api/admin/login?pin=${pin}`, { method: 'POST' });
        if (res.ok) {
            currentPin = pin;
            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
        } else {
            alert('Invalid PIN');
        }
    } catch (e) {
        alert('Login failed');
    }
}

async function addCategory() {
    const data = {
        name: document.getElementById('cat-name').value,
        order: parseInt(document.getElementById('cat-order').value) || 0
    };
    await apiPost('/api/categories', data);
}

async function addVideo() {
    const data = {
        title: document.getElementById('vid-title').value,
        description: document.getElementById('vid-desc').value,
        url: document.getElementById('vid-url').value,
        type: document.getElementById('vid-type').value,
        banner_url: document.getElementById('vid-banner').value,
        category_id: parseInt(document.getElementById('vid-cat').value),
        is_featured: document.getElementById('vid-featured').value === 'true'
    };
    await apiPost('/api/videos', data);
}

async function addAd() {
    const data = {
        url: document.getElementById('ad-url').value,
        active: true
    };
    await apiPost('/api/ads', data);
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
            // Clear inputs naively for demo
            document.querySelectorAll('input[type=text]').forEach(i => i.value = '');
        } else {
            alert('Failed: ' + await res.text());
        }
    } catch (e) {
        console.error(e);
        alert('Error occurred');
    }
}
