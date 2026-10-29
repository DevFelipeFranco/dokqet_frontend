# Especificación Funcional, Contexto del Dominio y Arquitectura Base
## Plataforma Dokqet — Vigilancia y Gestión Judicial Automatizada para Colombia

* **Versión del Documento:** 1.0.0
* **Referencia Base:** Dokqet Platform Core v1.21 (`dokqet_plataforma`)
* **Destino:** Frontend Angular Standalone (`dokqet-frontend`)
* **Fecha de Emisión:** Octubre 2026

---

## 1. Visión General del Producto y Contexto del Negocio

**Dokqet** es una plataforma de software como servicio (SaaS) especializada en la **vigilancia, seguimiento y gestión colaborativa de procesos judiciales en Colombia**. Su propósito es transformar la forma en que litigantes independientes y firmas de abogados interactúan con la administración de justicia, automatizando la extracción de información desde el **Portal Único de Consulta de la Rama Judicial**, eliminando la revisión manual de estados y previniendo la pérdida de términos procesales.

### 1.1. Pilares del Negocio
1. **Vigilancia Automatizada 24/7:** Monitoreo diario y programado de expedientes judiciales directamente contra los servicios oficiales de la Rama Judicial.
2. **Alertas Tempranas de Términos:** Notificación inmediata de actuaciones con términos iniciales y finales para garantizar el derecho a la defensa y la debida diligencia.
3. **Colaboración Multi-Tenant Segura:** Espacios separados para la práctica individual (Organización Personal) y el trabajo en equipo (Firmas de Abogados), con asignación de responsables y bitácora interna.
4. **Cumplimiento Normativo Colombiano Estricto:** Incorporación de las normas de Habeas Data (Ley 1581 de 2012), estándares tributarios de la DIAN (NIT y DV) y reserva judicial.

---

## 2. Marco Normativo y Reglas de Dominio Colombiano

### 2.1. El Radicado Único Nacional (23 Dígitos)
En Colombia, cada expediente judicial cuenta con un Código Único de Identificación de 23 dígitos establecido por el Consejo Superior de la Judicatura. El frontend debe admitir entradas flexibles (con guiones, espacios o caracteres pegados desde Word) y normalizarlas a un número continuo de 23 cifras estructurado de la siguiente forma:

| Segmento | Longitud | Significado | Ejemplo (`05001310300120230027400`) |
| :--- | :---: | :--- | :--- |
| **Dpto / Municipio** | 5 dígitos | Código DANE de ubicación geográfica | `05001` (Medellín, Antioquia) |
| **Entidad / Especialidad** | 7 dígitos | Jurisdicción, tipo y código del juzgado | `3103001` (Juzgado Civil del Circuito 001) |
| **Año de Radicación** | 4 dígitos | Año en que se admitió la demanda | `2023` |
| **Consecutivo Anual** | 5 dígitos | Número secuencial asignado en el año | `00274` |
| **Recurso / Instancia** | 2 dígitos | Identificador de instancia procesal | `00` (Primera instancia) |

#### Regla de Detección de Instancias Relacionadas:
Los primeros 21 dígitos identifican el **expediente matriz**. El sufijo de 2 dígitos indica la instancia o recurso:
* `00`: Primera instancia o trámite original.
* `01`, `02`, `03`...: Recursos de apelación, queja, casación o consultas en tribunales superiores o cortes.

### 2.2. Ley 1581 de 2012 (Protección de Datos Personales / Habeas Data)
* Al registrarse en la plataforma, el usuario debe autorizar expresamente el tratamiento de sus datos personales y los Términos del Servicio.
* **Auditoría Inmutable:** El sistema almacena obligatoriamente la dirección IP de origen, la marca de tiempo exacta (UTC), el User-Agent del navegador y la versión exacta de la política aceptada en el modelo de base de datos `Consent`.

### 2.3. Validación Tributaria y Fiscal (DIAN)
* **Tipos de Documento para Persona Natural:**
  * `13`: Cédula de Ciudadanía (CC).
  * `22`: Cédula de Extranjería (CE).
  * `41`: Pasaporte.
