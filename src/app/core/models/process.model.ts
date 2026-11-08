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

export type ProcessCheckResult =
  | 'FIRST_LOAD'
  | 'NO_CHANGES'
  | 'CHANGES'
  | 'ERROR'
  | 'PRIVATE'
  | 'NOT_FOUND'
  | 'ID_CHANGED'
  | 'RELOADED';

export interface ResponsibleLawyer {
  id: string;
  name: string;
}

export interface GroupLatest {
  fecha: string;
  instancia?: string | null;
  isSubprocess?: boolean;
}

export interface ProcessGroupProcess {
  id: string;
  radicado: string;
  instancia?: string | null;
  despacho?: string | null;
  departamento?: string | null;
  fechaUltimaActuacion?: string | null;
  ultimaConsulta?: string | null;
  ultimoResultado?: ProcessCheckResult | null;
  esPrivado: boolean;
  privadoDesde?: string | null;
  notes?: string | null;
  responsibleLawyer?: ResponsibleLawyer | null;
  responsibleUserId?: string | null;
  responsibleName?: string | null;
  representedParty?: RepresentedParty | string | null;
  parentId?: string | null;
  parentRadicado?: string | null;
  demandantes: string[];
  demandados: string[];
  newCount: number;
  instanceNotices: number;
}

export interface ProcessGroupSubprocess {
  id: string;
  radicado: string;
  instancia: string;
  despacho?: string | null;
  departamento?: string | null;
  fechaUltimaActuacion?: string | null;
  ultimaConsulta?: string | null;
  ultimoResultado?: ProcessCheckResult | null;
  esPrivado: boolean;
  notes?: string | null;
  responsibleLawyer?: ResponsibleLawyer | null;
  responsibleUserId?: string | null;
  responsibleName?: string | null;
  representedParty?: RepresentedParty | string | null;
  parentId?: string | null;
  parentRadicado?: string | null;
  demandantes: string[];
  demandados: string[];
  newCount: number;
  instanceNotices: number;
}

export interface ProcessGroupItem {
  process: ProcessGroupProcess;
  subprocesses: ProcessGroupSubprocess[];
  groupLatest?: GroupLatest | null;
  matchedOnlyIn?: 'notas' | 'actuaciones' | null;
}

export interface ProcessGroupPageResponse {
  items: ProcessGroupItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  unassignedCount: number;
  withNewsCount: number;
  hasProcesses: boolean;
  seesAll: boolean;
  visibility: string;
}

export interface ProcessListQueryFilters {
  filter?: 'todos' | 'mios' | 'sin-asignar' | 'novedades';
  q?: string;
  order?: 'reciente' | 'antigua';
  page?: number;
  pageSize?: number;
  onlyMine?: boolean;
  unassignedOnly?: boolean;
  withNewsOnly?: boolean;
  responsibleUserId?: string;
}

export interface ProcessListItem {
  id: string; // OrganizationProcess ID
  radicado: string;
  instancia: string;
  despacho?: string | null;
  departamento?: string | null;
  fechaUltimaActuacion?: string | null;
  ultimaConsulta?: string | null;
  ultimoResultado?: ProcessCheckResult | null;
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

export interface ActuacionEstadoArchivo {
  nombre: string;
  url: string;
}

export interface ActuacionDocumentoItem {
  idRegDocumento: number;
  nombre: string;
  descripcion?: string | null;
  fechaCarga?: string | null;
  url: string;
}

export interface ActuacionDocumentosView {
  actuacionId: string;
  kind: 'LISTA' | 'BOTON' | 'VACIA';
  documentos: ActuacionDocumentoItem[];
}

export interface ActuacionAutoAnterior {
  actuacionId: string;
  fecha?: string | null;
  tipoActuacion?: string | null;
  tieneDocumentos: boolean;
  documentos?: ActuacionDocumentosView | null;
}

export interface ActuacionEstado {
  estadoVista: 'ANTES' | 'ENCONTRADO' | 'SOLO_ESTADO' | 'BUSCANDO' | 'NO_ENCONTRADO' | 'SIN_ESTADOS_DEL_JUZGADO' | 'ENLACE' | string;
  processPdfUrl?: string | null;
  processPdfName?: string | null;
  estadoGeneralUrl?: string | null;
  estadoGeneralName?: string | null;
  buscadoAlMenosUnaVez?: boolean | null;
  micrositioUrl?: string | null;
  paginaUrl?: string | null;
  numeroEstado?: string | null;
  archivosProceso?: ActuacionEstadoArchivo[] | null;
}

export interface ProcessDetailView {
  id: string;
  isHead: boolean;
  canReload?: boolean;
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
    ultimaRevision?: string | null;
    esPrivado: boolean;
    privadoDesde?: string | null;
    ultimoResultado?: ProcessCheckResult | null;
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
    estado?: ActuacionEstado | null;
    documentos?: ActuacionDocumentosView | null;
    autoAnterior?: ActuacionAutoAnterior | null;
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

export interface RefreshProcessResponse {
  message: string;
  newActuaciones: number;
}

export interface ReloadLookupResponse {
  candidates: FoundProcess[];
  message?: string | null;
}

export interface ReloadProcessRequest {
  selectedIdProceso: number;
}

export interface ProcessCooldownErrorResponse {
  type?: string;
  title?: string;
  status: number; // 429
  detail: string;
  instance?: string;
  errorCode: 'PROCESS_COOLDOWN';
  elapsedMinutes: number;
  remainingMinutes: number;
  elapsedSeconds?: number;
  remainingSeconds?: number;
}
