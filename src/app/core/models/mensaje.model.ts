import { IMensaje, ISenal, EstadoTransmision, IResultadoTransmision } from '../interfaces';

export class Mensaje implements IMensaje {
  id: string;
  contenido: string;
  remitente: string;
  destinatario: string;
  timestamp: Date;
  prioridad: number;

  constructor(
    contenido: string,
    remitente: string,
    destinatario: string,
    prioridad: number = 5
  ) {
    this.id = this.generarId();
    this.contenido = contenido;
    this.remitente = remitente;
    this.destinatario = destinatario;
    this.timestamp = new Date();
    this.prioridad = prioridad;
  }

  private generarId(): string {
    return `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class Senal implements ISenal {
  pulsos: number[];
  intensidad: number;
  frecuencia: number;
  mensajeOrigenId: string;
  timestampGeneracion: Date;

  constructor(
    pulsos: number[],
    mensajeOrigenId: string,
    intensidad: number = 100,
    frecuencia: number = 1000
  ) {
    this.pulsos = [...pulsos];
    this.intensidad = intensidad;
    this.frecuencia = frecuencia;
    this.mensajeOrigenId = mensajeOrigenId;
    this.timestampGeneracion = new Date();
  }

  conIntensidad(nuevaIntensidad: number): Senal {
    const copia = new Senal(
      this.pulsos,
      this.mensajeOrigenId,
      Math.max(0, Math.min(100, nuevaIntensidad)),
      this.frecuencia
    );
    copia.timestampGeneracion = this.timestampGeneracion;
    return copia;
  }

  clonar(): Senal {
    const copia = new Senal(
      this.pulsos,
      this.mensajeOrigenId,
      this.intensidad,
      this.frecuencia
    );
    copia.timestampGeneracion = this.timestampGeneracion;
    return copia;
  }
}

/**
 * Factory para crear resultados de transmisión
 */
export class ResultadoTransmisionFactory {
  
  static exito(senal: ISenal, latenciaMs?: number): IResultadoTransmision {
    return {
      exito: true,
      estado: EstadoTransmision.COMPLETADA,
      senal,
      latenciaMs
    };
  }

  static error(mensaje: string, codigo?: string): IResultadoTransmision {
    return {
      exito: false,
      estado: EstadoTransmision.ERROR,
      mensajeError: mensaje,
      codigoError: codigo
    };
  }

}
