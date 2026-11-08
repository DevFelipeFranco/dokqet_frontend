# 📖 Historia de Usuario: HU-29 - Agrupación Jerárquica de Instancias, Orden por Última Actuación del Grupo, Búsqueda en Vivo en BD con Notas y Paginación en el Panel de Procesos

---

## 📌 1. Información General de la Historia

| Metadato | Detalle |
| :--- | :--- |
| **Identificador** | `HU-29` (Equivalente: `HU-29-PROCESS-PANEL-GROUPS-SEARCH-NOTES`) |
| **Código Equivalente Backend** | `US-023` (`Agrupación de Instancias, Orden por Última Actuación del Grupo, Búsqueda en Vivo en Base de Datos con Inclusión de Notas y Paginación en el Panel de Procesos`) |
| **Título** | Agrupación Jerárquica de Instancias, Orden por Última Actuación del Grupo, Búsqueda en Vivo en BD con Notas y Paginación en el Panel de Procesos |
| **Épica** | Vigilancia Judicial Continua, Experiencia de Usuario en Litigio, Búsqueda Avanzada y Rendimiento |
| **Módulos / Rutas Angular** | `src/app/features/processes/list/` (`/panel` o `/procesos`), `src/app/core/models/process.model.ts`, `src/app/core/services/process.service.ts` |
| **Estado** | `🚀 Implementada / Verificada` |
| **Prioridad** | `Alta (Core Operativo Diario de Litigantes y Firmas Jurídicas)` |
| **Tipo** | `Experiencia de Usuario (UX/UI) / Funcionalidad Clave / Standalone Angular 19+` |
| **Actor Principal** | `Litigante / Abogado Responsable (`LAWYER`) / Administrador de Firma (`ADMIN`)` |
| **Referencias de Origen (`piloto`)** | Mejoras `9.21` y `9.22` (`lib/procesos/listado.ts`, `docs/documentacion-tecnica.md` v1.40 Secciones 4.1 y Regla 3.2.1) |
| **Historias Relacionadas** | Extiende `HU-28` (Resiliencia Rama, Cooldown y Recarga), `HU-14` (Rediseño UX Prodex/Dokqet), `HU-16` (Skeleton Loaders) y consume backend `US-023` |

---

## 🎯 2. Narrativa de Negocio y Experiencia de Usuario (User Story Narrative)

> **Como** abogado litigante y administrador de una firma jurídica en **Dokqet**,  
> **Quiero** visualizar mis expedientes agrupados por sus instancias procesales (primera y segunda instancia juntas en un solo bloque), ordenados según la actuación más reciente de todo el grupo con indicador explicativo si la novedad proviene de una subinstancia, disponer de un cuadro de búsqueda único con ejecución reactiva (`debounceTime`) que consulte en tiempo real sobre la base de datos (radicados, despachos, partes, actuaciones y notas privadas), y contar con paginación de servidor de 25 grupos por página con sincronización en la URL,  
> **Para** ubicar rápidamente cualquier expediente sin importar si la palabra clave está en una anotación privada o en un auto judicial, reducir el consumo de red en el cliente y mantener un control procesal ágil y confidencial entre colegas.

---

## 🔍 2.1. Diagnóstico del Estado Actual en `dokqet-frontend` y Brecha a Implementar

1. **Lista Plana No Agrupada:**
   - Actualmente, cada proceso y subproceso se lista como una fila o tarjeta independiente sin relación visual padre-hijo.
   - Si un caso tiene primera instancia (ej. radicado terminado en `00`) y apelación en segunda instancia (terminado en `01`), se muestran dispersos según sus fechas individuales.
   - **Solución (`Mejora 9.21`):** Renderizar una tarjeta principal para el proceso raíz con sus subprocesos identados dentro de un bloque secundario, mostrando etiqueta de instancia (`01`, `02`). Si un abogado con visibilidad restringida solo tiene asignada la subinstancia, se renderiza como tarjeta principal exponiendo el badge o referencia `parentRadicado`.

2. **Ordenamiento por Actuación Más Reciente del Grupo (`groupLatest`):**
   - El orden actual evalúa únicamente la fecha de última actuación del expediente individual.
   - Si la apelación en segunda instancia tuvo un auto ayer, pero la primera instancia no se mueve hace un año, el grupo debe posicionarse arriba de todo según la actividad de la subinstancia.
   - **Solución (`Mejora 9.21`):** Consumir el nuevo orden de backend (`reciente` o `antigua`). Si `groupLatest` viene poblado en la respuesta (`groupLatest: { fecha, instancia }`), desplegar en la tarjeta la fecha formateada acompañada del texto contextual: *"27 oct 2026 (en la 01)"*.
   - Los grupos sin actuaciones siempre se envían al final (`NULLS LAST`).

