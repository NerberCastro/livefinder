/// =============================================================================
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
        if (formHero) iniciarBuscador(formHero);
        if (formCta) iniciarBuscador(formCta);
        
        // Configura los botones de búsqueda rápida (Madrid, Barcelona, etc.)
        iniciarBotonesRapidos();
        
        // Carga los eventos destacados (Madrid) - VERSIÓN AGRUPADA
        if (gridEventos) cargarEventosDestacados(gridEventos);
    }

    // =========================================================================
    // PÁGINA DE RESULTADOS (resultados.html)
    // =========================================================================
    const gridResultados = document.getElementById('cuadricula-resultados');

    if (gridResultados) {
        // Obtiene la ciudad de la URL (?city=Madrid)
        const paramsUrl = new URLSearchParams(window.location.search);
        const ciudad = paramsUrl.get('city');

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

        // Configura los filtros (género y fecha) - solo si existe la función
        if (typeof iniciarFiltros === 'function') {
            iniciarFiltros(gridResultados);
        }
    }

    // =========================================================================
    // PÁGINA DE DETALLE (evento.html)
    // =========================================================================
    const contenedorEvento = document.getElementById('detalle-evento');

    if (contenedorEvento) {
        // Obtiene el ID del evento de la URL (?id=xxxx)
        const paramsDetalle = new URLSearchParams(window.location.search);
        const id = paramsDetalle.get('id');

        if (id) {
            cargarDetalleEvento(contenedorEvento, id);
        } else {
            if (typeof mostrarError === 'function') {
                mostrarError(contenedorEvento, 'No se encontró el evento.');
            } else {
                contenedorEvento.innerHTML = '<p>Error: No se encontró el evento.</p>';
            }
        }
    }

    // =========================================================================
    // PÁGINA DE CIUDADES (ciudades.html)
    // =========================================================================
    const gridCiudades = document.getElementById('cuadricula-ciudades');

    if (gridCiudades) {
        // Configura los botones de filtro por región
        const botonesFiltro = document.querySelectorAll('.cities-filter__btn');

        if (botonesFiltro.length > 0) {
            botonesFiltro.forEach(function(boton) {
                boton.addEventListener('click', function() {
                    // Quita la clase 'active' de todos los botones
                    botonesFiltro.forEach(function(b) { 
                        b.classList.remove('active'); 
                    });
                    // Activa el botón clickeado
                    boton.classList.add('active');

                    // Obtiene la región seleccionada
                    const region = boton.getAttribute('data-region');
                    const cards = gridCiudades.querySelectorAll('.tarjeta-ciudad');

                    // Muestra/oculta las tarjetas según la región
                    cards.forEach(function(card) {
                        if (!region || card.getAttribute('data-region') === region) {
                            card.classList.remove('hidden');
                        } else {
                            card.classList.add('hidden');
                        }
                    });
                });
            });
        }
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
    // Validar que grid existe
    if (!grid) return;
    
    // Busca eventos en Madrid
    const datos = await buscarEventos('Madrid');

    if (!datos || !datos._embedded) {
        if (typeof mostrarError === 'function') {
            mostrarError(grid, 'No se pudieron cargar los eventos.');
        } else {
            grid.innerHTML = '<p>Error al cargar eventos</p>';
        }
        return;
    }

    // Tomamos más eventos para que al agrupar queden varios días distintos
    const eventos = datos._embedded.events.slice(0, 12);
    
    // =============================================================
    // VERSIÓN AGRUPADA POR DÍA - Renderiza los eventos agrupados
    // =============================================================
    if (typeof renderizarEventosAgrupados === 'function') {
        renderizarEventosAgrupados(grid, eventos);
    } else if (typeof crearCardEvento === 'function') {
        // Fallback: si no existe la función agrupada, usa la original
        grid.innerHTML = eventos.map(crearCardEvento).join('');
    } else {
        grid.innerHTML = '<p>Error: Función de renderizado no disponible</p>';
    }
}

/* 
    cargarResultados - Carga eventos de la ciudad buscada
    @param {HTMLElement} grid - Contenedor donde insertar las tarjetas
    @param {string} ciudad - Nombre de la ciudad a buscar
*/
async function cargarResultados(grid, ciudad) {
    // Validar que grid existe
    if (!grid) return;
    
    // Busca eventos en la ciudad
    const datos = await buscarEventos(ciudad);

    if (!datos || !datos._embedded) {
        if (typeof mostrarError === 'function') {
            mostrarError(grid, `No se encontraron eventos en ${ciudad}.`);
        } else {
            grid.innerHTML = `<p>No se encontraron eventos en ${ciudad}</p>`;
        }
        return;
    }

    const eventos = datos._embedded.events;

    // Guarda los eventos originales para que filters.js pueda filtrarlos
    if (typeof guardarEventosOriginales === 'function') {
        guardarEventosOriginales(eventos);
    }

    // =============================================================
    // VERSIÓN AGRUPADA POR DÍA - Renderiza los eventos agrupados
    // =============================================================
    if (typeof renderizarEventosAgrupados === 'function') {
        renderizarEventosAgrupados(grid, eventos);
    } else if (typeof crearCardEvento === 'function') {
        // Fallback: si no existe la función agrupada, usa la original
        grid.innerHTML = eventos.map(crearCardEvento).join('');
    } else {
        grid.innerHTML = '<p>Error: Función de renderizado no disponible</p>';
    }
}

/* 
    cargarDetalleEvento - Carga y muestra el detalle de un evento
    @param {HTMLElement} contenedor - Contenedor donde insertar el detalle
    @param {string} id - ID del evento
*/
async function cargarDetalleEvento(contenedor, id) {
    // Validar que contenedor existe
    if (!contenedor) return;
    
    // Obtiene los detalles del evento
    const evento = await obtenerEvento(id);

    if (!evento) {
        if (typeof mostrarError === 'function') {
            mostrarError(contenedor, 'No se encontró el evento.');
        } else {
            contenedor.innerHTML = '<p>No se encontró el evento.</p>';
        }
        return;
    }

    // Renderiza el detalle
    if (typeof crearDetalleEvento === 'function') {
        contenedor.innerHTML = crearDetalleEvento(evento);
    } else {
        contenedor.innerHTML = '<p>Error: Función crearDetalleEvento no disponible</p>';
    }
}
