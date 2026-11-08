# 🔍 Reglas de Detección e Indexación de Skills y Agentes (`skill-index-detection-rules.md`)

Este documento define el protocolo y las reglas para descubrir, auditar, registrar y mantener actualizado el catálogo de skills y subagentes en la plataforma Dokqet Frontend.

---

## 1. Descubrimiento Dinámico de Skills y Agentes

Toda skill o agente operativo de la plataforma Dokqet Frontend debe residir en `.agents/skills/{skill-name}/` y cumplir la siguiente estructura mínima:
1. `SKILL.md`: Archivo con frontmatter YAML que defina `name`, `description`, `tags` y `version`.
2. `rules/`: Carpeta con directrices técnicas obligatorias y reglas no negociables.
3. `examples/`, `references/` o `templates/`: Recursos, referencias arquitectónicas o plantillas de código TypeScript / HTML / CSS / Markdown.

### 📋 Algoritmo de Detección e Indexación:
1. **Escanear Directorio de Skills**:
   Listar todos los subdirectorios en `.agents/skills/`.
2. **Validar Frontmatter de `SKILL.md`**:
   Verificar que contenga las etiquetas obligatorias, versión y descripción del rol.
3. **Auditar Conformidad Tecnológica Frontend**:
   Inspeccionar el contenido en busca de antipatrones o términos incompatibles:
   - ⛔ Si propone `NgModule`, `@NgModule`, decoradores `@Input()`/`@Output()` clásicos, `*ngIf`, `*ngFor` o inyección por constructor clásico ➔ **Alerta Crítica: Requiere migración a Standalone Components, Signals, nuevo Control Flow e `inject()`**.
   - ⛔ Si propone backend Java, JPA, Flyway, WebFlux o R2DBC dentro de skills frontend ➔ **Alerta: Error de alcance arquitectural; corresponde a dokqet-backend**.
   - ✅ Debe validar cumplimiento con: `Angular 19+`, `TypeScript 5.6+`, `Signals`, `Standalone`, `Tailwind CSS v3`, `WCAG 2.1 AA` y `datetime-standards`.
4. **Sincronizar `AGENTS.md` (y `AGENT.md`)**:
   - Agregar el nuevo nodo en el diagrama Mermaid del árbol de decisión operativa.
   - Añadir la ficha detallada en la Sección 3 (Catálogo e Índice de Skills Operativas).
   - Actualizar el árbol ASCII de directorios en la Sección 4.
5. **Sincronizar `GEMINI.md`**:
   - Incluir la skill en la lista de skills disponibles en la Sección 4 de `GEMINI.md`.

---

## 2. Matriz Canónica de Skills de Dokqet Frontend

```
┌──────────────────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Nombre de la Skill                   │ Responsabilidad Primordial                                  │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 1. dokqet-frontend-orchestrator      │ Orquestador maestro, enrutador y auditor del pipeline UI    │
│ 2. agile-user-stories-expert         │ Historias de usuario BDD Gherkin, RN-FE y modelos TS        │
│ 3. ui-ux-pro-max                     │ Inteligencia de diseño visual, Tailwind, WCAG 2.1 AA y UX   │
│ 4. angular-developer                 │ Componentes Standalone, Signals, inject(), Control Flow     │
│ 5. datetime-standards                │ Regla de oro temporal: UTC (Z) <-> America/Bogota (COT)     │
│ 6. agent-docs-updater                │ Sincronización continua de AGENTS.md y GEMINI.md            │
└──────────────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 3. Registro de Subagentes y Nuevas Skills

Cuando un desarrollador o agente crea un nuevo rol especializado (ej. un subagente de accesibilidad `a11y-auditor`, un generador de pruebas `frontend-test-generator`, o un validador de contratos OpenAPI `api-contract-sync`):

1. **Creación del Directorio**: Crear `.agents/skills/{nueva-skill}/` con su respectivo `SKILL.md` y `rules/`.
2. **Definición de Triggers**: Especificar con claridad en qué situaciones debe activarse (palabras clave, extensiones de archivo o flujos de trabajo).
3. **Integración en el Enrutador Maestro**:
   - Abrir `.agents/skills/dokqet-frontend-orchestrator/SKILL.md` e insertar la nueva capacidad en el diagrama ASCII de enrutamiento.
   - Actualizar el pipeline si la skill interviene en una de las fases o crea una fase adicional.
4. **Actualización Inmediata de Documentación Central**:
   - Invocar `agent-docs-updater` para reflejar la adición en `AGENTS.md` (y `AGENT.md`) y `GEMINI.md`.
5. **Verificación de Enlaces**: Garantizar que todas las rutas de archivo relativas o absolutas funcionen correctamente.
