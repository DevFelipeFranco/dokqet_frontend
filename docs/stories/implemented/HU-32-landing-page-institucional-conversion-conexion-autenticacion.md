# HU-32: Landing Page Institucional y Comercial con Conexión a Autenticación y Experiencia de Usuario de Alto Rendimiento

---

## 1. Información General

| Campo | Valor |
|---|---|
| **ID de Historia** | `HU-32` |
| **Código Equivalente Dokqet Plataforma** | `Inspiración Landing Repositorio DOKQET + Mejora 9.28` |
| **Título** | Landing Page Institucional de Alta Conversión con Animación de Marca, Simulador Procesal y Conexión de Autenticación |
| **Módulos / Rutas de UI** | `/` (Ruta raíz pública de Dokqet Frontend) |
| **Estado** | `🚀 Implementada / Verificada` |
| **Prioridad** | `ALTA` |
| **Actores de UI** | Visitantes Públicos, Abogados Litigantes, Directores de Firmas Jurídicas, Usuarios Autenticados |

---

## 2. Narrativa de Negocio y Experiencia de Usuario

### 2.1. Como
**Como** abogado litigante, socio de firma o director jurídico en Colombia que visita por primera vez la dirección web de Dokqet,

### 2.2. Quiero
**Quiero** acceder a una Landing Page moderna, inmersiva y de alto impacto visual que me explique claramente en segundos el valor de la vigilancia judicial automatizada, me permita interactuar con una demostración del origami/mosaico de procesos y simular la consulta de un radicado de 23 dígitos, explore planes transparentes y resuelva dudas frecuentes,

### 2.3. Para
**Para** tomar la decisión informada de registrar a mi despacho (`/registro`) o iniciar sesión (`/iniciar-sesion`) sin fricciones, con la plena confianza en el cumplimiento de la Ley 1581 de 2012, el aislamiento de expedientes y la garantía de no perder jamás un término procesal.

---

## 3. Modelos de Datos en Cliente y Contratos API

### 3.1. Modelos de Contenido de la Landing Page
**Archivo:** `src/app/core/models/landing.model.ts` `[NUEVO / POR CREAR]`

```typescript
export interface LandingFeaturePillar {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: string;
  metric?: string;
  metricLabel?: string;
}

export interface LandingPricingTier {
  id: string;
  name: string;
  subtitle: string;
  priceMonthly: number;
  priceAnnual: number;
  popular: boolean;
  ctaText: string;
  ctaRoute: string;
  features: string[];
  recommendedFor: string;
}

export interface LandingFaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'cobertura' | 'seguridad' | 'planes' | 'funcionalidad';
}

export interface LandingWorkflowStep {
  step: number;
  title: string;
  description: string;
  detail: string;
  icon: string;
}
```

### 3.2. Constantes de Valor y Planes
```typescript
export const LANDING_PRICING_PLANS: LandingPricingTier[] = [
  {
    id: 'litigante',
    name: 'Litigante Individual',
    subtitle: 'Para abogados independientes con volumen propio de procesos.',
    priceMonthly: 59000,
    priceAnnual: 47000, // Descuento anual del 20%
    popular: false,
    ctaText: 'Iniciar prueba gratuita',
    ctaRoute: '/registro',
    recommendedFor: '1 abogado · Hasta 40 expedientes activos',
    features: [
      'Vigilancia diaria en el Portal Único de la Rama Judicial',
      'Alertas inmediatas de nuevas actuaciones y autos',
      'Visor de providencias en navegador sin descarga obligatoria',
      'Notificaciones por correo electrónico',
      'Soporte técnico estándar'
    ]
  },
  {
    id: 'firma',
    name: 'Firma Colectiva',
    subtitle: 'El estándar para despachos, socios y equipos de litigio.',
    priceMonthly: 189000,
    priceAnnual: 149000,
    popular: true,
    ctaText: 'Crear firma jurídica',
    ctaRoute: '/registro',
    recommendedFor: 'Hasta 5 abogados y asistentes · Expedientes ilimitados',
    features: [
      'Todo lo del plan Litigante Individual',
      'Gestión colaborativa con roles ADMIN y LAWYER',
      'Asignación y delegación de expedientes por abogado',
      'Filtro unaccent insensible a tildes y búsqueda en vivo',
      'Consulta bajo demanda con cooldown inteligente',
      'Soporte prioritario por WhatsApp y correo'
    ]
  },
  {
    id: 'corporativo',
    name: 'Corporativo / Gran Despacho',
    subtitle: 'Para departamentos jurídicos empresariales y firmas masivas.',
    priceMonthly: 490000,
    priceAnnual: 390000,
    popular: false,
    ctaText: 'Contactar a ventas',
    ctaRoute: '/registro',
    recommendedFor: 'Abogados ilimitados · Múltiples sedes judiciales',
    features: [
      'Todo lo del plan Firma Colectiva',
      'Cargue masivo estructurado de expedientes',
      'Auditoría y bitácora de trazabilidad de actuaciones',
      'Acuerdo de nivel de servicio (SLA 99.9%)',
      'Onboarding personalizado para todo el equipo'
    ]
  }
];
```

