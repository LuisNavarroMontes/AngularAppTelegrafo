import { TipoNodo, ConfiguracionNodo, ICanal, IRele, IMensaje } from '../interfaces';

export enum EstadoSistema {
  DETENIDO = 'DETENIDO',
  LISTO = 'LISTO',
  TRANSMITIENDO = 'TRANSMITIENDO',
  ERROR = 'ERROR'
}

export interface ConfiguracionSistema {
  emisores: ConfiguracionNodo[];
  componentesIntermedios: ConfiguracionNodo[];
  receptores: ConfiguracionNodo[];
  emisor?: ConfiguracionNodo;
  receptor?: ConfiguracionNodo;
}

export interface ComponenteCadena {
  tipo: TipoNodo;
  componente: ICanal | IRele;
}

export interface RegistroTransmision {
  mensaje: IMensaje;
  exito: boolean;
  error?: string;
  componenteFallo?: string;
  tiempoMs: number;
  timestamp: Date;
  contenidoEnviado: string;
  contenidoRecibido?: string;
  codificadorUsado?: string;
}

export interface ResultadoEnvio {
  exito: boolean;
  mensaje?: IMensaje;
  tiempoTransmisionMs?: number;
  error?: string;
  componenteFallo?: string;
  mensajeDecodificado?: string;
}

export interface InfoBateria {
  nivel: number;
  capacidadMaxima: number;
  critico: boolean;
  agotada: boolean;
}

export interface ComponenteIntermedioInfo {
  tipo: TipoNodo;
  nombre: string;
  parametros?: Record<string, unknown>;
  bateria?: InfoBateria;
}

export interface InformacionSistema {
  estado: EstadoSistema;
  codificador: string;
  emisores: Array<{ nombre: string; encendido: boolean }>;
  componentesIntermedios: ComponenteIntermedioInfo[];
  receptores: Array<{ nombre: string; activo: boolean; mensajesRecibidos: number }>;
  transmisionesRealizadas: number;
  transmisionesExitosas: number;
  transmisionAutomaticaActiva?: boolean;
  mensajesAutomaticosEnviados?: number;
  intervaloTransmision?: number;
  emisor?: { nombre: string; encendido: boolean } | null;
  receptor?: { nombre: string; activo: boolean; mensajesRecibidos: number } | null;
}
