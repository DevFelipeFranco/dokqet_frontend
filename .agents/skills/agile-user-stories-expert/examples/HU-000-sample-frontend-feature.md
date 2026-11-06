# 📖 Historia de Usuario: HU-000 - Visualización de Actuaciones Judiciales en Detalle de Proceso con Skeleton Loaders

---

## 📌 1. Información General de la Historia

| Metadato | Detalle |
| :--- | :--- |
| **Identificador** | `HU-000` |
| **Código Equivalente Backend** | `US-010` (Endpoint `/api/v1/processes/{id}/actuaciones`) |
| **Título** | Visualización Paginada de Actuaciones Judiciales con Skeleton Loaders y Filtro por Cuaderno |
| **Módulo / Rutas Angular** | `src/app/features/processes/detail/` (`/procesos/:id`) |
| **Estado** | `✅ Completada` (Ejemplo de Referencia) |
| **Prioridad** | `Alta (Core)` |
| **Tipo** | `Experiencia de Usuario (UX/UI)` / `Funcionalidad (Feature)` |
| **Actor Principal** | `Abogado Litigante` / `Dependiente Judicial` |

---

## 🎯 2. Narrativa de Negocio y Experiencia de Usuario (User Story Narrative)

**Como** abogado litigante registrado en Dokqet,  
**Quiero** consultar la cronología completa de actuaciones de un expediente judicial con filtrado rápido por cuaderno y paginación fluida mediante skeleton loaders contextuales,  
**Para** revisar las providencias y traslados sin saltos bruscos en la pantalla (CLS < 0.1), asegurando no omitir términos legales perentorios.

---

## 🧱 3. Modelos de Datos en Cliente y Contratos API (`TypeScript`)

### 3.1. Interfaces de Modelo (`src/app/core/models/process.model.ts`)

```typescript
// [EXISTENTE - REUTILIZADO]
export interface ActuacionJudicial {
  id: string;
  fechaActuacion: string; // ISO 8601
  actuacion: string;
  anotacion?: string | null;
  fechaRegistro: string;
  fechaInicial?: string | null;
  fechaFinal?: string | null;
  cuaderno: string;
  conDocumentos: boolean;
}

// [MODIFICADO / POR EXTENDER] - Paginación reactiva de actuaciones
export interface ActuacionesPaginadasResponse {
  actuaciones: ActuacionJudicial[];
  totalElementos: number;
  paginaActual: number;
  totalPaginas: number;
  tamanoPagina: number;
}
```

---

## ⚖️ 4. Reglas de Negocio en Frontend (RN-FE)

- **RN-FE-01 (Carga Paginada con Skeleton Contextual):**  
  Durante la navegación entre páginas o al cambiar de filtro de cuaderno, el cuerpo de la tabla debe reemplazar las filas por `<app-skeleton-table>` manteniendo fija la altura del contenedor para evitar saltos en la barra de scroll (CLS < 0.1).
- **RN-FE-02 (Empty State Contextual):**  
  Si un expediente no cuenta con actuaciones registradas para el cuaderno seleccionado, se debe renderizar un contenedor amigable con ilustración, texto *"No se registran actuaciones en este cuaderno"* y botón para limpiar filtros.
- **RN-FE-03 (Accesibilidad y Atajos de Teclado):**  
  El paginador debe permitir navegación accesible mediante teclado (`Enter` / `Espacio` en botones Anterior y Siguiente) con indicador de foco `focus-visible:ring-2`.
- **RN-FE-04 (Manejo de Errores de Red):**  
  Si la llamada al microservicio falla con HTTP 500 o 503, la tabla debe desplegar una alerta contextual con botón *"Reintentar consulta"* sin recargar toda la página.

---

## 🧪 5. Criterios de Aceptación (Escenarios en Formato Gherkin)

