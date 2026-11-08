# 🚀 Reglas del Pipeline de Orquestación Frontend (`orchestration-pipeline-rules.md`)

Este documento detalla el flujo de trabajo secuencial en 5 fases obligatorias coordinado por `dokqet-frontend-orchestrator` para cualquier nueva funcionalidad, refactorización mayor o módulo en la interfaz web de Dokqet.

---

## 1. Las 5 Fases Estándar de Desarrollo en Frontend

### Fase 1: Requerimientos y BDD Frontend (`agile-user-stories-expert`)
* **Objetivo:** Traducir los requisitos de negocio y regulatorios judiciales a especificaciones ejecutables BDD.
* **Actividades Obligatorias:**
  1. Crear archivo en `docs/stories/HU-XXX-nombre.md` siguiendo la plantilla estándar con estado inicial `📝 Lista para Desarrollo`.
  2. Redactar escenarios en Gherkin (Dado-Cuando-Entonces / Given-When-Then) cubriendo flujos exitosos, errores HTTP 4xx/5xx y estados vacíos.
  3. Definir reglas de negocio de frontend (RN-FE) específicas: validación de radicado de 23 dígitos, cálculo de DV DIAN, cooldown de recarga (10 min), aislamiento de notas privadas de organización.
  4. Especificar interfaces y contratos TypeScript necesarios en `src/app/core/models/`.

### Fase 2: Diseño Visual, UI/UX y Accesibilidad (`ui-ux-pro-max`)
* **Objetivo:** Definir la experiencia visual, la maquetación responsiva y la accesibilidad.
* **Actividades Obligatorias:**
  1. Diseñar maquetación Mobile-First con utilidades semánticas de Tailwind CSS v3.
  2. Asegurar contraste accesible WCAG 2.1 AA (mínimo 4.5:1 para texto normal, 3:1 para elementos de interfaz y texto grande).
  3. Incorporar Skeleton Loaders contextuales para evitar Cumulative Layout Shift (CLS < 0.1) en lugar de spinners globales intrusivos.
  4. Garantizar áreas táctiles mínimas de 44×44px y estados de interacción (`focus-visible`, `hover`, `active`).

### Fase 3: Arquitectura, Components y Signals (`angular-developer`)
* **Objetivo:** Implementación del código TypeScript, plantillas HTML y servicios Angular.
* **Actividades Obligatorias:**
  1. Componentes Standalone con `imports` explícitos y `ChangeDetectionStrategy.OnPush`.
  2. Inyección de dependencias moderna mediante `inject()`.
  3. Reactividad granular basada en Angular Signals (`signal`, `computed`, `effect`, `input()`, `output()`).
  4. Uso del nuevo Control Flow (`@if`, `@for`, `@switch`, `@defer`) en plantillas.
  5. Consumo de endpoints de backend mediante `HttpClient` mapeando excepciones a `ProblemDetail` (RFC 7807/9457).
  6. Directiva/Pipe de visualización de radicado judicial (`RadicadoPipe`).

### Fase 4: Estándares de Fechas y Tiempos (`datetime-standards`)
* **Objetivo:** Garantizar coherencia temporal, legal y de zonas horarias en toda la aplicación.
* **Actividades Obligatorias:**
  1. Transporte y almacenamiento de marcas de tiempo en formato ISO-8601 UTC (`...Z`).
  2. Cálculos de términos y vencimientos procesales basados en instantes absolutos.
  3. Presentación al usuario en hora local del navegador o hora legal colombiana (`America/Bogota` / COT) empleando `datetime.utils.ts`.

### Fase 5: Documentación, Auditoría e Indexación (`agent-docs-updater` / `dokqet-frontend-orchestrator`)
* **Objetivo:** Verificación técnica y sincronización del conocimiento del repositorio.
* **Actividades Obligatorias:**
  1. Compilar y verificar el bundle de producción mediante `npm run build`.
  2. Sincronizar diagramas y catálogos en `AGENTS.md` (y `AGENT.md`) y `GEMINI.md`.
  3. Ejecutar el protocolo obligatorio de cierre y archivo de historias a `docs/stories/implemented/`.

---

## 2. Puertas de Calidad (Quality Gates)

No se puede avanzar entre fases si no se cumplen las siguientes condiciones:
* **Fase 1 ➔ Fase 2:** La historia debe tener criterios Gherkin claros y modelos TypeScript definidos.
* **Fase 2 ➔ Fase 3:** El diseño debe respetar Tailwind semántico y contraste WCAG 2.1 AA.
* **Fase 3 ➔ Fase 4:** Cero NgModules, cero `@Input` clásico, cero variables `any` sin justificar.
* **Fase 4 ➔ Fase 5:** Todas las fechas deben cumplir la regla de oro UTC <-> COT.
* **Cierre:** `npm run build` debe terminar con 0 errores y bundle optimizado.

---

## 3. Protocolo Obligatorio de Archivo y Traslado a `docs/stories/implemented/`

Al superar satisfactoriamente la verificación técnica de la funcionalidad implementada (`npm run build` con 0 errores):

1. **Actualizar el Estado del Documento**:
   - Modificar en el encabezado de la historia markdown:
     ```markdown
     * **Estado:** 🚀 Implementada / Verificada
     ```
2. **Completar la Definición de Hecho (DoD)**:
   - Marcar con `[x]` todos los ítems de verificación en la sección de criterios de aceptación y DoD.
3. **Mover Físicamente el Archivo Markdown**:
   - Trasladar el archivo desde `docs/stories/HU-XXX-{slug}.md` hacia `docs/stories/implemented/HU-XXX-{slug}.md`:
     ```bash
     mv docs/stories/HU-XXX-{slug}.md docs/stories/implemented/
     ```
4. **Propósito del Archivo Físico**:
   - Garantizar que la raíz `docs/stories/` contenga exclusivamente las historias pendientes o en desarrollo activo, manteniendo el backlog visible y despejado.
