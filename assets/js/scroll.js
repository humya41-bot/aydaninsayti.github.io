'use strict';

/* ── Scroll reveal ──────────────────────── */
(function () {
    const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
            }
        }),
        { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
    );

    const run = () =>
        document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', run)
        : run();
})();

/* ── Header border on scroll ────────────── */
(function () {
    const h = document.getElementById('header');
    if (!h) return;
    window.addEventListener('scroll', () => {
        h.style.borderBottomColor = window.scrollY > 4
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(255,255,255,0.08)';
    }, { passive: true });
})();

/* ── Auto-grow textarea ─────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const ta = document.getElementById('lyricsInput');
    if (!ta) return;
    ta.addEventListener('input', () => {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
    });
});

/* ── Smooth anchor scroll ───────────────── */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const t = document.getElementById(a.getAttribute('href').slice(1));
            if (!t) return;
            e.preventDefault();
            t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
});

/* ── Staggered card reveal ──────────────── */
window.revealTracks = function () {
    document.querySelectorAll('.track').forEach((el, i) => {
        el.style.animationDelay = `${i * 0.045}s`;
    });
};

/* ── Cycling icons ──────────────────────── */
(function initCycleIcons() {
    const icons = document.querySelectorAll('.cicon');
    if (!icons.length) return;

    let current = 0;

    function next() {
        icons[current].classList.remove('active');
        current = (current + 1) % icons.length;
        icons[current].classList.add('active');
    }

    icons[0].classList.add('active');
    setInterval(next, 2200);
})();

/* ── Wave canvas animation ──────────────── */
(function initWave() {
    const canvas = document.getElementById('waveCanvas');
    if (!canvas) return;

    const DPR = window.devicePixelRatio || 1;
    const W   = 360;
    const H   = 72;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;

    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);

    const waves = [
        { amplitude: 12, frequency: 0.030, speed: 1.0, opacity: 0.18, width: 1.1,  phase: 0   },
        { amplitude: 7,  frequency: 0.022, speed: 0.6, opacity: 0.09, width: 0.9,  phase: 1.8 },
        { amplitude: 18, frequency: 0.016, speed: 0.4, opacity: 0.05, width: 1.4,  phase: 3.6 },
    ];

    let tick = 0;

    function draw() {
        ctx.clearRect(0, 0, W, H);
        const mid = H / 2;

        waves.forEach((w) => {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(242,240,236,${w.opacity})`;
            ctx.lineWidth   = w.width;
            ctx.lineJoin    = 'round';
            ctx.lineCap     = 'round';

            for (let x = 0; x <= W; x++) {
                const y = mid + Math.sin(x * w.frequency + tick * w.speed + w.phase) * w.amplitude;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        });

        tick += 0.04;
        requestAnimationFrame(draw);
    }

    draw();
})();
