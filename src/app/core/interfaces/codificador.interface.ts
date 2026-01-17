/**
 * Interfaz que define el contrato para todos los sistemas de codificación.
 * 
 * PRINCIPIO: Open/Closed - abierto a extensión, cerrado a modificación.
 */
export interface ICodificador {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;

  codificar(texto: string): number[];
  decodificar(pulsos: number[]): string;
  validarPulsos(pulsos: number[]): boolean;
  calcularChecksum(pulsos: number[]): number;
  obtenerRepresentacion(texto: string): string;
}

export enum TipoCodificador {
  MORSE = 'MORSE',
  BAUDOT = 'BAUDOT',
  BINARIO = 'BINARIO',
  ASCII = 'ASCII'
}
