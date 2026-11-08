---
name: agent-docs-updater
description: >
  Use whenever a new skill is created, modified, or removed, or when new architecture modules,
  UI features, or operational commands are introduced in the frontend. Ensures AGENTS.md (catalog,
  decision diagrams, file trees) and GEMINI.md (architectural context, CLI commands, configs)
  stay completely synchronized for dokqet-frontend.
tags: [agent-engineering, documentation, mermaid, skills-sync, gemini-context, dev-commands, dokqet, frontend, angular]
version: 2.0.0
---

# 🤖 Skill: Agent Documentation & Context Synchronizer for Frontend (`agent-docs-updater`)

## 1. Propósito y Alcance
Esta skill estandariza y automatiza el mantenimiento de la **documentación operativa de los Agentes de IA** en el repositorio `dokqet-frontend` (Plataforma Dokqet — Vigilancia y Gestión Judicial Automatizada para Colombia — Interfaz SPA en **Angular 19+** con TypeScript y Tailwind CSS).

Garantiza que:
1. **`AGENTS.md`** se mantenga como la fuente de verdad operativa del frontend, actualizando:
   - El **Árbol de Decisión Operativa (Diagrama Mermaid)** cuando se agreguen nuevas rutas o skills (Angular 19+, Signals, Tailwind CSS, UI/UX Pro Max, Requerimientos BDD Gherkin, Estándares DateTime).
   - El **Catálogo e Índice de Skills del Frontend** con sus propósitos, triggers y enlaces a reglas/ejemplos.
   - La **Estructura de Directorios ASCII** de `.agents/skills/`.
2. **`GEMINI.md`** se mantenga enriquecido con:
   - **Comandos Operativos Relevantes** (Angular CLI, npm scripts: `npm run build`, `npm start`, `npm run watch`).
   - **Contexto Arquitectural y Funcional** actualizado a medida que se agregan nuevas características (`src/app/features/**`), modelos (`src/app/core/models/**`), servicios HTTP (`src/app/core/services/**`) o componentes reutilizables (`src/app/shared/**`).

---

## 2. Reglas Inviolables (Hard Constraints)

1. **Sincronización Inmediata y Atómica**: Cada vez que se cree o modifique una skill en `.agents/skills/{skill-name}/`, se DEBE actualizar de forma atómica tanto `AGENTS.md` como `GEMINI.md` en la raíz del frontend antes de concluir la tarea.
2. **Validez Estricta de Mermaid**: Prohibido introducir caracteres que rompan el parser de Mermaid en `AGENTS.md` (como paréntesis sin comillas o nodos mal anidados). Las etiquetas de nodos con símbolos especiales DEBEN delimitarse con comillas dobles: `nodeId["Texto (con detalle)"]`.
3. **Formato de Enlaces `file://` con URL-Encoding**: Todos los hipervínculos a archivos locales en `AGENTS.md` deben usar la sintaxis `[Nombre](file:///ruta/absoluta)` y codificar espacios en blanco como `%20`.
4. **Cero Comandos Destructivos en `GEMINI.md`**: Los comandos registrados en `GEMINI.md` deben ser idempotentes o de consulta/ejecución segura para desarrollo y pruebas (ej. `npm run build`, `npm start`). Nunca incluir comandos destructivos sin salvaguardas explícitas.
5. **Preservación de la Estructura de Secciones**: No alterar los números de sección base ni la jerarquía de precedencia de reglas en `AGENTS.md`. No tocar los bloques delimitados por instaladores en `GEMINI.md`.
6. **Especialización Estricta en Frontend**: No contaminar la documentación del frontend con clases Java, Gradle, JPA o Hibernate del backend. Toda referencia técnica debe corresponder al stack Angular (Signals, Standalone Components, Tailwind CSS, TypeScript, `HttpClient`, TestBed).

---

## 3. Protocolo de Ejecución de la Skill (Workflow de 3 Pasos)

```
┌──────────────────────────────┐
│  PASO 1: Inspeccionar Skill  │ ➔ Extraer metadata YAML, reglas, examples y triggers de la skill frontend.
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  PASO 2: Sincronizar         │ ➔ Actualizar Diagrama Mermaid, Catálogo §3 y
│          AGENTS.md           │   Estructura de Directorios §4 en dokqet_frontend.
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  PASO 3: Sincronizar         │ ➔ Incorporar comandos npm/CLI asociados y contexto
│          GEMINI.md           │   de nuevos módulos en src/app/features, core o shared.
└──────────────────────────────┘
```

---

## 4. Guía Detallada de Actualización

### A. Actualización de `AGENTS.md`
Al detectar una nueva skill en `.agents/skills/<skill-name>`:
1. **Extraer Metadatos de `SKILL.md`**:
   - `name`: Identificador exacto del directorio.
   - `description`: Resumen del propósito y casos de uso.
   - `tags`: Etiquetas temáticas.
2. **Actualizar la Sección 3 (Catálogo e Índice de Skills)**:
   - Crear una nueva subsección `### {N}. <skill-name>`.
   - Incluir enlace a `SKILL.md`.
   - Listar **Propósito**, **Cuándo Activar (Triggers)** e **Índice de Referencias y Reglas** con links a cada archivo de `rules/` y `examples/` o `references/`.
3. **Actualizar el Diagrama Mermaid (Sección 2)**:
   - Evaluar si la nueva skill introduce una bifurcación de decisión para el agente (ej. UI/UX, Requerimientos BDD, Componentes Angular, Manipulación Temporal DateTime).
   - Agregar el nodo condicional y las ramas correspondientes asegurando que el flujo sea determinista.
4. **Actualizar la Estructura de Directorios (Sección 4)**:
   - Agregar la nueva carpeta bajo `skills/` listando los archivos creados (`SKILL.md`, `rules/*`, `examples/*` o `references/*`).

---

### B. Actualización de `GEMINI.md`
Al agregar nuevas pantallas, features, servicios o herramientas:
1. **Comandos Operativos**:
   - Si la funcionalidad introduce comandos de build, testing o serve, agregarlos en la sección correspondiente de `GEMINI.md`.
2. **Contexto de Módulos y Carpetas**:
   - Registrar nuevos subdirectorios bajo `src/app/features` (`admin`, `auth`, `dashboard`, `processes`, `profile`, etc.).
   - Documentar nuevos modelos en `src/app/core/models/`, servicios en `src/app/core/services/` o componentes de diseño en `src/app/shared/components/ui/`.
   - Registrar la integración con los contratos REST del backend (`ProblemDetail`, endpoints de consulta y control de cuotas).

---

## 5. Referencias y Reglas Asociadas
* 📏 **[Reglas de Sincronización Segura](rules/sync-rules.md):** `rules/sync-rules.md`
* 💡 **[Ejemplo de Actualización de `AGENTS.md`](examples/agents-update-example.md):** `examples/agents-update-example.md`
* 💡 **[Plantilla de Contexto `GEMINI.md`](examples/gemini-context-template.md):** `examples/gemini-context-template.md`
