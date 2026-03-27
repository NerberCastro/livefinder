// api.js - Comunicación con el proxy PHP
// =============================================================================
// Comunicación frontend-backend.
// Las peticiones a Ticketmaster pasan por el proxy PHP (caché + API key).
// Ventajas: API key protegida, caché en servidor, código centralizado.

// -----------------------------------------------------------------------------
// BUSCAR EVENTOS POR CIUDAD
// -----------------------------------------------------------------------------
// Busca conciertos en una ciudad.
// @param {string} ciudad - Nombre de la ciudad
// @param {number} pagina - Pagina (0 por defecto)
// @returns {Promise<Object|null>} - Datos de Ticketmaster o null

async function buscarEventos(ciudad, pagina = 0) {
    const url = `${API_URL}?action=events&city=${ciudad}&page=${pagina}&size=${EVENTOS_POR_PAGINA}`;

    try {
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`);
        }

        return await respuesta.json();

    } catch (error) {
        console.error('Error al buscar eventos:', error);
        return null;
    }
}

// -----------------------------------------------------------------------------
// OBTENER DETALLE DE UN EVENTO
// -----------------------------------------------------------------------------
// Obtiene informacion completa de un evento por su ID.
// @param {string} id - ID del evento (ej: "Z7r9jZ1AdJkR")
// @returns {Promise<Object|null>} - Datos del evento o null

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