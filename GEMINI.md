<!-- clean-code-skills:begin v4.0.0 -->
## Clean Code Rules (clean-code-skills)

Non-negotiable for all code work.

**Read the skill before non-trivial work.** First existing path wins: `.claude/skills/clean-code/SKILL.md`, `.agents/skills/clean-code/SKILL.md`, `.github/skills/clean-code/SKILL.md`, `skills/clean-code/SKILL.md`. Then your stack's packs, named by the skill's `scripts/detect_stack.py` or `references/framework-map.md`.

**Load project context first.** If present: `.clean/context.json`, `.clean/architecture.md`, `.clean/decisions.md`, `.clean/ledger.md`, `.clean/structure.md` rows for your area; then project instruction files. Recorded decisions are settled. Project instructions outrank this block.

### Work Loop

1. Frame: behavior change, design-relevant assumptions, smallest scope, success check.
2. Read first: nearby code, naming, tests, error style, framework idioms; search for existing implementations.
3. Place: owning unit; which side of which boundary.
4. Edit surgically: smallest diff, targeted edits (no whole-file regeneration), nothing unrelated; remove what your change orphaned.
5. Verify: narrowest meaningful check, broader as risk demands.
6. Review the diff against these rules, missing tests included.

### Layers

- Undeclared layers (`.clean/architecture.md`): follow framework pack's idiomatic structure.
- Declared: Dependency Rule strict; source dependencies point inward, to higher-level policy; nothing inner names anything outer (class, function, variable, annotation, data format).
- Business rules highest; database, web, UI, framework are details behind policy-owned interfaces.
- SQL stays in data access; rows, ORM types, framework request/response objects never travel inward. Never derive business objects from framework base classes or annotate them; dependency-injection wiring in `main`.
- Component graph acyclic; no speculative boundary, layer, or service.

### File And Code Placement

- Role decides folder, per pack roles and project layout; mirror similar files. Resolve paths from project root, never defaulting to repository root or current directory.
- New file only without a cohesive home; wire fully (imports, exports, registration, build config). Unreferenced files are dead code.
- Never create sibling variants (`_v2`, `_new`, `_final`, `_enhanced`, `_copy`) or grow junk drawers (`utils`, `helpers`, `common`); name the domain concept.
- Narrowest access modifier; no scratch files or debug output in project tree.

### One Job Per Unit

- Single responsibility at every scale. Needs "and" to describe? Split.
- Parsing, domain rules, persistence, external calls, presentation, construction: separate homes. Orchestrators sequence collaborators, hold no business rules.
- Different actors' code stays apart, even if identical today. New behavior goes to its owning unit, not the open file.

### Quality Bars

- Names reveal intent, use project vocabulary, disclose side effects.
- Functions: one thing, one abstraction level. Comments: why, never what or how; short.
- Never swallow errors; keep causes and context; model expected alternate outcomes as values; no secrets in logs.
- Tests deterministic, behavior-focused. Never weaken, skip, or delete failing tests; never verify business rules through UI.
- Verify every API, function, option, config key against this codebase and installed versions; never trust memory.
- Deduplicate only copies that must change together.
- Match local style; formatters and linters own formatting.

### Scope And Honesty

- Surgical by default: report unrelated smells, never fix them unless the requested outcome needs it: smallest fix, reported separately. Whole-project cleanup only on explicit request (`references/project-refactor.md`).
- Report honestly: commands run, results, what was not run, remaining risk. Never claim unverified success or present a stub or placeholder as finished.
- Record lasting decisions in `.clean/decisions.md`, if present.

### Keeping These Rules Current

This block is installer-owned: never hand-edit. To update, re-run the installer from project root, or ask the user. Never fetch and execute a remote script on your own initiative.
<!-- clean-code-skills:end -->

---

# GUÍA DE ARQUITECTURA, STACK TECNOLÓGICO Y COMANDOS - DOKQET FRONTEND

## 1. Contexto del Producto y Dominio
**Dokqet** es la plataforma SaaS especializada en la **vigilancia, seguimiento y gestión automatizada de expedientes judiciales en Colombia** (Radicado de 23 dígitos, Portal Único de la Rama Judicial, Habeas Data Ley 1581 de 2012, validación tributaria DIAN con Módulo 11 y multi-tenancy para litigantes y firmas).

### Stack Tecnológico Obligatorio (Frontend)
- **Framework:** Angular 19+ (Standalone Components, Signals, Signal Inputs/Outputs, Control Flow `@if`/`@for`/`@switch`, `@defer`, inyección con `inject()`, `ChangeDetectionStrategy.OnPush`)
- **Lenguaje:** TypeScript 5.6+ / ES2022+ en modo estricto
- **Estilos y Maquetación:** Tailwind CSS v3 + PostCSS, diseño adaptativo mobile-first, soporte modo oscuro (`dark:`), accesibilidad WCAG 2.1 AA
- **Comunicación HTTP:** `HttpClient` consumiendo la API REST imperativa de Spring Boot 3.4.1 con `ProblemDetail` (RFC 7807 / RFC 9457)
- **Seguridad:** Tokens PASETO v4 almacenados en el estado de autenticación de la sesión
- **Dominio Judicial:** Máscara y validación de radicado de 23 dígitos (`RadicadoPipe`), cálculo de Dígito de Verificación DIAN (Módulo 11), visualización y descarga de providencias en visor PDF embebido (`<iframe>`) directo en navegador sin almacenamiento de binarios

