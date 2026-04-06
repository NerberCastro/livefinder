<?php
// =============================================================================
// proxy.php - API Proxy para InfinityFree
// =============================================================================

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

$action = $_GET['action'] ?? 'events';

try {
    if ($action === 'events') {
        $city = $_GET['city'] ?? '';
        if (empty($city)) throw new Exception('Ciudad requerida', 400);
        
        $city = ucwords(strtolower(trim($city)));
        
        // Intentar caché en BD
        $conn = @mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn) {
            mysqli_set_charset($conn, 'utf8');
            $cityEsc = mysqli_real_escape_string($conn, $city);
            $result = @mysqli_query($conn, "SELECT datos FROM eventos_cache 
                WHERE ciudad = '$cityEsc' AND creado_en > DATE_SUB(NOW(), INTERVAL 2 HOUR)
                ORDER BY creado_en DESC LIMIT 1");
            if ($result && mysqli_num_rows($result) > 0) {
                $row = mysqli_fetch_assoc($result);
                mysqli_close($conn);
                echo $row['datos'];
                return;
            }
        }
        
        // Llamar a Ticketmaster
        $url = TICKETMASTER_API_URL . '/events.json?' . http_build_query([
            'apikey' => TICKETMASTER_API_KEY,
            'city' => $city,
            'size' => EVENTOS_POR_PAGINA,
            'sort' => 'date,asc',
            'countryCode' => 'ES',
            'startDateTime' => date('Y-m-d\TH:i:s\Z'),
            'endDateTime' => date('Y-m-d\TH:i:s\Z', strtotime('+3 months'))
        ]);
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,  // Necesario en InfinityFree
            CURLOPT_TIMEOUT => 30
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
        
        // Guardar en caché
        if ($conn && $response) {
            $cityEsc = mysqli_real_escape_string($conn, $city);
            $respEsc = mysqli_real_escape_string($conn, $response);
            @mysqli_query($conn, "INSERT INTO eventos_cache (ciudad, datos, creado_en) 
                VALUES ('$cityEsc', '$respEsc', NOW())");
            mysqli_close($conn);
        }
        
        echo $response;
        
    } elseif ($action === 'event-details') {
        $id = $_GET['id'] ?? '';
        if (empty($id)) throw new Exception('ID requerido', 400);
        
        $url = TICKETMASTER_API_URL . '/events/' . $id . '.json?apikey=' . TICKETMASTER_API_KEY;
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 30
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
        
        echo $response;
    }
    
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>