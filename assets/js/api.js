// =============================================================================
// api.js - Funciones para hablar con el proxy PHP
// Todas las peticiones a Ticketmaster pasan por aquí.
// Usamos fetch() que es la forma moderna de hacer peticiones en JavaScript.
// =============================================================================

// -----------------------------------------------------------------------------
// Buscar eventos por ciudad
// Recibe: ciudad (string), página (número, por defecto 0)
// Devuelve: los datos de Ticketmaster en formato JSON
// -----------------------------------------------------------------------------
async function buscarEventos(ciudad, pagina = 0) {
    // Construimos la URL con los parámetros que necesita el proxy
    const url = `${API_URL}?action=events&city=${ciudad}&page=${pagina}&size=${EVENTOS_POR_PAGINA}`;

    try {
        const respuesta = await fetch(url);

        // Si el servidor devuelve un error (404, 500...), lo lanzamos
        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        return datos;

    } catch (error) {
        console.error('Error al buscar eventos:', error);
        return null;  // Devolvemos null para que quien llame a esta función pueda manejarlo
    }
}

// -----------------------------------------------------------------------------
// Obtener el detalle de un evento concreto
// Recibe: id del evento (string)
// Devuelve: los datos del evento en formato JSON
// -----------------------------------------------------------------------------
async function obtenerEvento(id) {
    const url = `${API_URL}?action=event-details&id=${id}`;

    try {
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        return datos;

    } catch (error) {
        console.error('Error al obtener el evento:', error);
        return null;
    }
}