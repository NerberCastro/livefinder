<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'config.php';

$action = $_GET['action'] ?? 'events';

try {
    switch ($action) {
        case 'events':       getEvents();       break;
        case 'event-details': getEventDetails(); break;
        default: throw new Exception('Acción no válida', 400);
    }
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode(['error' => $e->getMessage()]);
}

// -----------------------------------------------------------------------------
// Buscar eventos
// Ticketmaster tiene buena cobertura en España (ES) y México (MX).
// Para esas ciudades buscamos por city + countryCode para mejores resultados.
// Para el resto buscamos solo por city.
// -----------------------------------------------------------------------------
function getEvents() {
    $city = $_GET['city'] ?? '';
    $page = (int)($_GET['page'] ?? 0);
    $size = (int)($_GET['size'] ?? 20);

    if (empty($city)) {
        throw new Exception('Ciudad requerida', 400);
    }

    if (!preg_match('/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/u', $city)) {
        throw new Exception('Ciudad no válida', 400);
    }

    // Ciudades y su countryCode para que Ticketmaster devuelva mejores resultados
    $countryMap = [
        'Madrid'           => 'ES',
        'Barcelona'        => 'ES',
        'Sevilla'          => 'ES',
        'Valencia'         => 'ES',
        'Bilbao'           => 'ES',
        'Malaga'           => 'ES',
        'Málaga'           => 'ES',
    ];

    $startDate = date('Y-m-d') . 'T00:00:00Z';
    $endDate   = date('Y-m-d', strtotime('+3 months')) . 'T23:59:59Z';

    $params = [
        'apikey'        => TICKETMASTER_API_KEY,
        'city'          => $city,
        'page'          => $page,
        'size'          => $size,
        'sort'          => 'date,asc',
        'startDateTime' => $startDate,
        'endDateTime'   => $endDate,
    ];

    // Si la ciudad tiene countryCode definido, lo añadimos para mejores resultados
    if (isset($countryMap[$city])) {
        $params['countryCode'] = $countryMap[$city];
    }

    $url = TICKETMASTER_API_URL . '/events.json?' . http_build_query($params);
    echo curlRequest($url);
}

// -----------------------------------------------------------------------------
// Detalle de un evento por ID
// -----------------------------------------------------------------------------
function getEventDetails() {
    $id = $_GET['id'] ?? '';

    if (empty($id)) throw new Exception('ID requerido', 400);
    if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $id)) throw new Exception('ID no válido', 400);

    $url = TICKETMASTER_API_URL . '/events/' . $id . '.json?apikey=' . TICKETMASTER_API_KEY;
    echo curlRequest($url);
}

// -----------------------------------------------------------------------------
// Petición cURL genérica
// -----------------------------------------------------------------------------
function curlRequest($url) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT      => 'LiveFinder/1.0',
    ]);

    $response  = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) throw new Exception('Error de conexión: ' . $curlError, 500);
    if ($httpCode >= 400) throw new Exception('Ticketmaster respondió con error ' . $httpCode, $httpCode);

    return $response;
}
?>