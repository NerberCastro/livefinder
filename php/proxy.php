    <?php
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json");

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

    // -----------------------------------------------------------------------------
    // Conectar a la base de datos
    // Devuelve la conexión o null si falla (no bloqueamos la app si la BD falla)
    // -----------------------------------------------------------------------------
    function conectarBD() {
        $conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if (!$conn) {
            return null; // Si la BD no está disponible, seguimos sin caché
        }
        mysqli_set_charset($conn, 'utf8');
        return $conn;
    }

    // -----------------------------------------------------------------------------
    // Buscar eventos
    // Primero mira en la caché de MySQL.
    // Si los datos tienen menos de 1 hora los usa directamente.
    // Si no, pide a Ticketmaster, guarda en caché y devuelve.
    // -----------------------------------------------------------------------------
    function getEvents() {
        $city = $_GET['city'] ?? '';
        $page = (int)($_GET['page'] ?? 0);
        $size = (int)($_GET['size'] ?? 20);

        if (empty($city)) throw new Exception('Ciudad requerida', 400);

        if (!preg_match('/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/u', $city)) {
            throw new Exception('Ciudad no válida', 400);
        }

        // Capitalizamos cada palabra: "madrid" -> "Madrid", "buenos aires" -> "Buenos Aires"
        // Así siempre coincide con el countryMap y Ticketmaster la reconoce mejor
        $city = ucwords(strtolower($city));

        // 1. Intentamos leer de la caché
        $conn = conectarBD();
        if ($conn) {
            $cityEscapada = mysqli_real_escape_string($conn, $city);

            // Buscamos un registro de esta ciudad con menos de 1 hora de antigüedad
            $sql = "SELECT datos FROM eventos_cache 
                    WHERE ciudad = '$cityEscapada' 
                    AND creado_en > DATE_SUB(NOW(), INTERVAL 1 HOUR)
                    ORDER BY creado_en DESC 
                    LIMIT 1";

            $resultado = mysqli_query($conn, $sql);

            if ($resultado && mysqli_num_rows($resultado) > 0) {
                // Tenemos datos frescos en caché — los devolvemos sin llamar a Ticketmaster
                $fila = mysqli_fetch_assoc($resultado);
                mysqli_close($conn);
                echo $fila['datos'];
                return;
            }
        }

        // 2. No hay caché — pedimos a Ticketmaster
        $countryMap = [
            'Madrid' => 'ES', 'Barcelona' => 'ES', 'Sevilla' => 'ES',
            'Valencia' => 'ES', 'Bilbao' => 'ES', 'Malaga' => 'ES',
            'Málaga' => 'ES', 'Zaragoza' => 'ES', 'Granada' => 'ES',
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

        // 3. Guardamos en caché y registramos la búsqueda
        if ($conn) {
            $cityEscapada      = mysqli_real_escape_string($conn, $city);
            $respuestaEscapada = mysqli_real_escape_string($conn, $respuesta);
            $ahora             = date('Y-m-d H:i:s');

            // Guardamos los datos en caché
            mysqli_query($conn, "INSERT INTO eventos_cache (ciudad, datos, creado_en) 
                                VALUES ('$cityEscapada', '$respuestaEscapada', '$ahora')");

            // Registramos la búsqueda
            mysqli_query($conn, "INSERT INTO busquedas (ciudad, buscado_en) 
                                VALUES ('$cityEscapada', '$ahora')");

            mysqli_close($conn);
        }

        echo $respuesta;
    }

    // -----------------------------------------------------------------------------
    // Detalle de un evento por ID (sin caché, son datos únicos)
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