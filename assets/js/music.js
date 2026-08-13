'use strict';

let ytPlayer = null;
let videoId  = null;

async function findBgMusic() {
    try {
        const res  = await fetch('search.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lyrics:      'kafabidunya binlerce özür mesajı',
                api_key:     localStorage.getItem('yt_api_key') || 'AIzaSyDuw4l7_NNc1fUXZuclH5gzIe7cLWFrXl8',
                max_results: 1,
            }),
        });
        const data = await res.json();
        if (data.success && data.items?.length) {
            videoId = data.items[0].video_id;
            initYTPlayer(videoId);
        }
    } catch {}
}

function initYTPlayer(vid) {
    if (!window.YT?.Player) {
        setTimeout(() => initYTPlayer(vid), 200);
        return;
    }
    ytPlayer = new YT.Player('yt-player', {
        height: '1',
        width:  '1',
        videoId: vid,
        playerVars: {
            autoplay:       1,
            mute:           0,
            loop:           1,
            playlist:       vid,
            controls:       0,
            disablekb:      1,
            fs:             0,
            modestbranding: 1,
            rel:            0,
        },
        events: {
            onReady: (e) => {
                e.target.setVolume(50);
                e.target.playVideo();
            },
        },
    });
}

window.onYouTubeIframeAPIReady = function () {
    if (videoId) initYTPlayer(videoId);
};

document.addEventListener('DOMContentLoaded', findBgMusic);
