import { ICanal, ISenal, IResultadoTransmision, EstadoCanal, IErrorTransmision, CodigoError, TipoNodo } from '../core/interfaces';
import { ErrorTransmisionFactory } from '../core/interfaces/error-transmision.interface';
import { Senal, ResultadoTransmisionFactory } from '../core/models/mensaje.model';
import { Component } from '../core/components/component';

/**
 * Clase base abstracta para todos los canales de transmisión.
 */
export abstract class CanalBase extends Component implements ICanal {
  abstract override readonly id: string;
  abstract override readonly nombre: string;
  override readonly tipo: TipoNodo = TipoNodo.CANAL;
  
  distancia: number;
  factorAtenuacion: number;
  probabilidadFallo: number;
  operativo: boolean = true;
  
  protected readonly UMBRAL_SENAL_MINIMA = 5;
  protected transmisionesExitosas: number = 0;
  protected transmisionesFallidas: number = 0;
  protected registroErrores: IErrorTransmision[] = [];

  constructor(
    distancia: number,
    factorAtenuacion: number = 0.01,
    probabilidadFallo: number = 0.05
  ) {
    super();
    this.distancia = distancia;
    this.factorAtenuacion = factorAtenuacion;
    this.probabilidadFallo = probabilidadFallo;
  }

  protected override procesar(senal: ISenal): IResultadoTransmision {
    return this.transportar(senal);
  }

  transportar(senal: ISenal): IResultadoTransmision {
    if (!this.operativo) {
      const error = ErrorTransmisionFactory.crear(
        CodigoError.CANAL_INOPERATIVO,
        `Canal ${this.nombre} no operativo`,
        'CANAL' as any,
        this.id,
        this.nombre,
        { recuperable: true, sugerencia: 'Reparar el canal' }
      );
      this.registroErrores.push(error);
      this.transmisionesFallidas++;
      
      return {
        exito: false,
        estado: 'ERROR' as any,
        mensajeError: error.mensaje,
        codigoError: error.codigo
      };
    }

    if (this.simularFallo()) {
      const error = ErrorTransmisionFactory.crear(
        CodigoError.CANAL_FALLO_TRANSMISION,
        `ERROR: fallo de transmisión en ${this.nombre}`,
        'CANAL' as any,
        this.id,
        this.nombre,
        { 
          contexto: { distancia: this.distancia },
          recuperable: false 
        }
      );
      this.registroErrores.push(error);
      this.transmisionesFallidas++;
      
      return {
        exito: false,
        estado: 'ERROR' as any,
        mensajeError: error.mensaje,
        codigoError: error.codigo
      };
    }

    const nuevaIntensidad = this.calcularPerdida(senal.intensidad);
    
    const senalTransportada = new Senal(
      [...senal.pulsos],
      senal.mensajeOrigenId,
      nuevaIntensidad,
      senal.frecuencia
    );
    
    if ((senal as any).checksum !== undefined) {
      (senalTransportada as any).checksum = (senal as any).checksum;
      (senalTransportada as any).codificadorId = (senal as any).codificadorId;
    }

    if (nuevaIntensidad < this.UMBRAL_SENAL_MINIMA) {
      const error = ErrorTransmisionFactory.canalSenalPerdida(
        this.id,
        this.nombre,
        this.distancia,
        nuevaIntensidad
      );
      this.registroErrores.push(error);
      this.transmisionesFallidas++;
      
      return {
        exito: false,
        estado: 'ERROR' as any,
        mensajeError: error.mensaje,
        codigoError: error.codigo,
        senal: senalTransportada
      };
    }
    
    this.transmisionesExitosas++;
    const latencia = this.calcularLatencia();
    
    return ResultadoTransmisionFactory.exito(senalTransportada, latencia);
  }

  public calcularPerdida(intensidadOriginal: number): number {
    const factorPerdida = Math.pow(1 - this.factorAtenuacion, this.distancia);
    const intensidadResultante = intensidadOriginal * factorPerdida;
    const ruido = (Math.random() - 0.5) * 2;
    const intensidadConRuido = intensidadResultante + ruido;
    return Math.max(0, intensidadConRuido);
  }

  public simularFallo(): boolean {
    return Math.random() < this.probabilidadFallo;
  }

  public obtenerEstado(): EstadoCanal {
    return {
      operativo: this.operativo,
      distancia: this.distancia,
      atenuacionActual: this.factorAtenuacion * this.distancia,
      transmisionesExitosas: this.transmisionesExitosas,
      transmisionesFallidas: this.transmisionesFallidas
    };
  }

  obtenerRegistroErrores(): IErrorTransmision[] {
    return [...this.registroErrores];
  }

  limpiarRegistroErrores(): void {
    this.registroErrores = [];
  }

  protected abstract calcularLatencia(): number;

  resetearEstadisticas(): void {
    this.transmisionesExitosas = 0;
    this.transmisionesFallidas = 0;
    this.registroErrores = [];
  }
}
