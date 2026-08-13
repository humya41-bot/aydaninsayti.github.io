<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

/* ════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════ */
function respondError(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function httpPost(string $url, string $body, array $headers = []): ?string {
    if (!function_exists('curl_init')) {
        // fallback: stream context
        $ctx = stream_context_create(['http' => [
            'method'  => 'POST',
            'header'  => implode("\r\n", array_merge(['Content-Type: application/json'], $headers)),
            'content' => $body,
            'timeout' => 14,
        ], 'ssl' => ['verify_peer' => true]]);
        $r = @file_get_contents($url, false, $ctx);
        return $r === false ? null : $r;
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => array_merge(['Content-Type: application/json'], $headers),
        CURLOPT_TIMEOUT        => 14,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $r = curl_exec($ch);
    curl_close($ch);
    return $r === false ? null : $r;
}

function httpGet(string $url): ?string {
    if (!function_exists('curl_init')) {
        $ctx = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 12], 'ssl' => ['verify_peer' => true]]);
        $r = @file_get_contents($url, false, $ctx);
        return $r === false ? null : $r;
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 12,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);
    $r = curl_exec($ch);
    curl_close($ch);
    return $r === false ? null : $r;
}

/* ════════════════════════════════════════════════
   STEP 1 — AI identifies the song via Gemini
════════════════════════════════════════════════ */
function identifyWithGemini(string $lyrics, string $apiKey): ?array {
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key='
           . urlencode($apiKey);

    $prompt = <<<PROMPT
You are a music expert. The user gives you song lyrics — they may be partially remembered, slightly wrong, or in any language.
Your job: identify the most likely song.

Lyrics:
{$lyrics}

Reply with ONLY a valid JSON object, no extra text, no markdown:
{"title":"Song Title","artist":"Artist Name","confidence":"high"}

- confidence must be "high", "medium", or "low"
- If you cannot identify the song at all, set title and artist to ""
PROMPT;

    $body = json_encode([
        'contents'         => [['parts' => [['text' => $prompt]]]],
        'generationConfig' => ['temperature' => 0.1, 'maxOutputTokens' => 80],
    ]);

    $raw = httpPost($url, $body);
    if (!$raw) return null;

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) return null;

    // extract text from Gemini response
    $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
    $text = trim($text);

    // strip markdown code fences if present
    $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
    $text = preg_replace('/\s*```$/', '', $text);

    $parsed = json_decode(trim($text), true);
    if (json_last_error() !== JSON_ERROR_NONE) return null;

    $title  = trim($parsed['title']  ?? '');
    $artist = trim($parsed['artist'] ?? '');
    $conf   = trim($parsed['confidence'] ?? 'low');

    if (empty($title) && empty($artist)) return null;

    return ['title' => $title, 'artist' => $artist, 'confidence' => $conf];
}

/* ════════════════════════════════════════════════
   STEP 2 — build YouTube queries from AI result
════════════════════════════════════════════════ */
function buildQueriesFromAI(array $ai, string $lyrics): array {
    $t = $ai['title'];
    $a = $ai['artist'];
    $q = [];

    if ($t && $a) {
        $q[] = "$t $a official";
        $q[] = "$t $a lyrics";
        $q[] = "$t $a";
    } elseif ($t) {
        $q[] = "$t lyrics";
        $q[] = "$t official";
    } elseif ($a) {
        $q[] = "$a $lyrics lyrics";
    }

    // always add a fallback based on raw lyrics
    $q[] = trim(mb_substr($lyrics, 0, 80, 'UTF-8')) . ' lyrics';

    return array_values(array_unique($q));
}

/* ════════════════════════════════════════════════
   STEP 2b — fallback queries (no AI)
════════════════════════════════════════════════ */
function stopWords(): array {
    return [
        'i','me','my','you','your','he','she','it','we','they',
        'am','is','are','was','were','be','been','a','an','the',
        'and','or','but','if','in','on','at','to','of','for',
        'with','by','as','up','so','do','did','not','no','oh',
        'yeah','hey','just','out','got','get','go','gone',
        'come','know','want','that','this','what','when',
        'never','always','every','like','dont','wont','im',
        'mən','sən','o','biz','siz','bu','şu','və','da','də',
        'ki','amma','bir','var','yox','ilə','üçün','kimi','çox',
    ];
}

function extractKeywords(string $text, int $limit = 5): array {
    $clean = mb_strtolower($text, 'UTF-8');
    $clean = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $clean);
    $words = preg_split('/\s+/u', $clean, -1, PREG_SPLIT_NO_EMPTY);
    $stop  = stopWords();
    $out   = [];
    foreach ($words as $w) {
        if (mb_strlen($w, 'UTF-8') < 3) continue;
        if (in_array($w, $stop, true))  continue;
        if (!in_array($w, $out, true))  $out[] = $w;
        if (count($out) >= $limit * 2)  break;
    }
    usort($out, fn($a, $b) => mb_strlen($b) - mb_strlen($a));
    return array_slice($out, 0, $limit);
}

