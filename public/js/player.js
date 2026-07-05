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

// 1. Fetch Playlist, Ads, and Logo
Promise.all([
    fetch('/api/videos').then(res => res.json()),
    fetch('/api/ads').then(res => res.json()),
    fetch('/api/settings/logo_url').then(res => res.json())
]).then(([videos, ads, logo]) => {
    playlist = videos;
    adList = ads;
    
    // Set dynamic logo
    if (logo && logo.value) {
        document.querySelector('#channel-logo img').src = logo.value;
    }
});

function startTV() {
    if (tvStarted) return;
    tvStarted = true;
    document.getElementById('start-overlay').style.display = 'none';

    if (playlist.length > 0) {
        playVideoFromPlaylist();
    } else {
        document.getElementById('video-title').innerText = "No Signal (Empty Playlist)";
        showTitleOverlay();
    }

    // Start 5-min Ad loop
    setInterval(triggerAd, 5 * 60 * 1000);
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
    if (Hls.isSupported() && video.type === 'HLS') {
        var hls = new Hls();
        hls.loadSource(video.url);
        hls.attachMedia(mainVideo);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            mainVideo.play();
        });
    } else if (typeof dashjs !== 'undefined' && video.type === 'DASH') {
        var player = dashjs.MediaPlayer().create();
        player.initialize(mainVideo, video.url, true);
    } else {
        mainVideo.src = video.url;
        mainVideo.play();
    }
}

// When Native video ends, play next
mainVideo.addEventListener('ended', () => {
    if(!isAdPlaying) nextVideo();
});

// YouTube Logic
function playYouTube(url) {
    let videoId = url.split('v=')[1] || url.split('/').pop();
    const ampersandPosition = videoId.indexOf('&');
    if (ampersandPosition !== -1) videoId = videoId.substring(0, ampersandPosition);

    if (!ytPlayer) {
        ytPlayer = new YT.Player('youtube-player', {
            videoId: videoId,
            playerVars: { 'autoplay': 1, 'controls': 0, 'disablekb': 1, 'modestbranding': 1 },
            events: {
                'onReady': (event) => event.target.playVideo(),
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
    // API ready
}
