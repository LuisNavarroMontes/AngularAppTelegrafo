import { ReceptorBase } from './receptor-base';
import { IMensaje, ICodificador } from '../core/interfaces';

/**
 * Receptor de Fichero
 * Guarda los mensajes en un "fichero" simulado.
 */
export class ReceptorFichero extends ReceptorBase {
  readonly id = 'receptor-fichero';
  readonly nombre = 'Receptor Fichero';
  
  private contenidoFichero: string = '';
  nombreFichero: string = 'mensajes_telegrafo.txt';
  formato: FormatoFichero = FormatoFichero.TEXTO;

  constructor(codificador: ICodificador) {
    super(codificador);
    this.inicializarFichero();
  }

  private inicializarFichero(): void {
    const fecha = new Date().toLocaleDateString();
    this.contenidoFichero = `=== REGISTRO DE MENSAJES TELEGRÁFICOS ===\n`;
    this.contenidoFichero += `Fecha de inicio: ${fecha}\n`;
    this.contenidoFichero += `=========================================\n\n`;
  }

  producirSalida(mensaje: IMensaje): void {
    let entrada: string;
    
    switch (this.formato) {
      case FormatoFichero.CSV:
        entrada = this.formatearCSV(mensaje);
        break;
      case FormatoFichero.JSON:
        entrada = this.formatearJSON(mensaje);
        break;
      default:
        entrada = this.formatearTexto(mensaje);
    }
    
    this.contenidoFichero += entrada;
  }

  private formatearTexto(mensaje: IMensaje): string {
    return `[${mensaje.timestamp.toISOString()}]\n` +
           `De: ${mensaje.remitente}\n` +
           `Para: ${mensaje.destinatario}\n` +
           `Mensaje: ${mensaje.contenido}\n` +
           `---\n`;
  }

  private formatearCSV(mensaje: IMensaje): string {
    const contenidoEscapado = mensaje.contenido.replace(/"/g, '""');
    return `"${mensaje.timestamp.toISOString()}","${mensaje.remitente}","${mensaje.destinatario}","${contenidoEscapado}"\n`;
  }

  private formatearJSON(mensaje: IMensaje): string {
    return JSON.stringify({
      timestamp: mensaje.timestamp.toISOString(),
      id: mensaje.id,
      remitente: mensaje.remitente,
      destinatario: mensaje.destinatario,
      contenido: mensaje.contenido,
      prioridad: mensaje.prioridad
    }) + '\n';
  }

  obtenerContenidoFichero(): string {
    return this.contenidoFichero;
  }

  exportarFichero(): { nombre: string; contenido: string; tipo: string } {
    let tipoMime: string;
    switch (this.formato) {
      case FormatoFichero.CSV: tipoMime = 'text/csv'; break;
      case FormatoFichero.JSON: tipoMime = 'application/json'; break;
      default: tipoMime = 'text/plain';
    }
    return { nombre: this.nombreFichero, contenido: this.contenidoFichero, tipo: tipoMime };
  }

  limpiarFichero(): void {
    this.inicializarFichero();
  }
}

export enum FormatoFichero {
  TEXTO = 'TEXTO',
  CSV = 'CSV',
  JSON = 'JSON'
}