* **Personas Jurídicas / Firmas (NIT con Dígito de Verificación):**
  * Toda firma debe ingresar su Número de Identificación Tributaria (NIT).
  * El frontend y backend validan automáticamente el **Dígito de Verificación (DV)** mediante el algoritmo de ponderación oficial de la DIAN (**Módulo 11** con primos `[3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]`).
* **Regla de Congelamiento Fiscal de 30 Días:**
  * Los datos fiscales (Razón Social y NIT) sólo pueden editarse una vez cada 30 días calendario para evitar suplantaciones o fraude. Se requiere un modal de advertencia previa con la fecha exacta del próximo desbloqueo.

### 2.4. Tratamiento Ético de Procesos Privados (`esPrivado`)
* Determinados procesos de familia, penales o con menores cuentan con reserva judicial en el sistema oficial (`esPrivado === true`).
* Si un usuario intenta registrar un proceso privado, la plataforma exige marcar un checkbox juramentado declarando que cuenta con poder conferido y personería judicial reconocida en el expediente.

---

## 3. Modelo de Tenencia y Seguridad (Multi-Tenancy)

```
                         ┌─────────────────────────────┐
                         │      USUARIO (Persona)      │
                         │    (Cédula / Contraseña)    │
                         └──────────────┬──────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
  ┌─────────────────────────────┐               ┌─────────────────────────────┐
  │    ORGANIZACIÓN PERSONAL    │               │  FIRMA JURÍDICA COLECTIVA   │
  │     (Uso individual)        │               │   (Máx. 1 creada x persona) │
  └──────────────┬──────────────┘               └──────────────┬──────────────┘
                 │ (Rol: Personal)                             │ (Membresía)
                 ▼                                             ▼
  ┌─────────────────────────────┐               ┌─────────────────────────────┐
  │   Expedientes del Abogado   │               │ Roles: ADMIN / LAWYER       │
  │     (Control exclusivo)     │               │ Expedientes Compartidos     │
  └─────────────────────────────┘               └─────────────────────────────┘
```

### 3.1. Tipos de Organización
1. **Organización Personal (`isPersonal: true`):**
   * Se crea automáticamente al registrar la cuenta.
   * Pertenece de por vida al usuario.
   * No admite otros miembros ni invitaciones.
   * No requiere NIT ni datos de persona jurídica.
2. **Organización Jurídica / Firma (`isPersonal: false`):**
   * Creada voluntariamente por un usuario (límite de negocio: **máximo 1 firma creada por usuario**).
   * Admite múltiples miembros con roles diferenciados.
   * Requiere configuración de datos fiscales ante la DIAN.

### 3.2. Matriz de Roles y Permisos (RACI)

| Operación / Vista | Organización Personal | Abogado en Firma (`LAWYER`) | Administrador de Firma (`ADMIN`) |
| :--- | :---: | :---: | :---: |
| **Registrar nuevo proceso** | ✅ Sí | ✅ Sí (sólo a su propio nombre) | ✅ Sí (a cualquier abogado) |
| **Ver procesos del equipo** | N/A | 👁️ Solo lectura de otros | ✅ Edición y asignación total |
| **Editar responsable y notas** | ✅ Sí | ✅ En sus procesos asignados | ✅ En todos los procesos |
| **Dejar de seguir proceso** | ✅ Sí | ❌ No permitido | ✅ Sí |
| **Invitar miembros al equipo** | ❌ No | ❌ No permitido | ✅ Sí (Tokens válidos x 24h) |
| **Cambiar roles (Admin ↔ Lawyer)**| ❌ No | ❌ No permitido | ✅ Sí (excepto auto-degradación) |
| **Remover miembros del equipo** | ❌ No | ❌ No permitido | ✅ Sí (con reasignación obligatoria) |
| **Modificar datos fiscales (NIT)**| ❌ No | ❌ No permitido | ✅ Sí (regla de 30 días) |
| **Eliminar firma / Migrar procesos**| ❌ No | ❌ No permitido | ✅ Solo el Fundador / Creador |

---

## 4. Desglose Detallado de Páginas y Flujos de Usuario (Frontend)

### 4.1. Módulo de Cuentas y Acceso Público (`/auth`)

