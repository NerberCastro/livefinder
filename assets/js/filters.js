// =============================================================================
// filters.js - Lógica de los filtros en la página de resultados
// Gestiona los filtros de género y fecha que hay en resultados.html
// =============================================================================

// Guardamos aquí los eventos originales para poder filtrar sin perder datos
let eventosOriginales = [];

// -----------------------------------------------------------------------------
// Iniciar los filtros
// Recibe: el grid donde están las cards de eventos
// Lee los selects de género y fecha, y filtra cuando cambian
// -----------------------------------------------------------------------------
function iniciarFiltros(grid) {
    const selectGenero = document.getElementById('filtro-genero');
    const selectFecha  = document.getElementById('filtro-fecha');

    // Si no hay filtros en esta página, salimos
    if (!selectGenero && !selectFecha) return;

    // Cuando cambia el filtro de género, volvemos a filtrar
    if (selectGenero) {
        selectGenero.addEventListener('change', function() {
            aplicarFiltros(grid);
        });
    }

    // Cuando cambia el filtro de fecha, volvemos a filtrar
    if (selectFecha) {
        selectFecha.addEventListener('change', function() {
            aplicarFiltros(grid);
        });
    }
}

// -----------------------------------------------------------------------------
// Guardar los eventos originales (se llama desde pages.js al cargar resultados)
// Necesitamos guardarlos para poder filtrar sin hacer otra llamada a la API
// -----------------------------------------------------------------------------
function guardarEventosOriginales(eventos) {
    eventosOriginales = eventos;
}

// -----------------------------------------------------------------------------
// Aplicar los filtros activos y redibujar el grid
// -----------------------------------------------------------------------------
function aplicarFiltros(grid) {
    const genero = document.getElementById('filtro-genero')?.value || '';
    const fecha  = document.getElementById('filtro-fecha')?.value  || '';

    let eventosFiltrados = eventosOriginales;

    // Filtrar por género si se seleccionó uno
    if (genero) {
        eventosFiltrados = eventosFiltrados.filter(function(evento) {
            // Ticketmaster guarda el género en classifications[0].genre.name
            const generoEvento = evento.classifications?.[0]?.genre?.name || '';
            return generoEvento.toLowerCase() === genero.toLowerCase();
        });
    }

    // Filtrar por fecha si se seleccionó una
    if (fecha) {
        const hoy   = new Date();
        let limite  = new Date();

        if (fecha === '7dias')  limite.setDate(hoy.getDate() + 7);
        if (fecha === '30dias') limite.setDate(hoy.getDate() + 30);
        if (fecha === '3meses') limite.setMonth(hoy.getMonth() + 3);

        eventosFiltrados = eventosFiltrados.filter(function(evento) {
            const fechaEvento = new Date(evento.dates?.start?.localDate);
            return fechaEvento >= hoy && fechaEvento <= limite;
        });
    }

    // Si no queda ningún evento tras filtrar, mostramos mensaje
    if (eventosFiltrados.length === 0) {
        mostrarError(grid, 'No hay eventos con estos filtros.');
        return;
    }

    // Redibujamos el grid con los eventos filtrados
    grid.innerHTML = eventosFiltrados.map(crearCardEvento).join('');
}