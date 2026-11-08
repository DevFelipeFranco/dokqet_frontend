/**
 * Modelos de datos y contenido oficial de la Landing Page de Dokqet (HU-32),
 * sincronizados fielmente con el repositorio DOKQET de Miguel (src/i18n/es.ts y DemoScreens.astro).
 */

export interface LandingProblemBeat {
  id: string;
  numberBadge: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix?: string;
  description: string;
}

export interface LandingHowStep {
  step: number;
  tag: string;
  title: string;
  text: string;
}

export interface LandingFeatureHighlight {
  id: string;
  badge: string;
  title: string;
  text: string;
  icon: 'radar' | 'folder' | 'calendar';
}

export interface LandingDemoCaption {
  id: 'mail' | 'panel' | 'detail';
  badge: string;
  title: string;
  text: string;
  ariaLabel: string;
}

export interface LandingPlanItem {
  id: string;
  name: string;
  forText: string;
  priceLabel: string;
  features: string[];
  highlight?: boolean;
}

export interface LandingConsultingItem {
  number: string;
  title: string;
  text: string;
}

export const LANDING_NAV = {
  platform: 'Plataforma',
  demo: 'Demostración',
  plans: 'Planes y precios',
  consulting: 'Consultoría IA',
};

export const LANDING_HERO = {
  time: 'Lunes, 7:40 a. m.',
  titleLine1: '48 procesos.',
  titleLine2: 'Una actuación',
  titleHighlight: 'no puede esperar.',
  leadStrong: 'Automatiza el seguimiento de tus procesos judiciales.',
  lead: 'dokqet detecta las novedades de cada expediente y te avisa de nuevas actuaciones, estados y documentos.',
  storyCta: 'Sigue la historia',
  boardCaption: 'Cada triángulo es un proceso de tu oficina.',
  notice: {
    label: 'Aviso de ejemplo de dokqet',
    title: 'Nueva actuación',
    radicado: '99999-31-03-001-2023-00001-00',
    text: 'Auto fija fecha de audiencia',
  },
};

export const LANDING_PROBLEM = {
  kicker: 'Lo de siempre, sin dokqet:',
  beats: [
    {
      id: 'beat-1',
      numberBadge: '01 / 03',
      titlePrefix: 'Abrir la consulta de la Rama: proceso',
      titleHighlight: '48 de 48.',
      description:
        'Escribir el radicado, buscar la última actuación, comparar con la semana pasada. Y repetir con el siguiente.',
    },
    {
      id: 'beat-2',
      numberBadge: '02 / 03',
      titlePrefix: 'Una actuación sin ver es un',
      titleHighlight: 'término corriendo.',
      description: 'Un auto notificado por estado que nadie revisó a tiempo.',
    },
    {
      id: 'beat-3',
      numberBadge: '03 / 03',
      titlePrefix: 'Y cada abogado con',
      titleHighlight: 'su propia',
      titleSuffix: 'hoja de cálculo.',
      description:
        'La información está dispersa, el seguimiento es manual y nadie tiene una visión completa de lo que pasa con los procesos.',
    },
  ] satisfies LandingProblemBeat[],
};

export const LANDING_HOW = {
  kicker: 'Ahora, el mismo lunes con dokqet:',
  title: 'Tú registras. dokqet vigila.',
  steps: [
    {
      step: 1,
      tag: 'Una sola vez',
      title: 'Registras el proceso',
      text: 'Solo necesitas ingresar el número de radicado. dokqet localiza el expediente.',
    },
    {
      step: 2,
      tag: 'Automáticamente',
      title: 'dokqet hace el seguimiento',
      text: 'Consulta tus expedientes e identifica nuevas actuaciones, estados publicados y documentos incorporados.',
    },
    {
      step: 3,
      tag: 'Cuando hay novedades',
      title: 'Recibes una notificación',
      text: 'Te informamos por correo electrónico cuando hay movimientos en tus procesos judiciales.',
    },
    {
      step: 4,
      tag: 'Para todo el equipo',
      title: 'Todo tu equipo jurídico, en un solo lugar.',
      text: 'Organiza tu equipo, asigna responsables a cada proceso y facilita el trabajo colaborativo en la gestión de tus expedientes.',
    },
  ] satisfies LandingHowStep[],
  features: [
    {
      id: 'seguimiento-automatico',
      badge: 'Vigilancia Diaria',
      title: 'Seguimiento automático',
      text: 'Olvídate de consultar la Rama Judicial proceso por proceso: dokqet vigila tus expedientes y te avisa cuando algo cambia.',
      icon: 'radar',
    },
    {
      id: 'expediente-digital',
      badge: 'Acceso Directo',
      title: 'Enlaza tu expediente digital',
      text: 'Vincula a cada proceso su expediente digital y tenlo a un clic, junto a sus actuaciones.',
      icon: 'folder',
    },
    {
      id: 'alertas-agenda',
      badge: 'Agenda y Recordatorios',
      title: 'Configura alertas y gestiona tu agenda',
      text: 'Agenda audiencias y programa recordatorios de lo que tu equipo debe hacer y cuándo.',
      icon: 'calendar',
    },
  ] satisfies LandingFeatureHighlight[],
};

