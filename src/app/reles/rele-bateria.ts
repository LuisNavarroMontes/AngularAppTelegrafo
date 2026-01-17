import { ReleBase } from './rele-base';
import { ISenal, IResultadoTransmision } from '../core/interfaces';
import { ResultadoTransmisionFactory } from '../core/models/mensaje.model';
import { EstadoBateria } from './rele-bateria.interfaces';

/**
 * Relé con Batería Limitada
 * Relé que funciona con una batería que se agota con el uso.
 * Características:
 * - Batería finita que se consume con cada amplificación
 * - Mayor amplificación consume más batería
 * - Puede recargarse
 * - Se desactiva cuando la batería se agota
 * 
 * REQUISITO: Relé con energía limitada que se niega a amplificar cuando está agotado
 */
export class ReleBateria extends ReleBase {
  readonly id = 'rele-bateria';
  readonly nombre = 'Relé con Batería';
  
  /** Nivel de batería actual (0-100) */
  nivelBateria: number = 100;
  
  /** Capacidad máxima de la batería */
  readonly capacidadMaxima: number = 100;
  
  /** Consumo base por operación */
  private consumoBase: number = 2;
  
  /** Consumo adicional por amplificación */
  private consumoPorAmplificacion: number = 0.5;

  constructor() {
    super(25, 2.5);
  }

  protected procesarEspecifico(senal: ISenal): IResultadoTransmision {
    if (this.nivelBateria <= 0) {
      return ResultadoTransmisionFactory.error(
        'Batería agotada',
        'BATERIA_AGOTADA'
      );
    }

    const consumo = this.calcularConsumo(senal);
    
    if (this.nivelBateria < consumo) {
      return ResultadoTransmisionFactory.error(
        'Batería insuficiente para la operación',
        'BATERIA_INSUFICIENTE'
      );
    }

    this.nivelBateria -= consumo;

    if (this.nivelBateria <= 0) {
      this.activo = false;
    }

    return ResultadoTransmisionFactory.exito(senal);
  }

  /**
   * Calcula el consumo de batería para una operación
   */
  private calcularConsumo(senal: ISenal): number {
    const amplificacionNecesaria = this.detectarSenalDebil(senal) 
      ? this.factorAmplificacion 
      : 1;
    
    return this.consumoBase + (amplificacionNecesaria * this.consumoPorAmplificacion);
  }

  /**
   * Recarga la batería
   * @param cantidad Cantidad a recargar (0-100)
   */
  recargar(cantidad: number = 100): void {
    const anterior = this.nivelBateria;
    this.nivelBateria = Math.min(this.capacidadMaxima, this.nivelBateria + cantidad);
    
    if (!this.activo && this.nivelBateria > 0) {
      this.activo = true;
    }
  }

  /**
   * Obtiene el estado de la batería
   */
  obtenerEstadoBateria(): EstadoBateria {
    return {
      nivelActual: this.nivelBateria,
      capacidadMaxima: this.capacidadMaxima,
      porcentaje: (this.nivelBateria / this.capacidadMaxima) * 100,
      critico: this.nivelBateria < 20,
      agotada: this.nivelBateria <= 0
    };
  }
}

