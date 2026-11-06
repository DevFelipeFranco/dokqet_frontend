# 📏 Reglas de Formato y Estructura de Historias de Usuario Frontend

Este documento establece las directivas obligatorias de formato para cualquier historia de usuario creada para `dokqet-frontend`.

---

## 1. Convención Estricta de Ubicación y Nombres de Archivo
- **Ubicación Exclusiva:** Todo archivo de historia de usuario DEBE ubicarse **estrictamente en `docs/stories/`**.
- **Creación Obligatoria del Directorio:** Si el directorio `docs/stories/` no existe al momento de redactar una historia, el agente o desarrollador **DEBE crearlo automáticamente** antes de guardar el archivo.
- **Prohibición de Ubicación:** Queda terminantemente prohibido almacenar historias de usuario directamente en la raíz de `docs/` o fuera del directorio `docs/stories/`.
- **Numeración Obligatoria en el Nombre:** Todo archivo DEBE incluir obligatoriamente el código de historia con prefijo `HU-` seguido del número (2 o 3 dígitos) y un slug en `kebab-case`.
- **Formato Estricto:** `HU-{NN}-{descripcion-corta-slug}.md`
- **Ejemplo correcto:** `docs/stories/HU-17-regulacion-intentos-fallidos-bloqueo-cuenta.md`, `docs/stories/HU-16-skeleton-loaders-experiencia-usuario.md`, `docs/stories/HU-14-rediseno-ux-prodex-dokqet.md`.
- **Ejemplo incorrecto:** `docs/historia-login.md` (falta subcarpeta y número), `historia-usuario-panel.md` (falta prefijo `HU-XX`), `HU-1.md` (debe tener al menos 2 dígitos y descripción en kebab-case).

---

## 2. Estructura Obligatoria de Secciones

Toda historia debe contener las siguientes 7 secciones numeradas:

### Sección 1: Información General
Tabla de metadatos con:
- **Identificador:** Código único `HU-XX` (ej. `HU-17`).
- **Código Equivalente Backend:** Relación con el microservicio (`US-016`, `HU-16-AUTH` o `N/A - Exclusivo Frontend`).
- **Título:** Frase declarativa y concisa sobre la funcionalidad o experiencia de usuario.
- **Módulo / Rutas Angular:** Rutas impactadas (`/panel`, `/procesos/:id`, `/iniciar-sesion`) y paquetes (`features/auth`, `features/processes`, `shared/components/ui`).
- **Estado:** `📝 Lista para Desarrollo`, `⚙️ En Progreso`, `✅ Completada`, `🔒 Bloqueada`.
- **Prioridad:** `Alta (Core)`, `Media`, `Baja`.
- **Actores de UI:** Rol que interactúa con la vista (ej. `Abogado Litigante`, `Administrador de Despacho`, `SuperAdmin`, `Visitante Anónimo`).

### Sección 2: Narrativa de Negocio y Experiencia de Usuario
Formato estándar:
```markdown
**Como** [rol del usuario en la interfaz],  
**Quiero** [acción concreta que desea ejecutar en la pantalla o flujo],  
**Para** [beneficio operativo, de seguridad o de experiencia de usuario (UX) en la vigilancia judicial].
```

### Sección 3: Modelos de Datos en Cliente y Contratos API (TypeScript)
- **Validación Obligatoria de Preexistencia:** Antes de redactar esta sección, el agente DEBE inspeccionar `src/app/core/models/` y los servicios que consumen endpoints REST.
- **Etiquetado Explícito:** Cada interfaz o tipo TypeScript debe llevar junto a su nombre una etiqueta obligatoria:
  - `[EXISTENTE - REUTILIZADO]`: La interfaz ya existe en el proyecto. Se deben usar exactamente los mismos nombres de atributos y tipos.
  - `[MODIFICADA]`: La interfaz existe, pero requiere agregar nuevas propiedades opcionales o tipos unión.
  - `[NUEVA - POR CREAR]`: No existe en el código y requiere nuevo archivo o export en `src/app/core/models/`.
- Desglose de tipos estrictos, payloads de petición, respuestas JSON exitosas y estructuras de error RFC 9457 (`ProblemDetail`).

### Sección 4: Reglas de Negocio en Frontend (RN-FE)
- Lista enumerada `RN-FE-01`, `RN-FE-02`, etc.
- Definición de:
  - Reglas de validación reactiva de formularios (`Validators.required`, expresiones regulares para Radicado de 23 dígitos, algoritmo Módulo 11 de la DIAN).
  - Comportamiento de estados de vista: Carga contextual con Skeleton loaders (prohibición de spinners bloqueantes centrales), Empty states, Error alerts y Banners.
  - Accesibilidad (WCAG 2.1 AA): Atributos `aria-*`, soporte para teclado (`Enter`, `Tab`, `Escape`, detección de `CapsLock`).
  - Web Vitals: Estabilidad visual (*Cumulative Layout Shift* CLS < 0.1).

### Sección 5: Criterios de Aceptación (Gherkin UI / BDD)
- Bloque de código con syntax highlighting `gherkin`.
- Declaración de idioma (`# language: es` o `# language: en`).
- Mínimo 4 escenarios cubriendo:
  1. Camino feliz de usuario (*Happy path* con renderizado y navegación exitosa).
  2. Validación de formularios y retroalimentación reactiva en tiempo real.
  3. Manejo de errores de servidor (códigos HTTP 400 Bad Request, 401 Unauthorized, 403 Forbidden, 423 Locked o 500 Server Error).
  4. Experiencia de carga asíncrona (Skeleton loader activo sin saltos de maquetación).

### Sección 6: Mapeo a la Arquitectura Angular (Clasificación de Componentes)
- **Auditoría de Componentes y Servicios:** El agente DEBE verificar qué componentes standalone, pipes, directivas, guards y servicios ya están implementados.
- Cada archivo listado DEBE clasificarse obligatoriamente con su etiqueta:
  - `[EXISTENTE - REUTILIZADO]`: No requiere crear archivo nuevo; se inyecta o consume tal como está.
  - `[MODIFICADO / POR EXTENDER]`: Archivo existente donde se agregará un signal, método, plantilla o estilo (detallar el cambio específico).
  - `[NUEVO / POR CREAR]`: Componente, servicio o validador nuevo que debe crearse respetando las carpetas del proyecto (`features/`, `core/`, `shared/components/ui/`).

### Sección 7: Guía y Ejemplos Prácticos de Prueba (Testing Guide)
- Especificación de pruebas unitarias de componentes con `TestBed`, signals y fixtures.
- Mock de llamadas HTTP mediante `HttpTestingController` o servicios simulados (`provideHttpClientTesting`).
- Comandos ejecutables de testing: `npx ng test --include="...*.spec.ts" --no-watch --browsers=ChromeHeadless`.
- Lista de verificación para pruebas manuales en el navegador local (`http://localhost:4200`).
