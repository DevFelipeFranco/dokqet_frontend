# Historia de Usuario HU-14: Rediseño Integral del Shell y Tablero de Vigilancia Judicial (Patrón Ejecutivo Sidebar + Data Grid)

* **ID de Historia:** `HU-14`
* **Título:** Rediseño de Interfaz y Experiencia de Usuario (UX) basado en Arquitectura de Panel Lateral, Barra Contextual y Grilla Interactiva de Alto Rendimiento
* **Estado:** En Implementación / Completada
* **Fecha:** Octubre 2026
* **Módulos Impactados:** `AppComponent (AppShell)`, `OrganizationSwitcherComponent`, `StatCardComponent`, `DashboardComponent`, `ProcessDetailComponent`, `Styles / Tokens Globales`

---

## 1. Narrativa de la Historia de Usuario

> **Como** abogado litigante o administrador de firma jurídica en **Dokqet**,
> **Quiero** contar con una interfaz de trabajo estructurada con menú lateral colapsable, barra superior contextual con búsqueda global (`Ctrl+K`), tarjetas de indicadores con semáforo semántico y una tabla de expedientes con selección múltiple, ordenamiento, exportación y acciones por lote, conservando el logotipo e identidad visual oficial de Dokqet,
> **Para** gestionar altos volúmenes de radicados judiciales con mínima carga cognitiva, acceso inmediato a las novedades procesales de la Rama Judicial y una experiencia de usuario (UX) ágil en escritorio, tableta y móvil.

---

## 2. Análisis del Diseño de Referencia y Mapeo al Dominio Dokqet

El diseño de referencia establece una arquitectura SaaS moderna compuesta por tres zonas jerárquicas claramente diferenciadas:

### 2.1. Conservación de Activos Visuales e Identidad Corporativa
* **Logotipo Oficial Intacto:** Se mantiene sin alteraciones el componente `<app-logo>` y los activos vectoriales `src/assets/logo_dokqet.svg`, `public/logo_dokqet.svg`, `public/favicon.svg` y `public/icon.svg`.
* **Paleta Institucional con Contraste WCAG AA:**
  * **Rojo Dokqet (`--brand: #EC1319`):** Reservado para el isotipo oficial, contadores de notificaciones críticas y acentos de identidad.
  * **Petróleo Corporativo (`--primary: #032A2E`):** Color de autoridad para acciones primarias, estados seleccionados y cabeceras tipográficas.
  * **Superficies Diferenciadas:** Fondo general de aplicación en gris neutro cálido (`#F6F8F9` en modo claro / `#021B1E` en modo oscuro) que permite que el contenedor principal de trabajo (`#FFFFFF` en modo claro / `#032A2E` en modo oscuro) destaque como una hoja elevada de alta legibilidad.

### 2.2. Mapeo Componente por Componente (Referencia vs. Dokqet)

