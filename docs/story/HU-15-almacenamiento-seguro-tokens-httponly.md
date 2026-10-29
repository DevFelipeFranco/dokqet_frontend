# Historia de Usuario HU-15: Persistencia Segura de Tokens en Memoria y Cookies HttpOnly con Refresh Token Rotation

* **ID de Historia:** `HU-15`
* **Título:** Almacenamiento seguro de credenciales de sesión en cliente (Angular) y servidor (Spring Boot) mediante Tokens en Memoria, Cookies HttpOnly y Rotación de Refresh Token.
* **Estado:** Completada e Implementada
* **Fecha:** Octubre 2026
* **Módulos Impactados:**
  * **Frontend (`dokqet-frontend`):** `AuthService`, `pasetoInterceptor`, `APP_INITIALIZER` (`app.config.ts`), `authGuard`.
  * **Backend (`dokqet-backend`):** `AuthController`, `AuthService`, `CorsConfig`, `PasetoTokenService`, `SecurityConfig`.

---

## 1. Narrativa de la Historia de Usuario

> **Como** usuario y administrador de la plataforma **Dokqet**,  
> **Quiero** que el almacenamiento y renovación de mis credenciales de sesión (Access Token y Refresh Token) se gestionen siguiendo las directivas de seguridad recomendadas por OWASP (Access Token en memoria de la SPA y Refresh Token en Cookie `HttpOnly` con rotación continua),  
> **Para** neutralizar vectores de ataque por extracción de credenciales mediante Cross-Site Scripting (XSS), mitigar riesgos de Cross-Site Request Forgery (CSRF) y garantizar la compatibilidad operativa continua entre el backend Spring Boot y el cliente Angular.

---

## 2. Diagnóstico del Estado Actual y Riesgos de Seguridad

### 2.1. Vulnerabilidades Identificadas
* **Exposición en Almacenamiento Web (LocalStorage):**
  Actualmente en `dokqet-frontend` (`src/app/core/auth/auth.service.ts`), las claves `dokqet_paseto_access` y `dokqet_paseto_refresh` se almacenan en `localStorage`. Cualquier vulnerabilidad o script inyectado en la aplicación (vía dependencias npm de terceros, contenido dinámico o XSS) tiene acceso irrestricto a `localStorage.getItem()` y puede exfiltrar los tokens PASETO a un servidor malicioso.
* **Falta de endpoint `/refresh` y `/logout` en Backend:**
  Actualmente `dokqet-backend` genera ambos tokens en `login` y `signUp`, pero no provee un endpoint formal para renovar el `accessToken` cuando expira, obligando al usuario a volver a iniciar sesión o a mantener tokens de acceso de vigencia innecesariamente larga.

---

## 3. Arquitectura de la Solución (Híbrida: Memoria + HttpOnly Cookie)

La solución técnica adopta el patrón estándar de oro recomendado por OWASP para arquitecturas SPA + API REST:

```
[ Navegador / Angular Client ]                           [ Backend Spring Boot ]
             |                                                      |
             | ---- 1. POST /api/v1/auth/login -------------------> |
             |                                                      | (Valida credenciales)
             | <--- 2. Responde 200 OK ---------------------------- | (Genera Access + Refresh PASETO)
             |      - Set-Cookie: refreshToken=...; HttpOnly; ...   |
             |      - Body: { accessToken, user, organizations }    |
             |                                                      |
(Guarda accessToken en MEMORIA - Signal)                            |
             |                                                      |
             | ---- 3. GET /api/v1/expedientes (Bearer accessToken) |
             |         (Peticiones ordinarias de negocio) --------> | (Valida PasetoAuthenticationFilter)
             | <--- 4. 200 OK (Datos de negocio) ------------------ |
             |                                                      |
    [ Expiró Access Token (401) o F5 Recarga ]                      |
             |                                                      |
             | ---- 5. POST /api/v1/auth/refresh -----------------> |
             |         (withCredentials: true, cookie automática)   | (Valida Refresh Token)
             |                                                      | (Rota Refresh Token: invalida anterior)
             | <--- 6. Responde 200 OK ---------------------------- | (Emite nuevo Set-Cookie + nuevo AccessToken)
             |      - Set-Cookie: nuevo refreshToken; HttpOnly      |
             |      - Body: { accessToken: nuevoToken }             |
             |                                                      |
(Actualiza Signal de AccessToken y reintenta petición original)     |
```

