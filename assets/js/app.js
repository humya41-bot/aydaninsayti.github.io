'use strict';

const STATE = { apiKey: null, pending: null, searching: false };
const $  = (id) => document.getElementById(id);

const lyricsInput  = $('lyricsInput');
const charCount    = $('charCount'); // may be null
const searchBtn    = $('searchBtn');
const loadingEl    = $('loadingContainer');
const errorEl      = $('errorContainer');
const errorMsg     = $('errorMessage');
const resultsEl    = $('resultsSection');
const trackList    = $('resultsGrid');
const resCount     = $('resultsCount');
const apiModal     = $('apiKeyModal');
const apiInput     = $('apiKeyInput');


/* ── Init ─────────────────────────────── */
(function () {
    const DEFAULT = 'AIzaSyDuw4l7_NNc1fUXZuclH5gzIe7cLWFrXl8';
    const saved   = localStorage.getItem('yt_api_key') || DEFAULT;
    STATE.apiKey  = saved;
    localStorage.setItem('yt_api_key', saved);

    lyricsInput.addEventListener('input', () => {
        if (charCount) charCount.textContent = lyricsInput.value.length;
        updateAC();
    });

    lyricsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            closeAC();
            searchLyrics();
            return;
        }
        handleACKeys(e);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#inputLine')) closeAC();
    });
})();

/* ─── Autocomplete (live web search) ───────────────── */
const acList    = $('acList');
let   acFocused = -1;
let   acTimer   = null;
let   acItems   = [];

function updateAC() {
    const val = lyricsInput.value.trim();
    if (!val || val.length < 2) { closeAC(); return; }

    clearTimeout(acTimer);
    acTimer = setTimeout(() => fetchSuggestions(val), 80);
}

async function fetchSuggestions(q) {
    try {
        const res  = await fetch('suggest.php?q=' + encodeURIComponent(q));
        const data = await res.json();
        const list = data.items || [];

        if (!list.length) { closeAC(); return; }

        acItems   = list;
        acFocused = -1;

        acList.innerHTML = list.map((item, i) =>
            `<li class="ac-item" onmousedown="pickAC(${i})">
                <span class="ac-label">${esc(item.label)}</span>
            </li>`
        ).join('');

        acList.classList.add('open');
    } catch {
        closeAC();
    }
}

function closeAC() {
    clearTimeout(acTimer);
    acList.classList.remove('open');
    acList.innerHTML = '';
    acFocused = -1;
    acItems   = [];
}

window.pickAC = function (i) {
    const item = acItems[i];
    if (!item) return;
    const fill = item.title + (item.artist ? ' ' + item.artist : '');
    lyricsInput.value = fill;
    lyricsInput.dispatchEvent(new Event('input'));
    closeAC();
    lyricsInput.focus();
};

function handleACKeys(e) {
    if (!acList.classList.contains('open')) return;
    const items = acList.querySelectorAll('.ac-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        setACFocus(Math.min(acFocused + 1, items.length - 1), items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setACFocus(Math.max(acFocused - 1, 0), items);
    } else if (e.key === 'Enter' && acFocused >= 0) {
        e.preventDefault();
        pickAC(acFocused);
    } else if (e.key === 'Escape') {
        closeAC();
    }
}

function setACFocus(i, items) {
    items.forEach(el => el.classList.remove('focused'));
    acFocused = i;
    items[i].classList.add('focused');
    items[i].scrollIntoView({ block: 'nearest' });
}

function escReg(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ── Public ───────────────────────────── */
window.fillExample = function (text) {
    lyricsInput.value = text;
    charCount.textContent = text.length;
    // trigger auto-grow
    lyricsInput.dispatchEvent(new Event('input'));
    lyricsInput.focus();
};

window.searchLyrics = function () {
    const lyrics = lyricsInput.value.trim();
    if (!lyrics) { shake(lyricsInput); return; }
    if (!STATE.apiKey) { STATE.pending = lyrics; openApiModal(); return; }
    doSearch(lyrics);
};

/* ── Core search ──────────────────────── */
async function doSearch(lyrics) {
    if (STATE.searching) return;
    STATE.searching = true;
    hideAll();
    show(loadingEl);
    searchBtn.disabled = true;

    // button fire animation
    searchBtn.classList.remove('fired', 'loading');
    void searchBtn.offsetWidth;
    searchBtn.classList.add('fired');
    searchBtn.addEventListener('animationend', () => {
        searchBtn.classList.remove('fired');
        searchBtn.classList.add('loading');
    }, { once: true });

    try {
        const res  = await fetch('search.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ lyrics, api_key: STATE.apiKey, max_results: 12 }),
        });
        const data = await res.json();

        if (!data.success) {
            if (res.status === 400 || res.status === 403) {
                STATE.apiKey = null;
                localStorage.removeItem('yt_api_key');
                STATE.pending = lyrics;
                hide(loadingEl);
                openApiModal(data.error);
                return;
            }
            showError(data.error || 'Naməlum xəta baş verdi.');
            return;
        }

        data.total === 0 ? showEmpty() : showResults(data);

    } catch {
        showError('Serverə qoşulmaq mümkün olmadı. XAMPP işləyir?');
    } finally {
        STATE.searching = false;
        searchBtn.disabled = false;
        searchBtn.classList.remove('fired', 'loading');
    }
}

