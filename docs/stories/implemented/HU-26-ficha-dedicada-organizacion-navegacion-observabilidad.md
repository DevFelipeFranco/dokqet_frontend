# HU-26: Ficha Dedicada de Organización y Navegación de Observabilidad (Master-Detail UX)

---

## 1. Información General

| Campo | Valor |
|---|---|
| **ID de Historia** | `HU-26` |
| **Código Equivalente Backend** | `US-030` |
| **Título** | Ficha Dedicada de Organización y Navegación de Observabilidad (Master-Detail UX) |
| **Módulos / Rutas de UI** | `/admin/organizaciones`, `/admin/organizaciones/:id` |
| **Estado** | `🚀 Implementada / Verificada` |
| **Prioridad** | `ALTA` |
| **Actores de UI** | Super Administrador de Plataforma Dokqet (`ROLE_SUPER_ADMIN`) |

---

## 2. Narrativa de Negocio y Experiencia de Usuario

### 2.1. Como
**Como** Super Administrador de la plataforma Dokqet con permisos globales de observabilidad y auditoría,

### 2.2. Quiero
**Quiero** hacer clic sobre cualquier organización (sea un espacio personal o una firma colectiva como *"FIRMA SUPEr WAY"*) desde la tabla de observabilidad y navegar directamente a una **pantalla completa dedicada (`/admin/organizaciones/:id`)**,

### 2.3. Para
**Para** aprovechar al máximo el espacio de pantalla, evitar el desorden visual ocasionado por acordeones desplegados dentro de filas de tabla cuando crecen las organizaciones, y contar con una vista profesional, estructurada y organizada con métricas, integrantes, datos legales y vinculación directa con su usuario titular.

---

## 3. Modelos de Datos en Cliente y Contratos API

### 3.1. Modelo `AdminOrganizationDetail`
**Archivo:** `src/app/core/models/super-admin.model.ts` `[MODIFICADO / POR EXTENDER]`

```typescript
export interface AdminOrganizationDetail extends AdminOrganizationSummary {
  cityId: string | null;
  personalOwnerId: string | null;
  createdById: string | null;
  processVisibility: 'ALL_MEMBERS' | 'OWN_ONLY';
  updatedAt: string;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
}
```

### 3.2. Modelo `AdminMember`
**Archivo:** `src/app/core/models/super-admin.model.ts` `[EXISTENTE - REUTILIZADO]`

```typescript
export interface AdminMember {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'LAWYER';
  status: 'ACTIVE' | 'SUSPENDED';
  joinedAt: string;
  lastUsedAt: string | null;
}
```

### 3.3. Contratos de Endpoints Backend Consumidos
**Archivo:** `src/app/core/services/super-admin.service.ts` `[EXISTENTE - REUTILIZADO]`

1. `GET /api/v1/admin/organizations/{id}` -> Retorna `AdminApiResponse<AdminOrganizationDetail>`.
2. `GET /api/v1/admin/organizations/{id}/members` -> Retorna `AdminApiResponse<AdminMember[]>`.

---

## 4. Reglas de Negocio en Frontend (RN-FE)

- **RN-FE-01: Supresión de Acordeones Colapsibles Gigantes dentro de Tablas**:  
  La tabla de observabilidad (`/admin/organizaciones`) no debe incrustar sub-tablas ni acordeones masivos dentro de las filas. Cada entidad vinculada (espacio personal o firma jurídica) se expone como un chip interactivo o botón de acceso directo que redirige a `/admin/organizaciones/:id`.
- **RN-FE-02: Navegación Bidireccional Fluida (Master-Detail)**:  
  La pantalla de detalle `/admin/organizaciones/:id` debe incluir breadcrumbs jerárquicos (`Inicio > Super Admin > Observabilidad de Organizaciones > [Nombre]`) y un botón visible de retorno rápido (`← Volver a Organizaciones`) accesible por teclado (`Esc` o clic).
- **RN-FE-03: Identificación Clara del Tipo de Entidad y Políticas**:  
  La ficha debe diferenciar con claridad visual mediante badges si se trata de un *Espacio Personal (Persona Natural)* o una *Firma Jurídica Colectiva (Persona Jurídica)*, y reflejar el régimen de visibilidad de expedientes (`ALL_MEMBERS` vs `OWN_ONLY`).
- **RN-FE-04: Vinculación con el Titular / Creador**:  
  Si la organización tiene titular (`ownerId` / `ownerName`), se debe desplegar una tarjeta con su nombre, correo y un enlace directo a su ficha de usuario en `/admin/usuarios/:ownerId`.
