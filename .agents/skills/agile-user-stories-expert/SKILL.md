---
name: agile-user-stories-expert
description: >
  Diseña, estructura, valida y redacta historias de usuario con criterios de aceptación en formato
  Gherkin (Dado-Cuando-Entonces / Given-When-Then), reglas de negocio de interfaz (RN-FE), modelos TypeScript
  y arquitectura Angular (Signals, Standalone Components, Tailwind CSS, Jasmine/Karma) para la plataforma Dokqet
  exclusivamente dentro de docs/stories/, y gestiona su transición a estado implementado (🚀 Implementada / Verificada)
  y traslado físico a docs/stories/implemented/ al verificarse satisfactoriamente.
tags: [frontend, angular, user-stories, agile, bdd, gherkin, signals, tailwind, ui-ux, dokqet, testing]
version: 2.1.0
---

# 📋 Skill: Agile User Stories & Gherkin Requirements Expert for Frontend (`agile-user-stories-expert`)

## 1. Propósito y Alcance
Esta skill guía a los Agentes de Inteligencia Artificial en la creación, refinamiento, mantenimiento y archivo de **historias de usuario ágiles con especificaciones ejecutables BDD en formato Gherkin para el Frontend de Dokqet** (Plataforma de Vigilancia y Gestión Judicial Automatizada para Colombia en **Angular 19+**), asegurando que:

1. Cada requerimiento funcional o de experiencia de usuario quede documentado **estrictamente dentro del subdirectorio [`docs/stories/`](docs/stories/)** (creándolo automáticamente si no existe) bajo el estándar oficial `HU-{NN}-{kebab-case-slug}.md`.
2. Los criterios de aceptación se redacten en **Gherkin riguroso** (`Dado`, `Cuando`, `Entonces`, `Y`), modelando con precisión la interacción del usuario, transiciones de señales (`signals`), renderizado condicional, estados de carga y respuestas de APIs REST (`ProblemDetail` RFC 9457).
3. Se definan claramente los **modelos de datos TypeScript** (`src/app/core/models/`), **reglas de interacción y validación en cliente (RN-FE)** (Radicado 23 dígitos, DIAN Módulo 11, validadores reactivos) y su mapeo con la arquitectura Angular.
4. Se apliquen los estándares de diseño y accesibilidad de Dokqet: **Tailwind CSS**, diseño adaptativo (Mobile/Tablet/Desktop), **WCAG 2.1 AA** (navegación por teclado, contraste, lectores de pantalla) y **Skeleton Loaders contextuales** para suprimir spinners de bloqueo global (CLS < 0.1).
5. Se gestione el **ciclo de vida de la historia hasta su cierre**: al superar la verificación técnica (`npm run build` con 0 errores), actualizar su estado a `🚀 Implementada / Verificada` y mover físicamente el archivo a [`docs/stories/implemented/`](docs/stories/implemented/).

---

## 2. Cuándo Activar esta Skill (Triggers)

Activar esta skill cuando:
- El usuario solicita crear una nueva historia de usuario o especificar una funcionalidad para la interfaz de usuario de Dokqet.
- Se requiere convertir requerimientos de UI/UX o nuevos endpoints del backend en especificaciones formales BDD / Gherkin para Angular.
- Se necesita refinar o agregar escenarios de prueba visuales, flujos de formulario o criterios de aceptación a una historia en `docs/stories/`.
- Se introducen nuevos componentes, páginas (`features/`), servicios (`core/services/`), interceptores o modelos (`core/models/`) que requieran contratos previos a su implementación.
- Se auditan historias de frontend para garantizar compatibilidad con Angular Signals, Standalone Components y prevención de saltos de maquetación (CLS).

---

## 3. Reglas Inviolables (Hard Constraints)

1. **Ubicación Exclusiva y Obligatoria en `docs/stories/`**:  
   - Todas las historias DEBEN residir **exclusivamente en `docs/stories/`**.
   - **Creación Automática:** Si la carpeta `docs/stories/` no existe en el proyecto, el agente **DEBE crearla automáticamente** antes de generar cualquier historia. Queda estrictamente prohibido guardar historias en la raíz de `docs/` o fuera de `docs/stories/`.
   - **Nomenclatura Obligatoria:** El archivo DEBE incluir el prefijo `HU-` seguido del número de historia (2 o 3 dígitos) y un slug en `kebab-case` descriptivo: `HU-{NN}-{kebab-case-slug}.md` (ejemplo: `HU-17-regulacion-intentos-fallidos-bloqueo-cuenta.md`, `HU-16-skeleton-loaders-experiencia-usuario.md`). Queda prohibido nombrar archivos sin código numérico o con formatos arbitrarios.
