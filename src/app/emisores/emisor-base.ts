import { IEmisor, IMensaje, ISenal, IResultadoTransmision, ICodificador, TipoNodo } from '../core/interfaces';
import { Senal, ResultadoTransmisionFactory } from '../core/models/mensaje.model';
import { Component } from '../core/components/component';

/**
 * Clase base abstracta para todos los emisores.
 * 
 * Dependency Inversion: depende de ICodificador, no de implementación concreta.
 * Strategy Pattern: el algoritmo de codificación es intercambiable.
 */
export abstract class EmisorBase extends Component implements IEmisor {
  abstract override readonly id: string;
  abstract override readonly nombre: string;
  override readonly tipo: TipoNodo = TipoNodo.EMISOR;
  
  encendido: boolean = false;
  
  protected codificador: ICodificador;

  constructor(codificador: ICodificador) {
    super();
    this.codificador = codificador;
  }

  setCodificador(codificador: ICodificador): void {
    this.codificador = codificador;
  }

  getCodificador(): ICodificador {
    return this.codificador;
  }

  encender(): void {
    this.encendido = true;
  }

  apagar(): void {
    this.encendido = false;
  }

  codificarMensaje(mensaje: IMensaje): ISenal {
    if (!this.encendido) {
      throw new Error('El emisor debe estar encendido para codificar mensajes');
    }

    const pulsos = this.codificador.codificar(mensaje.contenido);
    
    const markerIndex = pulsos.indexOf(-99);
    let checksum = 0;
    
    if (markerIndex !== -1 && markerIndex < pulsos.length - 1) {
      checksum = pulsos[markerIndex + 1];
    } else {
      checksum = this.codificador.calcularChecksum(pulsos);
    }
    
    const senal = new Senal(pulsos, mensaje.id, 100, 1000);
    (senal as any).checksum = checksum;
    (senal as any).codificadorId = this.codificador.id;
    
    return senal;
  }

  protected override procesar(senal: ISenal): IResultadoTransmision {
    if (!this.encendido) {
      return ResultadoTransmisionFactory.error(
        'El emisor debe estar encendido',
        'EMISOR_APAGADO'
      );
    }

    const inicio = Date.now();
    const resultado = this.procesarEnvio(senal);
    
    if (resultado.exito) {
      const latencia = Date.now() - inicio;
      return ResultadoTransmisionFactory.exito(senal, latencia);
    }
    
    return resultado;
  }

  sendPulseOk(senal: ISenal): boolean {
    if (!this.encendido) {
      return false;
    }
    
    if (!senal || !senal.pulsos || senal.pulsos.length === 0) {
      return false;
    }
    
    if (senal.intensidad <= 0) {
      return false;
    }

    if (!this.codificador.validarPulsos(senal.pulsos)) {
      return false;
    }

    return true;
  }

  protected abstract procesarEnvio(senal: ISenal): IResultadoTransmision;
}
