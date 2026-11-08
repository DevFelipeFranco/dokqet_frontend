# HU-31: Panel de Marca y Animación de Origami en Pantallas de Autenticación

---

## 1. Información General

| Campo | Valor |
|---|---|
| **ID de Historia** | `HU-31` (Portabilidad Mejora 9.28) |
| **Código Equivalente Dokqet Plataforma** | `Mejora 9.28 (Commit c150d59)` |
| **Título** | Panel de Marca Inmersivo con Animación de Pájaro de Origami en Pantallas de Autenticación |
| **Módulos / Rutas de UI** | `/iniciar-sesion`, `/registro`, `/recuperar-contrasena` |
| **Estado** | `🚀 Implementada / Verificada` |
| **Prioridad** | `MEDIA` |
| **Actores de UI** | Abogados Litigantes, Miembros de Firmas Jurídicas, Nuevos Usuarios |

---

## 2. Narrativa de Negocio y Experiencia de Usuario

### 2.1. Como
**Como** abogado litigante o integrante de una firma jurídica que accede a Dokqet para gestionar y vigilar expedientes,

### 2.2. Quiero
**Quiero** visualizar en la pantalla de inicio de sesión un panel de marca cinematográfico y unificado con la Landing Page institucional, donde los procesos judiciales se representen como un mosaico geométrico que se escanea en tiempo real y del cual florece el pájaro de origami oficial de Dokqet en 4 segundos,

### 2.3. Para
**Para** conectar emocionalmente con la propuesta de valor del producto desde el primer segundo de acceso, comprender de forma intuitiva que Dokqet vigila y alerta automáticamente sobre novedades procesales, y disfrutar de una experiencia visual moderna, accesible (WCAG 2.1 AA) y coherente en todo el ecosistema de la plataforma.

---

## 3. Modelos de Datos en Cliente y Contratos API

### 3.1. Tipos y Modelos de la Animación Geométrica
**Archivo:** `src/app/shared/utils/origami-animation.utils.ts` `[NUEVO / POR CREAR]`

```typescript
export type Point = [number, number];
export type Polygon = Point[];

export interface OrigamiTriangle {
  index: number;
  column: number;
  points: string;
  isUpward: boolean;
}

export type OrigamiPhase = 'inicio' | 'mosaico' | 'pajaro' | 'final';

export interface BrandFeature {
  title: string;
  description: string;
}
```

### 3.2. Constantes de Valor de Marca
```typescript
export const BRAND_FEATURES: BrandFeature[] = [
  {
    title: 'Vigila tus procesos por ti',
    description: 'Cada proceso, todos los días, sin consultar uno por uno.'
  },
  {
    title: 'Te avisa al instante',
    description: 'Actuaciones, autos y estados directamente en tu correo.'
  },
  {
    title: 'Tu firma y tu equipo, en un solo lugar',
    description: 'Responsables, procesos y expedientes organizados sin duplicidad.'
  }
];
```

---

## 4. Reglas de Negocio en Frontend (RN-FE)

- **RN-FE-01: Secuencia Orquestada de 5 Fases en Inicio de Sesión**:
  1. *Fase 0 (`inicio`, t = 0s)*: Los 48 triángulos del mosaico parten ocultos con escala 0 y rotación de 90°. El pájaro de origami se ubica en su origen con escala 0.25 y rotación -30°.
  2. *Fase 1 (`mosaico`, t = 30ms)*: Los 48 triángulos brotan con transiciones elásticas aleatorias (100ms - 700ms de delay) en tono petróleo institucional (`#0b3a3f`).
  3. *Fase 2 (`escaneo`, t = 900ms a 1800ms)*: Un frente de escaneo viaja secuencialmente por las 8 columnas (90ms por columna), tiñendo los triángulos momentáneamente en tono vino de escaneo (`#7a2a2c`).
  4. *Fase 3 (`novedad`, t = 1700ms)*: El proceso índice 21 se ilumina en rojo Dokqet (`#ec1319`), alertando una novedad judicial en juzgados.
  5. *Fase 4 (`pajaro`, t = 2000ms a 3300ms)*: Durante 1.3 segundos, una hoja romboide roja se dobla geométricamente dos veces y se despliega como el pájaro oficial de 7 piezas de Dokqet (usando interpolación polinomial cúbica y sombreado de reverso de papel).
  6. *Fase 5 (`aviso` y `final`, t = 3500ms)*: Se muestra una notificación flotante simulada de actuación detectada; luego se atenúa el fondo y emergen escalonadamente los 3 pilares de valor.
- **RN-FE-02: Accesibilidad Universal y Reducción de Movimiento (WCAG 2.1 AA)**:  
  Si el sistema operativo o navegador tiene activa la directiva `prefers-reduced-motion: reduce`:
  - Queda estrictamente prohibida la reproducción de temporizadores o morphing SVG continuo.
  - El componente se renderiza inmediatamente en su fase final estática (`data-fase="final"`), mostrando el pájaro completamente plegado y los 3 pilares legibles.
