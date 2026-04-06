// =============================================================================
// ui.js - Funciones para pintar cosas en la pantalla
// =============================================================================
/* 
    Este archivo contiene todas las funciones que generan HTML dinámicamente.
    Convierte los datos de Ticketmaster en elementos visibles para el usuario.
    
    FUNCIONES:
    - crearCardEvento: Genera una tarjeta resumen de evento
    - mostrarError: Muestra mensajes de error amigables
    - formatearFecha: Convierte fechas a formato legible en español
    - crearDetalleEvento: Genera la vista completa de un evento
    
    // NUEVAS FUNCIONES PARA AGRUPAR POR DÍA
    - agruparEventosPorDia: Agrupa eventos que ocurren la misma fecha
    - crearCardEventoAgrupado: Genera tarjeta con múltiples horarios
    - renderizarEventosAgrupados: Renderiza el grid con eventos agrupados
*/

// -----------------------------------------------------------------------------
// CREAR CARD DE EVENTO (VERSIÓN ORIGINAL - SE MANTIENE POR COMPATIBILIDAD)
// -----------------------------------------------------------------------------
/* 
    Genera el HTML de una tarjeta resumen para usar en cuadrículas.
    @param {Object} evento - Datos del evento desde Ticketmaster
    @returns {string} - HTML de la tarjeta
*/
function crearCardEvento(evento) {
    // =============================================================
    // EXTRAER DATOS CON VALORES POR DEFECTO
    // =============================================================
    // Usamos optional chaining (?.) para evitar errores si faltan datos
    // El operador || asigna un valor por defecto si el dato no existe
    
    const nombre    = evento.name || 'Evento sin nombre';                    // Título del evento
    const fecha     = evento.dates?.start?.localDate || 'Fecha por confirmar'; // Fecha YYYY-MM-DD
    const ciudad    = evento._embedded?.venues?.[0]?.city?.name || 'Ciudad desconocida'; // Ciudad
    const recinto   = evento._embedded?.venues?.[0]?.name || '';            // Nombre del lugar
    const imagen    = evento.images?.[0]?.url || 'assets/images/placeholders/evento.jpg'; // Imagen
    const url       = evento.url || '#';                                    // Enlace original

    // Convierte "2025-06-15" a "15 jun 2025"
    const fechaFormateada = formatearFecha(fecha);

    // =============================================================
    // GENERAR HTML
    // =============================================================
    return `
        <article class="card">
            <img src="${imagen}" alt="${nombre}" class="tarjeta__imagen" loading="lazy">
            <div class="tarjeta__cuerpo">
                <p class="tarjeta__fecha">${fechaFormateada}</p>
                <h3 class="tarjeta__titulo">${nombre}</h3>
                <p class="tarjeta__recinto">${recinto}</p>
            </div>
            <div class="tarjeta__pie">
                <span class="tarjeta__ciudad">${ciudad}</span>
                <a href="evento.html?id=${evento.id}" class="boton boton--primario boton--pequeno">Ver más</a>
            </div>
        </article>
    `;
}

// -----------------------------------------------------------------------------
// NUEVAS FUNCIONES PARA AGRUPAR EVENTOS POR DÍA
// -----------------------------------------------------------------------------