function buildFallbackQueries(string $lyrics): array {
    $kw  = extractKeywords($lyrics, 5);
    $raw = trim(preg_replace('/\s+/', ' ', $lyrics));
    $q   = [];
    $q[] = $raw . ' lyrics';
    if (count($kw) >= 2) $q[] = implode(' ', $kw) . ' lyrics';
    if (count($kw) >= 2) $q[] = implode(' ', array_slice($kw, 0, 4)) . ' song';
    return array_unique($q);
}

/* ════════════════════════════════════════════════
   STEP 3 — YouTube search
════════════════════════════════════════════════ */
function ytSearch(string $query, string $apiKey, int $max): array|null {
    $url = sprintf(
        'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=%s&maxResults=%d&key=%s',
        urlencode($query), $max, urlencode($apiKey)
    );
    $raw  = httpGet($url);
    if (!$raw) return null;
    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) return null;
    if (isset($data['error'])) return $data; // pass error through
    return $data['items'] ?? [];
}

function parseItem(array $item): ?array {
    $id  = $item['id']['videoId'] ?? '';
    if (!$id) return null;
    $s   = $item['snippet'] ?? [];
    $ts  = strtotime($s['publishedAt'] ?? '');
    $d   = $s['description'] ?? '';
    $d   = mb_substr($d, 0, 160, 'UTF-8') . (mb_strlen($d) > 160 ? '…' : '');
    return [
        'video_id'    => $id,
        'title'       => htmlspecialchars($s['title']        ?? '', ENT_QUOTES, 'UTF-8'),
        'channel'     => htmlspecialchars($s['channelTitle'] ?? '', ENT_QUOTES, 'UTF-8'),
        'description' => htmlspecialchars($d,                      ENT_QUOTES, 'UTF-8'),
        'thumbnail'   => $s['thumbnails']['high']['url']
                      ?? $s['thumbnails']['medium']['url']
                      ?? $s['thumbnails']['default']['url'] ?? '',
        'url'         => 'https://www.youtube.com/watch?v=' . urlencode($id),
        'published'   => $ts ? date('d.m.Y', $ts) : '',
    ];
}

/* ════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════ */
$input      = json_decode(file_get_contents('php://input'), true);
$lyrics     = trim($input['lyrics']      ?? '');
$apiKey     = trim($input['api_key']     ?? '');
$maxResults = min(max((int)($input['max_results'] ?? 12), 1), 25);

if (!$lyrics) respondError('Mahnı sözləri boş ola bilməz.');
if (!$apiKey) respondError('YouTube API açarı tələb olunur.');

/* — 1. AI identification — */
$aiResult  = identifyWithGemini($lyrics, $apiKey);
$aiUsed    = $aiResult !== null;
$queries   = $aiUsed
    ? buildQueriesFromAI($aiResult, $lyrics)
    : buildFallbackQueries($lyrics);

/* — 2. Search YouTube with each query — */
$seen        = [];
$items       = [];
$apiErrData  = null;

foreach ($queries as $q) {
    if (count($items) >= $maxResults) break;

    $needed = $maxResults - count($items);
    $batch  = ytSearch($q, $apiKey, min($needed + 3, 15));

    if (is_array($batch) && isset($batch['error'])) {
        if ($apiErrData === null) $apiErrData = $batch;
        continue;
    }

    if (empty($batch)) continue;

    foreach ((array)$batch as $raw) {
        $p = parseItem($raw);
        if (!$p || isset($seen[$p['video_id']])) continue;
        $seen[$p['video_id']] = true;
        $items[] = $p;
        if (count($items) >= $maxResults) break;
    }
}

/* — 3. Surface API error only when result is empty — */
if (empty($items) && $apiErrData) {
    $ec = $apiErrData['error']['code']    ?? 400;
    $em = $apiErrData['error']['message'] ?? 'Naməlum xəta';
    if ($ec === 403) respondError('API limiti dolub və ya icazə yoxdur.', 403);
    if ($ec === 400) respondError('API açarı düzgün deyil.', 400);
    respondError('YouTube API xətası: ' . $em, $ec);
}

echo json_encode([
    'success'    => true,
    'total'      => count($items),
    'ai_used'    => $aiUsed,
    'ai_result'  => $aiResult,
    'query'      => htmlspecialchars($lyrics, ENT_QUOTES, 'UTF-8'),
    'items'      => $items,
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
