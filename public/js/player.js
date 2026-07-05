let currentVideo = null;
let adInterval = null;
let mainVideo = document.getElementById('main-video');
let ytPlayerDiv = document.getElementById('youtube-player');
let ytPlayer = null;
let adVideo = document.getElementById('ad-video');
let isAdPlaying = false;
let adTimerInterval = null;
let adList = [];

// Fetch ads
fetch('/api/ads').then(res => res.json()).then(data => adList = data);

function openPlayer(video) {
    currentVideo = video;
    document.getElementById('home-screen').classList.remove('active');
    document.getElementById('player-screen').classList.add('active');
    
    // Play video based on type
    if (video.type === 'YOUTUBE') {
        mainVideo.style.display = 'none';
        ytPlayerDiv.style.display = 'block';
        playYouTube(video.url);
    } else {
        ytPlayerDiv.style.display = 'none';
        mainVideo.style.display = 'block';
        playNative(video);
    }

    // Start 5 min ad interval
    adInterval = setInterval(() => {
        triggerAd();
    }, 5 * 60 * 1000); // 5 minutes
}

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
    
    if (mainVideo.requestFullscreen) {
        mainVideo.requestFullscreen().catch(e => console.log(e));
    }
}

function playYouTube(url) {
    // extract ID
    let videoId = url.split('v=')[1] || url.split('/').pop();
    const ampersandPosition = videoId.indexOf('&');
    if (ampersandPosition !== -1) {
        videoId = videoId.substring(0, ampersandPosition);
    }

    if (!ytPlayer) {
        ytPlayer = new YT.Player('youtube-player', {
            videoId: videoId,
            playerVars: { 'autoplay': 1, 'controls': 1 },
        });
    } else {
        ytPlayer.loadVideoById(videoId);
    }
}

function closePlayer() {
    document.getElementById('player-screen').classList.remove('active');
    document.getElementById('home-screen').classList.add('active');
    mainVideo.pause();
    if(ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
    
    clearInterval(adInterval);
    if(document.fullscreenElement) {
        document.exitFullscreen().catch(e=>console.log(e));
    }
}

function triggerAd() {
    if (isAdPlaying || adList.length === 0) return;
    isAdPlaying = true;
    
    // Pause main content
    if (currentVideo.type === 'YOUTUBE' && ytPlayer) {
        ytPlayer.pauseVideo();
    } else {
        mainVideo.pause();
    }

    const overlay = document.getElementById('ad-overlay');
    overlay.style.display = 'block';
    
    // Select random ad
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
    
    // Resume content
    if (currentVideo.type === 'YOUTUBE' && ytPlayer) {
        ytPlayer.playVideo();
    } else {
        mainVideo.play();
    }
}

// Ensure YT API is ready
function onYouTubeIframeAPIReady() {
    console.log("YouTube API Ready");
}