3. **Búsqueda en Vivo en BD con Indicador de Coincidencia (`matchedOnlyIn`):**
   - Actualmente, la búsqueda se hace filtrando un arreglo en memoria del frontend o sin consultar notas privadas ni actuaciones históricas.
   - **Solución (`Mejoras 9.21` y `9.22`):** Cuadro de búsqueda único con `debounceTime(400)` y tecla `Enter` inmediata. Envía el parámetro `?q=` al backend.
   - Cuando la respuesta devuelve `matchedOnlyIn === 'notas'`, desplegar en la tarjeta el badge de advertencia contextual:  
     `🏷️ Coincide en las notas` (color púrpura/índigo suave).
   - Cuando devuelve `matchedOnlyIn === 'actuaciones'`, desplegar:  
     `🏷️ Coincide en una actuación` (color azul suave).

4. **Paginación en Servidor y Sincronización en URL:**
   - Anteriormente se cargaban todos los procesos en un solo payload.
   - **Solución (`Mejora 9.21`):** Paginación por servidor a 25 grupos por página (`pageSize = 25`).
   - Controles de paginador: `"Página X de Y"` con botones `Anterior` y `Siguiente`, scroll automático al tope del listado.
   - Sincronización bidireccional en la URL mediante `queryParams`: `?q=...&order=reciente&page=1&filter=todos` con `{ replaceUrl: true }`.

---

## ⚖️ 3. Reglas de Negocio Frontend

1. **`RN-FE-023-01` — Modelo de Datos Agrupado (`ProcessGroupPageResponse`):**
   - Actualizar los modelos en `src/app/core/models/process.model.ts` para reflejar `ProcessGroupPageResponse`, `ProcessGroupItem`, `ProcessGroupProcess`, `ProcessGroupSubprocess` y `GroupLatest`.
   - Modificar `process.service.ts` para que `listProcesses(...)` retorne `Observable<ApiResponse<ProcessGroupPageResponse>>` aceptando `filter`, `q`, `order`, `page`, `pageSize`, `onlyMine`, `unassignedOnly`, `withNewsOnly` y `responsibleUserId`.

2. **`RN-FE-023-02` — Visualización de Instancias y Subprocesos:**
   - La tarjeta del proceso raíz expone el radicado completo de 23 dígitos con formato de copia, despacho, partes procesales y abogado asignado.
   - Los subprocesos se despliegan en un sub-panel o acordeón identado, mostrando la etiqueta de instancia (ej. `01`, `02`), despacho, última actuación y estado.
   - Si `item.groupLatest` existe, la cabecera del grupo muestra la fecha de actuación destacada y el texto explicativo `(en la XX)`.

3. **`RN-FE-023-03` — Badges de Coincidencia Contextual (`matchedOnlyIn`):**
   - Si `item.matchedOnlyIn === 'notas'`, mostrar píldora informativa: `"Coincide en las notas"`.
   - Si `item.matchedOnlyIn === 'actuaciones'`, mostrar píldora informativa: `"Coincide en una actuación"`.
   - Si `item.matchedOnlyIn == null`, no mostrar distintivo especial (coincidencia estándar en radicado, despacho o partes).

4. **`RN-FE-023-04` — Control de Búsqueda y Debounce:**
   - Input reactivo con `FormControl<string>` enlazado con `debounceTime(400)` y `distinctUntilChanged()`.
   - Presionar `Enter` cancela el debounce y dispara la búsqueda inmediatamente.
   - Si el usuario borra el texto, se refresca el listado restableciendo `page = 1`.

5. **`RN-FE-023-05` — Paginador de Grupos:**
   - Desplegar selector de orden (`Más recientes primero` / `Más antiguos primero`) mapeado a `order=reciente` y `order=antigua`.
   - Barra inferior con estado: `"Página X de Y (Total: Z grupos)"`.
   - Botón `Anterior` deshabilitado si `page === 1`. Botón `Siguiente` deshabilitado si `page >= pageCount`.

---

## 🌐 4. Contrato de Integración API con Backend (`dokqet-backend`)

### Endpoint Consumido
* **Método y Ruta:** `GET /api/v1/processes`
* **Query Parameters:**
  - `filter`: `"todos"` | `"mios"` | `"sin-asignar"` | `"novedades"`
  - `q`: string (máximo 100 caracteres)
  - `order`: `"reciente"` (predeterminado) | `"antigua"`
  - `page`: number (1-indexed, predeterminado 1)
  - `pageSize`: number (predeterminado 25)

