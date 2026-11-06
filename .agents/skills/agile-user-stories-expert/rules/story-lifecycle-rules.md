# 📏 Reglas de Ciclo de Vida, Reactividad y Experiencia de Usuario (Frontend)

Este documento define las políticas operativas sobre cómo modelar el ciclo de vida de componentes, reactividad con Signals, manejo de estados de vista y seguridad de sesión en `dokqet-frontend`.

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
