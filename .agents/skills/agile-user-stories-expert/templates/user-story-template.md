# 📖 Historia de Usuario: HU-XX - [Título de la Historia]

---

## 📌 1. Información General de la Historia

| Metadato | Detalle |
| :--- | :--- |
| **Identificador** | `HU-XX` |
| **Código Equivalente Backend** | `US-YYY` (o `N/A - Exclusivo Frontend`) |
| **Título** | [Título descriptivo orientado a la funcionalidad o UX de la interfaz] |
| **Módulo / Rutas Angular** | `src/app/features/[modulo]` (`/[ruta]`) |
| **Estado** | `📝 Lista para Desarrollo` / `⚙️ En Progreso` / `✅ Completada` |
| **Prioridad** | `Alta (Core)` / `Media` / `Baja` |
| **Tipo** | `Funcionalidad (Feature)` / `Experiencia de Usuario (UX/UI)` / `Seguridad` / `Refactor` |
| **Actor Principal** | [Abogado Litigante / Administrador de Firma / SuperAdmin / Visitante] |

---

## 🎯 2. Narrativa de Negocio y Experiencia de Usuario (User Story Narrative)

**Como** [rol del usuario en la plataforma],  
**Quiero** [acción o comportamiento concreto que desea experimentar en la pantalla],  
**Para** [beneficio operativo, agilidad o seguridad en la vigilancia y gestión de expedientes judiciales].

---

## 🧱 3. Modelos de Datos en Cliente y Contratos API (`TypeScript`)

> [!IMPORTANT]
> **Auditoría de Código Preexistente:**  
> Indicar explícitamente si los tipos o modelos ya existen en `src/app/core/models/` (`[EXISTENTE - REUTILIZADO]`), si requieren extenderse (`[MODIFICADO / POR EXTENDER]`) o si deben crearse desde cero (`[NUEVO / POR CREAR]`).

### 3.1. Interfaces y Tipos TypeScript (`src/app/core/models/[modelo].model.ts`)

```typescript
// [NUEVO / POR CREAR] o [MODIFICADO]
export interface [NombreModelo] {
  id: string;
  [propiedad]: string;
  [propiedadOpcional]?: number | null;
}

// Estructura de Error RFC 9457 (ProblemDetail) esperada
export interface ProblemDetail[ErrorEspecifico] {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  [metadatoExtra]?: any;
}
```

---

## ⚖️ 4. Reglas de Negocio en Frontend (RN-FE)

- **RN-FE-01 ([Validaciones de Formulario]):** [Reglas reactivas de campo: longitud, obligatoriedad, formatos DIAN o Radicado 23 dígitos].
- **RN-FE-02 ([Estados de Carga y Skeletons]):** Durante la espera asíncrona, se debe desplegar un skeleton contextual (`<app-skeleton-...>`) evitando saltos de diseño (CLS < 0.1).
- **RN-FE-03 ([Tratamiento de Errores y Alertas]):** Respuesta ante códigos HTTP de error (`400`, `401`, `423`, `500`) mediante componentes `<app-form-alert>` o banners específicos.
- **RN-FE-04 ([Accesibilidad y Comportamiento Adaptativo]):** Soporte para navegación por teclado, contraste en modo oscuro (`#021b1e`) y disposición responsiva (`sm`, `md`, `lg`).

---

## 🧪 5. Criterios de Aceptación (Escenarios en Formato Gherkin)

