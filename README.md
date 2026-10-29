# Dokqet Frontend (Angular 22 / Standalone Architecture)

Frontend moderno e independiente para la plataforma de gestión y monitoreo de procesos judiciales en Colombia (**Dokqet**), desacoplado del backend y migrado desde la arquitectura monolítica original de Next.js.

## Características Técnicas

- **Angular 19 / 22:** Componentes `standalone: true`, arquitectura sin `NgModule`.
- **Reactivity & State:** Angular Signals (`signal`, `computed`) para gestión reactiva del estado sin sobrecarga de RxJS en vistas.
- **Autenticación Segura PASETO:** Interceptor HTTP (`PasetoInterceptor`) inyectando tokens PASETO v2/v4 emitidos por el backend en Spring Boot.
- **Validaciones Legales Colombianas:**
  - Validador oficial del dígito de verificación (DV) del NIT ante la DIAN (`[3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]`).
  - Validador de formato de radicado de 23 dígitos de la Rama Judicial.
  - Validación de documentos de identidad colombianos (Cédula de Ciudadanía, Cédula de Extranjería, Pasaporte).
- **Estilos:** Tailwind CSS con soporte para tema oscuro y diseño responsivo.
- **Módulos Principales:**
  - **Autenticación:** Iniciar sesión, Registro con consentimiento Habeas Data (Ley 1581 de 2012), Recuperación y Restablecimiento de contraseña.
  - **Panel de Procesos:** Vista jerárquica de expedientes e instancias, contadores de actuaciones nuevas no leídas, filtros rápidos ("Todos", "Solo los míos", "Con novedades", "Sin asignar") y buscador en tiempo real.
  - **Registro de Expedientes:** Búsqueda en vivo contra la API de Rama Judicial de 23 dígitos, advertencia de expedientes privados y asignación de abogado responsable.
  - **Detalle de Expediente:** Paginación de actuaciones judiciales, visualización de términos legales (fecha inicial/final), tabla de sujetos procesales clasificados y ficha técnica.
  - **Administración de Firma:** Gestión de miembros, invitaciones con TTL de 24h, cálculo automático de NIT y protección de enfriamiento de 30 días para modificaciones de datos fiscales.

## Requisitos

- Node.js >= 20
- npm >= 10

## Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en http://localhost:4200
npm start

# Construir para producción
npm run build
```
