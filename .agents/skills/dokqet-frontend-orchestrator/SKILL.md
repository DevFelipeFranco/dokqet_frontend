---
name: dokqet-frontend-orchestrator
description: >
  Master orchestrator and skill router for Dokqet Frontend (Angular 19+, TypeScript 5.6+, Tailwind CSS v3,
  Signals, Standalone Components, WCAG 2.1 AA). Dynamically detects, indexes, and audits all frontend project
  skills, maintains the central decision index in AGENTS.md, and coordinates multi-step development pipelines.
tags: [orchestrator, skill-router, pipeline, index, audit, frontend-architecture, dokqet, angular]
version: 1.0.0
---

# 🎯 Skill: Dokqet Frontend Master Orchestrator & Skill Router (`dokqet-frontend-orchestrator`)

## 1. Propósito y Alcance
Esta skill actúa como el **Director de Orquesta y Enrutador Maestro** de todas las capacidades, skills y agentes de IA en la interfaz web de **Dokqet** (`dokqet_frontend`).

Garantiza:
1. **Detección Dinámica e Indexación**: Escanear e indexar continuamente el catálogo de skills y subagentes en `.agents/skills/`, manteniendo rigurosamente sincronizados [`AGENTS.md`](file:///Users/felipe/Develop/Workspace%20Front/dokqet_frontend/AGENTS.md) y [`GEMINI.md`](file:///Users/felipe/Develop/Workspace%20Front/dokqet_frontend/GEMINI.md).
2. **Enrutamiento Inteligente de Requerimientos**: Analizar cualquier requerimiento de usuario y activar con precisión la skill o secuencia de skills idónea según el árbol de decisión arquitectural del frontend.
3. **Coordinación de Pipelines Frontend End-to-End**: Orquestar el ciclo de vida completo de nuevas vistas, módulos o componentes a través de las 5 fases estándar de desarrollo de UI en Dokqet.
4. **Auditoría de Cumplimiento Tecnológico**: Verificar que todo código generado o skill configurada cumpla las reglas inviolables del frontend (Angular 19+, Standalone Components, Signals, `inject()`, Tailwind CSS v3, WCAG 2.1 AA, Cero NgModules clásicos, Cero almacenamiento local de binarios judiciales).

---

## 2. Árbol de Enrutamiento y Despacho Operativo

```
                                  [Requerimiento de Frontend / UI]
                                                 │
                                                 ▼
                               ┌──────────────────────────────────┐
                               │  dokqet-frontend-orchestrator    │
                               │      (Enrutador Maestro)         │
                               └────────────────┬─────────────────┘
                                                │
         ┌──────────────┬──────────────┬────────┼──────────────┬──────────────┐
         ▼              ▼              ▼        ▼              ▼              ▼
    [Req / BDD]    [Diseño / UI]  [Angular / Code] [Fechas / Tiempos] [Docs & Index] [Nuevos Agentes]
   agile-user-       ui-ux-        angular-        datetime-       agent-docs-    Extensibilidad
     stories-        pro-max       developer       standards         updater         Dinámica
     expert                                                                       (Subagentes)
```

---

## 3. Pipeline de Desarrollo Frontend (5 Fases de Dokqet)

Cuando se implementa una nueva funcionalidad de interfaz, pantalla o módulo judicial en el frontend, `dokqet-frontend-orchestrator` coordina la ejecución en el siguiente orden secuencial estricto:

| Fase | Skill Responsable | Entregables Clave |
| :--- | :--- | :--- |
| **Fase 1: BDD y Requerimientos UI** | `agile-user-stories-expert` | Historias de usuario en `docs/stories/` con criterios Gherkin (Dado-Cuando-Entonces), reglas de negocio de frontend (RN-FE), modelos TypeScript y accesibilidad. |
| **Fase 2: Diseño Visual y UX** | `ui-ux-pro-max` | Paletas semánticas, jerarquía visual, diseño responsive mobile-first con Tailwind CSS, microinteracciones, contraste WCAG 2.1 AA (mínimo 4.5:1) y control de CLS (< 0.1). |
| **Fase 3: Arquitectura, Signals y Código** | `angular-developer` | Standalone Components, reactividad con Angular Signals (`signal`, `computed`, `effect`), Signal inputs/outputs, nuevo Control Flow (`@if`, `@for`, `@switch`, `@defer`), consumo HTTP imperativo con `inject(HttpClient)` y mapeo de errores RFC 7807 (`ProblemDetail`). |
| **Fase 4: Estándares de Fechas y Tiempos** | `datetime-standards` | Almacenamiento/transporte en UTC (`Z`), cálculo de términos procesales e instantes absolutos, y presentación en hora local o COT (`America/Bogota`) mediante `datetime.utils.ts`. |
| **Fase 5: Documentación, Auditoría y Archivo** | `agent-docs-updater` / `dokqet-frontend-orchestrator` | Verificación de compilación de producción (`npm run build`), actualización de índices en `AGENTS.md` y `GEMINI.md`, actualización de estado de la historia a `🚀 Implementada / Verificada` y traslado físico a `docs/stories/implemented/`. |

---

## 4. Reglas Inviolables (Hard Constraints)

1. **Cero Salto de Fases en Nuevas Vistas**: No implementar componentes o maquetaciones complejas sin haber formalizado previamente la historia de usuario BDD o el diseño visual adaptativo.
2. **Veto a Patrones Obsoletos de Angular**: Prohibido el uso de `NgModule`, decoradores `@Input()` / `@Output()` clásicos (usar `input()`, `output()`), constructores con `@Inject` (usar `inject()`) o directivas estructurales antiguas `*ngIf`/`*ngFor` (usar `@if`, `@for`).
3. **Cero Almacenamiento ni Retransmisión de Archivos Binarios**: La previsualización de PDFs y providencias de la Rama Judicial o estados del micrositio se efectúa directamente en el navegador del cliente vía `blob:` e `<iframe>` seguro; nunca se envían binarios pesados a través del backend propio.
4. **Verificación Automatizada Obligatoria**: Todo cambio debe verificarse ejecutando `npm run build` sin errores antes de dar por cerrada la tarea.

---

## 5. Índice de Documentos de Referencia y Reglas

* 📏 **[Reglas del Pipeline de Orquestación Frontend](rules/orchestration-pipeline-rules.md):** `rules/orchestration-pipeline-rules.md`
* 📏 **[Reglas de Detección e Indexación de Skills y Agentes](rules/skill-index-detection-rules.md):** `rules/skill-index-detection-rules.md`
* 🛠️ **[Script de Auditoría de Skills](scripts/audit_skills.sh):** `scripts/audit_skills.sh`