```gherkin
# language: es
Característica: HU-000 - Visualización de Actuaciones Judiciales con Skeleton Loaders
  Como Abogado Litigante
  Quiero consultar las actuaciones de un proceso con carga fluida y sin saltos visuales
  Para vigilar el estado de mis expedientes sin fatiga visual ni demoras perceptibles

  Antecedentes:
    Dado que el abogado se encuentra autenticado
    Y navega a la ruta "/procesos/05001310300120230027400"

  # =========================================================================
  # REGLA: CAMINO FELIZ - CARGA EXITOSA Y PAGINACIÓN
  # =========================================================================
  Escenario: Consulta inicial exitosa de actuaciones judiciales
    Dado que el servicio "processService.getActuaciones" responde exitosamente con 10 registros
    Cuando la vista de detalle de proceso se estabiliza
    Entonces el skeleton de la tabla desaparece con una transición suave
    Y se visualizan 10 filas con la fecha de la actuación, despacho, tipo y anotación
    Y el paginador indica "Página 1 de 3"

  # =========================================================================
  # REGLA: SKELETON LOADER DURANTE TRANSICIÓN DE PÁGINA
  # =========================================================================
  Escenario: El usuario avanza a la página 2 de actuaciones
    Dado que el usuario se encuentra visualizando la página 1
    Cuando hace clic en el botón "Siguiente página"
    Y la petición HTTP se encuentra en tránsito
    Entonces la tabla muestra siluetas de Skeleton de 5 filas simuladas
    Y la altura total de la tabla se mantiene constante
    Y al responder el servidor, las filas reales se renderizan de inmediato

  # =========================================================================
  # REGLA: EMPTY STATE CUANDO NO HAY REGISTROS
  # =========================================================================
  Escenario: Filtrado por cuaderno sin actuaciones
    Dado que el usuario selecciona el cuaderno "Medidas Cautelares"
    Cuando el servidor responde con 0 registros
    Entonces la tabla oculta el paginador
    Y se visualiza el componente de estado vacío con el mensaje "No se registran actuaciones en este cuaderno"
    Y se muestra el botón "Ver todos los cuadernos"

  # =========================================================================
  # REGLA: GESTIÓN DE ERROR DE RED
  # =========================================================================
  Escenario: Caída momentánea del microservicio al consultar actuaciones
    Dado que el servidor responde con código HTTP 503 "Service Unavailable"
    Cuando la solicitud de actuaciones es rechazada
    Entonces se visualiza un banner de error con el texto "No fue posible sincronizar las actuaciones judiciales"
    Y se ofrece el botón interactivo "Reintentar"
```

---

## 🏗️ 6. Mapeo a la Arquitectura Angular (Clasificación de Componentes)

- **`[MODIFICADO / POR EXTENDER]` Componente de Detalle:**  
  `src/app/features/processes/detail/process-detail.component.ts` (Incorpora signals para paginación y filtro de cuaderno).
- **`[EXISTENTE - REUTILIZADO]` Componente de Skeleton Table:**  
  `src/app/shared/components/ui/skeleton-table.component.ts` (Renderizado de filas proporcionales durante carga).
- **`[EXISTENTE - REUTILIZADO]` Servicio de Expedientes:**  
  `src/app/core/services/process.service.ts` (Método `getActuaciones(processId, page, size, cuaderno)`).
- **`[MODIFICADO / POR EXTENDER]` Modelo de Datos:**  
  `src/app/core/models/process.model.ts` (Definición de `ActuacionesPaginadasResponse`).

---

## 🚀 7. Guía y Ejemplos Prácticos de Prueba (Testing Guide)

### 7.1. Pruebas Unitarias Automatizadas (Jasmine / Karma)
```typescript
it('debe mostrar app-skeleton-table mientras loadingActuaciones() sea verdadero', () => {
  component.loadingActuaciones.set(true);
  fixture.detectChanges();
  const skeletonEl = fixture.nativeElement.querySelector('app-skeleton-table');
  expect(skeletonEl).toBeTruthy();
});

it('debe renderizar el listado de actuaciones cuando la respuesta sea exitosa', () => {
  component.loadingActuaciones.set(false);
  component.actuaciones.set(MOCK_ACTUACIONES);
  fixture.detectChanges();
  const rows = fixture.nativeElement.querySelectorAll('tbody tr');
  expect(rows.length).toBe(MOCK_ACTUACIONES.length);
});
```

### 7.2. Comandos de Pruebas Automatizadas
```bash
npx ng test --include="src/app/features/processes/detail/**/*.spec.ts" --no-watch --browsers=ChromeHeadless
```
