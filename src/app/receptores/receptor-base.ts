import { IReceptor, IMensaje, ISenal, IResultadoTransmision, ICodificador, IErrorTransmision, CodigoError, TipoNodo } from '../core/interfaces';
import { ErrorTransmisionFactory } from '../core/interfaces/error-transmision.interface';
import { Mensaje, ResultadoTransmisionFactory } from '../core/models/mensaje.model';
import { Component } from '../core/components/component';

/**
 * Clase base abstracta para todos los receptores.
 */
export abstract class ReceptorBase extends Component implements IReceptor {
  abstract override readonly id: string;
  abstract override readonly nombre: string;
  override readonly tipo: TipoNodo = TipoNodo.RECEPTOR;
  
  activo: boolean = true;
  mensajesRecibidos: IMensaje[] = [];
  protected codificador: ICodificador;
  protected readonly UMBRAL_INTENSIDAD_MINIMA = 5;
  protected registroErrores: IErrorTransmision[] = [];

  constructor(codificador: ICodificador) {
    super();
    this.codificador = codificador;
  }

  setCodificador(codificador: ICodificador): void {
    this.codificador = codificador;
  }

  protected override procesar(senal: ISenal): IResultadoTransmision {
    return this.recibirPulsos(senal);
  }

  recibirPulsos(senal: ISenal): IResultadoTransmision {
    if (!this.activo) {
      const error = ErrorTransmisionFactory.crear(
        CodigoError.RECEPTOR_INACTIVO,
        `Receptor ${this.nombre} inactivo`,
        'RECEPTOR' as any,
        this.id,
        this.nombre,
        { recuperable: true }
      );
      this.registroErrores.push(error);
      this.onErrorRegistrado(error);
      return ResultadoTransmisionFactory.error(error.mensaje, error.codigo);
    }

    const pulsosLimpios = this.extraerPulsosSinChecksum(senal.pulsos);
    let checksumRecibido = (senal as any).checksum;
    
    if (checksumRecibido === undefined) {
      const markerIndex = senal.pulsos.indexOf(-99);
      if (markerIndex !== -1 && markerIndex < senal.pulsos.length - 1) {
        checksumRecibido = senal.pulsos[markerIndex + 1];
      }
    }
    
    if (checksumRecibido !== undefined) {
      const checksumCalculado = this.codificador.calcularChecksum(pulsosLimpios);
      
      if (checksumCalculado !== checksumRecibido) {
        const diferencia = Math.abs(checksumCalculado - checksumRecibido);
        if (diferencia > 50) {
          const error = ErrorTransmisionFactory.receptorCorrupcion(
            this.id,
            this.nombre,
            checksumRecibido,
            checksumCalculado
          );
          this.registroErrores.push(error);
          this.onErrorRegistrado(error);
          return ResultadoTransmisionFactory.error(error.mensaje, error.codigo);
        }
      }
    }

    if (!this.codificador.validarPulsos(senal.pulsos)) {
      const error = ErrorTransmisionFactory.crear(
        CodigoError.RECEPTOR_DECODIFICACION_FALLIDA,
        `ERROR: pulsos inválidos detectados en ${this.nombre}`,
        'RECEPTOR' as any,
        this.id,
        this.nombre,
        { recuperable: false }
      );
      this.registroErrores.push(error);
      this.onErrorRegistrado(error);
      return ResultadoTransmisionFactory.error(error.mensaje, error.codigo);
    }

    try {
      const mensaje = this.decodificar(senal);
      
      this.mensajesRecibidos.push(mensaje);
      this.producirSalida(mensaje);
      
      return ResultadoTransmisionFactory.exito(senal);
    } catch (error) {
      const errorTransmision = ErrorTransmisionFactory.crear(
        CodigoError.RECEPTOR_DECODIFICACION_FALLIDA,
        `ERROR al decodificar en ${this.nombre}: ${error}`,
        'RECEPTOR' as any,
        this.id,
        this.nombre,
        { recuperable: false }
      );
      this.registroErrores.push(errorTransmision);
      this.onErrorRegistrado(errorTransmision);
      return ResultadoTransmisionFactory.error(errorTransmision.mensaje, errorTransmision.codigo);
    }
  }
  
  /**
   * Método llamado cuando se registra un error
   * Puede ser sobrescrito por clases derivadas para realizar acciones adicionales
   */
  protected onErrorRegistrado(error: IErrorTransmision): void {
  }

  private extraerPulsosSinChecksum(pulsos: number[]): number[] {
    const markerIndex = pulsos.indexOf(-99);
    if (markerIndex !== -1) {
      return pulsos.slice(0, markerIndex);
    }
    return pulsos;
  }

  decodificar(senal: ISenal): IMensaje {
    const pulsosLimpios = this.extraerPulsosSinChecksum(senal.pulsos);
    
    const contenido = this.codificador.decodificar(pulsosLimpios);
    
    const mensaje = new Mensaje(
      contenido,
      'Operador',
      this.nombre
    );
    
    (mensaje as any).idOriginal = senal.mensajeOrigenId;
    
    return mensaje;
  }

  abstract producirSalida(mensaje: IMensaje): void;

  obtenerHistorial(): IMensaje[] {
    return [...this.mensajesRecibidos];
  }

  obtenerRegistroErrores(): IErrorTransmision[] {
    return [...this.registroErrores];
  }

  limpiarHistorial(): void {
    this.mensajesRecibidos = [];
    this.registroErrores = [];
  }

  activar(): void {
    this.activo = true;
  }

  desactivar(): void {
    this.activo = false;
  }
}