| Componente en Referencia | Equivalente Funcional en Dokqet | Propósito UX (Justificación de 1 línea) |
| :--- | :--- | :--- |
| **Sidebar Izquierdo con botón de colapso** | `AppComponent` Sidebar (`256px` / `72px` colapsado con eje de iconos centrados `size-10`) + Drawer móvil | Aprovecha el ancho horizontal para tablas judiciales densas y mantiene una columna de iconos perfectamente alineados al contraerse. |
| **Selector de Workspace (`Uxerflow`)** | `<app-organization-switcher>` en tarjeta superior del Sidebar | Ubica el contexto multi-tenant (Organización Personal vs. Firma Jurídica) en el primer nivel jerárquico de navegación. |
| **Menú `MAIN` (`Orders`)** | Grupo `PRINCIPAL` con el módulo padre `Expedientes` (`/panel`) y `Radicar vigilancia` (`/procesos/nuevo`) | Evita duplicar en el menú lateral los filtros internos (`Con novedades`, `A mi cargo`, `Sin asignar`) que ya residen dentro de la vista padre de Expedientes. |
| **Menú `SETTINGS`** | Grupo `ADMINISTRACIÓN` (`Organización y Equipo`, `Catálogos Maestros`, `Mi Perfil`) | Separa las tareas operativas diarias de la configuración societaria, tributaria (DIAN) y de catálogos. |
| **Switch `Dark Mode` en pie de Sidebar** | Interruptor `Modo oscuro` (`role="switch"`) en el pie del menú lateral | Ofrece control directo del tema visual sin ocupar espacio en la barra de herramientas superior. |
| **Tarjeta inferior (`Upgrade to Premium`)** | Tarjeta contextual de Firma Jurídica / Estado de Vigilancia 24/7 | Guía al abogado individual a crear su firma colaborativa o confirma el estado activo del motor de sincronización judicial. |
| **Topbar con título, avatares, campana y buscador `⌘K`** | Barra superior con título de ruta, avatares de la firma, alerta de novedades y buscador global `Ctrl+K` | Centraliza la conciencia situacional del equipo y permite buscar cualquier radicado o sujeto procesal al instante. |
| **4 Tarjetas KPI con punto de color semántico** | `<app-stat-card>` con indicador puntual (`●`) y cifra tabular grande | Reduce el ruido visual eliminando cajas de iconos pesadas para priorizar la lectura rápida de métricas clave. |
| **Pestañas limpias con línea inferior (`All`, `Incomplete`...)** | Pestañas de filtro con subrayado activo (`Todos`, `Con novedades`, `A mi cargo`, `Sin asignar`) | Distingue claramente la navegación de filtros internos frente a los botones de acción de la cabecera. |
| **Tabla con checkboxes, ordenamiento y estados suaves** | Tabla de expedientes con selección por fila, ordenamiento por columna (`aria-sort`) y badges semánticos | Permite auditar decenas de radicados, ordenar por fecha de última actuación e identificar novedades de un vistazo. |
| **Barra flotante inferior (`2 Selected \| Duplicate \| Print \| Delete`)** | Barra de acciones masivas (`N seleccionados \| Copiar radicados \| Exportar selección \| Limpiar`) | Habilita operaciones en lote sobre múltiples expedientes sin saturar la interfaz cuando no hay selección activa. |
| **Paginación inferior (`Showing 1-9 of 240` + `< Previous 1 2 3 Next >`)** | Pie de tabla con conteo exacto de registros y controles de página accesibles | Garantiza tiempos de renderizado inmediatos y orientación clara en despachos con cientos de procesos. |

---

## 3. Criterios de Aceptación (Gherkin)

### Escenario 1: Navegación Lateral Colapsable y Conservación de Marca
* **Dado** que un usuario autenticado accede a cualquier ruta protegida (`/panel`, `/procesos/:id`, `/organizacion`, `/perfil`, `/catalogos`),
* **Cuando** visualiza el `AppShell` de la aplicación,
* **Entonces** observa a la izquierda el menú lateral con el logotipo oficial `<app-logo>` de Dokqet intacto, el selector de organización estilo tarjeta, las secciones `PRINCIPAL` y `ADMINISTRACIÓN`, y el interruptor de `Modo oscuro` en la zona inferior.
* **Y** al pulsar el botón de contraer panel, el menú alterna suavemente entre vista expandida y compacta en escritorio, o abre/cierra el cajón lateral en dispositivos móviles (cerrable también con la tecla `Escape`).

### Escenario 2: Búsqueda Global con Atajo de Teclado (`Ctrl+K` / `⌘K`)
* **Dado** que el abogado se encuentra en la plataforma,
* **Cuando** presiona la combinación `Ctrl+K` (o `⌘K` en macOS) o escribe en el buscador de la barra superior,
* **Entonces** el foco se sitúa inmediatamente en el campo de búsqueda global y la tabla de expedientes filtra en tiempo real por número de radicado, despacho, demandante o demandado.

### Escenario 3: Tarjetas KPI con Punto Semántico y Pestañas de Subrayado
* **Dado** que el usuario consulta el tablero de procesos (`/panel`),
* **Cuando** revisa el resumen ejecutivo dentro del contenedor principal,
* **Entonces** visualiza 4 tarjetas de indicadores (`Total este mes / en vigilancia`, `Con novedades`, `A mi cargo`, `Sin asignar`) con su respectivo punto de color semántico y cifra en fuente tabular (`tabular-nums`), sincronizadas con la barra de pestañas inferior.

