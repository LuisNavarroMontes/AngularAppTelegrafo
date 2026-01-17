import { IRele, ISenal, IResultadoTransmision, TipoNodo } from '../core/interfaces';
import { Senal, ResultadoTransmisionFactory } from '../core/models/mensaje.model';
import { Component } from '../core/components/component';

/**
 * Clase base abstracta para todos los relés/repetidores.
 */
export abstract class ReleBase extends Component implements IRele {
  abstract override readonly id: string;
  abstract override readonly nombre: string;
  override readonly tipo: TipoNodo = TipoNodo.RELE;
  
  umbralDeteccion: number;
  factorAmplificacion: number;
  activo: boolean = true;
  
  protected readonly UMBRAL_INTENSIDAD_MINIMA = 5;

  constructor(
    umbralDeteccion: number = 30,
    factorAmplificacion: number = 2.0
  ) {
    super();
    this.umbralDeteccion = umbralDeteccion;
    this.factorAmplificacion = factorAmplificacion;
  }

  detectarSenalDebil(senal: ISenal): boolean {
    return senal.intensidad > this.umbralDeteccion;
  }

  restaurarSenal(senal: ISenal): ISenal {
    const nuevaIntensidad = Math.min(100, senal.intensidad * this.factorAmplificacion);
    
    const senalRestaurada = new Senal(
      [...senal.pulsos],
      senal.mensajeOrigenId,
      nuevaIntensidad,
      senal.frecuencia
    );

    if ((senal as any).checksum !== undefined) {
      (senalRestaurada as any).checksum = (senal as any).checksum;
      (senalRestaurada as any).codificadorId = (senal as any).codificadorId;
    }

    return senalRestaurada;
  }

  reenviarSenal(senal: ISenal): IResultadoTransmision {
    if (!this.activo) {
      return ResultadoTransmisionFactory.error(
        'Relé inactivo',
        'RELE_INACTIVO'
      );
    }

    return ResultadoTransmisionFactory.exito(senal);
  }

  public override procesar(senal: ISenal): IResultadoTransmision {
    return this.procesarRele(senal);
  }

  private procesarRele(senal: ISenal): IResultadoTransmision {
    if (!this.activo) {
      return ResultadoTransmisionFactory.error(
        'Relé inactivo',
        'RELE_INACTIVO'
      );
    }

    let senalProcesada = senal;

    if (senal.intensidad >= this.UMBRAL_INTENSIDAD_MINIMA) {
      if (this.detectarSenalDebil(senal)) {
        senalProcesada = this.restaurarSenal(senal);
      }
    }

    const resultadoProcesamiento = this.procesarEspecifico(senalProcesada);
    if (!resultadoProcesamiento.exito) {
      return resultadoProcesamiento;
    }

    return this.reenviarSenal(resultadoProcesamiento.senal || senalProcesada);
  }

  protected abstract procesarEspecifico(senal: ISenal): IResultadoTransmision;

  activar(): void {
    this.activo = true;
  }

  desactivar(): void {
    this.activo = false;
  }
}
