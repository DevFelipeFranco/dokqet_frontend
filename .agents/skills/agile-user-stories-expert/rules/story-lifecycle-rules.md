# 📏 Reglas de Ciclo de Vida, Reactividad y Experiencia de Usuario (Frontend)

Este documento define las políticas operativas sobre cómo modelar el ciclo de vida de componentes, reactividad con Signals, manejo de estados de vista y ciclo de vida de historias de usuario en `dokqet-frontend`.

---

## 1. Principio de Reactividad Basada en Signals (Angular 19+)

En la interfaz de Dokqet:
- **Regla:** Se debe priorizar el uso de **Angular Signals** (`signal()`, `computed()`, `linkedSignal()`) para la gestión de estados locales y globales en lugar de variables mutables tradicionales.
- **Inmutabilidad de Señales:** Las actualizaciones de estado deben realizarse mediante mutaciones inmutables (`stateSignal.update(current => ({ ...current, ...changes }))`).
- **Limpieza de Recursos:** Toda suscripción a Observables o temporizadores en tiempo real (`setInterval`, `setTimeout`) debe limpiarse automáticamente utilizando `DestroyRef` (`destroyRef.onDestroy(...)`) o el operador `takeUntilDestroyed()`.

---

## 2. Máquina de Estados Visuales de Interfaz

Todo componente de visualización o formulario que consuma datos asíncronos DEBE contemplar formalmente los siguientes 4 estados:

```
 ┌─────────────────┐       Inicia petición HTTP           ┌──────────────────┐
 │      IDLE       │ ───────────────────────────────────> │     LOADING      │
 │ (Estado Inicial)│                                      │ (Skeleton Shimmer│
 └─────────────────┘                                      │  Contextual)     │
                                                          └────────┬─────────┘
                                                                   │
                                      Respuesta Exitosa (200 OK)    │ Fallo HTTP (4xx / 5xx)
                                      ┌─────────────────────────────┴─────────────────────────────┐
                                      ▼                                                           ▼
                           ┌──────────────────┐                                        ┌──────────────────┐
                           │     SUCCESS      │                                        │      ERROR       │
                           │ (Datos Reales /  │                                        │ (Alerta / Banner │
                           │  Empty State)    │                                        │  Countdown 423)  │
                           └──────────────────┘                                        └──────────────────┘
```

### Directivas de los Estados:
1. **LOADING (Esqueleto Contextual Obligatorio):**
   - **Prohibición de Spinners Centrales:** Queda estrictamente prohibido vaciar el contenedor de datos para colocar un spinner giratorio centrado (`animate-spin`) en pantallas principales.
   - **Uso de Skeleton Loaders:** Se debe utilizar `<app-skeleton>`, `<app-skeleton-table>` o `<app-skeleton-card-grid>` para anticipar la geometría real del contenido y mantener el Web Vital **CLS < 0.1**.
2. **SUCCESS con Datos Vacíos (Empty State):**
   - Si una consulta retorna una lista vacía (ej. cero actuaciones o cero expedientes), se debe desplegar una ilustración o icono representativo con un texto orientador y un botón de acción principal (*"Registrar nuevo expediente"*).
3. **ERROR (Retroalimentación Accionable):**
   - Desplegar mensajes comprensibles basados en la estructura RFC 9457 (`detail` / `message`).
   - Proveer acciones claras de recuperación: botón de reintento, enlace a soporte o enlace de restablecimiento de contraseña ante cuentas bloqueadas (`423 Locked`).

---

## 3. Seguridad de Sesión y Almacenamiento en Cliente

Siguiendo las directivas de seguridad OWASP y la historia `HU-15`:
1. **Access Token (PASETO):**
   - Debe residir exclusivamente **en memoria** dentro de `AuthService` (`signal<string | null>`). Nunca debe persistirse en `localStorage` ni `sessionStorage` para prevenir exfiltración ante ataques de tipo XSS.
2. **Refresh Token:**
   - Se administra mediante Cookie segura **`HttpOnly`** emitida por el backend, con reintentos automáticos mediante `withCredentials: true`.