---

## 4. Reglas de Negocio en Frontend (RN-FE)

* **RN-FE-01: Enrutamiento Inteligente por Estado de Autenticación**:
  - Si un usuario **no autenticado (invitado)** accede a `/`, se renderiza la Landing Page completa.
  - Si un usuario **ya tiene sesión abierta activa**, la ruta `/` lo redirige automáticamente a su panel de control `/panel` (evitando fricción y pasos redundantes).
* **RN-FE-02: Barra de Navegación Sticky con Efecto Backdrop Blur**:
  - Encabezado fijado en el tope de la ventana (`sticky top-0 z-50`).
  - Fondo translúcido con desenfoque de cristal (`bg-background/80 backdrop-blur-md border-b border-border/40`).
  - Enlaces de acceso directo: "Características", "Cómo funciona", "Planes", "Preguntas Frecuentes", alternador de tema claro/oscuro y CTAs directos: "Iniciar sesión" (`/iniciar-sesion`) y "Registrarse" (`/registro`).
* **RN-FE-03: Hero Section con Propuesta de Valor y Artefacto de Origami**:
  - Título principal optimizado para conversión (H1): *"La plataforma de vigilancia judicial más rápida y confiable de Colombia"*.
  - Subtítulo explicativo: *"Monitoreo automatizado de la Rama Judicial, detección de autos y providencias en tiempo real, y control total para abogados litigantes y firmas jurídicas."*
  - Bloque visual interactivo a la derecha/abajo: Integra el mosaico geométrico de 48 procesos y el pajarito de origami Dokqet animado (`OrigamiBrandPanelComponent` en modo showcase).
  - Badges de confianza: *"Cifrado TLS 1.3 · Ley 1581 de 2012 (Habeas Data) · Portal Único Rama Judicial"*.
* **RN-FE-04: Simulador Interactivo de Radicado de 23 Dígitos (Demo en Vivo)**:
  - El visitante puede teclear un radicado o pulsar el botón *"Probar con radicado de ejemplo"*.
  - Validación visual de la máscara de 23 dígitos sin requerir registro inmediato, mostrando cómo Dokqet desglosa el código de departamento, municipio, juzgado, año y consecutivo según la regla oficial colombiana.
* **RN-FE-05: Comparador "Antes de Dokqet vs Con Dokqet"**:
  - Tabla comparativa o tarjetas duales contraponiendo el modelo manual (revisión diaria de micrositios uno a uno, riesgo de preclusión, pérdida de estados fijados en lista) frente al modelo automatizado de Dokqet (alertas instantáneas, visor PDF seguro en cliente sin triangular binarios pesados, asignación en equipo).
* **RN-FE-06: Selector de Facturación Mensual / Anual en Planes**:
  - Switch interactivo para alternar entre pago mensual y anual con descuento visible (`-20% anual`).
  - Precios formateados en pesos colombianos (COP).
  - El botón de cada plan redirige a `/registro` preseleccionando el tipo de cuenta adecuado.
* **RN-FE-07: Acordeón Accesible de Preguntas Frecuentes (FAQ)**:
  - Componente accesible con control de teclado (`Enter`, `Space`) y soporte de atributos ARIA (`aria-expanded`, `aria-controls`).
  - Cero saltos de maquetación (CLS < 0.1).
* **RN-FE-08: Pie de Página Institucional (Footer)**:
  - Enlaces a términos de servicio, política de protección de datos personales, estado del servicio y accesos rápidos a autenticación.

---

## 5. Criterios de Aceptación (Gherkin BDD)

