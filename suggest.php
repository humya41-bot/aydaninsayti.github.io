<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$q = trim($_GET['q'] ?? '');
if (strlen($q) < 2) {
    echo json_encode(['items' => []]);
    exit;
}

$results = [];
$seen    = [];

if (function_exists('curl_multi_init')) {

    /* ── Parallel fetch with curl_multi ── */
    $urls = [
        'itunes' => 'https://itunes.apple.com/search?'
            . http_build_query(['term' => $q, 'media' => 'music',
                                'entity' => 'song', 'limit' => 7]),
        'lyrics' => 'https://api.lyrics.ovh/suggest/' . urlencode($q),
    ];

    $mh   = curl_multi_init();
    $chs  = [];

    foreach ($urls as $key => $url) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 3,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT      => 'Mozilla/5.0',
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
        ]);
        curl_multi_add_handle($mh, $ch);
        $chs[$key] = $ch;
    }

    $running = null;
    do {
        curl_multi_exec($mh, $running);
        curl_multi_select($mh, 0.05);
    } while ($running > 0);

    $responses = [];
    foreach ($chs as $key => $ch) {
        $responses[$key] = curl_multi_getcontent($ch);
        curl_multi_remove_handle($mh, $ch);
        curl_close($ch);
    }
    curl_multi_close($mh);

} else {
    /* ── Fallback: sequential stream ── */
    function sg($url) {
        $ctx = stream_context_create([
            'http' => ['method' => 'GET', 'timeout' => 3,
                       'header' => "User-Agent: Mozilla/5.0\r\nAccept: application/json"],
            'ssl'  => ['verify_peer' => true],
        ]);
        return @file_get_contents($url, false, $ctx) ?: null;
    }
    $responses = [
        'itunes' => sg('https://itunes.apple.com/search?'
            . http_build_query(['term' => $q, 'media' => 'music',
                                'entity' => 'song', 'limit' => 7])),
        'lyrics' => sg('https://api.lyrics.ovh/suggest/' . urlencode($q)),
    ];
}

/* ── Parse iTunes ── */
$itunes = json_decode($responses['itunes'] ?? '', true);
foreach ($itunes['results'] ?? [] as $item) {
    $title  = $item['trackName']  ?? '';
    $artist = $item['artistName'] ?? '';
    if (!$title) continue;
    $key = strtolower("$title|$artist");
    if (isset($seen[$key])) continue;
    $seen[$key] = true;
    $results[]  = ['label' => "$title — $artist", 'title' => $title, 'artist' => $artist];
    if (count($results) >= 5) break;
}

/* ── Parse Lyrics.ovh ── */
$lyrics = json_decode($responses['lyrics'] ?? '', true);
foreach ($lyrics['data'] ?? [] as $item) {
    $title  = $item['title']          ?? '';
    $artist = $item['artist']['name'] ?? '';
    if (!$title) continue;
    $key = strtolower("$title|$artist");
    if (isset($seen[$key])) continue;
    $seen[$key] = true;
    $results[]  = ['label' => "$title — $artist", 'title' => $title, 'artist' => $artist];
    if (count($results) >= 8) break;
}

echo json_encode(['items' => array_slice($results, 0, 8)], JSON_UNESCAPED_UNICODE);
