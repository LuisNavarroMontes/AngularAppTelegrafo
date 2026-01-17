import { CanalBase } from './canal-base';
import { ISenal, IResultadoTransmision, CodigoError } from '../core/interfaces';
import { ErrorTransmisionFactory } from '../core/interfaces/error-transmision.interface';
import { Senal, ResultadoTransmisionFactory } from '../core/models/mensaje.model';

/**
 * Canal de Cable Submarino
 * Simula un cable telegráfico tendido bajo el mar.
 * 
 * CARACTERÍSTICAS:
 * - Alta atenuación (1.5% por km)
 * - Mayor estabilidad (no afectado por clima)
 * - Difícil de reparar
 * - Pérdida total en distancias > ~200km sin relé
 * 
 * Nota: Creado por Factory en SistemaCoordinadorService
 */
export class CanalSubmarino extends CanalBase {
  readonly id = 'canal-submarino';
  readonly nombre = 'Cable Submarino';
  
  profundidad: number;
  private presionAtm: number;

  constructor() {
    super(500, 0.015, 0.02);
    this.profundidad = 3000;
    this.presionAtm = this.calcularPresion();
  }

  protected calcularLatencia(): number {
    const latenciaBase = 50;
    const latenciaPorKm = 0.01;
    const factorProfundidad = 1 + (this.profundidad / 10000);
    return (latenciaBase + (this.distancia * latenciaPorKm)) * factorProfundidad;
  }

  override transportar(senal: ISenal): IResultadoTransmision {
    if (!this.operativo) {
      const error = ErrorTransmisionFactory.crear(
        CodigoError.CANAL_INOPERATIVO,
        `Cable submarino ${this.nombre} dañado - requiere expedición de reparación`,
        'CANAL' as any,
        this.id,
        this.nombre,
        { recuperable: false }
      );
      this.registroErrores.push(error);
      this.transmisionesFallidas++;
      return ResultadoTransmisionFactory.error(error.mensaje, error.codigo);
    }

    // Factor de presión aumenta riesgo de fallo
    const factorPresion = this.calcularFactorPresion();
    
    if (Math.random() < this.probabilidadFallo * factorPresion) {
      const error = ErrorTransmisionFactory.crear(
        CodigoError.CANAL_FALLO_TRANSMISION,
        `ERROR: fallo en ${this.nombre} a ${this.profundidad}m de profundidad`,
        'CANAL' as any,
        this.id,
        this.nombre,
        { contexto: { profundidad: this.profundidad, presion: this.presionAtm } }
      );
      this.registroErrores.push(error);
      this.transmisionesFallidas++;
      return ResultadoTransmisionFactory.error(error.mensaje, error.codigo);
    }

    const perdidaBase = this.calcularPerdida(senal.intensidad);
    const factorProfundidad = 1 - (this.profundidad / 50000);
    const intensidadFinal = Math.max(0, perdidaBase * factorProfundidad);
    
    if (intensidadFinal < this.UMBRAL_SENAL_MINIMA) {
      const error = ErrorTransmisionFactory.canalSenalPerdida(
        this.id,
        this.nombre,
        this.distancia,
        intensidadFinal
      );
      this.registroErrores.push(error);
      this.transmisionesFallidas++;
      return ResultadoTransmisionFactory.error(error.mensaje, error.codigo);
    }

    const senalTransportada = new Senal(
      senal.pulsos,
      senal.mensajeOrigenId,
      intensidadFinal,
      senal.frecuencia
    );

    if ((senal as any).checksum !== undefined) {
      (senalTransportada as any).checksum = (senal as any).checksum;
      (senalTransportada as any).codificadorId = (senal as any).codificadorId;
    }


    this.transmisionesExitosas++;
    return ResultadoTransmisionFactory.exito(senalTransportada, this.calcularLatencia());
  }

  establecerProfundidad(metros: number): void {
    this.profundidad = Math.max(0, Math.min(11000, metros));
    this.presionAtm = this.calcularPresion();
  }

  private calcularPresion(): number {
    return 1 + (this.profundidad / 10);
  }

  private calcularFactorPresion(): number {
    return 1 + (this.presionAtm / 1000);
  }

  reportarDano(): void {
    this.operativo = false;
  }
}
