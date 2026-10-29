# Historia de Usuario HU-16: Implementación de Skeleton Loaders Contextuales y Supresión de Spinners de Bloqueo Global

* **ID de Historia:** `HU-16`
* **Título:** Optimización de Perceived Performance y Estabilidad Visual (CLS) mediante Skeleton Loaders Contextuales en Reemplazo de Spinners Bloqueantes de Pantalla Completa.
* **Estado:** Propuesta / Lista para Desarrollo
* **Fecha:** Octubre 2026
* **Módulos Impactados:**
  * **Core / Shared UI:** `<app-skeleton>` (componente atómico multi-variante), `<app-skeleton-table>`, `<app-skeleton-card-grid>`.
  * **Expedientes (`DashboardComponent`):** Carga inicial de KPIs y listado general de radicados judiciales.
  * **Detalle de Proceso (`ProcessDetailComponent`):** Carga inicial de expediente y paginación en tiempo real de actuaciones judiciales.
  * **Tablas Maestras (`CatalogsAdminComponent`):** Carga del explorador de catálogos y tabla/tarjetas de registros.
  * **Organización y Firma (`OrganizationAdminComponent`):** Consulta de datos societarios, sedes y directorio de invitaciones.
  * **Mi Perfil (`ProfileComponent`):** Carga en segundo plano de pestañas "Equipo y personal" y "Radicados asignados".
  * **Aceptación de Invitaciones (`AcceptInvitationComponent`):** Verificación de tokens de acceso al despacho.

---

## 1. Narrativa de la Historia de Usuario

> **Como** abogado litigante, dependiente o administrador de firma jurídica en **Dokqet**,  
> **Quiero** visualizar esqueletos de carga estructurados (*Skeleton Loaders*) que anticipen de manera fiel la geometría, volumen y distribución del contenido mientras se resuelven las peticiones asíncronas con el backend,  
> **Para** evitar pantallas vacías o bloqueadas por spinners gigantes de carga, reducir la fatiga visual y la percepción de demora, garantizar una navegación fluida sin saltos abruptos de diseño (*Cumulative Layout Shift - CLS*) y mantener la continuidad operativa y espacial de la plataforma.

---

## 2. Diagnóstico del Estado Actual y Justificación UX

### 2.1. Problemas Identificados con los Spinners Centrales

1. **Aumento Artificial del Tiempo Percibido (Perceived Latency):**
   * Estudios de UX e interacción persona-ordenador (Nielsen Norman Group) demuestran que los spinners circulares centrados focalizan la atención del usuario en el tiempo de espera, generando una percepción de lentitud hasta un **40% superior** a la real.
   * En varios componentes de Dokqet (ej. `OrganizationAdminComponent:32-39`, `ProfileComponent:730,919` y `CatalogsAdminComponent:415-420`), la pantalla o la tarjeta se vacía por completo para mostrar un círculo girando (`animate-spin`) con textos como *"Cargando datos de la organización…"* o *"Consultando equipo de trabajo..."*.

2. **Salto Abrupto de Contenido (Cumulative Layout Shift - CLS):**
   * Cuando la respuesta HTTP llega, el spinner desaparece y los elementos (tarjetas, inputs, tablas) irrumpen de golpe.
   * Esto provoca que la barra de desplazamiento y los contenedores salten bruscamente, afectando negativamente la métrica Web Vital **CLS** (debe ser `< 0.1`).

3. **Pérdida de Orientación Espacial:**
   * Un spinner no comunica al usuario qué tipo de información va a recibir: ¿es una tabla, un formulario, un resumen numérico o un documento judicial?
   * El skeleton loader preserva la silueta del diseño final, preparando al cerebro del usuario para escanear los datos antes de que se hayan descargado por completo.

---

## 3. Arquitectura de la Solución: Sistema de Skeleton Loaders Dokqet

