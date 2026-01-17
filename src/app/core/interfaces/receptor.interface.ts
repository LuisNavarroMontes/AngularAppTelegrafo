import { IMensaje, ISenal, IResultadoTransmision } from './mensaje.interface';

/**
 * Interfaz que define el contrato para todos los receptores.
 * Un receptor es el elemento final que decodifica la señal en texto legible.
 * 
 * Responsabilidades:
 * - Recibir pulsos
 * - Decodificar la información
 * - Producir representación legible del mensaje
 */
export interface IReceptor {
  /** Identificador único del receptor */
  readonly id: string;
  
  /** Nombre descriptivo del receptor */
  readonly nombre: string;
  
  /** Indica si el receptor está activo */
  activo: boolean;
  
  /** Historial de mensajes recibidos */
  mensajesRecibidos: IMensaje[];

  /**
   * Recibe los pulsos de una señal
   * @param senal La señal con los pulsos a recibir
   * @returns Resultado de la recepción
   */
  recibirPulsos(senal: ISenal): IResultadoTransmision;

  /**
   * Decodifica una señal en un mensaje legible
   * @param senal La señal a decodificar
   * @returns El mensaje decodificado
   */
  decodificar(senal: ISenal): IMensaje;

  /**
   * Produce una representación legible del mensaje
   * (consola, fichero, estructura interna según implementación)
   * @param mensaje El mensaje a representar
   */
  producirSalida(mensaje: IMensaje): void;

  /**
   * Obtiene todos los mensajes recibidos
   */
  obtenerHistorial(): IMensaje[];

  /**
   * Obtiene el registro de errores de transmisión
   */
  obtenerRegistroErrores?(): any[];
}

/**
 * Tipos de receptor disponibles
 */
export enum TipoReceptor {
  CONSOLA = 'CONSOLA',
  FICHERO = 'FICHERO',
  MEMORIA = 'MEMORIA'
}
