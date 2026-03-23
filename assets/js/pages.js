// =============================================================================
// pages.js - Inicialización de cada página
// Este archivo detecta en qué página estamos y ejecuta lo que corresponde.
// Es el punto de entrada: llama a las funciones de los otros archivos JS.
// =============================================================================

// Esperamos a que todo el HTML esté cargado antes de ejecutar nada
document.addEventListener('DOMContentLoaded', function() {

    // Año actual en el footer (en todas las páginas)
    const spanAnio = document.getElementById('pie-anio');
    if (spanAnio) {
        spanAnio.textContent = new Date().getFullYear();
    }

    // Menú hamburguesa (en todas las páginas)
    iniciarMenuMovil();

    // -------------------------------------------------------------------------
    // HOME (index.html)
    // -------------------------------------------------------------------------
    const formHero    = document.getElementById('formulario-busqueda-hero');
    const formCta     = document.getElementById('formulario-busqueda-cta');
    const gridEventos = document.getElementById('cuadricula-eventos-destacados');

    if (formHero) {
        iniciarBuscador(formHero);
        iniciarBuscador(formCta);
        iniciarBotonesRapidos();
        cargarEventosDestacados(gridEventos);
    }

    // -------------------------------------------------------------------------
    // RESULTADOS (resultados.html)
    // -------------------------------------------------------------------------
    const gridResultados = document.getElementById('cuadricula-resultados');

    if (gridResultados) {
        const params = new URLSearchParams(window.location.search);
        const ciudad = params.get('city');

        if (ciudad) {
            // Hay ciudad en la URL — cargamos sus eventos
            const tituloCiudad = document.getElementById('ciudad-resultados');
            if (tituloCiudad) tituloCiudad.textContent = ciudad;

            cargarResultados(gridResultados, ciudad);
        } else {
            // No hay ciudad — ocultamos los filtros y mostramos mensaje de búsqueda
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

        const formResultados = document.getElementById('formulario-busqueda-resultados');
        if (formResultados) iniciarBuscador(formResultados);

        iniciarFiltros(gridResultados);
    }

    // -------------------------------------------------------------------------
    // DETALLE DE EVENTO (evento.html)
    // -------------------------------------------------------------------------
    const contenedorEvento = document.getElementById('detalle-evento');

    if (contenedorEvento) {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (id) {
            cargarDetalleEvento(contenedorEvento, id);
        } else {
            mostrarError(contenedorEvento, 'No se encontró el evento.');
        }
    }

    // -------------------------------------------------------------------------
    // CIUDADES (ciudades.html)
    // FIX: movido aquí dentro del DOMContentLoaded para que el HTML ya exista
    // -------------------------------------------------------------------------
    const gridCiudades = document.getElementById('cuadricula-ciudades');

    if (gridCiudades) {
        const botonesFiltro = document.querySelectorAll('.cities-filter__btn');

        botonesFiltro.forEach(function(boton) {
            boton.addEventListener('click', function() {

                // Quitamos "active" de todos y se lo ponemos al pulsado
                botonesFiltro.forEach(function(b) { b.classList.remove('active'); });
                boton.classList.add('active');

                const region = boton.getAttribute('data-region');
                const cards  = gridCiudades.querySelectorAll('.tarjeta-ciudad');

                cards.forEach(function(card) {
                    // Si region está vacío ("Todas"), mostramos todo
                    if (!region || card.getAttribute('data-region') === region) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        });
    }

});

// =============================================================================
// Funciones de carga de datos
// =============================================================================

// Carga 6 eventos de Madrid en la home
async function cargarEventosDestacados(grid) {
    const datos = await buscarEventos('Madrid');

    if (!datos || !datos._embedded) {
        mostrarError(grid, 'No se pudieron cargar los eventos.');
        return;
    }

    const eventos = datos._embedded.events.slice(0, 6);
    grid.innerHTML = eventos.map(crearCardEvento).join('');
}

// Carga eventos de la ciudad de la URL
// FIX: ahora llama a guardarEventosOriginales() para que los filtros funcionen
async function cargarResultados(grid, ciudad) {
    const datos = await buscarEventos(ciudad);

    if (!datos || !datos._embedded) {
        mostrarError(grid, `No se encontraron eventos en ${ciudad}.`);
        return;
    }

    const eventos = datos._embedded.events;

    // Guardamos los eventos originales para que filters.js pueda filtrarlos
    guardarEventosOriginales(eventos);

    grid.innerHTML = eventos.map(crearCardEvento).join('');
}

// Carga el detalle de un evento concreto
async function cargarDetalleEvento(contenedor, id) {
    const evento = await obtenerEvento(id);

    if (!evento) {
        mostrarError(contenedor, 'No se encontró el evento.');
        return;
    }

    contenedor.innerHTML = crearDetalleEvento(evento);
}