/* 
    agruparEventosPorDia - Agrupa eventos que ocurren la misma fecha
    @param {Array} eventos - Lista de eventos de Ticketmaster
    @returns {Array} - Eventos agrupados por día
*/
function agruparEventosPorDia(eventos) {
    const agrupados = new Map();
    
    eventos.forEach(evento => {
        const fecha = evento.dates?.start?.localDate;
        if (!fecha) return;
        
        if (!agrupados.has(fecha)) {
            // Primera vez que vemos esta fecha
            agrupados.set(fecha, {
                fecha: fecha,
                id: evento.id,
                nombre: evento.name,
                recinto: evento._embedded?.venues?.[0]?.name || 'Lugar por confirmar',
                ciudad: evento._embedded?.venues?.[0]?.city?.name || 'Ciudad desconocida',
                imagen: evento.images?.[0]?.url || 'assets/images/placeholders/evento.jpg',
                url: evento.url || '#',
                horarios: [],
                todosLosEventos: []  // Guardamos los eventos originales por si hacen falta
            });
        }
        
        // Agregar el horario específico
        const hora = evento.dates?.start?.localTime?.slice(0, 5) || 'Horario por confirmar';
        agrupados.get(fecha).horarios.push(hora);
        agrupados.get(fecha).todosLosEventos.push(evento);
    });
    
    // Convertir el Map a Array y formatear horarios
    return Array.from(agrupados.values()).map(evento => ({
        ...evento,
        horariosTexto: evento.horarios.length > 1 
            ? `${evento.horarios.length} horarios disponibles`
            : evento.horarios[0],
        tieneMultiplesHorarios: evento.horarios.length > 1
    }));
}

/* 
    crearCardEventoAgrupado - Genera una tarjeta de evento agrupada por día
    @param {Object} evento - Evento agrupado (con horarios múltiples)
    @returns {string} - HTML de la tarjeta agrupada
*/
function crearCardEventoAgrupado(evento) {
    const fechaFormateada = formatearFecha(evento.fecha);
    
    // Generar lista de horarios para el desplegable
    const horariosLista = evento.horarios.map(h => `<li>⏰ ${h}</li>`).join('');
    
    return `
        <article class="card card--agrupado">
            <img src="${evento.imagen}" alt="${evento.nombre}" class="tarjeta__imagen" loading="lazy">
            <div class="tarjeta__cuerpo">
                <p class="tarjeta__fecha">${fechaFormateada}</p>
                <h3 class="tarjeta__titulo">${evento.nombre}</h3>
                <p class="tarjeta__recinto">${evento.recinto}</p>
                
                <!-- Horario(s) del evento -->
                <div class="tarjeta__horarios">
                    <span class="horario-icono">🕐</span>
                    <span class="horario-texto">${evento.horariosTexto}</span>
                </div>
                
                <!-- Desplegable con todos los horarios si hay múltiples -->
                ${evento.tieneMultiplesHorarios ? `
                    <details class="tarjeta__detalles">
                        <summary>Ver todos los horarios (${evento.horarios.length})</summary>
                        <ul class="horarios-lista">
                            ${horariosLista}
                        </ul>
                    </details>
                ` : ''}
            </div>
            <div class="tarjeta__pie">
                <span class="tarjeta__ciudad">${evento.ciudad}</span>
                <a href="evento.html?id=${evento.id}" class="boton boton--primario boton--pequeno">Ver más</a>
            </div>
        </article>
    `;
}

/* 
    renderizarEventosAgrupados - Renderiza eventos agrupados en un contenedor
    @param {HTMLElement} contenedor - Elemento DOM donde insertar
    @param {Array} eventos - Lista de eventos de Ticketmaster
*/
function renderizarEventosAgrupados(contenedor, eventos) {
    if (!eventos || eventos.length === 0) {
        if (typeof mostrarError === 'function') {
            mostrarError(contenedor, 'No hay eventos en esta ciudad');
        } else {
            contenedor.innerHTML = `
                <div class="estado-vacio">
                    <p class="estado-vacio__icono">🎵</p>
                    <p class="estado-vacio__titulo">No hay eventos</p>
                    <p class="estado-vacio__texto">No encontramos conciertos en esta ciudad</p>
                </div>
            `;
        }
        return;
    }
    
    const eventosAgrupados = agruparEventosPorDia(eventos);
    contenedor.innerHTML = eventosAgrupados.map(crearCardEventoAgrupado).join('');
}

