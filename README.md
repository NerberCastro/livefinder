````
# LiveFinder 🎵

> "Encuentra, vive y disfruta"  
> Descubre conciertos y eventos musicales en vivo filtrados por ciudad.

## 📖 Descripción
LiveFinder es una aplicación web que permite buscar conciertos en tiempo real usando la API de Ticketmaster. Diseñada para el público hispanohablante, con foco en España y Latinoamérica.

## 🛠️ Tecnologías
- **Frontend**: HTML5, CSS3, JavaScript ES6+ (Vanilla, sin frameworks)
- **Backend**: PHP + MySQL (caché de eventos)
- **API**: Ticketmaster Discovery API
- **Entorno local**: XAMPP (Apache + PHP + MySQL)

## 📁 Estructura del proyecto
livefinder/
├── index.html # Home: buscador + eventos destacados
├── resultados.html # Listado de conciertos filtrados
├── evento.html # Detalle de un evento
├── ciudades.html # Exploración por ciudades
├── sobre.html # Sobre LiveFinder
│
├── assets/
│ ├── css/
│ │ ├── base.css # Reset, variables, estilos globales
│ │ └── pages.css # Estilos específicos por página
│ ├── js/
│ │ ├── config.js # Constantes y configuración
│ │ ├── api.js # Comunicación con el proxy PHP
│ │ ├── ui.js # Renderizado de la interfaz
│ │ ├── search.js # Buscador y autocompletado
│ │ ├── filters.js # Filtros de fecha y género
│ │ └── pages.js # Inicialización por página
│ ├── images/ # Hero, ciudades, logo, placeholders
│ └── icons/ # Iconos SVG
│
└── php/
├── config.php # Clave API (NO incluido en Git)
└── proxy.php # Único endpoint hacia Ticketmaster

## 🚀 Instalación local

### Opción 1: Si ya tienes los archivos (recomendado)
1. Asegúrate de que tu proyecto está en:
C:\xampp\htdocs\livefinder

2. **Crear archivo de configuración** `php/config.php`:
```php
<?php
define('TM_API_KEY', 'tu_api_key_aqui');
define('DB_HOST', 'localhost');
define('DB_NAME', 'livefinder');
define('DB_USER', 'root');
define('DB_PASS', '');
````

3. Iniciar Apache y MySQL desde el panel de XAMPP

4. Abrir en el navegador:
   [http://localhost/livefinder](http://localhost/livefinder)

### Opción 2: Clonar desde GitHub (para otros usuarios)

```bash
cd C:\xampp\htdocs
git clone https://github.com/NerberCastro/livefinder.git
cd livefinder
# Luego seguir pasos 2-4 de la Opción 1
```

## 🌆 Ciudades cubiertas

### 🇪🇸 España

Madrid, Barcelona, Valencia, Sevilla, Bilbao, Zaragoza, Málaga, Murcia, Palma, Granada

### 🌎 Latinoamérica

Ciudad de México, Buenos Aires, Bogotá, Santiago, Lima

## 📊 Estado del proyecto

🚧 En desarrollo activo — Semana 1 de 3

## 📸 Próximamente

* Capturas de pantalla
* Demo en vivo
* Documentación de la API
* Sistema de caché con MySQL

## 🤝 Contribuciones

¿Ideas, sugerencias o bugs? Abre un issue o envía un pull request.

## 📄 Licencia

MIT © NerberCastro

```
```
