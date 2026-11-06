# 📏 Reglas de Sintaxis y Criterios de Aceptación Gherkin para Frontend

Este documento detalla las directivas para la redacción de especificaciones BDD en formato Gherkin para la interfaz de usuario de `dokqet-frontend`.

---

## 1. Estándar de Idioma y Palabras Clave
Se permite el uso de español (`# language: es`) o inglés (`# language: en`). Se recomienda mantener consistencia dentro de una misma historia.

### Mapeo de Palabras Clave:
| Elemento | Español (`# language: es`) | Inglés (`# language: en`) |
| :--- | :--- | :--- |
| **Característica** | `Característica:` | `Feature:` |
| **Antecedentes** | `Antecedentes:` | `Background:` |
| **Escenario** | `Escenario:` | `Scenario:` |
| **Esquema del escenario** | `Esquema del escenario:` | `Scenario Outline:` |
| **Ejemplos** | `Ejemplos:` | `Examples:` |
| **Precondición** | `Dado` / `Dada` / `Dados` / `Dadas` | `Given` |
| **Acción / Evento** | `Cuando` | `When` |
| **Resultado esperado** | `Entonces` | `Then` |
| **Conjunción** | `Y` / `E` | `And` |
| **Disyunción / Exclusión**| `Pero` | `But` |

---

## 2. Anatomía de un Escenario Gherkin de Frontend

Cada escenario debe responder a tres momentos claros, deterministas y orientados a la experiencia del usuario y la reactividad:

1. **Dado (Precondición / Estado inicial de la UI y Sesión):**
   - Estado de la sesión del usuario (`autenticado con rol LAWYER`, `no autenticado`, `sesión expirada`).
   - Ruta activa de Angular (`se encuentra en "/iniciar-sesion"`, `visualiza el detalle del expediente en "/procesos/uuid-123"`).
   - Estado inicial de los datos o formulario (`formulario vacío`, `datos cargados en memoria`, `solicitud HTTP pendiente`).
   - Ejemplo: `Dado que el abogado se encuentra en la pantalla de inicio de sesión "/iniciar-sesion"`

2. **Cuando (Acción del Usuario o Evento de Red):**
   - Interacción del usuario: tipeo en un campo de texto, clic en un botón de acción, selección de opción, navegación con teclado o atajo.
   - Evento de red o respuesta HTTP simulada: el backend responde con un código de estado específico o la petición experimenta latencia.
   - Ejemplo: `Cuando el usuario hace clic en "Ingresar al despacho" y el servidor responde con HTTP 423 "Locked"`

3. **Entonces (Postcondición / Verificación Visible y Reactiva):**
   - Elementos visuales renderizados en el DOM: alertas, modales, badges, banners informativos o skeletons de carga.
   - Estado de los controles de formulario: inputs inhabilitados (`disabled`), campo marcado con error de validación (`border-red-500`, texto descriptivo).
   - Transiciones de rutas y reactividad: navegación mediante `Router` a una nueva URL, actualización de un temporizador en vivo o actualización de señales (`signals`).
   - Ejemplo: `Entonces se visualiza la tarjeta de bloqueo temporal con un temporizador regresivo "14:59" y los campos de contraseña quedan inhabilitados`

---

## 3. Cobertura Mínima Obligatoria por Historia

Toda especificación debe incluir escenarios para:
1. **Camino Feliz (Happy Path):** Interacción exitosa con datos válidos, feedback afirmativo y navegación esperada.
2. **Validación de Formularios en Tiempo Real:** Entrada de datos erróneos o incompletos (ej. Radicado con longitud diferente a 23 dígitos, NIT con dígito de verificación inválido, correo mal formado).
3. **Manejo de Respuestas de Error del Backend:** Comportamiento ante errores HTTP comunes y especializados:
   - `400 Bad Request`: Alerta contextual con el detalle del campo o intentos restantes.
   - `401 Unauthorized / 403 Forbidden`: Mensaje de permisos insuficientes o redirección a login.
   - `423 Locked`: Tarjeta de seguridad de cuenta bloqueada con temporizador regresivo y CTA de recuperación.
   - `500 Internal Server Error`: Banner de contingencia sin romper la navegación general.
4. **Experiencia de Carga Asíncrona (Skeletons / CLS):** Verificación de que durante la latencia de red se rendericen siluetas de Skeleton y ningún spinner gigante bloqueante desplace el contenido.
5. **Accesibilidad (A11y):** Foco accesible en modales, compatibilidad con lectores de pantalla (`aria-live="polite"`, `aria-invalid="true"`) y advertencias de teclado (ej. `CapsLock`).

---

## 4. Buenas Prácticas y Anti-patrones en Gherkin de Frontend

### ✅ Buenas Prácticas
- Usar tablas de datos (`| campo | valor |`) para representar valores de formularios o datos tabulares esperados.
- Especificar el texto o rol semántico del elemento (`hace clic en el botón "Guardar cambios"` en lugar de `hace clic en el div #btn-save`).
- Especificar códigos HTTP esperados al modelar respuestas del servidor (`Cuando el servidor responde HTTP 400 con el mensaje "..."`).
- Mantener los pasos comprensibles para diseñadores, evaluadores de QA y desarrolladores de Angular.

### ❌ Anti-patrones Prohibidos
- Selectores CSS crudos en los pasos Gherkin (ej. `Cuando hace clic en "div.flex > button.btn-primary:first-child"`).
- Omitir el estado visual resultante (ej. `Entonces el sistema procesa la solicitud` sin indicar qué ve el usuario).
- Mezclar lógica interna del backend como queries SQL o tablas de base de datos en escenarios de frontend.
