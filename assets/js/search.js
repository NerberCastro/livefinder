    // =============================================================================
    // search.js - Lógica del buscador
    // Gestiona lo que pasa cuando el usuario escribe una ciudad y busca.
    // También controla el menú hamburguesa del móvil.
    // =============================================================================
    
    // -----------------------------------------------------------------------------
    // Manejar el envío de cualquier formulario de búsqueda
    // Recibe: el elemento <form>
    // Cuando el usuario pulsa "Buscar", redirige a resultados.html?city=...
    // -----------------------------------------------------------------------------
    function iniciarBuscador(formulario) {
        formulario.addEventListener('submit', function(e) {
            e.preventDefault(); // Evita que la página se recargue (comportamiento por defecto de los forms)
    
            const ciudadRaw = formulario.querySelector('input[name="city"]').value.trim();
    
            if (ciudadRaw.length < 2) return; // No buscamos si hay menos de 2 letras
    
            // Capitalizamos la primera letra de cada palabra: "madrid" -> "Madrid"
            const ciudad = ciudadRaw.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    
            // Redirigimos a la página de resultados con la ciudad en la URL
            window.location.href = `resultados.html?city=${encodeURIComponent(ciudad)}`;
        });
    }
    
    // -----------------------------------------------------------------------------
    // Manejar los botones de ciudad rápida (Madrid, Barcelona, etc.)
    // Cuando el usuario pulsa uno, lo lleva directo a resultados de esa ciudad
    // -----------------------------------------------------------------------------
    function iniciarBotonesRapidos() {
        const botones = document.querySelectorAll('[data-city]');
    
        botones.forEach(function(boton) {
            boton.addEventListener('click', function() {
                const ciudad = boton.getAttribute('data-city');
                window.location.href = `resultados.html?city=${encodeURIComponent(ciudad)}`;
            });
        });
    }
    
    // -----------------------------------------------------------------------------
    // Menú hamburguesa para móvil
    // Al pulsar el botón ☰, muestra u oculta el menú añadiendo una clase CSS
    // -----------------------------------------------------------------------------
    function iniciarMenuMovil() {
        const boton = document.getElementById('nav-toggle');
        const menu  = document.getElementById('nav-menu');
    
        if (!boton || !menu) return; // Si no existen en esta página, salimos
    
        boton.addEventListener('click', function() {
            // toggle añade la clase si no está, la quita si está
            menu.classList.toggle('nav__list--open');
        });
    }