// -----------------------------------------------------------------------------
// MOSTRAR ERROR
// -----------------------------------------------------------------------------
/* 
    Muestra un mensaje de error amigable dentro de un contenedor.
    @param {HTMLElement} contenedor - Elemento DOM donde insertar el error
    @param {string} mensaje - Texto del error
*/
function mostrarError(contenedor, mensaje) {
    contenedor.innerHTML = `
        <div class="estado-vacio">
            <p class="estado-vacio__icono">😕</p>
            <p class="estado-vacio__titulo">${mensaje}</p>
            <p class="estado-vacio__texto">Intenta con otra ciudad o vuelve más tarde.</p>
        </div>
    `;
}

// -----------------------------------------------------------------------------
// FORMATEAR FECHA
// -----------------------------------------------------------------------------
/* 
    Convierte fecha de formato ISO (YYYY-MM-DD) a formato legible en español.
    Ejemplo: "2025-06-15" → "15 jun 2025"
    
    @param {string} fecha - Fecha en formato YYYY-MM-DD
    @returns {string} - Fecha formateada en español
*/
function formatearFecha(fecha) {
    // Si la fecha no es válida o ya es texto, la devolvemos tal cual
    if (!fecha || fecha === 'Fecha por confirmar') return fecha;

    // Añade T00:00:00 para evitar problemas con zona horaria
    const date = new Date(fecha + 'T00:00:00');
    
    // Formato: día, mes abreviado, año (ej: "15 jun 2025")
    return date.toLocaleDateString('es-ES', {
        day:   'numeric',   // Número del día (1-31)
        month: 'short',     // Nombre del mes abreviado (ene, feb, mar...)
        year:  'numeric'    // Año completo (2025)
    });
}

// -----------------------------------------------------------------------------
// CREAR DETALLE DE EVENTO
// -----------------------------------------------------------------------------
/* 
    Genera la vista completa de un evento para la página evento.html.
    @param {Object} evento - Datos completos del evento desde Ticketmaster
    @returns {string} - HTML del detalle
*/
function crearDetalleEvento(evento) {
    // =============================================================
    // EXTRAER DATOS CON VALORES POR DEFECTO
    // =============================================================
    const nombre   = evento.name || 'Evento sin nombre';                    // Título
    const fecha    = evento.dates?.start?.localDate || 'Fecha por confirmar'; // Fecha
    const hora     = evento.dates?.start?.localTime?.slice(0, 5) || '';    // Hora (HH:MM)
    const imagen   = evento.images?.[0]?.url || 'assets/images/placeholders/evento.jpg'; // Imagen
    const recinto  = evento._embedded?.venues?.[0]?.name || 'Recinto por confirmar'; // Lugar
    const ciudad   = evento._embedded?.venues?.[0]?.city?.name || '';      // Ciudad
    const pais     = evento._embedded?.venues?.[0]?.country?.name || '';    // País
    const urlVenta = evento.url || '#';                                    // Enlace de compra
    const info     = evento.info || evento.pleaseNote || '';               // Descripción

    const fechaFormateada = formatearFecha(fecha);

    // =============================================================
    // GENERAR HTML DEL DETALLE
    // =============================================================
    return `
        <div class="detalle-evento">

            <!-- Imagen principal del evento -->
            <img src="${imagen}" alt="${nombre}" class="detalle-evento__imagen">

            <!-- Título del evento -->
            <h1 class="detalle-evento__titulo">${nombre}</h1>

            <!-- Información estructurada del evento -->
            <div class="detalle-evento__info">
                <p><strong>Fecha:</strong> ${fechaFormateada} ${hora ? 'a las ' + hora : ''}</p>
                <p><strong>Recinto:</strong> ${recinto}</p>
                <p><strong>Ciudad:</strong> ${ciudad}${pais ? ', ' + pais : ''}</p>
            </div>

            <!-- Descripción adicional (si existe) -->
            ${info ? `<p class="detalle-evento__descripcion">${info}</p>` : ''}

            <!-- Botón para comprar entradas (abre en nueva pestaña) -->
            <a href="${urlVenta}" target="_blank" class="boton boton--primario boton--grande">
                Comprar entradas
            </a>

        </div>
    `;
}