- **RN-FE-03: Reutilización sin Animación en Registro y Recuperación**:  
  En pantallas secundarias de autenticación (`/registro`, `/recuperar-contrasena`), el panel de marca se renderiza estático por defecto (`[animate]="false"`), evitando distracciones en formularios extensos de captura de datos.
- **RN-FE-04: Diseño Adaptativo Mobile-First**:  
  - En pantallas de escritorio (`lg:`, `>= 1024px`): Panel de marca lateral completo ocupando el 50% o 5/12 de la pantalla con altura `h-svh`.
  - En móviles y tabletas (`< 1024px`): Franja superior compacta (`marca-panel`) en fondo `#011416` con logo de la marca y frase representativa sin saturar el viewport del usuario.
- **RN-FE-05: Cero Dependencias Externas de Animación**:  
  El morphing vectorial del origami debe resolverse con SVG nativo e interpolación geométrica pura (`createOrigami`), sin instalar librerías pesadas (GSAP comercial, Three.js ni Lottie), garantizando un bundle ultraliviano (< 15 KB).

---

## 5. Criterios de Aceptación Gherkin

```gherkin
# language: es
Característica: Panel de Marca y Animación de Origami en Inicio de Sesión
  Como usuario que ingresa a la plataforma Dokqet
  Quiero presenciar la animación del pajarito de origami y la narrativa de vigilancia judicial
  Para experimentar una identidad visual profesional alineada con la Landing Page

  Escenario: Animación completa en pantalla de inicio de sesión en computador
    Dado que el usuario navega a "/iniciar-sesion" en una pantalla de escritorio
    Y el usuario no tiene activada la preferencia de reducción de movimiento
    Cuando se monta la vista
    Entonces se renderiza el panel izquierdo oscuro con el fondo "#011416"
    Y los 48 triángulos del mosaico de procesos se despliegan progresivamente
    Y una columna de escaneo recorre el mosaico
    Y el proceso central se enciende en rojo "#ec1319"
    Y la hoja de papel se pliega en el pájaro de origami de Dokqet en 1.3 segundos
    Y finalmente se presentan los tres pilares de valor de la plataforma

  Escenario: Respeto inmediato a la preferencia de reducción de movimiento
    Dado que el usuario tiene activado "prefers-reduced-motion: reduce" en su sistema
    Cuando navega a "/iniciar-sesion"
    Entonces el panel de marca se presenta de inmediato en su estado "final" estático
    Y el pájaro de origami se muestra completamente armado sin animaciones intermedias
    Y los tres pilares de valor son visibles de inmediato

  Escenario: Comportamiento estático en la pantalla de registro
    Dado que el usuario navega a "/registro"
    Cuando se renderiza el panel de marca
    Entonces el panel se muestra directamente armado sin ejecutar la secuencia de 4 segundos
    Y el formulario de registro conserva su foco y legibilidad inmediata
```

---

## 6. Mapeo a la Arquitectura Angular

| Archivo / Componente | Clasificación | Propósito |
|---|---|---|
| `src/app/shared/utils/origami-animation.utils.ts` | `[NUEVO / POR CREAR]` | Algoritmo matemático de interpolación y plegado del pájaro oficial de 7 piezas de Dokqet. |
| `src/app/shared/components/brand/origami-brand-panel.component.ts` | `[NUEVO / POR CREAR]` | Componente Standalone Angular 19 (`OnPush`) con orquestador de fases y Signals. |
| `src/app/shared/components/brand/origami-brand-panel.component.html` | `[NUEVO / POR CREAR]` | Plantilla con mosaico SVG de 48 procesos, notificación flotante y 3 pilares. |
| `src/app/features/auth/sign-in/sign-in.component.html` | `[MODIFICADO / POR EXTENDER]` | Integración del panel de marca interactivo `<app-origami-brand-panel>` en la columna izquierda. |
| `src/app/features/auth/sign-in/sign-in.component.ts` | `[MODIFICADO / POR EXTENDER]` | Importación del nuevo componente de marca en la sección de imports Standalone. |
| `src/styles.css` | `[MODIFICADO / POR EXTENDER]` | Reglas utilitarias y variables CSS para el mosaico y las fases de la animación. |
| `src/app/shared/components/brand/origami-brand-panel.component.spec.ts` | `[NUEVO / POR CREAR]` | Pruebas unitarias de las transiciones de fases y respeto de accesibilidad. |

---

## 7. Guía y Ejemplos Prácticos de Prueba

```bash
# 1. Compilación estricta de tipos y componentes
npx tsc --project tsconfig.spec.json --noEmit

# 2. Compilación del proyecto Angular
npx ng build
```