La solución contempla un diseño modular en dos niveles dentro de `src/app/shared/components/ui`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DOKQET SHELL                                   │
├────────────────────────────────┬────────────────────────────────────────────┤
│  EXPLORADOR DE TABLAS          │  TABLA DE ACTUACIONES / EXPEDIENTES        │
│                                │                                            │
│  ┌──────────────────────────┐  │  ┌────────┬─────────────────────┬────────┐ │
│  │ ▒▒▒▒▒▒▒▒▒  [▒▒▒]         │  │  │ ▒▒▒▒▒  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │ [▒▒▒]  │ │
│  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒    │  │  ├────────┼─────────────────────┼────────┤ │
│  └──────────────────────────┘  │  │ ▒▒▒▒▒  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │ [▒▒▒]  │ │
│  ┌──────────────────────────┐  │  ├────────┼─────────────────────┼────────┤ │
│  │ ▒▒▒▒▒▒▒▒▒  [▒▒▒]         │  │  │ ▒▒▒▒▒  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │ [▒▒▒]  │ │
│  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒    │  │  └────────┴─────────────────────┴────────┘ │
│  └──────────────────────────┘  │                                            │
│  [Estructura previa idéntica]  │  [Filas proporcionales con shimmer suave]  │
└────────────────────────────────┴────────────────────────────────────────────┘
```

### 3.1. Componente Atómico Reutilizable: `<app-skeleton>`

Componente standalone ligero configurable mediante inputs de Tailwind CSS y Signals:

```typescript
export type SkeletonVariant = 'text' | 'circular' | 'rounded' | 'rectangle';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div
      [class]="computedClasses()"
      [style.width]="width()"
      [style.height]="height()"
      role="status"
      aria-live="polite"
      aria-busy="true">
      <span class="sr-only">Cargando información...</span>
    </div>
  `
})
export class SkeletonComponent {
  variant = input<SkeletonVariant>('text');
  width = input<string>('100%');
  height = input<string>('1rem');
  rounded = input<string>('rounded-md');
  className = input<string>('');
  animate = input<boolean>(true); // Soporte para prefers-reduced-motion
}
```

* **Estética de brillo (Shimmer Animation):**
  * Fondo base en modo claro: `bg-muted/70` (`#eef3f3`).
  * Fondo base en modo oscuro: `dark:bg-card/70` (`#042428`) con borde `dark:border-border/40`.
  * Animación de onda de luz (`shimmer` o `animate-pulse`) sutil, sin saturación ni parpadeos agresivos.

### 3.2. Componentes de Composición Estructural

1. **`<app-skeleton-table>`:**
   * Renderiza una cabecera simulada y `N` filas configurables (`default: 5`), alternando anchos aleatorios de texto (ej. 60%, 80%, 45%) para simular datos reales de radicados, juzgados y sujetos procesales.
2. **`<app-skeleton-card-grid>`:**
   * Renderiza 3 o 4 tarjetas métricas con siluetas de punto indicador (`●`), valor tabular grande y etiqueta inferior.
3. **`<app-skeleton-form>`:**
   * Emula la altura de 46px (`h-[46px]`) de los inputs con floating labels y los botones de guardado.

---

## 4. Matriz de Reemplazo en Componentes Dokqet

| Componente | Estado Anterior (Spinner / Bloqueo) | Nuevo Estado (Skeleton Contextual) | Impacto UX |
| :--- | :--- | :--- | :--- |
| **`DashboardComponent`** | Skeleton básico inline en tabla (`h-14`), pero sin skeleton en tarjetas de indicadores KPI. | `<app-skeleton-card-grid>` en KPIs + `<app-skeleton-table>` en listado de expedientes con checkbox y badges simulados. | Elimina el parpadeo de cifras en las 4 tarjetas superiores al entrar o recargar el panel. |
| **`ProcessDetailComponent`** | Header básico pulsante; la tabla de actuaciones tiene un `opacity-60` con overlay opaco. | Skeleton compuesto de expediente (Radicado, Despacho, Partes) + Skeleton tabular de actuaciones manteniendo paginador visible. | Mantiene la orientación espacial durante la paginación entre páginas de actuaciones. |
| **`CatalogsAdminComponent`** | Spinner giratorio centrado (`size-6 animate-spin`) dentro de la tarjeta de datos. | Skeleton adaptativo: Tabla multi-columna en escritorio y Tarjetas verticales pulsantes en móvil. | Muestra la rejilla de columnas desde el primer milisegundo sin descolocar la cabecera. |
| **`OrganizationAdminComponent`** | Spinner grande (`py-24 size-8 animate-spin`) que oculta todo el formulario de firma. | Skeleton de formulario estructurado (NIT, Razón Social, Dirección, Cascada DANE) + Skeleton de tabla de invitaciones. | El usuario ve la distribución de su despacho de inmediato mientras cargan los datos de la API. |
| **`ProfileComponent`** (Tabs Equipo y Procesos) | Spinner giratorio (`size-7 animate-spin`) con texto *"Consultando..."*. | Skeleton de tarjetas de directorio de abogados (avatares circulares + pills) y tabla de procesos asignados. | Transición fluida e instantánea al cambiar entre las pestañas del perfil sin pantallas en blanco. |
| **`AcceptInvitationComponent`** | Spinner en tarjeta centrada (`w-8 h-8 animate-spin`). | Skeleton de invitación formal (logo, nombre de la firma y botón de confirmación). | Genera certeza y seguridad al profesional antes de confirmar su vinculación a la firma. |

