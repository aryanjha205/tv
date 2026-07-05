let playlist = [];
let currentVideoIndex = 0;
let adList = [];
let mainVideo = document.getElementById('main-video');
let ytPlayerDiv = document.getElementById('youtube-player');
let ytPlayer = null;
let adVideo = document.getElementById('ad-video');
let isAdPlaying = false;
let adTimerInterval = null;
let tvStarted = false;
let hlsPlayer = null;
let dashPlayer = null;

// 1. Fetch Playlist, Ads, and Logo
function fetchContent() {
    return Promise.all([
        fetch('/api/videos').then(res => res.json()),
        fetch('/api/ads').then(res => res.json()),
        fetch('/api/settings/logo_url').then(res => res.json())
    ]).then(([videos, ads, logo]) => {
        playlist = videos;
        adList = ads;
        
        if (logo && logo.value) {
            document.querySelector('#channel-logo img').src = logo.value;
        }
    });
}

// Initial fetch
fetchContent();

function startTV() {
    if (tvStarted) return;
    tvStarted = true;
    document.getElementById('start-overlay').style.display = 'none';

    checkAndPlay();

    // Start 5-min Ad loop
    setInterval(triggerAd, 5 * 60 * 1000);
    
    // Poll for new playlist updates every 15 seconds
    setInterval(() => {
        fetchContent().then(() => {
            // If we were stuck on No Signal but now have videos, start playing!
            if (playlist.length > 0 && document.getElementById('video-title').innerText === "No Signal (Empty Playlist)") {
                playVideoFromPlaylist();
            }
        });
    }, 15000);
}

function checkAndPlay() {
    if (playlist.length > 0) {
        playVideoFromPlaylist();
    } else {
        document.getElementById('video-title').innerText = "No Signal (Empty Playlist)";
        showTitleOverlay();
        // It will recover automatically via the 15s poll
    }
}

// Fullscreen request helper
function requestFS() {
    const el = document.documentElement;
    if (el.requestFullscreen) {
        el.requestFullscreen().catch(e=>console.log(e));
    }
}

function playVideoFromPlaylist() {
    if (playlist.length === 0) return;
    const video = playlist[currentVideoIndex];
    
    // Show Title briefly
    document.getElementById('video-title').innerText = video.title;
    showTitleOverlay();

    if (video.type === 'YOUTUBE') {
        mainVideo.style.display = 'none';
        ytPlayerDiv.style.display = 'block';
        playYouTube(video.url);
    } else {
        ytPlayerDiv.style.display = 'none';
        mainVideo.style.display = 'block';
        playNative(video);
    }
    
    requestFS();
}

function nextVideo() {
    currentVideoIndex++;
    if (currentVideoIndex >= playlist.length) {
        currentVideoIndex = 0; // Loop back
    }
    playVideoFromPlaylist();
}

// HTML5 Video / HLS / DASH logic
function playNative(video) {
    destroyNativePlayers();
    mainVideo.removeAttribute('src');
    mainVideo.load();

    if (typeof Hls !== 'undefined' && Hls.isSupported() && video.type === 'HLS') {
        hlsPlayer = new Hls();
        hlsPlayer.loadSource(video.url);
        hlsPlayer.attachMedia(mainVideo);
        hlsPlayer.on(Hls.Events.MANIFEST_PARSED, function() {
            safePlay(mainVideo);
        });
        hlsPlayer.on(Hls.Events.ERROR, function(_event, data) {
            if (data.fatal) showPlaybackError('This HLS stream could not be loaded.');
        });
    } else if (typeof dashjs !== 'undefined' && video.type === 'DASH') {
        dashPlayer = dashjs.MediaPlayer().create();
        dashPlayer.initialize(mainVideo, video.url, true);
    } else {
        mainVideo.src = video.url;
        safePlay(mainVideo);
    }
}

function destroyNativePlayers() {
    if (hlsPlayer) {
        hlsPlayer.destroy();
        hlsPlayer = null;
    }
    if (dashPlayer) {
        dashPlayer.reset();
        dashPlayer = null;
    }
}

function safePlay(element) {
    const result = element.play();
    if (result) result.catch(() => showPlaybackError('Playback was blocked. Tap the screen and try again.'));
}

function showPlaybackError(message) {
    document.getElementById('video-title').innerText = message;
    showTitleOverlay();
}

// When Native video ends, play next
mainVideo.addEventListener('ended', () => {
    if(!isAdPlaying) nextVideo();
});

// YouTube Logic
function playYouTube(url) {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
        showPlaybackError('Invalid YouTube URL.');
        return;
    }

    if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
        document.getElementById('video-title').innerText = 'Loading YouTube player...';
        showTitleOverlay();
        return;
    }

    if (!ytPlayer) {
        ytPlayer = new YT.Player('youtube-player', {
            videoId: videoId,
            playerVars: { 'autoplay': 1, 'controls': 0, 'disablekb': 1, 'modestbranding': 1 },
            events: {
                'onReady': (event) => event.target.playVideo(),
                'onError': () => showPlaybackError('This YouTube video cannot be played here.'),
                'onStateChange': (event) => {
                    if (event.data === YT.PlayerState.ENDED) {
                        nextVideo();
                    }
                }
            }
        });
    } else {
        ytPlayer.loadVideoById(videoId);
    }
}

function getYouTubeVideoId(value) {
    try {
        const url = new URL(value);
        let id = '';

        if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') {
            id = url.pathname.split('/').filter(Boolean)[0] || '';
        } else if (url.hostname.endsWith('youtube.com')) {
            if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
            else id = url.pathname.split('/').filter(Boolean).pop() || '';
        }

        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    } catch (_error) {
        return /^[a-zA-Z0-9_-]{11}$/.test(value) ? value : null;
    }
}

mainVideo.addEventListener('error', () => {
    showPlaybackError('This video could not be loaded. Check its URL and CORS settings.');
});

function showTitleOverlay() {
    const el = document.getElementById('now-playing');
    el.classList.add('visible');
    setTimeout(() => {
        el.classList.remove('visible');
    }, 5000); // Hide after 5 seconds
}

// Ad Logic
function triggerAd() {
    if (isAdPlaying || adList.length === 0 || !tvStarted) return;
    isAdPlaying = true;
    
    const currentVideo = playlist[currentVideoIndex];
    if (currentVideo && currentVideo.type === 'YOUTUBE' && ytPlayer) {
        ytPlayer.pauseVideo();
    } else {
        mainVideo.pause();
    }

    const overlay = document.getElementById('ad-overlay');
    overlay.style.display = 'block';
    
    const ad = adList[Math.floor(Math.random() * adList.length)];
    adVideo.src = ad.url || "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4";
    adVideo.play();

    let timeLeft = 30;
    document.getElementById('ad-timer').innerText = timeLeft;
    
    adTimerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('ad-timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            endAd();
        }
    }, 1000);
}

function endAd() {
    clearInterval(adTimerInterval);
    isAdPlaying = false;
    adVideo.pause();
    document.getElementById('ad-overlay').style.display = 'none';
    
    const currentVideo = playlist[currentVideoIndex];
    if (currentVideo && currentVideo.type === 'YOUTUBE' && ytPlayer) {
        ytPlayer.playVideo();
    } else {
        mainVideo.play();
    }
}

function onYouTubeIframeAPIReady() {
    if (tvStarted && playlist[currentVideoIndex]?.type === 'YOUTUBE') {
        playYouTube(playlist[currentVideoIndex].url);
    }
}