#### A. Inicio de Sesión (`/iniciar-sesion`)
* **Propósito:** Autenticar al usuario y redirigirlo a su último contexto de trabajo.
* **Componentes y Elementos:**
  * Formulario reactivo con validación de correo y contraseña.
  * Botón primario de envío con estado de carga interactivo (*loading spinner*).
  * Alerta de cuenta no verificada con enlace directo para reenviar correo de confirmación.
  * Enlace "¿Olvidaste tu contraseña?" hacia `/recuperar-contrasena`.
  * Enlace "¿No tienes cuenta? Regístrate" hacia `/registro`.
* **Regla de Redirección:** Si viene acompañado de un parámetro `?redirectTo=/procesos/123`, debe validar que sea una ruta interna relativa válida antes de redirigir.

#### B. Registro de Persona Natural (`/registro`)
* **Propósito:** Alta de nuevos abogados en el sistema.
* **Componentes y Elementos:**
  * Datos personales: Primer nombre, segundo nombre, primer apellido, segundo apellido (auto-capitalización y preservación de tildes).
  * Documento de identidad: Selector de tipo (`CC`, `CE`, `Pasaporte`) y número de identificación.
  * Correo electrónico y contraseña con medidor visual de fortaleza (longitud, caracteres especiales y chequeo de brechas).
  * Checkbox obligatorio con hipervínculos a los Términos de Servicio y la Política de Privacidad de Datos.
* **Comportamiento Post-Registro:** Despliega pantalla de confirmación informando el envío del correo de verificación.

#### C. Recuperación y Restablecimiento (`/recuperar-contrasena` & `/restablecer-contrasena`)
* **Propósito:** Gestión de olvido de credenciales de forma segura.
* **Reglas:**
  * La pantalla de solicitud siempre muestra éxito (*"Si el correo existe, hemos enviado un enlace"*), evitando la enumeración de correos.
  * El enlace contiene un token firmado de un solo uso con expiración a los 60 minutos.
  * Al ingresar la nueva contraseña, se invalidan de inmediato todas las sesiones activas en la tabla `Session`.

#### D. Aceptación de Invitaciones (`/invitacion`)
* **Propósito:** Permitir a un abogado unirse a una firma existente mediante un enlace recibido por correo electrónico.
* **Flujo:** Valida el token HMAC SHA-256. Si el usuario ya está conectado, le permite asociar su cuenta con un clic; si no, le permite iniciar sesión o registrarse manteniendo la invitación pendiente.

---

### 4.2. Shell Global de la Aplicación (`AppShell`)

* **Logotipo Oficial e Identidad:** Logo vectorizado Dokqet enlazado directamente al `/panel`.
* **Conmutador de Organización (`OrganizationSwitcher`):**
  * Menú desplegable que muestra la organización actualmente activa con su respectivo rol (`Personal`, `Administrador`, `Abogado`).
  * Lista de organizaciones a las que pertenece el usuario agrupadas en:
    * *Organización Personal*
    * *Firmas Jurídicas*
  * Botón *"Crear firma jurídica"* (habilitado únicamente si el usuario no ha creado una previamente).
  * Acceso directo a la configuración de la organización activa (`/organizacion`).
* **Selector de Tema (Theme Switcher):**
  * Alternancia fluida entre Modo Claro (fondo limpio `#F8FAFC`, texto grafito) y Modo Oscuro (fondo `#0F172A`, texto `#F8FAFC`).
* **Menú de Perfil:**
  * Muestra nombre del usuario, correo y botón de cierre de sesión seguro.

---

### 4.3. Panel de Procesos / Dashboard (`/panel`)

Es la pantalla principal tras iniciar sesión.

#### A. Cabecera y Banners Proactivos
* Saludo personalizado con el primer nombre del usuario.
* **Banner "Te invitaron":** Si existen invitaciones de firmas dirigidas al correo del usuario, muestra una tarjeta destacada con los botones `Aceptar` y `Rechazar`.
* **Banner "¿Trabajas con otros abogados?":** Se muestra a usuarios que solo tienen organización personal para incentivar la creación de su firma.

#### B. Barra de Filtros Rápidos (Pills Reactivos)
* `Ver todos`: Total de expedientes monitoreados.
* `Con novedades (N)`: Filtra procesos con actuaciones no leídas generadas por la ronda de sincronización.
* `Solo los míos`: Filtra los procesos donde el usuario conectado es el abogado responsable.
* `Sin asignar (N)`: Visible para administradores para identificar expedientes que no tienen responsable asignado.