export const LANDING_DEMO = {
  kicker: 'Al llegar a la oficina, suena el correo.',
  title: 'Lo que ves en pantalla.',
  captions: [
    {
      id: 'mail',
      badge: '01 · Correo',
      title: 'El aviso',
      text: 'Llega solo, sin que lo busques.',
      ariaLabel: 'Correo de novedades de dokqet, con datos de ejemplo',
    },
    {
      id: 'panel',
      badge: '02 · Plataforma',
      title: 'El panel',
      text: 'Lo que cambió aparece primero.',
      ariaLabel: 'Panel de procesos de dokqet, con datos de ejemplo',
    },
    {
      id: 'detail',
      badge: '03 · Expediente',
      title: 'El detalle',
      text: 'Actuación, estado y documento juntos.',
      ariaLabel: 'Detalle de un proceso en dokqet, con datos de ejemplo',
    },
  ] satisfies LandingDemoCaption[],
};

export const LANDING_PLANS = {
  kicker: '¿Y cuánto cuesta?',
  title: 'Un plan para cada oficina.',
  note: 'Estamos definiendo los precios. Escríbenos y te contamos en cuanto estén listos.',
  priceLabel: 'Precio próximamente',
  items: [
    {
      id: 'independiente',
      name: 'Independiente',
      forText: 'Para quien lleva sus propios procesos.',
      priceLabel: 'Precio próximamente',
      features: [
        'Tus procesos, en un solo lugar',
        'Avisos por correo de cada novedad',
        'Estados y documentos',
      ],
    },
    {
      id: 'firma',
      name: 'Firma',
      forText: 'Para equipos que se reparten los procesos.',
      priceLabel: 'Precio próximamente',
      highlight: true,
      features: [
        'Varios usuarios en la misma organización',
        'Responsables y «solo los míos»',
        'Instancias agrupadas',
      ],
    },
    {
      id: 'organizacion',
      name: 'Organización',
      forText: 'Para departamentos jurídicos.',
      priceLabel: 'Precio próximamente',
      features: [
        'Procesos y usuarios a la medida',
        'Carga inicial acompañada',
        'Acompañamiento para todo el equipo',
      ],
    },
  ] satisfies LandingPlanItem[],
};

export const LANDING_CLOSING = {
  time: 'Lunes, 6:00 p. m. Ningún término vencido.',
  titlePrefix: 'Deja que dokqet',
  titleHighlight: 'lo haga por ti.',
};

export const LANDING_CONSULTING = {
  kicker: 'Epílogo: ¿y el resto de la oficina?',
  title: 'Consultoría de IA para oficinas y firmas de abogados.',
  lede: 'Consultores de IA y abogados, trabajando juntos. No somos solo asesores legales, ni solo consultores de IA: somos los dos a la vez.',
  cta: 'Agendar diagnóstico',
  mailHref: 'mailto:info@dokqet.com?subject=Consultor%C3%ADa%20de%20IA',
  email: 'info@dokqet.com',
  items: [
    {
      number: '01',
      title: 'Diagnóstico',
      text: 'Analizamos cómo trabaja tu oficina para identificar qué se puede automatizar, qué no y con qué riesgos.',
    },
    {
      number: '02',
      title: 'Documentos',
      text: 'Revisión acelerada de contratos y documentos generados desde tus plantillas.',
    },
    {
      number: '03',
      title: 'Automatización',
      text: 'Reparto, seguimiento, recordatorios e informes que dejan de hacerse a mano.',
    },
    {
      number: '04',
      title: 'Uso responsable',
      text: 'Confidencialidad, secreto profesional y capacitación del equipo.',
    },
  ] satisfies LandingConsultingItem[],
};
