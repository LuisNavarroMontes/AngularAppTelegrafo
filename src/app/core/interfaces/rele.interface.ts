import { ISenal, IResultadoTransmision } from './mensaje.interface';

/**
 * Interfaz que define el contrato para todos los relés/repetidores.
 * Un relé es un elemento intermedio que regenera la señal.
 * 
 * Responsabilidades:
 * - Detectar señal débil
 * - Restaurar/amplificar la señal
 * - Reenviar la señal regenerada
 */
export interface IRele {
  /** Identificador único del relé */
  readonly id: string;
  
  /** Nombre descriptivo del relé */
  readonly nombre: string;
  
  /** Umbral mínimo de intensidad para detectar señal (0-100) */
  umbralDeteccion: number;
  
  /** Factor de amplificación de la señal */
  factorAmplificacion: number;
  
  /** Indica si el relé está activo */
  activo: boolean;

  /**
   * Detecta si una señal es débil y necesita regeneración
   * @param senal La señal a evaluar
   * @returns true si la señal está por debajo del umbral
   */
  detectarSenalDebil(senal: ISenal): boolean;

  /**
   * Restaura/amplifica una señal débil
   * @param senal La señal a restaurar
   * @returns La señal regenerada con mayor intensidad
   */
  restaurarSenal(senal: ISenal): ISenal;

  /**
   * Reenvía la señal (posiblemente regenerada) al siguiente componente
   * @param senal La señal a reenviar
   * @returns Resultado de la operación
   */
  reenviarSenal(senal: ISenal): IResultadoTransmision;

  /**
   * Procesa completamente una señal: detecta, restaura si es necesario, y reenvía
   * @param senal La señal entrante
   * @returns Resultado con la señal procesada
   */
  procesar(senal: ISenal): IResultadoTransmision;
}

/**
 * Tipos de relé disponibles
 */
export enum TipoRele {
  SIMPLE = 'SIMPLE',
  BATERIA_LIMITADA = 'BATERIA_LIMITADA',
  INTELIGENTE = 'INTELIGENTE'
}
