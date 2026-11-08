# 📖 Historia de Usuario: HU-27 - Consola Super Admin: Resumen Ejecutivo de Plataforma, Salud Operativa de Rondas y Trazabilidad de Rondas Limitadas

---

## 📌 1. Información General de la Historia

| Metadato | Detalle |
| :--- | :--- |
| **Identificador** | `HU-27` (Equivalente: `HU-27-SUPER-ADMIN-PLATFORM-OVERVIEW-ROUNDS-HEALTH-LIMITED`) |
| **Código Equivalente Backend** | `US-021` (`Resumen Ejecutivo de la Plataforma Dokqet, Salud de Sincronización y Trazabilidad de Rondas Limitadas en Consola Super Admin`) |
| **Título** | Consola Super Admin: Resumen Ejecutivo de Plataforma, Salud Operativa de Rondas y Trazabilidad de Rondas Limitadas |
| **Épica** | Backoffice Técnico (`/admin`), Observabilidad Global y Monitoreo de Vigilancia Judicial |
| **Módulos / Rutas Angular** | `src/app/features/admin/overview/` (o vista resumen en `/admin`), `src/app/core/models/super-admin.model.ts`, `src/app/core/services/super-admin.service.ts` |
| **Estado** | `🚀 Implementada / Verificada` |
| **Prioridad** | `Alta (Gobernanza de Plataforma, Observabilidad Operativa de Rondas y SLA de Vigilancia)` |
| **Tipo** | `Experiencia de Usuario (UX/UI) / Nuevo Módulo / Standalone Angular 19+` |
| **Actor Principal** | `Super Administrador (ROLE_SUPER_ADMIN - Área Técnica y de Infraestructura de Dokqet)` |
| **Historias Relacionadas** | Extiende `HU-18` (Observabilidad de Organizaciones), `HU-19` (Consola Cron/Scheduler) y `HU-21` (Gestión de Usuarios y Soporte) |

---

## 🎯 2. Narrativa de Negocio y Experiencia de Usuario (User Story Narrative)

> **Como** Super Administrador (`ROLE_SUPER_ADMIN`) de la plataforma **Dokqet**,  
> **Quiero** disponer de un panel ejecutivo consolidado (`/admin/resumen` o `/admin/overview`) que presente métricas transversales en tiempo real de organizaciones, usuarios y procesos judiciales vigilados, junto con un monitor de salud operativa de las rondas de sincronización con la Rama Judicial que distinga claramente la última ronda completa (`latestFull`) de las rondas parciales de prueba (`limited = true`),  
> **Para** evaluar de un vistazo la salud integral del SaaS, detectar rápidamente retrasos (`late`) o fallas en el scheduler de vigilancia sin falsos positivos originados por ejecuciones restringidas de prueba, y auditar la trazabilidad cronológica de los últimos 7 días.

---

## 🔍 2.1. Diagnóstico del Estado Actual en `dokqet-frontend` y Justificación UX

1. **Limitación del Modelo Anterior de Overview:**
   - Previamente, el modelo `AdminPlatformOverview` en `super-admin.model.ts` contenía únicamente 5 contadores planos (`totalOrganizations`, `totalPersonalOrganizations`, `totalCollectiveOrganizations`, `totalUsers`, `totalProcesses`).
   - El endpoint backend `GET /api/v1/admin/overview` fue evolucionado en `US-021` a una respuesta estructurada multidimensional (`AdminPlatformOverviewDto`) que incorpora desgloses específicos para:
     * **Organizaciones:** Espacios personales vs. firmas jurídicas colectivas.
     * **Procesos:** Total de expedientes únicos vigilados (`distinct`), total de vínculos de seguimiento multi-tenancy (`follows`), expedientes monitoreados al día (`monitoredByDay`) e instancias secundarias detectadas pendientes (`instancesDetected`).
     * **Usuarios:** Total registrados, usuarios activos, suspendidos y super administradores de plataforma.
     * **Salud de Rondas (`rounds`):** Indicador de última ronda completa oficial (`latestFull`), bandera de retraso operativo (`late`) según SLA diario, horario programado (`schedule`) e historial de los últimos 7 días con marcación `limited: boolean`.

2. **Problema de las Rondas Limitadas de Prueba en la Operación:**
   - Cuando un operador técnico o desarrollador ejecuta una ronda limitada a pocos radicados (ej. 3 o 5 procesos) para pruebas operativas, dicha ejecución no debe reemplazar a la última ronda de referencia completa (`latestFull`).
   - Si la interfaz no diferencia visualmente las rondas completas de las limitadas, el Super Administrador asume erróneamente que la vigilancia general se ejecutó sobre la totalidad de expedientes cuando en realidad fue una prueba confinada.