---

## 5. Criterios de Aceptación (Gherkin / BDD)

### Escenario 1: Carga Asíncrona en el Tablero de Expedientes (`/panel`)
* **Dado** que un usuario accede al panel de expedientes o actualiza el listado mediante el botón de refresco,
* **Cuando** el servicio `processService.getProcesses()` se encuentra en estado de espera (latencia de red),
* **Entonces** las 4 tarjetas métricas muestran siluetas pulsantes proporcionales con el punto semántico respetando su ubicación exacta,
* **Y** la tabla principal muestra filas de skeleton con checkboxes simulados, anchos variables de texto para simular radicado de 23 dígitos y despacho,
* **Y** no se muestra ningún spinner circular invasivo en el centro de la pantalla.

### Escenario 2: Navegación y Paginación de Actuaciones en Detalle de Proceso (`/procesos/:id`)
* **Dado** que el abogado consulta un expediente con más de 40 actuaciones y pulsa el botón "Siguiente página" en el paginador,
* **Cuando** el cliente consulta `/api/v1/processes/:id?page=X&pageSize=Y`,
* **Entonces** el cuerpo de la tabla de actuaciones reemplaza inmediatamente las filas actuales por esqueletos con alturas exactas (`py-3`),
* **Y** el contenedor de la tabla conserva su altura fija evitando que el pie de página o el paginador salten verticalmente,
* **Y** al resolverse la respuesta HTTP, los datos reales reemplazan las siluetas con una transición suave (`transition-opacity duration-150`).

### Escenario 3: Consulta y Filtrado en Tablas Maestras (`/catalogos`)
* **Dado** que el usuario selecciona una tabla maestra en el explorador lateral (ej. *Tipos de Documento* o *Ciudades / Municipios*),
* **Cuando** se ejecuta la llamada al servicio de catálogos,
* **Entonces** en pantallas de escritorio (`>= md`) se renderiza una estructura esquelética con las columnas técnicas correspondientes,
* **Y** en pantallas móviles (`< md`) se renderizan 3 tarjetas esqueléticas verticales con su código y micro-rejilla de atributos,
* **Y** el explorador de la izquierda permanece 100% interactivo permitiendo cambiar de categoría sin bloqueos de interfaz.

### Escenario 4: Carga de Pestañas Secundarias en Mi Perfil (`/perfil`)
* **Dado** que el usuario se encuentra en el módulo de Perfil y pulsa la pestaña "Equipo y personal",
* **Cuando** se consultan los miembros del despacho en segundo plano,
* **Entonces** la sección de directorio muestra 3 filas esqueléticas con avatares circulares simulados (`rounded-full size-8`) y badges alargados,
* **Y** el usuario puede volver a la pestaña de "Información del abogado" sin que la aplicación se congele ni presente bloqueos modales.

### Escenario 5: Estabilidad del Diseño y Rendimiento Web Vital (CLS < 0.1)
* **Dado** cualquier flujo de carga asíncrona dentro de la plataforma Dokqet,
* **Cuando** finaliza la carga y se inyectan los datos definitivos,
* **Entonces** la variación de diseño acumulada (*Cumulative Layout Shift*) es inferior a **0.05**, garantizando cero desacomodo de botones, campos o scrollbars.

### Escenario 6: Soporte y Contraste en Modo Oscuro (Dark Mode)
* **Dado** que el usuario tiene activado el tema oscuro (`.dark`),
* **Cuando** visualiza cualquier estado de skeleton loader,
* **Entonces** las siluetas utilizan fondos oscuros atenuados (`#042428` / `rgba(255,255,255,0.06)`) con bordes en `--border` nocturno,
* **Y** no se perciben destellos blancos (*flash of light*) ni sobreexposición luminosa en ambientes de baja luz.

