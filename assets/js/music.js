'use strict';

/* ── Kafabidunya — Binlerce Özür Mesajı
   YouTube video ID — URL-dən v=XXXXX hissəsi  ── */
const BG_VIDEO_ID = 'BURAYA_VIDEO_ID_YAZ';

let ytPlayer = null;
let started  = false;

function findBgMusic() {
    if (started || !BG_VIDEO_ID || BG_VIDEO_ID === 'BURAYA_VIDEO_ID_YAZ') return;
    started = true;
    initYTPlayer(BG_VIDEO_ID);
}

function initYTPlayer(vid) {
    if (!window.YT?.Player) {
        setTimeout(() => initYTPlayer(vid), 200);
        return;
    }
    ytPlayer = new YT.Player('yt-player', {
        height:  '1',
        width:   '1',
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

/* ── Start on first user interaction ──────────────────
   Browsers allow autoplay only after user gesture.
   We listen once for any click/touch/keypress.       */
function onFirstInteraction() {
    ['click', 'touchstart', 'keydown'].forEach(ev =>
        document.removeEventListener(ev, onFirstInteraction)
    );
    findBgMusic();
}

['click', 'touchstart', 'keydown'].forEach(ev =>
    document.addEventListener(ev, onFirstInteraction, { once: true, passive: true })
);
