// =============================================================================
// ui.js - Funciones para pintar cosas en la pantalla
// Aquí creamos el HTML de las cards, mensajes de error, etc.
// Estas funciones reciben datos y los convierten en elementos visibles.
// =============================================================================

// -----------------------------------------------------------------------------
// Crear el HTML de una card de evento
// Recibe: un objeto con los datos del evento (viene de Ticketmaster)
// Devuelve: un string con el HTML de la card
// -----------------------------------------------------------------------------
function crearCardEvento(evento) {
    // Ticketmaster devuelve los datos anidados, los extraemos con || para
    // tener un valor por defecto si algo no existe
    const nombre    = evento.name || 'Evento sin nombre';
    const fecha     = evento.dates?.start?.localDate || 'Fecha por confirmar';
    const ciudad    = evento._embedded?.venues?.[0]?.city?.name || 'Ciudad desconocida';
    const recinto   = evento._embedded?.venues?.[0]?.name || '';
    const imagen    = evento.images?.[0]?.url || 'assets/images/placeholders/evento.jpg';
    const url       = evento.url || '#';

    // Formateamos la fecha de "2025-06-15" a "15 jun 2025"
    const fechaFormateada = formatearFecha(fecha);

    // Devolvemos el HTML como string — pages.js lo insertará en el DOM
    return `
        <article class="card">
            <img src="${imagen}" alt="${nombre}" class="card__image" loading="lazy">
            <div class="card__body">
                <p class="card__date">${fechaFormateada}</p>
                <h3 class="card__title">${nombre}</h3>
                <p class="card__venue">${recinto}</p>
            </div>
            <div class="card__footer">
                <span class="card__city">${ciudad}</span>
                <a href="evento.html?id=${evento.id}" class="btn btn--primary btn--sm">Ver más</a>
            </div>
        </article>
    `;
}

// -----------------------------------------------------------------------------
// Mostrar un mensaje de error en un contenedor
// Recibe: el elemento del DOM donde mostrar el error, y el texto del mensaje
// -----------------------------------------------------------------------------
function mostrarError(contenedor, mensaje) {
    contenedor.innerHTML = `
        <div class="empty-state">
            <p class="empty-state__icon">😕</p>
            <p class="empty-state__title">${mensaje}</p>
            <p class="empty-state__text">Intenta con otra ciudad o vuelve más tarde.</p>
        </div>
    `;
}

// -----------------------------------------------------------------------------
// Formatear una fecha de "2025-06-15" a "15 jun 2025"
// Recibe: fecha en formato YYYY-MM-DD (string)
// Devuelve: fecha legible en español (string)
// -----------------------------------------------------------------------------
function formatearFecha(fecha) {
    // Si la fecha no es válida, la devolvemos tal cual
    if (!fecha || fecha === 'Fecha por confirmar') return fecha;

    const date = new Date(fecha + 'T00:00:00'); // T00:00:00 evita problemas de zona horaria
    return date.toLocaleDateString('es-ES', {
        day:   'numeric',
        month: 'short',
        year:  'numeric'
    });
}

// -----------------------------------------------------------------------------
// Crear el HTML del detalle de un evento
// Recibe: objeto con los datos completos del evento (viene de Ticketmaster)
// Devuelve: string con el HTML del detalle
// -----------------------------------------------------------------------------
function crearDetalleEvento(evento) {
    const nombre   = evento.name || 'Evento sin nombre';
    const fecha    = evento.dates?.start?.localDate || 'Fecha por confirmar';
    const hora     = evento.dates?.start?.localTime?.slice(0, 5) || '';
    const imagen   = evento.images?.[0]?.url || 'assets/images/placeholders/evento.jpg';
    const recinto  = evento._embedded?.venues?.[0]?.name || 'Recinto por confirmar';
    const ciudad   = evento._embedded?.venues?.[0]?.city?.name || '';
    const pais     = evento._embedded?.venues?.[0]?.country?.name || '';
    const urlVenta = evento.url || '#';
    const info     = evento.info || evento.pleaseNote || '';

    const fechaFormateada = formatearFecha(fecha);

    return `
        <div class="event-detail">

            <!-- Imagen grande del evento -->
            <img src="${imagen}" alt="${nombre}" class="event-detail__img">

            <!-- Nombre del evento -->
            <h1 class="event-detail__title">${nombre}</h1>

            <!-- Datos del evento en una tabla simple -->
            <div class="event-detail__info">
                <p>📅 <strong>Fecha:</strong> ${fechaFormateada} ${hora ? 'a las ' + hora : ''}</p>
                <p>📍 <strong>Recinto:</strong> ${recinto}</p>
                <p>🌍 <strong>Ciudad:</strong> ${ciudad}${pais ? ', ' + pais : ''}</p>
            </div>

            <!-- Descripción si existe -->
            ${info ? `<p class="event-detail__desc">${info}</p>` : ''}

            <!-- Botón para comprar entradas — abre en pestaña nueva -->
            <a href="${urlVenta}" target="_blank" class="btn btn--primary btn--lg">
                🎟️ Comprar entradas
            </a>

        </div>
    `;
}