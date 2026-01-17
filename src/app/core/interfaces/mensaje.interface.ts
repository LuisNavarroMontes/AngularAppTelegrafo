/**
 * Representa un mensaje que puede ser transmitido por el sistema de telégrafo.
 * Es la unidad fundamental de información que fluye a través del sistema.
 */
export interface IMensaje {
  /** Identificador único del mensaje */
  id: string;
  
  /** Contenido textual del mensaje */
  contenido: string;
  
  /** Remitente del mensaje */
  remitente: string;
  
  /** Destinatario del mensaje */
  destinatario: string;
  
  /** Marca temporal de creación */
  timestamp: Date;
  
  /** Prioridad del mensaje (1 = más alta) */
  prioridad: number;
}

/**
 * Representa la señal eléctrica que viaja por el canal.
 * Es la codificación física del mensaje.
 */
export interface ISenal {
  /** Patrón de pulsos (representación de la señal) */
  pulsos: number[];
  
  /** Intensidad de la señal (0-100) */
  intensidad: number;
  
  /** Frecuencia de transmisión en Hz */
  frecuencia: number;
  
  /** Mensaje original del que proviene la señal */
  mensajeOrigenId: string;
  
  /** Timestamp de cuando se generó la señal */
  timestampGeneracion: Date;
}

/**
 * Estados posibles de una transmisión
 */
export enum EstadoTransmision {
  COMPLETADA = 'COMPLETADA',
  ERROR = 'ERROR'
}

/**
 * Resultado de una operación de transmisión
 */
export interface IResultadoTransmision {
  /** Si la transmisión fue exitosa */
  exito: boolean;
  
  /** Estado de la transmisión */
  estado: EstadoTransmision;
  
  /** Mensaje de error si aplica */
  mensajeError?: string;
  
  /** Codigo de error si aplica */
  codigoError?: string;
  
  /** Señal resultante después de la operación */
  senal?: ISenal;
  
  /** Latencia en milisegundos */
  latenciaMs?: number;
}
