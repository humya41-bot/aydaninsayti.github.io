<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shazam Aydan</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@700;800&family=Indie+Flower&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

<header class="header" id="header">
    <a href="#" class="brand">Shazam <span>Aydan</span></a>

    <button class="key-btn" onclick="openDedication()" title="məlumat">i</button>
</header>

<main>

    <!-- Hero + Search -->
    <section class="hero">

        <div class="hero-visual" aria-hidden="true">
            <canvas id="waveCanvas" class="wave-canvas"></canvas>
        </div>

        <div class="search-wrap">
            <div class="input-line" id="inputLine">
                <textarea
                    id="lyricsInput"
                    class="main-input"
                    placeholder="Mahnı sözlərini buraya yazın…"
                    rows="1"
                    maxlength="300"
                    spellcheck="false"
                ></textarea>
                <button class="go-btn" id="searchBtn" onclick="searchLyrics()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                    </svg>
                </button>
                <ul class="ac-list" id="acList"></ul>
            </div>
        </div>

        <div class="suggestions">
            <button class="sug" onclick="fillExample('Never gonna give you up')">Never gonna give you up</button>
            <button class="sug" onclick="fillExample('Is this the real life bohemian rhapsody')">Bohemian Rhapsody</button>
            <button class="sug" onclick="fillExample('I will always love you')">I will always love you</button>
            <button class="sug" onclick="fillExample('Seni sevirdim amma')">Seni sevirdim amma</button>
        </div>
    </section>

    <!-- Loading -->
    <div class="state-load" id="loadingContainer" style="display:none">
        <div class="dots">
            <span></span><span></span><span></span>
        </div>
    </div>

    <!-- Error -->
    <div class="state-err" id="errorContainer" style="display:none">
        <p class="err-msg" id="errorMessage"></p>
        <button onclick="clearResults()">Yenidən cəhd et</button>
    </div>

    <!-- Results -->
    <section class="results" id="resultsSection" style="display:none">
        <div class="results-head">
            <span id="resultsCount" class="res-count"></span>
            <button class="reset-btn" onclick="clearResults()">Sıfırla</button>
        </div>
        <div class="track-list" id="resultsGrid"></div>
    </section>


</main>

<footer class="footer">
    <span>Shazam Aydan</span>
    <span class="foot-sep">—</span>
    <span>dev. zveinz</span>
</footer>

<!-- Dedication modal -->
<div class="ded-overlay" id="dedicationModal" style="display:none" onclick="handleDedOverlayClick(event)">
    <div class="ded-card">
        <button class="ded-close" onclick="closeDedication()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
        </button>

        <div class="ded-flower">
            <svg viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 56 Q20 44 20 36" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
                <path d="M20 44 Q14 40 13 34 Q18 36 20 44Z" fill="none" stroke="currentColor" stroke-width=".9"/>
                <path d="M20 40 Q26 36 27 30 Q22 33 20 40Z" fill="none" stroke="currentColor" stroke-width=".9"/>
                <path d="M20 26 Q17 19 11 19 Q11 26 20 26Z" fill="none" stroke="currentColor" stroke-width="1"/>
                <path d="M20 26 Q13 22 10 28 Q17 32 20 26Z" fill="none" stroke="currentColor" stroke-width="1"/>
                <path d="M20 26 Q17 33 20 37 Q23 33 20 26Z" fill="none" stroke="currentColor" stroke-width="1"/>
                <path d="M20 26 Q27 32 30 28 Q27 22 20 26Z" fill="none" stroke="currentColor" stroke-width="1"/>
                <path d="M20 26 Q27 19 27 12 Q22 15 20 26Z" fill="none" stroke="currentColor" stroke-width="1"/>
                <path d="M20 26 Q23 19 20 13 Q17 19 20 26Z" fill="none" stroke="currentColor" stroke-width="1"/>
                <circle cx="20" cy="26" r="2" stroke="currentColor" stroke-width=".9" fill="none"/>
            </svg>
        </div>

        <p class="ded-text">for my aydan.</p>
    </div>
</div>

<!-- API Modal -->
<div class="overlay" id="apiKeyModal" style="display:none" onclick="handleOverlayClick(event)">
    <div class="dialog">
        <div class="dialog-head">
            <h2>API Açarı</h2>
            <button class="dlg-close" onclick="closeApiModal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <p class="dlg-desc">
            YouTube Data API v3 açarı lazımdır.
            <a href="https://console.developers.google.com" target="_blank" rel="noopener">Google Console →</a>
        </p>
        <div class="dlg-field">
            <label for="apiKeyInput">API Açarı</label>
            <div class="dlg-input-wrap">
                <input type="password" id="apiKeyInput" placeholder="AIza…" autocomplete="off"/>
                <button class="eye" onclick="toggleApiKeyVisibility()" type="button">
                    <svg id="eyeIcon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
            </div>
        </div>
        <label class="dlg-check">
            <input type="checkbox" id="saveApiKey" checked/>
            Yadda saxla
        </label>
        <div class="dlg-actions">
            <button class="dlg-cancel" onclick="closeApiModal()">Ləğv et</button>
            <button class="dlg-save" onclick="saveApiKey()">Saxla</button>
        </div>
    </div>
</div>

<!-- Hidden YouTube player -->
<div id="yt-player-wrap" style="display:none">
    <div id="yt-player"></div>
</div>


<script src="https://www.youtube.com/iframe_api"></script>
<script src="assets/js/scroll.js"></script>
<script src="assets/js/app.js"></script>
<script src="assets/js/music.js"></script>
</body>
</html>