### Escenario 7: Accesibilidad y Respeto a Preferencias del Sistema (`prefers-reduced-motion`)
* **Dado** un usuario que tiene activada la preferencia de reducción de movimiento en su sistema operativo (`prefers-reduced-motion: reduce`),
* **Cuando** se despliegan los skeleton loaders en pantalla,
* **Entonces** la animación pulsante o de onda (*shimmer*) se desactiva automáticamente, mostrando una silueta estática en gris neutro,
* **Y** los lectores de pantalla reciben el anuncio accesible de carga mediante `role="status"` y texto reservado con la clase `sr-only`.

---

## 6. Tareas Técnicas de Implementación

### Tarea 1: Componente Base `<app-skeleton>`
- [ ] Crear [`src/app/shared/components/ui/skeleton.component.ts`](file:///e:/Workspace%20Spring%20Boot/dokqet_plataforma/dokqet-frontend/src/app/shared/components/ui/skeleton.component.ts) con soporte para variantes (`text`, `circular`, `rounded`, `card`).
- [ ] Configurar clases de Tailwind para animación fluida (`animate-pulse` respetando `motion-reduce:animate-none`).
- [ ] Exportar el componente en [`src/app/shared/components/ui/index.ts`](file:///e:/Workspace%20Spring%20Boot/dokqet_plataforma/dokqet-frontend/src/app/shared/components/ui/index.ts).

### Tarea 2: Refactorización en Expedientes y Actuaciones
- [ ] Integrar skeleton contextual en el tablero principal (`DashboardComponent`).
- [ ] Implementar skeleton tabular en el listado paginado de actuaciones judiciales de [`ProcessDetailComponent`](file:///e:/Workspace%20Spring%20Boot/dokqet_plataforma/dokqet-frontend/src/app/features/processes/detail/process-detail.component.html).

### Tarea 3: Refactorización en Administración y Catálogos
- [ ] Reemplazar spinner en [`CatalogsAdminComponent`](file:///e:/Workspace%20Spring%20Boot/dokqet_plataforma/dokqet-frontend/src/app/features/admin/catalogs/catalogs-admin.component.html) con vista de skeleton dual (tabla en escritorio y cards en móvil).
- [ ] Reemplazar spinner en [`OrganizationAdminComponent`](file:///e:/Workspace%20Spring%20Boot/dokqet_plataforma/dokqet-frontend/src/app/features/organization/organization-admin.component.html) con skeleton de formulario corporativo y tabla de personal.

### Tarea 4: Refactorización en Mi Perfil e Invitaciones
- [ ] Actualizar pestañas "Equipo y personal" y "Radicados asignados" en [`ProfileComponent`](file:///e:/Workspace%20Spring%20Boot/dokqet_plataforma/dokqet-frontend/src/app/features/profile/profile.component.html).
- [ ] Reemplazar el spinner central de verificación en [`AcceptInvitationComponent`](file:///e:/Workspace%20Spring%20Boot/dokqet_plataforma/dokqet-frontend/src/app/features/invitation/accept-invitation.component.html).

### Tarea 5: Pruebas y Validación de Calidad
- [ ] Pruebas de verificación de tipos TypeScript (`tsc --noEmit`).
- [ ] Pruebas de compilación limpia de producción (`ng build`).
- [ ] Verificación de CLS `< 0.1` en Lighthouse / DevTools.

---

## 7. Definición de Terminado (DoD - Definition of Done)

1. **Cero Spinners Globales de Bloqueo:** Ninguna vista principal de la aplicación bloquea la pantalla con spinners centrados durante la carga de datos inicial o paginación.
2. **Consistencia Visual:** Todos los skeletons utilizan la paleta corporativa neutra (`--muted` en claro y `--card` en oscuro) respetando los radios de borde del sistema (`--radius: 0.625rem`).
3. **Métrica Web Vitals Aprobada:** CLS (*Cumulative Layout Shift*) inferior a 0.05 en todas las transiciones de carga a contenido.
4. **Accesibilidad WCAG 2.1 AA:** Elementos con atributos `role="status"` y textos ocultos para lectores de pantalla.
5. **Calidad de Código:** Standalone Components en Angular 19, tipado estricto en TypeScript sin advertencias de compilación.

