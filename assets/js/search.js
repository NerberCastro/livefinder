// =============================================================================
// search.js - Lógica del buscador
// =============================================================================
/* 
    Este archivo gestiona todo lo relacionado con la búsqueda de ciudades:
    - Formularios de búsqueda (hero, CTA, resultados)
    - Botones de búsqueda rápida
    - Menú hamburguesa para móvil
*/

// -----------------------------------------------------------------------------
// INICIAR BUSCADOR
// -----------------------------------------------------------------------------
/* 
    Configura un formulario de búsqueda.
    Cuando el usuario envía el formulario, captura la ciudad y redirige a resultados.
    
    @param {HTMLFormElement} formulario - El elemento <form> del buscador
*/
function iniciarBuscador(formulario) {
    formulario.addEventListener('submit', function(e) {
        // Evita que la página se recargue (comportamiento por defecto del form)
        e.preventDefault();

        // Obtiene el valor del campo de texto y elimina espacios al inicio/final
        const ciudadRaw = formulario.querySelector('input[name="city"]').value.trim();

        // No busca si hay menos de 2 letras (evita búsquedas vacías)
        if (ciudadRaw.length < 2) return;

        // Capitaliza la primera letra de cada palabra
        // Ejemplo: "madrid" → "Madrid", "buenos aires" → "Buenos Aires"
        const ciudad = ciudadRaw.replace(/\b\w/g, function(c) { 
            return c.toUpperCase(); 
        });

        // Redirige a la página de resultados con la ciudad en la URL
        // encodeURIComponent asegura que caracteres especiales sean válidos
        window.location.href = `resultados.html?city=${encodeURIComponent(ciudad)}`;
    });
}

// -----------------------------------------------------------------------------
// INICIAR BOTONES RÁPIDOS
// -----------------------------------------------------------------------------
/* 
    Configura los botones de búsqueda rápida (Madrid, Barcelona, etc.).
    Cada botón tiene un atributo data-city con el nombre de la ciudad.
    Al hacer clic, redirige directamente a los resultados de esa ciudad.
*/
function iniciarBotonesRapidos() {
    // Selecciona todos los elementos que tienen el atributo data-city
    const botones = document.querySelectorAll('[data-city]');

    botones.forEach(function(boton) {
        boton.addEventListener('click', function() {
            // Obtiene la ciudad del atributo data-city
            const ciudad = boton.getAttribute('data-city');
            
            // Redirige a resultados con esa ciudad
            window.location.href = `resultados.html?city=${encodeURIComponent(ciudad)}`;
        });
    });
}

// -----------------------------------------------------------------------------
// MENÚ HAMBURGUESA PARA MÓVIL
// -----------------------------------------------------------------------------
/* 
    Configura el menú desplegable para dispositivos móviles.
    Al hacer clic en el botón ☰, añade/remueve una clase CSS que muestra u oculta el menú.
*/
function iniciarMenuMovil() {
    const boton = document.getElementById('nav-boton');
    const menu  = document.getElementById('nav-menu');

    // Si los elementos no existen en esta página, salimos sin hacer nada
    if (!boton || !menu) return;

    boton.addEventListener('click', function() {
        // toggle: añade la clase si no está, la quita si ya está
        menu.classList.toggle('nav__lista--abierta');
    });
}