---

## 2. Estructura de Paquetes y Directorios (`src/app`)
- **`core`**:
  - `auth`: `AuthService`, guardianes de ruta (`auth.guard`, `guest.guard`).
  - `models`: Modelos e interfaces de datos TypeScript (`process.model.ts`, `organization.model.ts`, `catalog.model.ts`, `user.model.ts`, `scheduler-admin.model.ts`, `super-admin.model.ts`).
  - `services`: Servicios HTTP singleton (`ProcessService`, `OrganizationService`, `CatalogService`, `SuperAdminService`, `NotificationService`).
  - `state`: Stores reactivos basados en Signals (`OrganizationStore`).
  - `utils`: Utilidades de fecha y hora (`datetime.utils.ts`) cumpliendo con `datetime-standards` (UTC <-> America/Bogota).
- **`features`**:
  - `admin`: Backoffice para `SUPER_ADMIN` (overview ejecutivo de salud de rondas, gestión de usuarios, auditoría, cron/schedulers, catálogos, detalle de organizaciones).
  - `auth`: Registro, activación de cuenta, inicio de sesión.
  - `dashboard`: Panel principal de métricas y acceso rápido.
  - `processes`: Registro de procesos, listado paginado con búsqueda unaccent insensible a tildes, agrupación de instancias con `groupLatest`, detalle del expediente (`process-detail`), consulta bajo demanda con cooldown de 10 min, visor de estados y autos del micrositio, consulta de documentos de actuaciones de la Rama Judicial con modal de vista previa directa y descarga.
  - `profile`: Perfil del usuario autenticado.
- **`shared`**:
  - `components/ui`: Componentes atómicos reutilizables (`Card`, `Button`, `Modal`, `EmptyState`, `FormAlert`, `Breadcrumbs`, `StatCard`, `Skeleton`).
  - `pipes`: Filtros puros (`RadicadoPipe`).

---

## 3. Comandos Operativos Clave (CLI)

### A. Servidor de Desarrollo Local
```bash
# Iniciar servidor de desarrollo en http://localhost:4200
npm start
# o con Angular CLI:
ng serve
```

### B. Compilación y Construcción (Production Build)
```bash
# Compilar bundle de producción optimizado en dist/dokqet-frontend
npm run build
```

### C. Modo Observador (Watch)
```bash
# Compilar continuamente en segundo plano ante cambios
npm run watch
```

### D. Auditoría de Skills del Frontend
```bash
# Validar e inspeccionar integridad de skills instaladas
./.agents/skills/dokqet-frontend-orchestrator/scripts/audit_skills.sh
```

---

## 4. Skills de Agentes Disponibles en Frontend
Consultar la guía completa de skills y árbol de decisiones en [`AGENTS.md`](AGENTS.md) (o [`AGENT.md`](AGENT.md)):
- `dokqet-frontend-orchestrator`: Orquestador maestro, enrutador de capacidades, pipeline de 5 fases y auditoría de indexación.
- `agent-docs-updater`: Sincronización continua de `AGENTS.md` y `GEMINI.md` en el frontend.
- `agile-user-stories-expert`: Redacción de historias BDD Gherkin para frontend en `docs/stories/` y archivo/transición a `docs/stories/implemented/` al completarse.
- `angular-developer`: Desarrollo y arquitectura de componentes Standalone, servicios, signals y enrutamiento en Angular 19+.
- `ui-ux-pro-max`: Inteligencia de diseño visual, accesibilidad WCAG 2.1 AA, paletas de color, tipografía y responsive layout.
- `datetime-standards`: Estándares de fechas, instantes UTC, cálculo de términos procesales y formateo en hora local/COT.

---

## 5. Protocolo para Registro de Nuevas Skills y Agentes
Cualquier nueva skill o subagente creado en `.agents/skills/{nueva-skill}/` debe:
1. Incluir `SKILL.md` con frontmatter YAML estándar (`name`, `description`, `tags`, `version`).
2. Respetar la arquitectura obligatoria de Angular 19+ (Standalone, Signals, Tailwind CSS).
3. Ser indexado en la Sección 2 (diagrama Mermaid) y Sección 3 (catálogo) de `AGENTS.md` / `AGENT.md`.
4. Ser indexado en la Sección 4 de `GEMINI.md`.
5. Ser auditado mediante `./.agents/skills/dokqet-frontend-orchestrator/scripts/audit_skills.sh`.