3. **Inicialización Resiliente (`APP_INITIALIZER`):**
   - Ante recargas de página (`F5`), el servicio `initAuth()` intenta renovar el token en segundo plano sin expulsar innecesariamente al usuario ante fluctuaciones momentáneas de red.
4. **Cierre de Sesión Seguro (`logout`):**
   - Invoca el endpoint de revocación en servidor y limpia inmediatamente todos los signals de usuario y permisos en el cliente (`clearSessionState()`).

---

## 4. Estándares de Diseño y Accesibilidad (WCAG 2.1 AA)

Toda pantalla o componente modelado debe garantizar:
1. **Contraste de Color:** Razón de contraste mínima de `4.5:1` para texto normal contra el fondo (tanto en modo claro como en el tema oscuro `#021b1e` / `#042428`).
2. **Navegación por Teclado:** Todos los elementos interactivos (`<app-button>`, links, inputs) deben contar con indicador de foco visible (`focus-visible:ring-2 focus-visible:ring-ring`).
3. **Soporte para Lectores de Pantalla:** Uso adecuado de roles ARIA (`role="alert"`, `aria-live="polite"`, `aria-busy="true"` en estados de carga esquelética).

---

## 5. Ciclo de Vida de los Documentos de Historias de Usuario (Transición y Archivo)

Cada requerimiento documentado como historia de usuario de frontend posee un ciclo de vida operativo que determina su estado y su ubicación física dentro del repositorio:

```
┌──────────────────────────────────────┐
│     docs/stories/HU-XXX.md           │
│  (Estado: 📝 Lista para Desarrollo)  │
└──────────────────┬───────────────────┘
                   │ Inicio de desarrollo (Fases 1 a 4)
                   ▼
┌──────────────────────────────────────┐
│     docs/stories/HU-XXX.md           │
│       (Estado: ⚙️ En Progreso)        │
└──────────────────┬───────────────────┘
                   │ Verificación total: DoD 100% y npm run build con 0 errores (Fase 5)
                   ▼
┌──────────────────────────────────────┐
│  docs/stories/implemented/HU-XXX.md  │
│ (Estado: 🚀 Implementada / Verificada)│
└──────────────────────────────────────┘
```

### 5.1. Estados Oficiales del Documento
1. `📝 Lista para Desarrollo`: Especificación formal aprobada con BDD Gherkin, reglas de negocio de frontend (RN-FE), modelos TypeScript y accesibilidad definida. **Ubicación:** `docs/stories/`.
2. `⚙️ En Progreso`: El agente o desarrollador se encuentra codificando componentes, plantillas, reactividad con Signals o servicios HTTP. **Ubicación:** `docs/stories/`.
3. `🚀 Implementada / Verificada`: Todos los criterios de aceptación, escenarios Gherkin y reglas RN-FE han sido implementados y validados con `npm run build` pasando con 0 errores. **Ubicación obligatoria:** `docs/stories/implemented/`.
4. `🔒 Bloqueada`: No puede continuar debido a una dependencia de endpoints de backend pendiente o bloqueo de diseño. **Ubicación:** `docs/stories/`.

### 5.2. Protocolo Obligatorio de Transición a Implementada
Al concluir la Fase 5 del pipeline de desarrollo, el agente **DEBE ejecutar obligatoriamente los siguientes pasos**:

1. **Actualización de Metadatos de Estado:**
   - Modificar en el encabezado de la historia:
     ```markdown
     * **Estado:** 🚀 Implementada / Verificada
     ```
2. **Actualización de la Definición de Hecho (DoD):**
   - Marcar con `[x]` todos los criterios de aceptación y listas de verificación de la historia.
3. **Movimiento Físico al Subdirectorio de Implementadas:**
   - Crear el subdirectorio `docs/stories/implemented/` si no existe.
   - Mover el archivo markdown desde `docs/stories/HU-XXX-{slug}.md` hacia `docs/stories/implemented/HU-XXX-{slug}.md`.
   - **Garantía:** `docs/stories/` en su raíz mantiene únicamente las historias pendientes o en curso, asegurando máxima visibilidad del backlog activo sin mezclarlo con trabajo ya concluido.
