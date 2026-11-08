# 💡 Plantilla de Contexto `GEMINI.md` para Frontend (`gemini-context-template.md`)

Estructura estándar recomendada para mantener el archivo `GEMINI.md` del proyecto `dokqet-frontend` enriquecido con comandos operativos y contexto funcional de Dokqet:

---

```markdown
# GUÍA DE ARQUITECTURA, STACK TECNOLÓGICO Y COMANDOS - DOKQET FRONTEND

## 1. Contexto del Producto y Dominio
**Dokqet** es la plataforma SaaS especializada en la **vigilancia, seguimiento y gestión automatizada de expedientes judiciales en Colombia** (Radicado de 23 dígitos, Portal Único de la Rama Judicial, Habeas Data Ley 1581 de 2012, validación tributaria DIAN con Módulo 11 y multi-tenancy para litigantes y firmas).

### Stack Tecnológico Obligatorio (Frontend)
- **Framework:** Angular 19+ (Standalone Components, Signals, Signal Inputs/Outputs, Control Flow `@if`/`@for`/`@switch`, `@defer`, `inject()`, `ChangeDetectionStrategy.OnPush`)
- **Lenguaje:** TypeScript 5.6+ / ES2022+
- **Estilos y Maquetación:** Tailwind CSS v3 + PostCSS, tema claro/oscuro
- **Comunicación HTTP:** `HttpClient` consumiendo REST API imperativa de Spring Boot 3.4.1 con `ProblemDetail` (RFC 7807 / RFC 9457)
- **Seguridad:** Tokens PASETO v4 almacenados en el estado de autenticación de la sesión
- **Testing:** Angular TestBed, Jasmine, ComponentFixture
- **Dominio Judicial:** Máscara y validación de radicado de 23 dígitos (`RadicadoPipe`), cálculo de Dígito de Verificación DIAN (Módulo 11), visualización y descarga de providencias en visor PDF embebido (`<iframe>`) directo en navegador sin almacenamiento de binarios

---

## 2. Estructura de Directorios (`src/app`)
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

### A. Servidor de Desarrollo
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
```