### 3.1. Roles y Almacenamiento por Token

| Token | Destino de Almacenamiento | Vida Útil | Mecanismo de Envío | Propósito de Seguridad |
| :--- | :--- | :--- | :--- | :--- |
| **Access Token (PASETO)** | **Solo en Memoria** (`signal<string | null>`) en `AuthService` de Angular. **Nunca en disco ni localStorage**. | Corta (ej. 10 - 15 minutos). | Cabecera estándar HTTP `Authorization: Bearer <token>`. | Inmune a CSRF en peticiones API ordinarias; si hay XSS, el atacante no puede extraer un token persistente del almacenamiento local. |
| **Refresh Token (PASETO)** | **Cookie `HttpOnly`** emitida por el backend. | Larga (ej. 7 a 30 días). | Automático por el navegador únicamente hacia `/api/v1/auth/**` con `withCredentials: true`. | Inaccesible desde JavaScript (`document.cookie` devuelve vacío). Protegido contra manipulación en cliente. |

---

## 4. Garantía de Compatibilidad y No-Afectación al Backend (`dokqet-backend`)

Para asegurar que los cambios **no rompan el backend existente ni otros posibles clientes**, se definen las siguientes reglas de diseño:

1. **Retrocompatibilidad en el Payload de Login y Registro:**
   * El backend seguirá devolviendo el objeto `AuthResponse` con `accessToken`, `user`, `activeOrganizationId`, `role` y `organizations`.
   * El backend inyectará la cookie `refreshToken` mediante la cabecera `Set-Cookie`. Opcionalmente puede seguir enviando `refreshToken` en el cuerpo JSON durante la fase de transición, de modo que ningún contrato existente se rompa.
2. **CORS Ya Habilitado con Credenciales:**
   * En `com.dokqet.plataforma.config.CorsConfig`, la línea `config.setAllowCredentials(true);` **ya se encuentra implementada**, con `allowedOrigins` cubriendo `http://localhost:4200` y `frontendUrl`. No requiere cambios estructurales drásticos, solo verificar la correspondencia de dominios.
3. **Endpoint `/refresh` Tolerante (Doble Fuente):**
   * El endpoint `/api/v1/auth/refresh` aceptará el token prioritariamente desde `@CookieValue(name = "refreshToken", required = false)`. Si no viene en la cookie (por ejemplo, clientes móviles o herramientas CLI/Postman), admitirá el token enviado en el cuerpo `RefreshTokenRequest`.
4. **Parámetro de Entorno para `Secure` Cookie:**
   * Atributo `secure(isProduction)`: en desarrollo local sobre `http://localhost`, `secure` debe ser `false` (o condicionado por perfil Spring `dev`/`prod`), y en producción sobre HTTPS debe ser `true`.

---

## 5. Criterios de Aceptación (Gherkin)

### Escenario 1: Login seguro sin persistencia de tokens en LocalStorage
* **Dado** que un usuario ingresa credenciales válidas en el formulario de inicio de sesión de Angular,
* **Cuando** el backend procesa exitosamente la solicitud `POST /api/v1/auth/login`:
  * El backend debe adjuntar una cookie `refreshToken` con los atributos:
    * `HttpOnly: true`
    * `SameSite: Strict` (o `Lax` si se requiere navegación externa)
    * `Path: /api/v1/auth`
    * `Max-Age: 7 días`
  * El frontend debe recibir el `accessToken` y almacenarlo en `AuthService.accessTokenSignal`.
* **Entonces** `localStorage.getItem('dokqet_paseto_access')` y `localStorage.getItem('dokqet_paseto_refresh')` deben retornar `null`.
* **Y** solo se permite persistir en almacenamiento local metadatos no sensibles de conveniencia de interfaz (como `dokqet_user` o `dokqet_active_org`).

