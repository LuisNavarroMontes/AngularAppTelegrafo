import { ISenal, IResultadoTransmision } from './mensaje.interface';

/**
 * Interfaz que define el contrato para todos los canales de transmisión.
 * Un canal simula el medio físico por donde viaja la señal.
 * 
 * Responsabilidades:
 * - Transportar señales
 * - Aplicar pérdida proporcional a la distancia
 * - Simular fallos según condiciones
 * 
 * gotcha!
 */
export interface ICanal {
  /** Identificador único del canal */
  readonly id: string;
  
  /** Nombre descriptivo del canal */
  readonly nombre: string;
  
  /** Distancia del canal en kilómetros */
  distancia: number;
  
  /** Factor de atenuación por km (0-1) */
  factorAtenuacion: number;
  
  /** Probabilidad de fallo (0-1) */
  probabilidadFallo: number;
  
  /** Indica si el canal está operativo */
  operativo: boolean;

  /**
   * Transporta una señal a través del canal
   * @param senal La señal a transportar
   * @returns Resultado con la señal posiblemente degradada
   */
  transportar(senal: ISenal): IResultadoTransmision;

  /**
   * Calcula la pérdida de señal basada en la distancia y otros factores
   * @param intensidadOriginal Intensidad original de la señal
   * @returns Intensidad resultante después de la pérdida
   */
  calcularPerdida(intensidadOriginal: number): number;

  /**
   * Simula si ocurre un fallo en la transmisión
   * @returns true si hay fallo, false si la transmisión es exitosa
   */
  simularFallo(): boolean;

  /**
   * Obtiene el estado actual del canal
   */
  obtenerEstado(): EstadoCanal;
}

/**
 * Estado detallado del canal
 */
export interface EstadoCanal {
  operativo: boolean;
  distancia: number;
  atenuacionActual: number;
  transmisionesExitosas: number;
  transmisionesFallidas: number;
}

/**
 * Tipos de canal disponibles
 */
export enum TipoCanal {
  CABLE_TERRESTRE = 'CABLE_TERRESTRE',
  CABLE_SUBMARINO = 'CABLE_SUBMARINO',
  ENLACE_SIMULADO = 'ENLACE_SIMULADO'
}