### Estructura de Respuesta JSON (`ApiResponse<ProcessGroupPageResponse>`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "process": {
          "id": "op-root-1",
          "radicado": "11001310300120200012300",
          "instancia": null,
          "despacho": "Juzgado 01 Civil del Circuito de Bogotá",
          "departamento": "BOGOTA",
          "fechaUltimaActuacion": "2026-10-20",
          "ultimaConsulta": "2026-10-31T11:00:00Z",
          "ultimoResultado": "CHANGES",
          "esPrivado": false,
          "privadoDesde": null,
          "notes": "Cliente solicitó concepto el viernes",
          "responsibleLawyer": { "id": "usr-1", "name": "Carlos Rodríguez" },
          "responsibleUserId": "usr-1",
          "responsibleName": "Carlos Rodríguez",
          "representedParty": "DEMANDANTE",
          "parentId": null,
          "parentRadicado": null,
          "demandantes": ["Pedro Pérez"],
          "demandados": ["Compañía de Seguros S.A."],
          "newCount": 0,
          "instanceNotices": 0
        },
        "subprocesses": [
          {
            "id": "op-sub-1",
            "radicado": "11001310300120200012301",
            "instancia": "01",
            "despacho": "Tribunal Superior de Bogotá - Sala Civil",
            "departamento": "BOGOTA",
            "fechaUltimaActuacion": "2026-10-28",
            "ultimaConsulta": "2026-10-31T11:00:00Z",
            "ultimoResultado": "CHANGES",
            "esPrivado": false,
            "notes": null,
            "responsibleLawyer": { "id": "usr-1", "name": "Carlos Rodríguez" },
            "responsibleUserId": "usr-1",
            "responsibleName": "Carlos Rodríguez",
            "representedParty": "DEMANDANTE",
            "parentId": "op-root-1",
            "parentRadicado": "11001310300120200012300",
            "demandantes": ["Pedro Pérez"],
            "demandados": ["Compañía de Seguros S.A."],
            "newCount": 1,
            "instanceNotices": 0
          }
        ],
        "groupLatest": {
          "fecha": "2026-10-28",
          "instancia": "01"
        },
        "matchedOnlyIn": "notas"
      }
    ],
    "total": 48,
    "page": 1,
    "pageSize": 25,
    "pageCount": 2,
    "unassignedCount": 3,
    "withNewsCount": 5,
    "hasProcesses": true,
    "seesAll": true,
    "visibility": "ALL_MEMBERS"
  }
}
```

---

## ✅ 5. Criterios de Aceptación BDD (Gherkin)

```gherkin
# language: es
Característica: Agrupación, orden, búsqueda y notas en panel de procesos (HU-29)
  Como abogado litigante de Dokqet
  Quiero ver mis expedientes agrupados por instancias, ordenados por actividad reciente y buscar en notas
  Para encontrar y gestionar mis procesos con máxima velocidad y contexto

  Escenario: 1. Renderizado de grupo procesal con subproceso y anotación de instancia más reciente
    Dado que el backend retorna un grupo con proceso principal y subproceso "01" cuya última actuación es más reciente
    Cuando el usuario ingresa al panel de procesos
    Entonces la tarjeta principal muestra el radicado del padre
    Y muestra una sección identada con el subproceso "01"
    Y la fecha principal de la tarjeta despliega la fecha del subproceso con el texto "(en la 01)"

  Escenario: 2. Distintivo contextual de coincidencia en notas privadas
    Dado que el usuario busca el término "apelacion"
    Y el backend responde con un grupo que tiene "matchedOnlyIn": "notas"
    Cuando se renderiza el resultado en la lista
    Entonces la tarjeta exhibe el distintivo visual "Coincide en las notas"

  Escenario: 3. Búsqueda reactiva con debounce y ejecución inmediata en Enter
    Dado que el usuario escribe en el cuadro de búsqueda
    Cuando deja de teclear por 400 milisegundos o pulsa la tecla Enter
    Entonces la aplicación envía la petición GET "/api/v1/processes?q=..." con el término
    Y sincroniza el query param "q" en la URL del navegador

  Escenario: 4. Paginación de 25 grupos por página con navegación suave
    Dado que existen más de 25 grupos de procesos en la organización
    Cuando el usuario pulsa en el botón "Siguiente" del paginador
    Entonces se solicita la página 2 con "page=2"
    Y la vista realiza un desplazamiento suave hacia la parte superior del listado
```

---

## 🏗️ 6. Definición de Hecho (DoD)

* [x] Modelos TypeScript actualizados en `src/app/core/models/process.model.ts` con tipado estricto sin `any`.
* [x] Servicio `ProcessService` adaptado para invocar la paginación de grupos y recibir `ProcessGroupPageResponse`.
* [x] Componente `DashboardComponent` refactorizado para renderizar grupos de procesos, subinstancias identadas, badges de `matchedOnlyIn` y ordenamiento.
* [x] Paginador funcional con sincronización en `queryParams` de Angular Router.
* [x] Pruebas unitarias en Jasmine actualizadas y cubriendo casos de agrupación, badges y paginación.
* [x] `npm run build` ejecutado satisfactoriamente sin advertencias ni errores de tipos.
