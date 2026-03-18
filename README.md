LiveFinder 🎵

"Encuentra, vive y disfruta"
Descubre conciertos y eventos musicales en vivo filtrados por ciudad.

Descripción
LiveFinder es una aplicación web que permite buscar conciertos en tiempo real usando la API de Ticketmaster. Diseñada para el público hispanohablante, con foco en España y Latinoamérica.
Tecnologías

Frontend: HTML5, CSS3, JavaScript ES6+ (Vanilla, sin frameworks)
Backend: PHP + MySQL (caché de eventos)
API: Ticketmaster Discovery API
Entorno local: XAMPP (Apache + PHP + MySQL)

Estructura del proyecto
livefinder/
├── index.html          → Home: buscador + eventos destacados
├── resultados.html     → Listado de conciertos filtrados
├── evento.html         → Detalle de un evento
├── ciudades.html       → Exploración por ciudades
├── sobre.html          → Sobre LiveFinder
├── assets/
│   ├── css/
│   │   ├── base.css    → Reset, variables, estilos globales
│   │   └── pages.css   → Estilos específicos por página
│   ├── js/
│   │   ├── config.js   → Constantes y configuración
│   │   ├── api.js      → Comunicación con el proxy PHP
│   │   ├── ui.js       → Renderizado de la interfaz
│   │   ├── search.js   → Buscador y autocompletado
│   │   ├── filters.js  → Filtros de fecha y género
│   │   └── pages.js    → Inicialización por página
│   ├── images/         → Hero, ciudades, logo, placeholders
│   └── icons/          → Iconos SVG
└── php/
    ├── config.php      → API Key (NO incluido en Git)
    └── proxy.php       → Único endpoint hacia Ticketmaster
Instalación local

Clonar el repositorio dentro de htdocs de XAMPP
Crear php/config.php con tu API Key (ver ejemplo abajo)
Importar php/sql/schema.sql en MySQL
Iniciar Apache y MySQL desde el panel de XAMPP
Abrir http://localhost/livefinder

php/config.php (no incluido en Git)
php<?php
define('TM_API_KEY', 'tu_api_key_aqui');
define('DB_HOST', 'localhost');
define('DB_NAME', 'livefinder');
define('DB_USER', 'root');
define('DB_PASS', '');
Ciudades cubiertas (lanzamiento)
España: Madrid, Barcelona, Valencia, Sevilla, Bilbao, Zaragoza, Málaga, Murcia, Palma, Granada
Latinoamérica: Ciudad de México, Buenos Aires, Bogotá, Santiago, Lima
Estado del proyecto
🚧 En desarrollo activo — Semana 1 de 3