2. **Estructura Obligatoria de 7 Secciones**:
   - Sección 1: Información General (ID, Código Equivalente Backend, Título, Módulos/Rutas, Estado, Prioridad, Actores de UI).
   - Sección 2: Narrativa de Negocio y Experiencia de Usuario (`Como [Rol] Quiero [Interacción en Interfaz] Para [Beneficio]`).
   - Sección 3: Modelos de Datos en Cliente y Contratos API (Interfaces TypeScript, DTOs, Enums y ProblemDetail).
   - Sección 4: Reglas de Negocio en Frontend (`RN-FE-01`, `RN-FE-02`, etc., validaciones de formularios, estados de UI y accesibilidad).
   - Sección 5: Criterios de Aceptación Gherkin (Bloque ```gherkin con `# language: es` o `# language: en` cubriendo flujos de UI y red).
   - Sección 6: Mapeo a la Arquitectura Angular (`features/`, `shared/components/ui/`, `core/services/`, `core/auth/`, `core/models/`, `app.routes.ts`).
   - Sección 7: Guía y Ejemplos Prácticos de Prueba (Pruebas unitarias Jasmine/Karma con `TestBed`, comandos `npx ng test` y verificación manual).
3. **Cero Historias con Modelado Superficial**: Prohibido asumir payloads sin tipos estrictos o dejar sin especificar estados de error (`400`, `401`, `403`, `423`, `500`), estados de carga (`Skeleton`) y estados vacíos (`Empty States`).
4. **Adopción Estricta de Angular Moderno (Signals & Standalone)**:
   - Se debe privilegiar la reactividad nativa mediante Signals (`signal()`, `computed()`, `linkedSignal()`) sobre variables mutables sin control reactivo.
   - Todo componente referenciado debe ser **Standalone** (`standalone: true`).
5. **Inspección y Validación Obligatoria de la Arquitectura Preexistente (Cero Duplicación)**:
   - **Antes de redactar cualquier historia**, el agente DEBE inspeccionar el árbol del frontend (`src/app/core/`, `src/app/features/`, `src/app/shared/components/ui/`) para verificar qué componentes, servicios, rutas o validadores **ya existen**.
   - **Prohibición de Duplicación:** Está terminantemente prohibido proponer la creación de componentes o servicios que ya existan en el proyecto.
   - **Etiquetado Explícito Obligatorio:** En la Sección 3 (*Modelos*) y Sección 6 (*Mapeo Arquitectónico*), cada archivo o componente DEBE clasificarse obligatoriamente con:
     - `[EXISTENTE - REUTILIZADO]`: Ya existe y se consume tal cual sin duplicar.
     - `[MODIFICADO / POR EXTENDER]`: Ya existe pero requiere nuevos métodos, signals o ajustes de plantilla.
     - `[NUEVO / POR CREAR]`: No existe actualmente en el código fuente y debe desarrollarse desde cero.

---

## 4. Flujo de Trabajo (Workflow) para Crear una Historia

```
┌──────────────────────────────────────────────┐
│ 0. Auditar Código y Arquitectura Frontend    │
│    (src/app/core, features, shared, routes)  │
└──────────────────────┬───────────────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│ 1. Clarificar Requerimiento y Actores de UI  │
│    (Identificar Reutilizado vs Nuevo)        │
└──────────────────────┬───────────────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│ 2. Modelar Interfaces TypeScript y RN-FE     │
│    (Formularios, Skeletons, Validaciones)    │
└──────────────────────┬───────────────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│ 3. Redactar Escenarios Gherkin de UI         │
│    (Interacción, Red, Accesibilidad)         │
└──────────────────────┬───────────────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│ 4. Mapear a Componentes y Servicios Angular  │
│    ([EXISTENTE] / [MODIFICADO] / [NUEVO])    │
└──────────────────────┬───────────────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│ 5. Asegurar docs/stories/                    │
│    y Registrar HU-NN-{slug}.md               │
└──────────────────────────────────────────────┘
```

---

## 5. Índice de Referencias, Reglas y Plantillas

* 📏 **[Reglas de Formato y Estructura](rules/story-format-rules.md):** `rules/story-format-rules.md`
* 📏 **[Reglas de Sintaxis y Escenarios Gherkin](rules/gherkin-rules.md):** `rules/gherkin-rules.md`
* 📏 **[Reglas de Ciclo de Vida y Reactividad](rules/story-lifecycle-rules.md):** `rules/story-lifecycle-rules.md`
* 📋 **[Plantilla Oficial de Historia de Usuario](templates/user-story-template.md):** `templates/user-story-template.md`
* 💡 **[Ejemplo de Referencia Frontend](examples/HU-000-sample-frontend-feature.md):** `examples/HU-000-sample-frontend-feature.md`
