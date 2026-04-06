// =============================================================================
// filters.js - Filtros de fecha para eventos
// =============================================================================

let eventosOriginales = [];  // Guarda los eventos sin filtrar

/* 
    guardarEventosOriginales - Guarda la lista original de eventos
    @param {Array} eventos - Lista de eventos desde la API
*/
function guardarEventosOriginales(eventos) {
    eventosOriginales = eventos;
}

/* 
    iniciarFiltros - Configura los botones de filtro de fecha
    @param {HTMLElement} grid - Contenedor donde mostrar los eventos
*/
function iniciarFiltros(grid) {
    const filtro7dias = document.getElementById('filtro-7dias');
    const filtroMes = document.getElementById('filtro-mes');
    const filtro3meses = document.getElementById('filtro-3meses');
    const filtroCualquier = document.getElementById('filtro-cualquier');
    
    if (!filtro7dias || !filtroMes || !filtro3meses || !filtroCualquier) {
        console.warn('No se encontraron los botones de filtro');
        return;
    }
    
    // Limpiar eventos anteriores del grid
    if (grid) grid.innerHTML = '';
    
    // Configurar eventos de los botones
    filtro7dias.addEventListener('click', function() {
        if (!grid) return;
        aplicarFiltroFecha(grid, 7);
        actualizarBotonActivo(filtro7dias, filtroMes, filtro3meses, filtroCualquier);
    });
    
    filtroMes.addEventListener('click', function() {
        if (!grid) return;
        aplicarFiltroFecha(grid, 30);
        actualizarBotonActivo(filtroMes, filtro7dias, filtro3meses, filtroCualquier);
    });
    
    filtro3meses.addEventListener('click', function() {
        if (!grid) return;
        aplicarFiltroFecha(grid, 90);
        actualizarBotonActivo(filtro3meses, filtro7dias, filtroMes, filtroCualquier);
    });
    
    filtroCualquier.addEventListener('click', function() {
        if (!grid) return;
        mostrarTodosEventos(grid);
        actualizarBotonActivo(filtroCualquier, filtro7dias, filtroMes, filtro3meses);
    });
}

/* 
    aplicarFiltroFecha - Filtra eventos por días en el futuro
    @param {HTMLElement} grid - Contenedor donde mostrar los eventos
    @param {number} dias - Número de días hacia el futuro
*/
function aplicarFiltroFecha(grid, dias) {
    if (!eventosOriginales || eventosOriginales.length === 0) {
        if (grid) grid.innerHTML = '<p>No hay eventos para filtrar</p>';
        return;
    }
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(hoy.getDate() + dias);
    
    // Filtrar eventos por fecha
    const eventosFiltrados = eventosOriginales.filter(evento => {
        const fechaEvento = evento.dates?.start?.localDate;
        if (!fechaEvento) return false;
        
        const fecha = new Date(fechaEvento);
        fecha.setHours(0, 0, 0, 0);
        
        return fecha >= hoy && fecha <= fechaLimite;
    });
    
    // Ordenar por fecha (más cercano primero)
    eventosFiltrados.sort((a, b) => {
        const fechaA = new Date(a.dates?.start?.localDate);
        const fechaB = new Date(b.dates?.start?.localDate);
        return fechaA - fechaB;
    });
    
    // Renderizar usando la función agrupada
    if (typeof renderizarEventosAgrupados === 'function') {
        renderizarEventosAgrupados(grid, eventosFiltrados);
    } else if (typeof crearCardEvento === 'function') {
        grid.innerHTML = eventosFiltrados.map(crearCardEvento).join('');
    } else {
        grid.innerHTML = '<p>Error: No se pueden renderizar los eventos</p>';
    }
    
    // Mostrar mensaje si no hay eventos
    if (eventosFiltrados.length === 0) {
        grid.innerHTML = `
            <div class="estado-vacio" style="grid-column: 1 / -1;">
                <p class="estado-vacio__icono">📅</p>
                <p class="estado-vacio__titulo">No hay eventos en este período</p>
                <p class="estado-vacio__texto">Prueba con otro filtro o busca otra ciudad</p>
            </div>
        `;
    }
}

/* 
    mostrarTodosEventos - Muestra todos los eventos sin filtrar
    @param {HTMLElement} grid - Contenedor donde mostrar los eventos
*/
function mostrarTodosEventos(grid) {
    if (!eventosOriginales || eventosOriginales.length === 0) {
        if (grid) grid.innerHTML = '<p>No hay eventos para mostrar</p>';
        return;
    }
    
    // Ordenar por fecha (más cercano primero)
    const eventosOrdenados = [...eventosOriginales].sort((a, b) => {
        const fechaA = new Date(a.dates?.start?.localDate);
        const fechaB = new Date(b.dates?.start?.localDate);
        return fechaA - fechaB;
    });
    
    // Renderizar usando la función agrupada
    if (typeof renderizarEventosAgrupados === 'function') {
        renderizarEventosAgrupados(grid, eventosOrdenados);
    } else if (typeof crearCardEvento === 'function') {
        grid.innerHTML = eventosOrdenados.map(crearCardEvento).join('');
    } else {
        grid.innerHTML = '<p>Error: No se pueden renderizar los eventos</p>';
    }
}

/* 
    actualizarBotonActivo - Cambia la clase active del botón seleccionado
*/
function actualizarBotonActivo(activo, ...otros) {
    activo.classList.add('active');
    otros.forEach(boton => {
        if (boton) boton.classList.remove('active');
    });
}