### Escenario 2: Restauración de sesión al recargar la página (`F5` / `APP_INITIALIZER`)
* **Dado** que el usuario tiene una sesión activa pero recarga la página o abre una nueva pestaña (haciendo que la memoria de Angular se limpie),
* **Cuando** arranca la aplicación Angular:
  * El `APP_INITIALIZER` de Angular ejecuta una llamada a `POST /api/v1/auth/refresh` con `withCredentials: true`.
  * El navegador incluye automáticamente la cookie `refreshToken`.
* **Entonces** el backend valida el refresh token y retorna un nuevo `accessToken` en el payload JSON.
* **Y** Angular inicializa el estado de autenticación como logueado sin necesidad de redirigir al usuario a `/iniciar-sesion`.

### Escenario 3: Refresco silencioso ante respuesta `401 Unauthorized` en peticiones HTTP
* **Dado** que el usuario está operando en la plataforma y su `accessToken` de corta duración vence,
* **Cuando** una petición de negocio (ej. `GET /api/v1/expedientes`) responde con código HTTP `401 Unauthorized`,
* **Entonces** el `pasetoInterceptor`:
  1. Captura el error `401` y encola las peticiones concurrentes para evitar múltiples refrescos paralelos.
  2. Lanza una única petición a `POST /api/v1/auth/refresh` con `withCredentials: true`.
  3. Tras recibir el nuevo `accessToken`, reintenta la petición original con la nueva cabecera `Authorization: Bearer <nuevoToken>`.
  4. Si el refresco también falla (cookie expirada o revocada), limpia la sesión y redirige a `/iniciar-sesion`.

### Escenario 4: Cierre de sesión seguro (`Logout`) e invalidación de Cookie
* **Dado** que el usuario decide cerrar sesión pulsando "Cerrar sesión",
* **Cuando** se ejecuta la función `logout()` en el cliente:
  * El frontend invoca `POST /api/v1/auth/logout` con `withCredentials: true`.
  * El backend responde con una cookie de expiración inmediata: `Set-Cookie: refreshToken=; Max-Age=0; Path=/api/v1/auth; HttpOnly`.
  * El backend opcionalmente invalida el identificador del token en base de datos.
* **Entonces** el navegador destruye la cookie en disco, el frontend limpia los signals de memoria y redirige a `/iniciar-sesion`.

---

## 6. Plan de Implementación Técnica Detallado

### Fase A: Cambios en el Backend (`dokqet-backend`)

1. **DTOs:**
   * Crear `RefreshTokenRequest.java` con campo `refreshToken` (opcional, para compatibilidad con clientes sin cookies).
2. **Métodos en `AuthService.java`:**
   * `refreshToken(String tokenFromCookieOrBody)`: valida que el token sea de tipo `REFRESH`, extrae el `userId`, verifica que el usuario exista y siga activo, y genera un nuevo par de tokens (`accessToken` y `refreshToken`).
   * `logout(String refreshToken)`: lógica de revocación si aplica.