#### C. Grilla / Tabla de Expedientes Judiciales
* **Columnas:**
  1. **Radicado y Partes:** Número de 23 dígitos formateado con enlace al detalle, acompañado del nombre del demandante principal frente al demandado principal.
  2. **Despacho Judicial:** Nombre completo del juzgado o tribunal y ciudad.
  3. **Última Actuación:** Descripción del trámite más reciente con su fecha oficial.
  4. **Responsable:** Nombre del abogado asignado (o badge ámbar `Sin asignar`).
  5. **Parte Representada:** Badge indicando si se representa a la parte *Demandante*, *Demandada* o *Tercero*.
* **Insignias y Estados Visuales:**
  * 🔒 *Proceso Privado* (con reserva legal).
  * 🔴 *N nuevas* (número de actuaciones no leídas).
  * 🟡 *Instancia nueva* (recurso o expediente derivado detectado automáticamente).
* **Agrupación de Instancias:** Uso de acordeón `<details>` para desplegar los subprocesos e instancias vinculadas al mismo radicado base sin saturar la pantalla.

---

### 4.4. Asistente de Registro de Procesos (`/procesos/nuevo`)

Flujo en tres pasos con validaciones en tiempo real:

```
  ┌──────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
  │  PASO 1: ENTRADA │       │   PASO 2: VALIDACIÓN   │       │   PASO 3: GESTIÓN      │
  │  Radicado de 23  │ ───►  │  Consulta Rama Judicial│ ───►  │  Asignación interna    │
  │  dígitos         │       │  Detección de reserva  │       │  y notas de la firma   │
  └──────────────────┘       └────────────────────────┘       └────────────────────────┘
```

* **Paso 1: Radicado:**
  * Campo de entrada con formateador en tiempo real.
  * Validador de longitud exacta y limpieza de caracteres inválidos.
* **Paso 2: Validación y Reglas de la Rama:**
  * Consulta inmediata a la API de la Rama Judicial.
  * Previsualización de los datos devueltos: Despacho, Sujetos Procesales, Última Actuación.
  * **Control de Duplicados:** Alerta y bloquea el registro si el proceso ya está siendo seguido por la organización activa.
  * **Validación de Reserva (`esPrivado`):** Si el proceso es reservado, despliega advertencia legal y exige confirmación de poder procesal.
  * **Manejo de Instancias Previas:** Si ya existe otro proceso con los mismos primeros 21 dígitos en la organización, el usuario decide si se registra como subproceso, proceso principal o independiente.
  * Botón para *"Escanear otras instancias (00 a 09)"*.
* **Paso 3: Gestión Interna:**
  * Selección del abogado responsable del equipo.
  * Indicación de la parte procesal que representa la firma.
  * Campo de texto libre para notas internas (hasta 2.000 caracteres).

---

### 4.5. Ficha y Detalle del Proceso (`/procesos/[id]`)

La vista de auditoría exhaustiva del expediente:

* **Cabecera y Acciones Globales:**
  * Radicado de 23 dígitos formateado con botón de copiado al portapapeles en un clic.
  * Botón primario: *"Marcar novedades como leídas"*.
  * Botón de peligro: *"Dejar de seguir"* (despliega modal de confirmación explicando que cesará el monitoreo de términos).
  * **Pestañas de Instancias:** Navegación entre las instancias del expediente (`00`, `01`, `02`) manteniendo el contexto.
* **Tarjeta de Gestión Interna:**
  * Visualización y edición en caliente (*in-place*) del abogado responsable, parte representada y notas internas.
* **Ficha Técnica Oficial del Despacho:**
  * Ponente / Juez a cargo.
  * Recurso (Apelación, Casación, Queja).
  * Tipo de proceso, Clase y Subclase.
  * Ubicación física del expediente en el despacho.
  * Fecha de radicación oficial.
* **Tarjeta de Sujetos Procesales:**
  * Listado clasificado: *Demandantes*, *Demandados*, *Apoderados*, *Ministerio Público*.
  * Alertas de estados de emplazamiento judicial.
