// =============================================================================
// filters.js - Lógica de los filtros en la página de resultados
// =============================================================================
/* 
    Este archivo gestiona los filtros de género y fecha en la página de resultados.
    Permite a los usuarios refinar la lista de conciertos sin necesidad de
    hacer nuevas llamadas a la API.
    
    CÓMO FUNCIONA:
    1. Guarda una copia de los eventos originales (eventosOriginales)
    2. Escucha cambios en los selects de género y fecha
    3. Filtra la copia según los criterios seleccionados
    4. Re-renderiza el grid con los resultados filtrados
*/

// -----------------------------------------------------------------------------
// VARIABLE GLOBAL
// -----------------------------------------------------------------------------
/* 
    eventosOriginales - Almacena los eventos sin filtrar
    Se utiliza como fuente de datos para aplicar los filtros.
    Se actualiza cada vez que se carga una nueva búsqueda.
*/
let eventosOriginales = [];

// -----------------------------------------------------------------------------
// INICIAR FILTROS
// -----------------------------------------------------------------------------
/* 
    Configura los listeners para los filtros.
    Se llama una vez cuando la página termina de cargar.
    
    @param {HTMLElement} grid - Contenedor donde se muestran las tarjetas de eventos
*/
function iniciarFiltros(grid) {
    // Obtiene los elementos select del DOM
    const selectGenero = document.getElementById('filtro-genero');
    const selectFecha  = document.getElementById('filtro-fecha');

    // Si no hay filtros en esta página, salimos (por seguridad)
    if (!selectGenero && !selectFecha) return;

    // Listener para filtro de género
    if (selectGenero) {
        selectGenero.addEventListener('change', function() {
            aplicarFiltros(grid);  // Cada cambio, re-filtra
        });
    }

    // Listener para filtro de fecha
    if (selectFecha) {
        selectFecha.addEventListener('change', function() {
            aplicarFiltros(grid);  // Cada cambio, re-filtra
        });
    }
}

// -----------------------------------------------------------------------------
// GUARDAR EVENTOS ORIGINALES
// -----------------------------------------------------------------------------
/* 
    Almacena los eventos sin filtrar.
    Se llama desde pages.js después de cargar los resultados de la API.
    
    @param {Array} eventos - Lista de eventos obtenida de Ticketmaster
*/
function guardarEventosOriginales(eventos) {
    eventosOriginales = eventos;  // Copia referencia para filtrar después
}

// -----------------------------------------------------------------------------
// APLICAR FILTROS
// -----------------------------------------------------------------------------
/* 
    Filtra los eventos según género y fecha seleccionados,
    y actualiza el grid con los resultados.
    
    @param {HTMLElement} grid - Contenedor donde se muestran las tarjetas
*/
function aplicarFiltros(grid) {
    // Obtiene valores seleccionados (o cadena vacía si no hay)
    const genero = document.getElementById('filtro-genero')?.value || '';
    const fecha  = document.getElementById('filtro-fecha')?.value  || '';

    // Parte de los eventos originales (sin filtros previos)
    let eventosFiltrados = eventosOriginales;

    // =============================================================
    // FILTRO POR GÉNERO
    // =============================================================
    if (genero) {
        eventosFiltrados = eventosFiltrados.filter(function(evento) {
            // Ticketmaster guarda el género en la ruta:
            // classifications[0].genre.name
            const generoEvento = evento.classifications?.[0]?.genre?.name || '';
            // Comparación case-insensitive
            return generoEvento.toLowerCase() === genero.toLowerCase();
        });
    }

    // =============================================================
    // FILTRO POR FECHA
    // =============================================================
    if (fecha) {
        const hoy   = new Date();
        let limite  = new Date();

        // Define el límite según la opción seleccionada
        if (fecha === '7dias')  limite.setDate(hoy.getDate() + 7);   // Próximos 7 días
        if (fecha === '30dias') limite.setDate(hoy.getDate() + 30);  // Próximo mes
        if (fecha === '3meses') limite.setMonth(hoy.getMonth() + 3); // Próximos 3 meses

        eventosFiltrados = eventosFiltrados.filter(function(evento) {
            const fechaEvento = new Date(evento.dates?.start?.localDate);
            // Incluye eventos desde hoy hasta el límite
            return fechaEvento >= hoy && fechaEvento <= limite;
        });
    }

    // =============================================================
    // MANEJO DE RESULTADOS VACÍOS
    // =============================================================
    if (eventosFiltrados.length === 0) {
        // Muestra mensaje de que no hay eventos con estos filtros
        mostrarError(grid, 'No hay eventos con estos filtros.');
        return;
    }

    // =============================================================
    // RENDERIZAR RESULTADOS
    // =============================================================
    // Genera HTML para cada evento y lo inserta en el grid
    grid.innerHTML = eventosFiltrados.map(crearCardEvento).join('');
}