```gherkin
# language: es
Característica: Landing Page Institucional y Comercial de Alta Conversión con Conexión a Autenticación

  Antecedentes:
    Dado que el usuario navega a la URL raíz de Dokqet "https://app.dokqet.com/"

  Escenario: Redirección automática de usuarios con sesión activa
    Dado que el usuario cuenta con un token de sesión PASETO válido y activo
    Cuando el usuario ingresa a la ruta raíz "/"
    Entonces el sistema no debe mostrar la landing comercial
    Y debe redirigirlo automáticamente al panel de procesos "/panel"

  Escenario: Visualización completa de la Landing Page para visitantes invitados
    Dado que el usuario no tiene una sesión iniciada
    Cuando accede a la ruta raíz "/"
    Entonces debe visualizarse la barra de navegación superior con el logotipo oficial de Dokqet
    Y debe mostrarse el enlace "Iniciar sesión" que dirige a "/iniciar-sesion"
    Y debe mostrarse el botón "Comenzar ahora" que dirige a "/registro"
    Y debe renderizarse la sección Hero con la propuesta de valor judicial y el mosaico de procesos animados

  Escenario: Interacción con el simulador de radicado de 23 dígitos en la sección Hero
    Dado que el visitante visualiza el simulador de vigilancia judicial
    Cuando pulsa el botón "Ver ejemplo de radicado"
    Entonces el campo se autocompleta con el radicado estándar "11001-31-03-001-2023-00001-00"
    Y se visualiza la tarjeta de previsualización con la tipología del juzgado y la novedad simulada

  Escenario: Alternancia entre facturación mensual y anual con descuento en planes
    Dado que el visitante desciende hasta la sección de "Planes y Tarifas"
    Cuando el switch de facturación se encuentra en "Mensual"
    Entonces el Plan Firma Colectiva exhibe el valor "$189.000 / mes"
    Cuando el visitante conmuta el switch a "Anual (Ahorra 20%)"
    Entonces el Plan Firma Colectiva actualiza reactivamente su valor a "$149.000 / mes"
    Y se muestra el distintivo de ahorro anual

  Escenario: Apertura y cierre de preguntas frecuentes en el acordeón FAQ
    Dado que el visitante navega a la sección "Preguntas Frecuentes"
    Cuando hace clic sobre la pregunta "¿Cómo garantiza Dokqet la reserva legal de los expedientes?"
    Entonces el acordeón se expande fluidamente mostrando la respuesta sobre la Ley 1581 y el visor sin retención de binarios
    Y el atributo "aria-expanded" cambia a "true"
    Cuando vuelve a hacer clic sobre la misma pregunta
    Entonces el acordeón se contrae suavemente

  Escenario: Accesibilidad y reducción de movimiento en la Landing Page
    Dado que el usuario tiene activada la preferencia del sistema "prefers-reduced-motion: reduce"
    Cuando la landing page carga en su navegador
    Entonces todas las animaciones complejas y transiciones del origami deben presentarse en su estado final estático
    Y la página debe mantener una puntuación de contraste WCAG 2.1 AA en temas claro y oscuro
```

---

## 6. Mapeo a la Arquitectura Angular

### 6.1. Componentes y Módulos
| Archivo / Componente | Clasificación | Propósito en la Solución |
|---|---|---|
| `src/app/core/models/landing.model.ts` | `[NUEVO / POR CREAR]` | Definición tipada de planes, pilares, FAQs y simulador. |
| `src/app/features/landing/landing.component.ts` | `[NUEVO / POR CREAR]` | Componente principal standalone de la Landing Page. |
| `src/app/features/landing/landing.component.html` | `[NUEVO / POR CREAR]` | Maquetación Tailwind semántica con secciones Hero, Demo, Features, Comparativa, Precios, FAQs y Footer. |
| `src/app/shared/components/ui/logo.component.ts` | `[EXISTENTE - REUTILIZADO]` | Logotipo oficial de Dokqet en variantes `completo`, `simbolo` y `nombre`. |
| `src/app/shared/components/ui/button.component.ts` | `[EXISTENTE - REUTILIZADO]` | Botones de acción principal y secundaria para CTAs de navegación. |
| `src/app/shared/components/brand/origami-brand-panel/` | `[EXISTENTE - REUTILIZADO]` | Demostración visual del plegado de origami y procesos en la sección interactiva. |
| `src/app/app.routes.ts` | `[MODIFICADO / POR EXTENDER]` | Configuración de la ruta `''` para cargar `LandingComponent` con redirección condicional para usuarios autenticados. |

---

## 7. Guía y Ejemplos Prácticos de Prueba

### 7.1. Pruebas Unitarias Jasmine / Karma
**Archivo:** `src/app/features/landing/landing.component.spec.ts` `[NUEVO / POR CREAR]`

```typescript
describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  it('debe crearse correctamente e inicializar las secciones de planes y FAQs', () => {
    // Verificación de inicialización de datos estáticos y signals
  });

  it('debe alternar reactivamente los precios entre facturación mensual y anual', () => {
    // Conmutación de signal isAnnualBilling
  });

  it('debe alternar la expansión de preguntas en el acordeón FAQ', () => {
    // Expansión y contracción de ítem FAQ
  });
});
```

### 7.2. Verificación Manual de Experiencia de Usuario (Checklist UX)
1. **Navegación Fluida:** Probar clic en "Iniciar sesión" $\rightarrow$ navega a `/iniciar-sesion`. Probar clic en "Registrarse" $\rightarrow$ navega a `/registro`.
2. **Responsive Mobile:** Verificar que en pantallas de 375px (iPhone SE/Galaxy) la barra de navegación condense los enlaces en menú móvil limpio y las tarjetas de precios se apilen verticalmente sin desbordamiento horizontal.
3. **Modo Claro / Modo Oscuro:** Validar legibilidad y contraste estricto en ambos temas sin textos opacos ilegibles.
4. **Validación de Compilación:** Ejecutar `npx tsc --project tsconfig.spec.json --noEmit` y `npm run build` con 0 errores y 0 warnings.