* **Historial Completo de Actuaciones Judiciales:**
  * Listado cronológico descendente paginado (opciones: 20, 40 o 60 por página).
  * Distintivo visual para actuaciones registradas en la última ronda de sincronización.
  * Indicador de existencia de documentos adjuntos (`tieneDocumentos`).
  * Desglose claro de **Términos Procesales:**
    * *Fecha de la Actuación*
    * *Fecha Inicial de Término*
    * *Fecha Final de Término*
    * *Fecha de Registro en Estados*

---

### 4.6. Configuración y Administración de la Firma (`/organizacion`)

Disponible únicamente al administrar una firma jurídica (organización no personal):

* **Información Fiscal (DIAN / Facturación):**
  * Formulario de Razón Social y Tipo de Persona (Jurídica / Natural).
  * NIT con cálculo dinámico del Dígito de Verificación (DV).
  * **Control de 30 Días:** Si los datos fiscales fueron modificados recientemente, los campos se bloquean en modo sólo lectura y se informa la fecha en que volverán a estar habilitados.
* **Gestión del Equipo y Membresías:**
  * Tabla de abogados vinculados: Nombre, Correo, Rol actual y etiqueta de *Fundador*.
  * Selector reactivo para ascender o descender miembros entre `ADMIN` y `LAWYER`.
  * Botón *"Invitar abogado"*: Despliega modal para ingresar el correo del destinatario y generar la invitación con token criptográfico.
  * Botón *"Desvincular"*: Abre un modal obligatorio que exige reasignar los procesos del abogado saliente a otro miembro de la firma o dejarlos en estado "Sin asignar".
* **Zona de Peligro:**
  * **Abandonar firma:** Opción para miembros regulares.
  * **Eliminar organización:** Acción exclusiva del fundador. Exige escribir el nombre exacto de la firma para confirmar y ofrece una opción crucial: **traspasar automáticamente todos los procesos de la firma a la organización personal del fundador** para no perder el seguimiento judicial.

---

## 5. Motor de Automatización en Segundo Plano (Sincronización Judicial)

El backend de Dokqet incorpora un motor de tareas programadas (`@Scheduled`) que alimenta las novedades del frontend:

1. **Rondas Diarias de Actuaciones (6:00 a.m. y 6:00 p.m. COT):**
   * Consulta por lotes de 50 radicados contra el servicio oficial de la Rama Judicial.
   * Compara la última actuación registrada; si hay diferencias, descarga el historial completo, persiste los nuevos registros en la tabla `actuaciones` y marca el proceso con el estado de novedad.
   * Envía un resumen por correo electrónico (`PROCESS_NEWS`) a los abogados correspondientes.
2. **Ronda Dominical de Detección de Instancias (Domingos 12:00 m. COT):**
   * Realiza un escaneo preventivo buscando radicados con los mismos primeros 21 dígitos pero con terminaciones de instancia superior (`01` a `09`), notificando la existencia de apelaciones concedidas.
3. **Mecanismo de Resiliencia (Circuit Breaker):**
   * Si la API de la Rama Judicial presenta indisponibilidad, errores 500 o rate-limiting, el motor aplica retroceso exponencial (*exponential backoff*) y pausas controladas, protegiendo la integridad de la base de datos y evitando el bloqueo de IPs.

---

## 6. Pautas de Implementación para el Frontend Angular

Para garantizar que el nuevo frontend conserve la fidelidad y la calidad técnica requerida:

* **Arquitectura Standalone:** Cada vista debe ser un componente Standalone cargado perezosamente mediante `loadComponent` en `app.routes.ts`.
* **Componentes Atómicos Reutilizables:**
  * Consumir la librería ubicada en `src/app/shared/components/ui/` (`ButtonComponent`, `BadgeComponent`, `CardComponent`, `ModalComponent`, `DropdownComponent`, `BreadcrumbsComponent`, `EmptyStateComponent`, `StatCardComponent`).
* **Tokens de Diseño y Colores Dokqet:**
  * Color Primario / Brand: `#EC1319` (Rojo Dokqet).
  * Color Secundario / Corporativo: `#032A2E` (Azul/Verde Petróleo Oscuro).
  * Superficies: Neutrales y modo oscuro configurado mediante Tailwind CSS (`class="dark"`).
* **Manejo de Estado con Signals:** Preferir `signal()`, `computed()` y `effect()` para el estado local, la reactividad de filtros y el cambio de organización activa.
