// =============================================================================
// config.js - Configuración global
// =============================================================================

// Ruta al proxy PHP que comunica con Ticketmaster
// Oculta la API key y permite caché en servidor
const API_URL = 'php/proxy.php';

// Ciudades disponibles en España
// Se usan en búsquedas rápidas y galería de ciudades
const CIUDADES = [
    'Madrid',      // Capital, mayor oferta
    'Barcelona',   // Segunda ciudad con más eventos
    'Sevilla',     // Sur de España
    'Valencia',    // Costa mediterránea
    'Bilbao',      // País Vasco
    'Malaga',      // Costa del Sol
    'Zaragoza',    // Aragón
    'Granada'      // Andalucía oriental
];

// Resultados por página en la API
// Balance entre rendimiento y experiencia de usuario
const EVENTOS_POR_PAGINA = 20;
javascript
// =============================================================================
// api.js - Comunicación con el proxy PHP
// =============================================================================

// -----------------------------------------------------------------------------
// Buscar eventos por ciudad
// Recibe: ciudad, página (opcional)
// Devuelve: datos JSON de Ticketmaster o null si hay error
// -----------------------------------------------------------------------------
async function buscarEventos(ciudad, pagina = 0) {
    // Construye URL con parámetros para el proxy
    const url = `${API_URL}?action=events&city=${ciudad}&page=${pagina}&size=${EVENTOS_POR_PAGINA}`;

    try {
        const respuesta = await fetch(url);
        
        // Verifica que la respuesta sea exitosa
        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`);
        }
        
        return await respuesta.json();
        
    } catch (error) {
        console.error('Error al buscar eventos:', error);
        return null;  // Indica que no se pudieron obtener datos
    }
}

// -----------------------------------------------------------------------------
// Obtener detalle de un evento por ID
// Recibe: id del evento
// Devuelve: datos detallados del evento o null si hay error
// -----------------------------------------------------------------------------
async function obtenerEvento(id) {
    const url = `${API_URL}?action=event-details&id=${id}`;

    try {
        const respuesta = await fetch(url);
        
        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`);
        }
        
        return await respuesta.json();
        
    } catch (error) {
        console.error('Error al obtener el evento:', error);
        return null;
    }
}