3. **Propuesta de Diseño y Experiencia de Usuario:**
   - **Sección 1: Tarjetas Ejecutivas de Alto Nivel (KPI Cards):**
     * **Organizaciones:** Total consolidado con píldora informativa *"X firmas jurídicas · Y espacios personales"*.
     * **Expedientes Judiciales:** Total de procesos únicos vigilados, con desglose de seguimientos totales multi-tenancy (*"X asignaciones en firmas"*) e instancias detectadas.
     * **Usuarios Registrados:** Total de usuarios, con desglose de usuarios activos, suspendidos y administradores técnicos.
   - **Sección 2: Monitor de Salud de Rondas de Sincronización:**
     * Tarjeta dedicada para **Vigilancia Diaria de Actuaciones (`UPDATES`)**:
       - Estado de la última ronda completa (`COMPLETED`, `RUNNING`, `INTERRUPTED`).
       - Fecha y hora exacta formateada con zona horaria local (`America/Bogota`).
       - Cantidad de procesos revisados, actuaciones nuevas detectadas y errores temporales.
       - **Insignia de Estado / Semáforo:** Badge verde `"Al día"` si `late === false`, o badge rojo/ámbar pulsante `"Retraso Operativo (>14h)"` si `late === true`.
     * Tarjeta dedicada para **Revisión de Instancias (`INSTANCES`)**:
       - Fecha y hora de la última revisión periódica completa y badge de alerta si `late === true`.
   - **Sección 3: Tabla Cronológica de Rondas (Últimos 7 Días):**
     * Listado ordenado cronológicamente descendente de todas las ejecuciones.
     * Columnas: Tipo de tarea (`UPDATES`, `INSTANCES`, `ESTADOS`), Inicio, Fin/Duración, Procesados/Total, Novedades, Fallos, Estado y Marcación.
     * **Badge Distintivo de Ronda Limitada:** Las filas con `limited === true` muestran un badge azul/púrpura `"Limitada (Prueba)"` con tooltip aclaratorio: *"Esta ejecución fue restringida a un lote parcial de procesos y no sustituye la ronda general"*.

---

## 🧭 2.2. Diagramas de Interacción y Flujo (Mermaid)

### 2.2.1. Diagrama de Navegación del Panel Ejecutivo

```mermaid
flowchart TD
    A["Navegación a /admin o /admin/resumen"] --> B["SuperAdminService.getPlatformOverview()"]
    B -->|GET /api/v1/admin/overview| C["API Gateway / Backend"]
    
    C -->|200 OK (AdminPlatformOverview)| D["Renderizado Reactivo con Signals"]
    
    D --> E["1. Tarjetas KPI (Organizaciones, Usuarios, Procesos)"]
    D --> F["2. Monitor de Salud de Rondas (UPDATES e INSTANCES)"]
    D --> G["3. Historial de Rondas (Últimos 7 días)"]
    
    F --> H{"¿rounds.updates.late == true?"}
    H -->|Sí| I["Resalta tarjeta en Rojo/Ámbar con badge 'Retraso en Vigilancia'"]
    H -->|No| J["Muestra badge Verde 'Vigilancia al día'"]
    
    G --> K{"¿item.limited == true?"}
    K -->|Sí| L["Renderiza Chip Azul 'Limitada' (Excluida de benchmark)"]
    K -->|No| M["Renderiza Chip Gris 'Ronda Completa'"]
```

---

## 3. Modelos de Datos en Cliente y Contratos API

### 3.1. Modelo TypeScript Extendido
**Archivo:** `src/app/core/models/super-admin.model.ts` `[MODIFICADO / POR EXTENDER]`

```typescript
export interface AdminLatestFullRun {
  id: string;
  finishedAt: string; // ISO 8601 UTC
  status: 'COMPLETED' | 'RUNNING' | 'INTERRUPTED' | 'STOPPED' | 'CUT';
  checked: number;
  errors: number;
  withChanges: number;
}

export interface AdminRoundHealth {
  latestFull: AdminLatestFullRun | null;
  late: boolean;
  schedule: string;
}

export interface AdminRunHistory {
  runId: string;
  startedAt: string; // ISO 8601 UTC
  finishedAt: string | null;
  status: 'COMPLETED' | 'RUNNING' | 'INTERRUPTED' | 'STOPPED' | 'CUT';
  kind: 'UPDATES' | 'INSTANCES' | 'ESTADOS';
  checked: number;
  errors: number;
  withChanges: number;
  limited: boolean;
}

export interface AdminOverviewProcesses {
  distinct: number;
  follows: number;
  monitoredByDay: number;
  instancesDetected: number;
}

export interface AdminOverviewUsers {
  total: number;
  active: number;
  suspended: number;
  superAdmins: number;
}

export interface AdminOverviewRounds {
  updates: AdminRoundHealth;
  instances: AdminRoundHealth;
  historyLast7Days: AdminRunHistory[];
}

export interface AdminPlatformOverview {
  totalOrganizations: number;
  personalOrganizations: number;
  firmOrganizations: number;
  processes: AdminOverviewProcesses;
  users: AdminOverviewUsers;
  rounds: AdminOverviewRounds;
  // Campos de compatibilidad con versiones anteriores
  totalCollectiveOrganizations?: number;
  totalPersonalOrganizations?: number;
  totalUsers?: number;
  totalProcesses?: number;
}
```

