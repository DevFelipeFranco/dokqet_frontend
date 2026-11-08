# 📏 Reglas de Sincronización Segura para Frontend (`sync-rules.md`)

Este documento compila las reglas obligatorias e invariantes para mantener sincronizados y consistentes los archivos `AGENTS.md` y `GEMINI.md` en el proyecto `dokqet-frontend`.

---

## 1. Reglas de Actualización de `AGENTS.md`

### A. Sintaxis e Integridad de Diagramas Mermaid
1. **Escape de Caracteres Especiales**:
   - Todo nodo cuyo texto contenga paréntesis `()`, corchetes `[]`, llaves `{}`, símbolos matemáticos o comillas DEBE encerrarse entre comillas dobles:
     - ✅ `nodeA["Componente (Standalone / Signals)"]`
     - ❌ `nodeA[Componente (Standalone / Signals)]`
2. **Determinismo de Flujo**:
   - Cada nodo de decisión `{¿Pregunta?}` debe tener salidas explícitas etiquetadas (`|Sí|`, `|No|` o valores equivalentes).
   - El diagrama debe comenzar en un nodo de inicio y terminar en nodos de acción concretos (skills específicas del frontend).
3. **Consistencia de Convención**:
   - Usar `flowchart TD` para diagramas de flujo de decisión y mantener una dirección uniforme de arriba hacia abajo.

### B. Formato de Hipervínculos Markdown
1. **Esquema de Enlace**:
   - Utilizar enlaces completos con el esquema `file:///` o enlaces relativos directos dentro del repositorio frontend.
   - Para enlaces `file:///`, los espacios en blanco deben codificarse con `%20` (ejemplo: `Workspace%20Front`).
   - El texto visible del enlace debe ser el nombre simple del archivo o el path comprensible.
2. **Verificación de Existencia**:
   - Prohibido enlazar archivos ficticios o que no hayan sido creados físicamente en disco.

### C. Catálogo de Skills (§3)
1. **Numeración Secuencial**:
   - Las subsecciones de skills deben conservar una numeración continua (`### 1. ...`, `### 2. ...`, etc.).
2. **Estructura Requerida por Entrada**:
   - `* **Ubicación de la Skill:**`
   - `* **Propósito:**`
   - `* **Cuándo Activar (Triggers):**`
   - `* **Índice de Referencias y Reglas:**`

### D. Árbol de Directorios (§4)
1. Mantener la indentación ASCII (`├──`, `│`, `└──`) reflejando la estructura real del sistema de archivos bajo `.agents/skills/`.

---

## 2. Reglas de Actualización de `GEMINI.md`

### A. Registro de Comandos CLI
1. **Comandos Verificados**:
   - Solo incluir comandos ejecutables y probados en el entorno Node.js / Angular CLI (`npm run build`, `npm start`, `npm run watch`).
2. **Categorización**:
   - Agrupar los comandos por categorías claras:
     - 🚀 **Servidor de Desarrollo Local** (`npm start`, `ng serve`)
     - 🏗️ **Compilación y Construcción de Producción** (`npm run build`, `ng build`)
     - 🧪 **Pruebas y Verificación** (`npm test`, `ng test`)
     - 🔍 **Inspección de Dependencias y Linter** (`npm audit`, etc.)
3. **Seguridad**:
   - No almacenar tokens PASETO reales de producción, API keys secretas ni credenciales en `GEMINI.md`. Solo referencias a variables de entorno (`environment.ts` / `environment.development.ts`).

### B. Contexto Funcional y Arquitectura
1. **Estructura del Proyecto**:
   - Documentar la arquitectura por capas frontend:
     - `src/app/core/`: Modelos TypeScript, servicios HTTP singleton (`ProcessService`, `AuthService`, `OrganizationService`, `CatalogService`), interceptores y utilitarios (`datetime.utils`).
     - `src/app/features/`: Módulos visuales por caso de uso (`admin`, `auth`, `dashboard`, `processes`, `profile`).
     - `src/app/shared/`: Componentes UI reutilizables (`Card`, `Button`, `Modal`, `EmptyState`, `Skeleton`), pipes (`RadicadoPipe`) y directivas.
2. **Stack Tecnológico y Versiones**:
   - Angular 19+ (Standalone Components, Signals, Signal Inputs/Outputs, Control Flow `@if`/`@for`/`@switch`, `@defer`).
   - TypeScript 5.6+ / ES2022+
   - Tailwind CSS v3 & PostCSS
   - Consumo de API REST Spring Boot 3.4.1 con `ProblemDetail` (RFC 7807 / RFC 9457).
   - PASETO v4 token storage en sesión del navegador.