- **RN-FE-05: Pestañas de Detalle con Accesibilidad (WCAG AA)**:  
  La ficha debe estructurar la información en 3 pestañas:
  1. *Integrantes y Equipo*: Tabla de miembros con roles, documentos, fechas de actividad y enlace a su ficha.
  2. *Información Corporativa & Fiscal*: Razón social, NIT con DV, ID del sistema con botón de copiado.
  3. *Expedientes y Reglas*: Política de radicación y visibilidad de procesos.
- **RN-FE-06: Prevención de Saltos de Maquetación (CLS < 0.1)**:  
  Mientras se cargan los datos de la organización y sus miembros, se renderizan Skeleton Loaders que preservan las dimensiones exactas del encabezado, métricas y tabla.

---

## 5. Criterios de Aceptación Gherkin

```gherkin
# language: es
Característica: Ficha Dedicada de Organización y Navegación de Observabilidad
  Como Super Administrador de la plataforma Dokqet
  Quiero acceder a una pantalla completa e independiente al hacer clic en cualquier organización
  Para examinar sus métricas, miembros y configuración con máxima legibilidad y sin saturación en tabla

  Escenario: Navegación desde la lista de observabilidad a la ficha de una firma colectiva
    Dado que el Super Administrador está en la página "/admin/organizaciones"
    Y observa en la tabla a la persona "Felipe Way" con su firma "FIRMA SUPEr WAY"
    Cuando hace clic en el enlace o chip interactivo "FIRMA SUPEr WAY"
    Entonces el navegador transiciona a la ruta "/admin/organizaciones/org-firma-way"
    Y se renderiza el encabezado con el título "FIRMA SUPEr WAY"
    Y se muestra la tarjeta del titular "Felipe Way" con enlace a su ficha de usuario
    Y se visualizan las 4 tarjetas de métricas (Expedientes, Integrantes Activos, Integrantes Totales y Política)

  Escenario: Inspección de los miembros e integrantes de la firma
    Dado que el Super Administrador se encuentra en "/admin/organizaciones/org-firma-way"
    Cuando selecciona la pestaña "Integrantes y Equipo"
    Entonces se visualiza la tabla de miembros con sus roles "ADMIN" o "LAWYER"
    Y cada miembro muestra su documento de identidad, correo y último acceso
    Y cuenta con una acción para navegar a la ficha individual del usuario en "/admin/usuarios/:id"

  Escenario: Retorno rápido a la lista de observabilidad
    Dado que el Super Administrador está visualizando la ficha en "/admin/organizaciones/org-firma-way"
    Cuando presiona el botón "Volver a Organizaciones" o el enlace en los breadcrumbs
    Entonces el sistema regresa de inmediato a "/admin/organizaciones" preservando el contexto
```

---

## 6. Mapeo a la Arquitectura Angular

| Archivo / Componente | Clasificación | Propósito |
|---|---|---|
| `src/app/app.routes.ts` | `[MODIFICADO / POR EXTENDER]` | Registro de la ruta `admin/organizaciones/:id` con `AdminOrganizationDetailComponent`. |
| `src/app/core/models/super-admin.model.ts` | `[MODIFICADO / POR EXTENDER]` | Tipado de `AdminOrganizationDetail` con soporte de `ownerId`, `ownerName` y `ownerEmail`. |
| `src/app/core/services/super-admin.service.ts` | `[EXISTENTE - REUTILIZADO]` | Invocación de `getOrganizationDetail` y `getOrganizationMembers`. |
| `src/app/features/admin/organizations/organizations-admin.component.ts` | `[MODIFICADO / POR EXTENDER]` | Navegación directa hacia `/admin/organizaciones/:id` en clicks de firmas y espacios personales. |
| `src/app/features/admin/organizations/organizations-admin.component.html` | `[MODIFICADO / POR EXTENDER]` | Reemplazo del acordeón masivo por chips de navegación directa y layout optimizado. |
| `src/app/features/admin/organizations/detail/admin-organization-detail.component.ts` | `[NUEVO / POR CREAR]` | Componente Standalone de página completa con Signals, Tabs y KPIs. |
| `src/app/features/admin/organizations/detail/admin-organization-detail.component.html` | `[NUEVO / POR CREAR]` | Maquetación con Tailwind CSS, WCAG 2.1 AA y Skeleton Loaders. |
| `src/app/features/admin/organizations/detail/admin-organization-detail.component.spec.ts` | `[NUEVO / POR CREAR]` | Pruebas unitarias de la ficha con Jasmine y TestBed. |

---

## 7. Guía y Ejemplos Prácticos de Prueba

```bash
# Compilar y verificar tipos de la ficha y componentes
npx tsc --project tsconfig.spec.json --noEmit

# Validar construcción completa de la aplicación Angular
npx ng build
```
