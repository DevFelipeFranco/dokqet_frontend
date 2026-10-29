export enum RepresentedParty {
  SIN_DEFINIR = 'SIN_DEFINIR',
  DEMANDANTE = 'DEMANDANTE',
  DEMANDADO = 'DEMANDADO',
  OTRA = 'OTRA'
}

export enum PartyCategory {
  DEMANDANTE = 'DEMANDANTE',
  DEMANDADO = 'DEMANDADO',
  MINISTERIO_PUBLICO = 'MINISTERIO_PUBLICO',
  APODERADO = 'APODERADO',
  TERCERO = 'TERCERO',
  OTRO = 'OTRO'
}

export interface ProcessListItem {
  id: string; // OrganizationProcess ID
  radicado: string;
  instancia: string;
  despacho?: string | null;
  departamento?: string | null;
  fechaUltimaActuacion?: string | null;
  esPrivado: boolean;
  privadoDesde?: string | null;
  demandantes: string[];
  demandados: string[];
  responsibleUserId?: string | null;
  responsibleName?: string | null;
  representedParty: RepresentedParty;
  parentId?: string | null;
  parentRadicado?: string | null;
  subprocesses: ProcessListItem[];
  newCount: number;
  instanceNotices: number;
}

export interface ProcessDetailView {
  id: string;
  isHead: boolean;
  process: {
    radicado: string;
    instancia: string;
    despacho?: string | null;
    departamento?: string | null;
    ponente?: string | null;
    tipoProceso?: string | null;
    claseProceso?: string | null;
    subclaseProceso?: string | null;
    recurso?: string | null;
    ubicacion?: string | null;
    notaRadicacion?: string | null;
    fechaInicio?: string | null;
    fechaUltimaActuacion?: string | null;
    ultimaConsulta?: string | null;
    esPrivado: boolean;
    privadoDesde?: string | null;
    ultimoResultado?: string | null;
  };
  organization: {
    responsibleUserId?: string | null;
    responsibleName?: string | null;
    representedParty: RepresentedParty;
    notes?: string | null;
    registeredByName?: string | null;
    createdAt: string;
  };
  parties: {
    idRegSujeto: number;
    tipoSujeto?: string | null;
    categoria: PartyCategory;
    nombreRazonSocial?: string | null;
    identificacion?: string | null;
    esEmplazado: boolean;
  }[];
  actuaciones: {
    id: string;
    consecutivo: number;
    fechaActuacion?: string | null;
    fechaRegistro?: string | null;
    tipoActuacion?: string | null;
    anotacion?: string | null;
    fechaInicial?: string | null;
    fechaFinal?: string | null;
    tieneDocumentos: boolean;
    isNew: boolean;
  }[];
  totalActuaciones: number;
  newActuacionesCount: number;
  page: number;
  pageSize: number;
}

export interface FoundProcess {
  idProceso: number;
  idConexion: number;
  llaveProceso: string;
  fechaProceso?: string | null;
  fechaUltimaActuacion?: string | null;
  despacho?: string | null;
  departamento?: string | null;
  sujetosProcesales?: string | null;
  esPrivado: boolean;
  alreadyInOrganization: boolean;
  currentResponsible?: string | null;
}