### 3.2. Contrato de Servicio Angular
**Archivo:** `src/app/core/services/super-admin.service.ts` `[EXISTENTE - REUTILIZADO]`

```typescript
/**
 * Obtiene el resumen ejecutivo consolidado de la plataforma Dokqet.
 */
getPlatformOverview(): Observable<AdminApiResponse<AdminPlatformOverview>> {
  return this.http.get<AdminApiResponse<AdminPlatformOverview>>(`${this.API_URL}/overview`);
}
```

---

## ⚖️ 4. Reglas de Negocio en Frontend (RN-FE)

1. **`RN-FE-27-01` — Compatibilidad y Robustez de Métricas Superiores:**
   - El componente debe consumir `AdminPlatformOverview` usando `computed signals`.
   - Se debe mantener compatibilidad hacia atrás mediante operadores de fusión nula (`??`) para evitar errores en caso de respuestas con campos legados.
   - Si `overview()?.rounds` es nulo o indefinido, la sección de rondas muestra un estado vacío elegante sin fallar la renderización.

2. **`RN-FE-27-02` — Visualización de Salud de Vigilancia y Retraso Operativo (`late`):**
   - Para la ronda `UPDATES`:
     * Si `rounds.updates.late === true`: la tarjeta muestra borde y fondo sutil rojo/ámbar (`border-destructive/40 bg-destructive/5`), con badge `"Retraso en Vigilancia (>14h)"` e ícono de advertencia.
     * Si `rounds.updates.late === false`: la tarjeta muestra borde neutro con badge verde `"Al día"`.
   - Si `latestFull` es `null`, mostrar aviso `"Sin ejecuciones completas registradas"`.

3. **`RN-FE-27-03` — Distinción Visual de Rondas Limitadas (`limited: true`):**
   - En la tabla de historial de los últimos 7 días:
     * Si `limited === true`: mostrar badge con estilo azul o violeta (`bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20`) con el texto `"Limitada"`.
     * Si `limited === false`: mostrar badge neutro `"Completa"`.
   - Al pasar el cursor sobre el badge `"Limitada"`, un tooltip explica que corresponde a una ejecución restringida que no afecta la última ronda oficial de referencia.

4. **`RN-FE-27-04` — Formateo de Fechas Relativas y Absolutas:**
   - La fecha de `finishedAt` de `latestFull` se muestra en formato relativo amigable (*"hace 2 horas"*, *"hace 35 minutos"*) acompañado de la fecha absoluta en tooltip (`COT / America/Bogota`).

---

## ✅ 5. Criterios de Aceptación BDD (Gherkin)

```gherkin
# language: es
Característica: Resumen ejecutivo y salud de rondas de sincronización en consola Super Admin (HU-27)
  Como Super Administrador de la plataforma Dokqet
  Quiero supervisar métricas generales y la salud de las rondas de sincronización distinguiendo ejecuciones limitadas
  Para verificar la continuidad operativa del servicio de vigilancia judicial

  Escenario: 1. Visualización de la salud de la ronda UPDATES al día
    Dado que el Super Administrador ingresa al módulo de observabilidad "/admin"
    Cuando la API retorna que "rounds.updates.late" es "false" y la última ronda completa finalizó hace 3 horas
    Entonces la tarjeta de vigilancia diaria muestra el badge verde "Al día"
    Y expone la cantidad de procesos revisados y actuaciones detectadas

  Escenario: 2. Alerta visual de retraso operativo en vigilancia diaria
    Dado que la última ronda completa de "UPDATES" finalizó hace 16 horas
    Y la API retorna "rounds.updates.late" en "true"
    Cuando el Super Administrador visualiza el monitor de salud de rondas
    Entonces la tarjeta de vigilancia se resalta con estado de advertencia
    Y expone el badge "Retraso en Vigilancia (>14h)" indicando posible anomalía en el scheduler

  Escenario: 3. Trazabilidad de ronda limitada en el historial de 7 días
    Dado que existe una ejecución con ID "run-lim-99" y "limited" en "true"
    Cuando el Super Administrador consulta la tabla de historial de rondas
    Entonces la fila de "run-lim-99" exhibe la insignia "Limitada"
    Y no interfiere en la indicación de la última ronda oficial completa
```

---

## 🏗️ 6. Definición de Hecho (DoD)

* [x] Modelo `AdminPlatformOverview` y subtipos (`AdminRoundHealth`, `AdminLatestFullRun`, `AdminRunHistory`) extendidos en `super-admin.model.ts`.
* [x] Componente visual de resumen ejecutivo (`OverviewAdminComponent`) implementado con tarjetas KPI y monitor de salud.
* [x] Indicador de retraso `late` y badges de rondas limitadas (`limited`) integrados con Tailwind CSS y soporte modo claro/oscuro.
* [x] Enrutamiento `/admin/resumen`, alias `/admin/overview` y enlace en menú lateral Super Admin integrados en `app.routes.ts` y `app.component.html`.
* [x] Compilación exitosa en Angular 19+ (`npm run build`) con 0 errores de TypeScript y templates.