3. **Controlador `AuthController.java`:**
   * Actualizar `/login` y `/register` para agregar la cabecera `Set-Cookie` usando Spring `ResponseCookie`:
     ```java
     ResponseCookie cookie = ResponseCookie.from("refreshToken", authResponse.refreshToken())
             .httpOnly(true)
             .secure(cookieSecure) // false en local dev, true en prod
             .path("/api/v1/auth")
             .sameSite("Strict")
             .maxAge(Duration.ofDays(7))
             .build();
     return ResponseEntity.ok()
             .header(HttpHeaders.SET_COOKIE, cookie.toString())
             .body(ApiResponse.ok("Inicio de sesión exitoso.", authResponse));
     ```
   * Crear endpoint `POST /api/v1/auth/refresh`:
     ```java
     @PostMapping("/refresh")
     public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
             @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
             @RequestBody(required = false) RefreshTokenRequest bodyRequest,
             HttpServletResponse response) {
         String token = cookieRefreshToken != null ? cookieRefreshToken : (bodyRequest != null ? bodyRequest.refreshToken() : null);
         if (token == null || token.isBlank()) {
             throw new ValidationException("No se proporcionó un token de refresco válido.");
         }
         AuthResponse newAuth = authService.refreshToken(token);
         
         // Rotación de cookie
         ResponseCookie newCookie = ResponseCookie.from("refreshToken", newAuth.refreshToken())
                 .httpOnly(true)
                 .secure(cookieSecure)
                 .path("/api/v1/auth")
                 .sameSite("Strict")
                 .maxAge(Duration.ofDays(7))
                 .build();
         response.addHeader(HttpHeaders.SET_COOKIE, newCookie.toString());

         return ResponseEntity.ok(ApiResponse.ok("Token renovado exitosamente.", newAuth));
     }
     ```
   * Crear endpoint `POST /api/v1/auth/logout`:
     ```java
     @PostMapping("/logout")
     public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
         ResponseCookie cleanCookie = ResponseCookie.from("refreshToken", "")
                 .httpOnly(true)
                 .secure(cookieSecure)
                 .path("/api/v1/auth")
                 .maxAge(0)
                 .build();
         response.addHeader(HttpHeaders.SET_COOKIE, cleanCookie.toString());
         return ResponseEntity.ok(ApiResponse.ok("Sesión cerrada exitosamente.", null));
     }
     ```
4. **Configuración de Seguridad (`SecurityConfig.java`):**
   * Verificar que `/api/v1/auth/**` permanezca en `.permitAll()`.

---

### Fase B: Cambios en el Frontend (`dokqet-frontend`)

1. **Refactorización de `AuthService` (`src/app/core/auth/auth.service.ts`):**
   * Eliminar lectura y escritura de `dokqet_paseto_access` y `dokqet_paseto_refresh` en `localStorage`.
   * Mantener `accessTokenSignal = signal<string | null>(null)`.
   * Agregar método `refreshToken(): Observable<AuthResponse>` con llamada HTTP `post(`${this.API_URL}/refresh`, {}, { withCredentials: true })`.
   * Actualizar `logout()` para invocar `this.http.post(`${this.API_URL}/logout`, {}, { withCredentials: true })` antes de limpiar el estado local y navegar.
2. **Inicialización de Aplicación (`app.config.ts`):**
   * Incorporar función `initializeAuth(authService: AuthService)` provista en `provideAppInitializer` (Angular 18/19+) para disparar el primer `refreshToken()` de forma silenciosa al arrancar la app.
3. **Interceptor Inteligente (`paseto.interceptor.ts`):**
   * Interceptar errores con status `401`.
   * Implementar cola de peticiones con `BehaviorSubject` para refrescar el token una sola vez y reintentar las peticiones en cola.
   * En peticiones hacia `/api/v1/auth/**` asegurar el paso de `withCredentials: true`.

---

## 7. Matriz de Verificación y Pruebas

| ID Prueba | Tipo | Descripción | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **TC-01** | Seguridad / DevTools | Inspeccionar almacenamiento `Application > Local Storage` tras login. | Las llaves de tokens PASETO **no existen**. Solo existen datos públicos como `dokqet_user`. |
| **TC-02** | Seguridad / DevTools | Inspeccionar `Application > Cookies` para el origen `localhost:8080`. | Aparece la cookie `refreshToken` con checks en `HttpOnly` y `SameSite: Strict`. |
| **TC-03** | Consola JS | Intentar ejecutar `document.cookie` en la consola del navegador. | La cookie `refreshToken` **no aparece**, previniendo robo por XSS. |
| **TC-04** | Funcional / F5 | Recargar la aplicación con `F5` teniendo sesión activa. | La sesión no se cierra; se ejecuta `/refresh` en segundo plano y el dashboard carga normalmente. |
| **TC-05** | Backend Directo | Probar endpoints actuales con Postman/Curl sin cookies. | El backend sigue respondiendo con el contrato JSON esperado sin romper clientes externos. |
| **TC-06** | Cierre de Sesión | Ejecutar logout y comprobar cookies. | La cookie `refreshToken` tiene `Max-Age: 0` y queda destruida del navegador. |
