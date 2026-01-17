import { ReceptorBase } from './receptor-base';
import { IMensaje, ICodificador, IErrorTransmision } from '../core/interfaces';

/**
 * Información de mensaje enviado
 */
export interface IMensajeEnviado {
  contenido: string;
  remitente: string;
  destinatario: string;
  timestamp: Date;
  exito: boolean;
  tiempoMs?: number;
  codificadorUsado?: string;
  contenidoRecibido?: string;
  error?: string;
  componenteFallo?: string;
}

/**
 * Entrada en la memoria del receptor (mensaje recibido, error o mensaje enviado)
 */
export interface IEntradaMemoria {
  tipo: 'mensaje' | 'error' | 'enviado';
  timestamp: Date;
  datos: IMensaje | IErrorTransmision | IMensajeEnviado;
}

/**
 * Receptor de Memoria
 * Almacena los mensajes y errores en estructura interna para procesamiento.
 */
export class ReceptorMemoria extends ReceptorBase {
  readonly id = 'receptor-memoria';
  readonly nombre = 'Receptor Memoria';
  
  capacidadMaxima: number = 1000;
  private indicePorRemitente: Map<string, IMensaje[]> = new Map();
  private indicePorFecha: Map<string, IMensaje[]> = new Map();
  private listeners: Array<(mensaje: IMensaje) => void> = [];
  
  memoriaSecuencial: IEntradaMemoria[] = [];

  constructor(codificador: ICodificador) {
    super(codificador);
  }

  producirSalida(mensaje: IMensaje): void {
    if (this.mensajesRecibidos.length >= this.capacidadMaxima) {
      const mensajeAntiguo = this.mensajesRecibidos.shift();
      if (mensajeAntiguo) this.eliminarDeIndices(mensajeAntiguo);
    }

    this.indexarMensaje(mensaje);
    this.notificarListeners(mensaje);
    
    this.memoriaSecuencial.push({
      tipo: 'mensaje',
      timestamp: new Date(),
      datos: mensaje
    });
    
    if (this.memoriaSecuencial.length > this.capacidadMaxima) {
      this.memoriaSecuencial.shift();
    }
  }
  
  /**
   * Registra un error en la memoria secuencial
   */
  registrarError(error: IErrorTransmision): void {
    this.memoriaSecuencial.push({
      tipo: 'error',
      timestamp: new Date(),
      datos: error
    });
    
    if (this.memoriaSecuencial.length > this.capacidadMaxima) {
      this.memoriaSecuencial.shift();
    }
  }
  
  /**
   * Obtiene todas las entradas de memoria en orden secuencial
   */
  obtenerMemoriaCompleta(): IEntradaMemoria[] {
    return [...this.memoriaSecuencial];
  }
  
  /**
   * Obtiene solo los mensajes de la memoria
   */
  obtenerMensajesMemoria(): IMensaje[] {
    return this.memoriaSecuencial
      .filter(entrada => entrada.tipo === 'mensaje')
      .map(entrada => entrada.datos as IMensaje);
  }
  
  /**
   * Obtiene solo los errores de la memoria
   */
  obtenerErroresMemoria(): IErrorTransmision[] {
    return this.memoriaSecuencial
      .filter(entrada => entrada.tipo === 'error')
      .map(entrada => entrada.datos as IErrorTransmision);
  }
  
  /**
   * Registra un mensaje enviado en la memoria secuencial
   */
  registrarMensajeEnviado(mensajeEnviado: IMensajeEnviado): void {
    this.memoriaSecuencial.push({
      tipo: 'enviado',
      timestamp: mensajeEnviado.timestamp || new Date(),
      datos: mensajeEnviado
    });
    
    if (this.memoriaSecuencial.length > this.capacidadMaxima) {
      this.memoriaSecuencial.shift();
    }
  }
  
  /**
   * Obtiene solo los mensajes enviados de la memoria
   */
  obtenerMensajesEnviadosMemoria(): IMensajeEnviado[] {
    return this.memoriaSecuencial
      .filter(entrada => entrada.tipo === 'enviado')
      .map(entrada => entrada.datos as IMensajeEnviado);
  }

  private indexarMensaje(mensaje: IMensaje): void {
    const remitente = mensaje.remitente;
    if (!this.indicePorRemitente.has(remitente)) {
      this.indicePorRemitente.set(remitente, []);
    }
    this.indicePorRemitente.get(remitente)!.push(mensaje);
    
    const fecha = mensaje.timestamp.toDateString();
    if (!this.indicePorFecha.has(fecha)) {
      this.indicePorFecha.set(fecha, []);
    }
    this.indicePorFecha.get(fecha)!.push(mensaje);
  }

  private eliminarDeIndices(mensaje: IMensaje): void {
    const porRemitente = this.indicePorRemitente.get(mensaje.remitente);
    if (porRemitente) {
      const index = porRemitente.findIndex(m => m.id === mensaje.id);
      if (index > -1) porRemitente.splice(index, 1);
    }
    
    const fecha = mensaje.timestamp.toDateString();
    const porFecha = this.indicePorFecha.get(fecha);
    if (porFecha) {
      const index = porFecha.findIndex(m => m.id === mensaje.id);
      if (index > -1) porFecha.splice(index, 1);
    }
  }

  buscarPorContenido(termino: string): IMensaje[] {
    return this.mensajesRecibidos.filter(
      m => m.contenido.toLowerCase().includes(termino.toLowerCase())
    );
  }

  obtenerPorRemitente(remitente: string): IMensaje[] {
    return this.indicePorRemitente.get(remitente) || [];
  }

  obtenerUltimos(cantidad: number): IMensaje[] {
    return this.mensajesRecibidos.slice(-cantidad);
  }

  registrarListener(callback: (mensaje: IMensaje) => void): void {
    this.listeners.push(callback);
  }

  private notificarListeners(mensaje: IMensaje): void {
    this.listeners.forEach(callback => {
      try { callback(mensaje); } catch (e) { }
    });
  }

  override limpiarHistorial(): void {
    super.limpiarHistorial();
    this.indicePorRemitente.clear();
    this.indicePorFecha.clear();
    this.memoriaSecuencial = [];
  }
  
  /**
   * Sobrescribe el método para registrar errores en la memoria secuencial
   */
  protected override onErrorRegistrado(error: IErrorTransmision): void {
    this.registrarError(error);
  }
}