### Escenario 4: Selección Múltiple y Barra Flotante de Acciones por Lote
* **Dado** que el usuario visualiza la tabla de expedientes judiciales,
* **Cuando** marca la casilla de uno o varios procesos (o la casilla maestra de la cabecera),
* **Entonces** las filas seleccionadas se resaltan sutilmente y emerge en la parte inferior central una barra flotante con el conteo de expedientes seleccionados y las acciones `Copiar radicados`, `Exportar selección` y `Cerrar selección`.

### Escenario 5: Ordenamiento por Columnas, Exportación CSV y Paginación
* **Dado** un listado de expedientes en vigilancia,
* **Cuando** el usuario pulsa sobre las cabeceras de columna (`Radicado`, `Sujetos Procesales`, `Última Actuación`, `Estado`, `Responsable`),
* **Entonces** la tabla ordena los registros de forma ascendente o descendente informando el estado mediante el atributo `aria-sort`.
* **Y** al pulsar `Exportar expedientes`, el navegador descarga un archivo `.csv` válido con los datos de los procesos filtrados.
* **Y** el pie de la tabla muestra el rango actual (`Mostrando X-Y de Z expedientes`) junto con los botones de paginación funcional.

### Escenario 6: Consulta Ágil y Paginación Real en Servidor de Actuaciones Judiciales (`/procesos/:id`)
* **Dado** que un expediente judicial puede acumular decenas o cientos de actuaciones con anotaciones extensas y el endpoint `/api/v1/processes/:id?page=X&pageSize=Y` soporta paginación nativa en el backend,
* **Cuando** el usuario ingresa al detalle del proceso (`/procesos/:id`),
* **Entonces** la aplicación solicita por defecto `page=1&pageSize=10` al backend (evitando la sobrecarga de traer 40 actuaciones completas en la carga inicial) y presenta la sección `Actuaciones judiciales` en primer plano debajo de las 4 tarjetas KPI interactivas.
* **Y** las actuaciones se organizan en una tabla estructurada de 6 columnas (`# Cons.`, `Fecha`, `Actuación / Trámite`, `Anotación Judicial`, `Término Procesal`, `Acción`) con paginación conectada directamente al servidor (`10`, `20` o `40 filas` por página), carga parcial no destructiva (`loadingActuaciones`) que conserva la cabecera y posición de scroll al cambiar de página, truncado limpio de 2 líneas (`line-clamp-2`) con botón `Ver anotación completa`, filtros rápidos (`Todas`, `Nuevas`, `Con términos`, `Con anexos`), buscador instantáneo, alternador de vista (`Tabla` / `Fichas`) y exportación a `.csv`.

---

## 4. Directrices de Calidad UX y Accesibilidad Aplicadas

1. **Contraste Verificado (WCAG 2.2 AA):** Todas las combinaciones de texto sobre fondo superan la relación mínima de `4.5:1` en texto normal y `3:1` en texto grande y bordes de controles interactivos, tanto en modo claro como en modo oscuro.
2. **Operabilidad Completa por Teclado:** Orden de tabulación lógico, anillos de foco visibles (`focus-visible:ring-2`), cierre de menús y cajones con `Escape`, y atajo `Ctrl+K` / `⌘K`.
3. **Diseño Responsivo en 3 Estados (Móvil, Tableta y Escritorio):**
   * **Móvil (`< 768px`):** Menú lateral en cajón superpuesto con respaldo traslúcido, tarjetas KPI en cuadrícula de 2 columnas, contenedor de tabla con desplazamiento horizontal contenido sin desbordar el `viewport` general, y áreas táctiles mínimas de `44x44px`.
   * **Tableta (`768px - 1024px`):** Cuadrícula adaptativa y controles compactos.
   * **Escritorio (`> 1024px`):** Sidebar persistente colapsable y tabla completa de 8 columnas.
4. **Estados de Interfaz Completos:** Esqueletos de carga (`skeleton shimmer`), estados vacíos accionables con explicación clara de la causa y acción recomendada, y retroalimentación inmediata al copiar radicados o exportar datos.
5. **Cero Contenido Ficticio o Decoración sin Propósito:** Todos los indicadores, avatares de iniciales y conteos provienen del estado real de la sesión y del servicio de procesos.

