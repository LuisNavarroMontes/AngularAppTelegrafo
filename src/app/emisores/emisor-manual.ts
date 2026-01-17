import { EmisorBase } from './emisor-base';
import { ISenal, IResultadoTransmision, ICodificador } from '../core/interfaces';
import { ResultadoTransmisionFactory } from '../core/models/mensaje.model';

/**
 * Emisor Manual
 * Simula un operador humano enviando mensajes manualmente.
 * Características:
 * - Velocidad de transmisión variable (simula operador)
 * - Posibilidad de errores humanos
 * - Requiere confirmación manual para cada envío
 * 
 * Nota: Creado por Factory en SistemaCoordinadorService
 */
export class EmisorManual extends EmisorBase {
  readonly id = 'emisor-manual';
  readonly nombre = 'Emisor Manual';
  
  /** Velocidad de transmisión (palabras por minuto) */
  velocidadWPM: number = 15;
  
  /** Probabilidad de error humano (0-1) */
  probabilidadErrorHumano: number = 0.02;

  constructor(codificador: ICodificador) {
    super(codificador);
  }

  protected procesarEnvio(senal: ISenal): IResultadoTransmision {
    if (Math.random() < this.probabilidadErrorHumano) {
      return ResultadoTransmisionFactory.error(
        'Error de operador en la transmisión',
        'ERROR_HUMANO'
      );
    }

    
    return ResultadoTransmisionFactory.exito(senal);
  }

  /**
   * Ajusta la velocidad de transmisión
   */
  ajustarVelocidad(wpm: number): void {
    this.velocidadWPM = Math.max(5, Math.min(30, wpm));
  }
}
