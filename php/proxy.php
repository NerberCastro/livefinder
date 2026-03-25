    <?php
    /**
     * =========================================================================
     * API ENDPOINT PRINCIPAL DE LIVEFINDER
     * =========================================================================
     * 
     * Este archivo actúa como el punto de entrada para todas las peticiones AJAX
     * de la aplicación LiveFinder. Maneja la comunicación entre el frontend
     * y la API de Ticketmaster, implementando un sistema de caché en MySQL
     * para optimizar el rendimiento y reducir llamadas externas.
     * 
     * FUNCIONALIDADES:
     * - Búsqueda de eventos por ciudad con caché de 1 hora
     * - Obtención de detalles específicos de un evento por ID
     * - Registro de búsquedas para análisis de uso
     * - Manejo de errores y validación de entrada
     * 
     * @package LiveFinder
     * @version 1.0.0
     * =========================================================================
     */

    // =========================================================================
    // CONFIGURACIÓN DE CABECERAS HTTP
    // =========================================================================

    /**
     * Configuración CORS (Cross-Origin Resource Sharing)
     * Permite que cualquier dominio acceda a esta API.
     * 
     * ⚠️ NOTA DE SEGURIDAD: En producción, reemplazar '*' por dominios específicos
     * para evitar accesos no autorizados.
     */
    header("Access-Control-Allow-Origin: *");

    /**
     * Establece el tipo de contenido de la respuesta como JSON
     * Todas las respuestas de esta API serán en formato JSON
     */
    header("Content-Type: application/json");

    // =========================================================================
    // CARGA DE CONFIGURACIÓN Y PROCESAMIENTO DE LA PETICIÓN
    // =========================================================================

    /**
     * Incluye el archivo de configuración con las constantes:
     * - Credenciales de Ticketmaster API
     * - Configuración de base de datos MySQL
     */
    require_once 'config.php';

    /**
     * Obtiene la acción solicitada desde el parámetro GET 'action'
     * Si no se especifica, por defecto busca eventos ('events')
     * 
     * @var string $action Acción a ejecutar (events, event-details)
     */
    $action = $_GET['action'] ?? 'events';

    /**
     * Bloque try-catch para manejo centralizado de errores
     * Captura cualquier excepción y la devuelve como respuesta JSON
     */
    try {
        /**
         * Switch que ejecuta la función correspondiente según la acción solicitada
         * - 'events': Busca eventos por ciudad con caché
         * - 'event-details': Obtiene detalles de un evento específico
         */
        switch ($action) {
            case 'events':        getEvents();       break;  // Búsqueda de eventos
            case 'event-details': getEventDetails(); break;  // Detalle de evento
            default: throw new Exception('Acción no válida', 400);  // Error: acción desconocida
        }
    } catch (Exception $e) {
        /**
         * Manejo de excepciones:
         * - Establece el código HTTP de respuesta (400, 404, 500, etc.)
         * - Si no hay código, usa 500 (Error interno del servidor)
         * - Devuelve el mensaje de error en formato JSON
         */
        http_response_code($e->getCode() ?: 500);
        echo json_encode(['error' => $e->getMessage()]);
    }

    // =========================================================================
    // FUNCIÓN: CONEXIÓN A BASE DE DATOS
    // =========================================================================

    /**
     * Establece y devuelve una conexión a la base de datos MySQL
     * 
     * LÓGICA:
     * - Intenta conectar con las credenciales definidas en config.php
     * - Si la conexión falla, devuelve null (la aplicación continúa sin caché)
     * - Configura el juego de caracteres a UTF-8 para soportar tildes y ñ
     * 
     * @return mysqli|null Objeto de conexión MySQL o null si falla
     */
    function conectarBD() {
        // Intenta establecer conexión con MySQL
        $conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        // Si falla la conexión, devolvemos null (no bloqueamos la app)
        if (!$conn) {
            return null; // La BD no está disponible, seguimos sin caché
        }
        
        // Configura el juego de caracteres a UTF-8 para manejar correctamente acentos y ñ
        mysqli_set_charset($conn, 'utf8');
        
        return $conn;
    }

    // =========================================================================
    // FUNCIÓN: BÚSQUEDA DE EVENTOS POR CIUDAD
    // =========================================================================

    /**
     * Busca eventos musicales en una ciudad específica
     * 
     * FLUJO COMPLETO:
     * 1. Valida y sanitiza la ciudad recibida
     * 2. Intenta obtener datos desde la caché MySQL (menos de 1 hora de antigüedad)
     * 3. Si no hay caché válida, consulta a la API de Ticketmaster
     * 4. Guarda la respuesta en caché para futuras consultas
     * 5. Registra la búsqueda para análisis estadístico
     * 6. Devuelve los resultados al cliente
     * 
     * @throws Exception Si la ciudad no es válida o hay error en la petición
     */
    function getEvents() {
        // =================================================================
        // 1. OBTENCIÓN Y VALIDACIÓN DE PARÁMETROS
        // =================================================================
        
        /**
         * Obtiene el nombre de la ciudad desde el parámetro GET 'city'
         * @var string $city Nombre de la ciudad buscada
         */
        $city = $_GET['city'] ?? '';
        
        /**
         * Número de página para paginación de resultados
         * @var int $page Página actual (0-indexed)
         */
        $page = (int)($_GET['page'] ?? 0);
        
        /**
         * Cantidad de resultados por página
         * @var int $size Máximo 200 según API de Ticketmaster
         */
        $size = (int)($_GET['size'] ?? 20);
        
        // Validación: ciudad requerida
        if (empty($city)) throw new Exception('Ciudad requerida', 400);
        
        /**
         * Validación de formato de ciudad:
         * - Permite letras mayúsculas y minúsculas
         * - Permite acentos (áéíóú)
         * - Permite la letra ñ y ü
         * - Permite espacios entre palabras
         * - No permite números ni caracteres especiales
         */
        if (!preg_match('/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/u', $city)) {
            throw new Exception('Ciudad no válida', 400);
        }
        
        /**
         * Normalización del nombre de ciudad:
         * 1. Convierte todo a minúsculas
         * 2. Capitaliza cada palabra (primera letra mayúscula)
         * Ejemplo: "madrid" → "Madrid", "buenos aires" → "Buenos Aires"
         * Esto asegura coincidencia con el countryMap y mejor reconocimiento por Ticketmaster
         */
        $city = ucwords(strtolower($city));
        
        // =================================================================
        // 2. CONSULTA A CACHÉ DE MYSQL
        // =================================================================
        
        /**
         * Intenta obtener conexión a la base de datos
         * Si falla, $conn será null y continuamos sin caché
         */
        $conn = conectarBD();
        
        if ($conn) {
            // Escapa la ciudad para prevenir inyección SQL
            $cityEscapada = mysqli_real_escape_string($conn, $city);
            
            /**
             * Consulta SQL para obtener datos en caché:
             * - Busca eventos de la ciudad especificada
             * - Filtra registros con menos de 1 hora de antigüedad
             * - Ordena por fecha de creación descendente
             * - Solo toma el registro más reciente
             */
            $sql = "SELECT datos FROM eventos_cache 
                    WHERE ciudad = '$cityEscapada' 
                    AND creado_en > DATE_SUB(NOW(), INTERVAL 1 HOUR)
                    ORDER BY creado_en DESC 
                    LIMIT 1";
            
            $resultado = mysqli_query($conn, $sql);
            
            // Si encontramos datos frescos en caché, los devolvemos inmediatamente
            if ($resultado && mysqli_num_rows($resultado) > 0) {
                $fila = mysqli_fetch_assoc($resultado);
                mysqli_close($conn);
                echo $fila['datos'];  // Devolvemos el JSON almacenado
                return;               // Salimos de la función sin llamar a Ticketmaster
            }
        }
        
        // =================================================================
        // 3. CONSULTA A LA API DE TICKETMASTER
        // =================================================================
        
        /**
         * Mapa de ciudades a códigos de país ISO 3166-1 alpha-2
         * Ticketmaster requiere código de país para búsquedas precisas
         * 
         * @var array $countryMap Asociación ciudad → código de país
         */
        $countryMap = [
            'Madrid' => 'ES', 'Barcelona' => 'ES', 'Sevilla' => 'ES',
            'Valencia' => 'ES', 'Bilbao' => 'ES', 'Malaga' => 'ES',
            'Málaga' => 'ES', 'Zaragoza' => 'ES', 'Granada' => 'ES',
        ];
        
        /**
         * Configuración de fechas para la búsqueda:
         * - startDate: Hoy a las 00:00:00 UTC
         * - endDate: 3 meses después a las 23:59:59 UTC
         * Esto limita los resultados a eventos futuros próximos
         */
        $startDate = date('Y-m-d') . 'T00:00:00Z';           // Hoy
        $endDate   = date('Y-m-d', strtotime('+3 months')) . 'T23:59:59Z';  // +3 meses
        
        /**
         * Parámetros para la API de Ticketmaster
         * @see https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
         */
        $params = [
            'apikey'        => TICKETMASTER_API_KEY,    // Clave de autenticación
            'city'          => $city,                   // Ciudad a buscar
            'page'          => $page,                   // Número de página
            'size'          => $size,                   // Resultados por página
            'sort'          => 'date,asc',              // Ordenar por fecha ascendente
            'startDateTime' => $startDate,              // Desde hoy
            'endDateTime'   => $endDate,                // Hasta 3 meses
        ];
        
        // Agrega código de país si la ciudad está en el mapa
        if (isset($countryMap[$city])) {
            $params['countryCode'] = $countryMap[$city];
        }
        
        /**
         * Construye la URL completa de la API
         * Ejemplo: https://app.ticketmaster.com/discovery/v2/events.json?apikey=XXX&city=Madrid...
         */
        $url      = TICKETMASTER_API_URL . '/events.json?' . http_build_query($params);
        $respuesta = curlRequest($url);  // Realiza la petición HTTP
        
        // =================================================================
        // 4. ALMACENAMIENTO EN CACHÉ Y REGISTRO DE BÚSQUEDA
        // =================================================================
        
        // Si hay conexión a BD, guardamos los resultados para futuras consultas
        if ($conn) {
            $cityEscapada      = mysqli_real_escape_string($conn, $city);
            $respuestaEscapada = mysqli_real_escape_string($conn, $respuesta);
            $ahora             = date('Y-m-d H:i:s');
            
            /**
             * Guarda la respuesta en la tabla de caché
             * - ciudad: nombre de la ciudad buscada
             * - datos: JSON completo de la respuesta de Ticketmaster
             * - creado_en: timestamp de cuando se almacenó
             */
            mysqli_query($conn, "INSERT INTO eventos_cache (ciudad, datos, creado_en) 
                                VALUES ('$cityEscapada', '$respuestaEscapada', '$ahora')");
            
            /**
             * Registra la búsqueda para análisis estadístico
             * Esta tabla permite conocer las ciudades más buscadas
             */
            mysqli_query($conn, "INSERT INTO busquedas (ciudad, buscado_en) 
                                VALUES ('$cityEscapada', '$ahora')");
            
            mysqli_close($conn);
        }
        
        // Devuelve la respuesta al cliente
        echo $respuesta;
    }

    // =========================================================================
    // FUNCIÓN: DETALLE DE EVENTO POR ID
    // =========================================================================

    /**
     * Obtiene los detalles completos de un evento específico
     * 
     * A diferencia de getEvents(), esta función NO utiliza caché porque:
     * - Los detalles de eventos son datos únicos que cambian poco
     * - Las consultas por ID son menos frecuentes
     * - La API de Ticketmaster no permite caché eficiente por ID
     * 
     * @throws Exception Si el ID no es válido o hay error en la petición
     */
    function getEventDetails() {
        // Obtiene el ID del evento desde el parámetro GET 'id'
        $id = $_GET['id'] ?? '';
        
        // Validación: ID requerido
        if (empty($id)) throw new Exception('ID requerido', 400);
        
        /**
         * Validación de formato del ID de Ticketmaster:
         * - Solo permite caracteres alfanuméricos, guiones y guiones bajos
         * - Previene inyección de código en la URL
         */
        if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $id)) throw new Exception('ID no válido', 400);
        
        /**
         * Construye la URL para obtener detalles del evento
         * Formato: /events/{id}.json?apikey=XXX
         */
        $url = TICKETMASTER_API_URL . '/events/' . $id . '.json?apikey=' . TICKETMASTER_API_KEY;
        
        // Realiza la petición y devuelve la respuesta
        echo curlRequest($url);
    }

    // =========================================================================
    // FUNCIÓN: PETICIÓN HTTP CON CURL
    // =========================================================================

    /**
     * Realiza una petición HTTP utilizando cURL
     * 
     * Esta función genérica maneja:
     * - Configuración de opciones de cURL
     * - Manejo de errores de conexión
     * - Validación de códigos de respuesta HTTP
     * 
     * @param string $url URL completa a la que hacer la petición
     * @return string Respuesta del servidor (JSON)
     * @throws Exception Si hay error de conexión o la API responde con error
     */
    function curlRequest($url) {
        // Inicializa una sesión cURL
        $ch = curl_init();
        
        /**
         * Configuración de opciones de cURL:
         * - CURLOPT_URL: URL a la que conectar
         * - CURLOPT_RETURNTRANSFER: Devuelve el resultado como string
         * - CURLOPT_TIMEOUT: Timeout de 30 segundos
         * - CURLOPT_SSL_VERIFYPEER: Verifica certificado SSL (seguridad)
         * - CURLOPT_USERAGENT: Identifica la aplicación cliente
         */
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,      // Devuelve el resultado como string
            CURLOPT_TIMEOUT        => 30,        // 30 segundos máximo de espera
            CURLOPT_SSL_VERIFYPEER => true,      // Verifica certificado SSL (producción)
            CURLOPT_USERAGENT      => 'LiveFinder/1.0',  // Identifica nuestra app
        ]);
        
        // Ejecuta la petición
        $response  = curl_exec($ch);
        
        // Obtiene información de la respuesta
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);  // Código HTTP (200, 404, etc.)
        $curlError = curl_error($ch);                        // Error de cURL si existe
        
        // Cierra la sesión cURL
        curl_close($ch);
        
        // Manejo de errores de conexión
        if ($curlError) throw new Exception('Error de conexión: ' . $curlError, 500);
        
        // Manejo de errores HTTP (4xx, 5xx)
        if ($httpCode >= 400) throw new Exception('Ticketmaster respondió con error ' . $httpCode, $httpCode);
        
        // Devuelve la respuesta exitosa
        return $response;
    }
    ?>