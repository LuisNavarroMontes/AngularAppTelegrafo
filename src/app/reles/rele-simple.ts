import { ReleBase } from './rele-base';
import { ISenal, IResultadoTransmision } from '../core/interfaces';
import { ResultadoTransmisionFactory } from '../core/models/mensaje.model';

/**
 * Relé Simple
 * Relé básico que simplemente detecta, amplifica y reenvía.
 * Características:
 * - Operación sencilla y confiable
 * - Sin lógica adicional
 * - Amplificación fija
 */
export class ReleSimple extends ReleBase {
  readonly id = 'rele-simple';
  readonly nombre = 'Relé Simple';
  
  /**
   * Atributo release - tiempo de liberación del relé en milisegundos.
   * Representa el tiempo que tarda el relé en volver a su estado de reposo
   * después de procesar una señal.
   */
  release: number = 50;
  
  /** Contador de señales procesadas */
  private senalesProcesadas: number = 0;

  constructor() {
    super(30, 2.0);
  }

  protected procesarEspecifico(senal: ISenal): IResultadoTransmision {
    this.senalesProcesadas++;
    
    return ResultadoTransmisionFactory.exito(senal);
  }

  /**
   * Establece el tiempo de release del relé
   * @param tiempoMs Tiempo en milisegundos
   */
  establecerRelease(tiempoMs: number): void {
    this.release = Math.max(10, Math.min(500, tiempoMs));
  }

  /**
   * Obtiene el número de señales procesadas
   */
  obtenerContadorSenales(): number {
    return this.senalesProcesadas;
  }

  /**
   * Resetea el contador de señales
   */
  resetearContador(): void {
    this.senalesProcesadas = 0;
  }
}
