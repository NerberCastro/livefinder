// =============================================================================
// pages.js - Inicialización de cada página
// =============================================================================
/* 
    Este archivo es el punto de entrada de la aplicación.
    Detecta en qué página estamos (home, resultados, detalle, ciudades)
    y ejecuta las funciones correspondientes para cargar los datos.
    
    FLUJO:
    1. Espera a que el DOM esté listo (DOMContentLoaded)
    2. Configura elementos comunes (footer, menú móvil)
    3. Detecta la página actual por la presencia de elementos específicos
    4. Ejecuta la lógica específica de cada página
*/

// Espera a que todo el HTML esté cargado antes de ejecutar nada
document.addEventListener('DOMContentLoaded', function() {

    // =========================================================================
    // ELEMENTOS COMUNES (TODAS LAS PÁGINAS)
    // =========================================================================
    
    // Año actual en el footer
    const spanAnio = document.getElementById('pie-anio');
    if (spanAnio) {
        spanAnio.textContent = new Date().getFullYear();
    }

    // Configura el menú hamburguesa para móvil
    iniciarMenuMovil();

    // =========================================================================
    // PÁGINA DE INICIO (index.html)
    // =========================================================================
    const formHero    = document.getElementById('formulario-busqueda-hero');
    const formCta     = document.getElementById('formulario-busqueda-cta');
    const gridEventos = document.getElementById('cuadricula-eventos-destacados');

    if (formHero) {
        // Configura los buscadores (hero y CTA)
        iniciarBuscador(formHero);
        iniciarBuscador(formCta);
        
        // Configura los botones de búsqueda rápida (Madrid, Barcelona, etc.)
        iniciarBotonesRapidos();
        
        // Carga los eventos destacados (Madrid)
        cargarEventosDestacados(gridEventos);
    }

    // =========================================================================
    // PÁGINA DE RESULTADOS (resultados.html)
    // =========================================================================
    const gridResultados = document.getElementById('cuadricula-resultados');

    if (gridResultados) {
        // Obtiene la ciudad de la URL (?city=Madrid)
        const params = new URLSearchParams(window.location.search);
        const ciudad = params.get('city');

        if (ciudad) {
            // Hay ciudad en la URL — cargamos sus eventos
            const tituloCiudad = document.getElementById('ciudad-resultados');
            if (tituloCiudad) tituloCiudad.textContent = ciudad;

            cargarResultados(gridResultados, ciudad);
        } else {
            // No hay ciudad — mostramos mensaje para que el usuario busque
            const filtros = document.querySelector('.filtros-resultados');
            if (filtros) filtros.style.display = 'none';

            const tituloCiudad = document.getElementById('ciudad-resultados');
            if (tituloCiudad) tituloCiudad.textContent = 'España';

            gridResultados.innerHTML = `
                <div class="estado-vacio" style="grid-column: 1 / -1;">
                    <p class="estado-vacio__icono">🎵</p>
                    <p class="estado-vacio__titulo">¿Qué ciudad quieres explorar?</p>
                    <p class="estado-vacio__texto">Usa el buscador de arriba para encontrar conciertos en tu ciudad.</p>
                </div>
            `;
        }

        // Configura el buscador dentro de la página de resultados
        const formResultados = document.getElementById('formulario-busqueda-resultados');
        if (formResultados) iniciarBuscador(formResultados);

        // Configura los filtros (género y fecha)
        iniciarFiltros(gridResultados);
    }

    // =========================================================================
    // PÁGINA DE DETALLE (evento.html)
    // =========================================================================
    const contenedorEvento = document.getElementById('detalle-evento');

    if (contenedorEvento) {
        // Obtiene el ID del evento de la URL (?id=xxxx)
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (id) {
            cargarDetalleEvento(contenedorEvento, id);
        } else {
            mostrarError(contenedorEvento, 'No se encontró el evento.');
        }
    }

    // =========================================================================
    // PÁGINA DE CIUDADES (ciudades.html)
    // =========================================================================
    const gridCiudades = document.getElementById('cuadricula-ciudades');

    if (gridCiudades) {
        // Configura los botones de filtro por región
        const botonesFiltro = document.querySelectorAll('.cities-filter__btn');

        botonesFiltro.forEach(function(boton) {
            boton.addEventListener('click', function() {

                // Quita la clase 'active' de todos los botones
                botonesFiltro.forEach(function(b) { b.classList.remove('active'); });
                // Activa el botón clickeado
                boton.classList.add('active');

                // Obtiene la región seleccionada
                const region = boton.getAttribute('data-region');
                const cards  = gridCiudades.querySelectorAll('.tarjeta-ciudad');

                // Muestra/oculta las tarjetas según la región
                cards.forEach(function(card) {
                    if (!region || card.getAttribute('data-region') === region) {
                        card.classList.remove('hidden');  // Mostrar
                    } else {
                        card.classList.add('hidden');     // Ocultar
                    }
                });
            });
        });
    }

});

// =============================================================================
// FUNCIONES DE CARGA DE DATOS
// =============================================================================

/* 
    cargarEventosDestacados - Carga eventos de Madrid para la página de inicio
    @param {HTMLElement} grid - Contenedor donde insertar las tarjetas
*/
async function cargarEventosDestacados(grid) {
    // Busca eventos en Madrid
    const datos = await buscarEventos('Madrid');

    if (!datos || !datos._embedded) {
        mostrarError(grid, 'No se pudieron cargar los eventos.');
        return;
    }

    // Toma solo los primeros 6 eventos
    const eventos = datos._embedded.events.slice(0, 6);
    
    // Renderiza las tarjetas
    grid.innerHTML = eventos.map(crearCardEvento).join('');
}

/* 
    cargarResultados - Carga eventos de la ciudad buscada
    @param {HTMLElement} grid - Contenedor donde insertar las tarjetas
    @param {string} ciudad - Nombre de la ciudad a buscar
*/
async function cargarResultados(grid, ciudad) {
    // Busca eventos en la ciudad
    const datos = await buscarEventos(ciudad);

    if (!datos || !datos._embedded) {
        mostrarError(grid, `No se encontraron eventos en ${ciudad}.`);
        return;
    }

    const eventos = datos._embedded.events;

    // Guarda los eventos originales para que filters.js pueda filtrarlos
    guardarEventosOriginales(eventos);

    // Renderiza las tarjetas
    grid.innerHTML = eventos.map(crearCardEvento).join('');
}

/* 
    cargarDetalleEvento - Carga y muestra el detalle de un evento
    @param {HTMLElement} contenedor - Contenedor donde insertar el detalle
    @param {string} id - ID del evento
*/
async function cargarDetalleEvento(contenedor, id) {
    // Obtiene los detalles del evento
    const evento = await obtenerEvento(id);

    if (!evento) {
        mostrarError(contenedor, 'No se encontró el evento.');
        return;
    }

    // Renderiza el detalle
    contenedor.innerHTML = crearDetalleEvento(evento);
}