```gherkin
# language: es
Característica: HU-XX - [Título de la Característica]
  Como [Rol]
  Quiero [Acción en la interfaz]
  Para [Beneficio]

  Antecedentes:
    Dado que el usuario se encuentra autenticado en Dokqet
    Y navega a la pantalla "[/ruta]"

  # =========================================================================
  # REGLA: CAMINO FELIZ - RENDERIZADO Y FLUJO EXITOSO
  # =========================================================================
  Escenario: Carga y visualización exitosa de los datos
    Dado que el servicio "[Servicio]" responde exitosamente con los datos requeridos
    Cuando la vista finaliza la carga
    Entonces el skeleton de carga desaparece
    Y se visualiza el contenido con sus etiquetas y controles interactivos

  # =========================================================================
  # REGLA: VALIDACIÓN REACTIVA DE ENTRADA
  # =========================================================================
  Esquema del escenario: Validación de campos obligatorios o formatos inválidos
    Dado que el usuario interactúa con el campo "<campo>"
    Cuando ingresa el valor "<valor>" y desenfoca el control
    Entonces el campo muestra el estado de error con borde destacado
    Y se despliega el mensaje de ayuda "<mensajeError>"
    Y el botón principal permanece inhabilitado

    Ejemplos:
      | campo            | valor             | mensajeError                                      |
      | radicado         | 12345             | El radicado judicial debe contener 23 dígitos.    |
      | email            | correo-invalido   | Ingresa un correo electrónico profesional válido. |

  # =========================================================================
  # REGLA: MANEJO DE ERRORES DEL BACKEND (RFC 9457)
  # =========================================================================
  Escenario: El servidor responde con error de negocio
    Dado que el usuario completa el formulario y presiona el botón de confirmación
    Cuando el backend responde con código HTTP <codigoError> y detalle "<detalleError>"
    Entonces la interfaz muestra una alerta contextual de error con dicho mensaje
    Y los campos del formulario conservan los valores ingresados por el usuario

  # =========================================================================
  # REGLA: ESTADOS DE CARGA ASÍNCRONA (SKELETON LOADERS)
  # =========================================================================
  Escenario: Transición suave durante la consulta de red
    Dado que se ejecuta una petición asíncrona de datos
    Cuando la respuesta se encuentra pendiente en la red
    Entonces se muestran siluetas esqueléticas pulsantes sin spinners de pantalla completa
    Y la barra de desplazamiento y contenedores no experimentan saltos bruscos
```

---

## 🏗️ 6. Mapeo a la Arquitectura Angular (Clasificación de Componentes)

- **`[EXISTENTE - REUTILIZADO]` / `[MODIFICADO]` / `[NUEVO]` Componente Principal:**  
  `src/app/features/[modulo]/[nombre-componente].component.ts` (Plantilla HTML y Componente Standalone con Signals).
- **`[EXISTENTE - REUTILIZADO]` / `[MODIFICADO]` / `[NUEVO]` Componentes Compartidos (UI):**  
  `src/app/shared/components/ui/[nombre-ui].component.ts` (Button, Skeleton, FormAlert, Dialog, etc.).
- **`[EXISTENTE - REUTILIZADO]` / `[MODIFICADO]` / `[NUEVO]` Servicio de Dominio:**  
  `src/app/core/services/[nombre-servicio].service.ts` (Inyección de `HttpClient`, Signals y Observables).
- **`[EXISTENTE - REUTILIZADO]` / `[MODIFICADO]` / `[NUEVO]` Modelos y DTOs:**  
  `src/app/core/models/[nombre-modelo].model.ts` (Interfaces TypeScript y Enums).
- **`[EXISTENTE - REUTILIZADA]` / `[MODIFICADA]` Configuración de Enrutamiento:**  
  `src/app/app.routes.ts` (Rutas con `loadComponent` y `canActivate`).

---

## 🚀 7. Guía y Ejemplos Prácticos de Prueba (Testing Guide)

### 7.1. Pruebas Unitarias Automatizadas (Jasmine / Karma)
```typescript
describe('[NombreComponente]', () => {
  let component: [NombreComponente];
  let fixture: ComponentFixture<[NombreComponente]>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [[NombreComponente]],
      providers: [
        provideHttpClientTesting(),
        // Mocks de servicios requeridos
      ]
    }).compileComponents();

    fixture = TestBed.createComponent([NombreComponente]);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe renderizar el skeleton loader mientras carga', () => {
    // Verificación de estado de carga
  });

  it('debe manejar errores de servidor y mostrar alerta contextual', () => {
    // Verificación de error HTTP
  });
});
```

### 7.2. Ejecución de Pruebas con Angular CLI
```bash
# Ejecutar pruebas unitarias headless del componente
npx ng test --include="src/app/features/[modulo]/**/*.spec.ts" --no-watch --browsers=ChromeHeadless
```

### 7.3. Checklist de Verificación Manual de UI
1. Navegar a `http://localhost:4200/[ruta]`.
2. Verificar que no haya saltos visuales (CLS < 0.1) durante la carga inicial.
3. Probar la validación en tiempo real en los campos de formulario.
4. Simular errores de red y confirmar que la retroalimentación sea clara y amigable.
5. Verificar el contraste visual en tema claro y oscuro, así como la accesibilidad con teclado (`Tab`, `Enter`).