/* ── Render ───────────────────────────── */
function showResults(data) {
    hide(loadingEl);
    resCount.textContent = `${data.total} nəticə tapıldı`;
    trackList.innerHTML  = '';

    // AI identification banner
    const oldBanner = document.getElementById('aiBanner');
    if (oldBanner) oldBanner.remove();

    if (data.ai_used && data.ai_result) {
        const ai   = data.ai_result;
        const conf = ai.confidence;
        const banner = document.createElement('div');
        banner.id    = 'aiBanner';
        banner.style.cssText = `
            display:flex; align-items:center; gap:10px;
            padding:10px 0 20px; font-size:.8rem; color:var(--dim);
            border-bottom:1px solid var(--line); margin-bottom:4px;
            animation: trackIn .3s ease both;
        `;
        const icon = conf === 'low'
            ? '◌' : conf === 'medium' ? '◎' : '●';
        const label = ai.title && ai.artist
            ? `<strong style="color:var(--white)">${esc(ai.title)}</strong> — ${esc(ai.artist)}`
            : ai.title
                ? `<strong style="color:var(--white)">${esc(ai.title)}</strong>`
                : esc(ai.artist);
        banner.innerHTML = `
            <span style="color:var(--dim-2);font-size:.65rem;letter-spacing:.08em;text-transform:uppercase">AI</span>
            <span style="color:var(--dim-2)">${icon}</span>
            ${label}
            <span style="color:var(--dim-2);margin-left:auto;font-size:.72rem">${conf} confidence</span>
        `;
        trackList.before(banner);
    }

    data.items.forEach((item, i) => trackList.appendChild(buildTrack(item, i + 1)));

    show(resultsEl);
    if (typeof window.revealTracks === 'function') window.revealTracks();
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildTrack(item, idx) {
    const a = document.createElement('a');
    a.className = 'track';
    a.href      = item.url;
    a.target    = '_blank';
    a.rel       = 'noopener noreferrer';

    const thumb = item.thumbnail
        ? escAttr(item.thumbnail)
        : 'https://i.ytimg.com/vi/default/hqdefault.jpg';

    a.innerHTML = `
        <span class="track-n">${idx}</span>
        <div class="track-thumb">
            <img src="${thumb}" alt="" loading="lazy"
                 onerror="this.src='https://i.ytimg.com/vi/default/hqdefault.jpg'"/>
            <div class="track-thumb-overlay">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
        </div>
        <div class="track-info">
            <div class="track-title">${esc(item.title)}</div>
            <div class="track-channel">${esc(item.channel)}</div>
        </div>
        <span class="track-date">${item.published || ''}</span>
        <span class="track-yt">
            <svg viewBox="0 0 24 24" fill="#ff0000">
                <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
            </svg>
            Aç
        </span>`;
    return a;
}

function showEmpty() {
    hide(loadingEl);
    trackList.innerHTML = '<div class="empty">Heç bir nəticə tapılmadı. Başqa sözlər cəhd edin.</div>';
    resCount.textContent = '0 nəticə';
    show(resultsEl);
}

function showError(msg) {
    hide(loadingEl);
    errorMsg.textContent = msg;
    show(errorEl);
}

window.clearResults = function () {
    hideAll();
    lyricsInput.value = '';
    lyricsInput.style.height = 'auto';
    charCount.textContent = '0';
    lyricsInput.focus();
};

/* ── Dedication modal ─────────────────── */
window.openDedication = function () {
    show($('dedicationModal'));
};

window.closeDedication = function () {
    hide($('dedicationModal'));
};

window.handleDedOverlayClick = function (e) {
    if (e.target === $('dedicationModal')) closeDedication();
};

/* ── API Modal ────────────────────────── */
window.openApiModal = function (err) {
    apiInput.value = STATE.apiKey || '';
    if (err) {
        let el = apiModal.querySelector('.dlg-err');
        if (!el) {
            el = document.createElement('p');
            el.className = 'dlg-err';
            el.style.cssText = 'color:rgba(255,100,100,.85);font-size:.78rem;margin-top:6px;';
            apiInput.closest('.dlg-input-wrap').after(el);
        }
        el.textContent = err;
    }
    show(apiModal);
    setTimeout(() => apiInput.focus(), 80);
};

window.closeApiModal = function () {
    hide(apiModal);
    STATE.pending = null;
};

window.handleOverlayClick = function (e) {
    if (e.target === apiModal) closeApiModal();
};

window.saveApiKey = function () {
    const k = apiInput.value.trim();
    if (!k) { shake(apiInput); return; }
    STATE.apiKey = k;
    if ($('saveApiKey').checked) localStorage.setItem('yt_api_key', k);
    hide(apiModal);
    const lyrics = STATE.pending || lyricsInput.value.trim();
    STATE.pending = null;
    if (lyrics) doSearch(lyrics);
};

window.toggleApiKeyVisibility = function () {
    const t = apiInput.type === 'password' ? 'text' : 'password';
    apiInput.type = t;
    $('eyeIcon').innerHTML = t === 'password'
        ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
        : '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if ($('dedicationModal').style.display !== 'none') closeDedication();
        if (apiModal.style.display !== 'none') closeApiModal();
    }
});

/* ── Helpers ──────────────────────────── */
function show(el) { el.style.display = ''; }
function hide(el) { el.style.display = 'none'; }

function hideAll() {
    hide(loadingEl);
    hide(errorEl);
    hide(resultsEl);
}

function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

function escAttr(s) {
    return (s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function shake(el) {
    el.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(0)' },
    ], { duration: 340, easing: 'ease-out' });
}
