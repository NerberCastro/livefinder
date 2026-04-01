<?php
/**
 * =========================================================================
 * API ENDPOINT PRINCIPAL DE LIVEFINDER
 * =========================================================================
 */

// =========================================================================
// CONFIGURACIÓN DE CABECERAS HTTP
// =========================================================================
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Incluye configuración (API key, BD)
require_once 'config.php';

$action = $_GET['action'] ?? 'events';

try {
    switch ($action) {
        case 'events':        getEvents();       break;
        case 'event-details': getEventDetails(); break;
        default: throw new Exception('Acción no válida', 400);
    }
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode(['error' => $e->getMessage()]);
}

// =========================================================================
// CONEXIÓN A BASE DE DATOS
// =========================================================================
function conectarBD() {
    $conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if (!$conn) {
        return null; // Sin caché, la app sigue funcionando
    }
    mysqli_set_charset($conn, 'utf8');
    return $conn;
}

// =========================================================================
// BÚSQUEDA DE EVENTOS POR CIUDAD
// =========================================================================
function getEvents() {
    $city = $_GET['city'] ?? '';
    $page = (int)($_GET['page'] ?? 0);
    $size = (int)($_GET['size'] ?? 20);

    if (empty($city)) throw new Exception('Ciudad requerida', 400);

    if (!preg_match('/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/u', $city)) {
        throw new Exception('Ciudad no válida', 400);
    }

    // Normaliza el nombre: "madrid" → "Madrid"
    $city = ucwords(strtolower($city));

    // Intenta caché de MySQL
    $conn = conectarBD();

    if ($conn) {
        $cityEscapada = mysqli_real_escape_string($conn, $city);
        $resultado = mysqli_query($conn,
            "SELECT datos FROM eventos_cache
             WHERE ciudad = '$cityEscapada'
             AND creado_en > DATE_SUB(NOW(), INTERVAL 1 HOUR)
             ORDER BY creado_en DESC LIMIT 1"
        );

        if ($resultado && mysqli_num_rows($resultado) > 0) {
            $fila = mysqli_fetch_assoc($resultado);
            mysqli_close($conn);
            echo $fila['datos'];
            return;
        }
    }

    // Mapa ciudad → código de país para Ticketmaster
    $countryMap = [
        'Madrid'    => 'ES', 'Barcelona' => 'ES', 'Sevilla'   => 'ES',
        'Valencia'  => 'ES', 'Bilbao'    => 'ES', 'Malaga'    => 'ES',
        'Málaga'    => 'ES', 'Zaragoza'  => 'ES', 'Granada'   => 'ES',
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

    if (isset($countryMap[$city])) {
        $params['countryCode'] = $countryMap[$city];
    }

    $url      = TICKETMASTER_API_URL . '/events.json?' . http_build_query($params);
    $respuesta = curlRequest($url);

    // Guarda en caché y registra la búsqueda si hay BD
    if ($conn) {
        $cityEscapada      = mysqli_real_escape_string($conn, $city);
        $respuestaEscapada = mysqli_real_escape_string($conn, $respuesta);
        $ahora             = date('Y-m-d H:i:s');

        mysqli_query($conn, "INSERT INTO eventos_cache (ciudad, datos, creado_en)
                             VALUES ('$cityEscapada', '$respuestaEscapada', '$ahora')");

        mysqli_query($conn, "INSERT INTO busquedas (ciudad, buscado_en)
                             VALUES ('$cityEscapada', '$ahora')");

        mysqli_close($conn);
    }

    echo $respuesta;
}

// =========================================================================
// DETALLE DE EVENTO POR ID
// =========================================================================
function getEventDetails() {
    $id = $_GET['id'] ?? '';

    if (empty($id)) throw new Exception('ID requerido', 400);

    if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $id)) {
        throw new Exception('ID no válido', 400);
    }

    $url = TICKETMASTER_API_URL . '/events/' . $id . '.json?apikey=' . TICKETMASTER_API_KEY;
    echo curlRequest($url);
}

// =========================================================================
// PETICIÓN HTTP CON CURL
// =========================================================================
function curlRequest($url) {
    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        // --- CORRECCIÓN INFINITYFREE ---
        // Los hostings compartidos gratuitos no tienen los certificados CA
        // actualizados, por lo que SSL_VERIFYPEER debe ser false
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        // --------------------------------
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