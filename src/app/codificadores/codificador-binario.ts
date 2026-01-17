import { Injectable } from '@angular/core';
import { ICodificador } from '../core/interfaces/codificador.interface';
import { CodificadorBase } from './codificador-base';

/**
 * Codificador Binario Simple
 * Convierte texto a su representación binaria ASCII de 8 bits.
 * Útil para demostrar la intercambiabilidad de codificadores.
 */
@Injectable({
  providedIn: 'root'
})
export class CodificadorBinario extends CodificadorBase implements ICodificador {
  readonly id = 'codificador-binario';
  readonly nombre = 'Codigo Binario ASCII';
  readonly descripcion = 'Codificación binaria directa usando valores ASCII de 8 bits';

  /** Bits por carácter */
  private readonly BITS_POR_CARACTER = 8;
  
  /** Separador entre caracteres */
  private readonly SEPARADOR = -1;

  /**
   * Detecta si la entrada es Codigo binario directo (grupos de 8 bits)
   * Ejemplos válidos: "01001000", "01001000 01001001", "01001000 01001001 00100001"
   */
  esCodigoBinario(texto: string): boolean {
    const patronBinario = /^[01]{8}(\s+[01]{8})*$/;
    return patronBinario.test(texto.trim());
  }

  /**
   * Traduce Codigo binario directo a texto
   * Ejemplo: "01001000 01001001" → "HI"
   */
  traducirBinarioATexto(codigoBinario: string): string {
    const grupos = codigoBinario.trim().split(/\s+/);
    let resultado = '';
    
    for (const grupo of grupos) {
      const valor = parseInt(grupo, 2);
      resultado += String.fromCharCode(valor);
    }
    
    return resultado;
  }

  /**
   * Obtiene la representación visual en binario de un texto
   * Ejemplo: "HI" → "01001000 01001001"
   */
  obtenerRepresentacion(texto: string): string {
    if (this.esCodigoBinario(texto)) {
      return texto;
    }
    
    const partes: string[] = [];
    
    for (const caracter of texto) {
      const codigoAscii = caracter.charCodeAt(0);
      const binario = codigoAscii.toString(2).padStart(8, '0');
      partes.push(binario);
    }
    
    return partes.join(' ');
  }

  codificar(texto: string): number[] {
    const pulsos: number[] = [];
    
    if (this.esCodigoBinario(texto)) {
      return this.binarioDirectoAPulsos(texto);
    }
    
    for (const caracter of texto) {
      const codigoAscii = caracter.charCodeAt(0);
      
      for (let i = 7; i >= 0; i--) {
        pulsos.push((codigoAscii >> i) & 1);
      }
      
      pulsos.push(this.SEPARADOR);
    }
    
    if (pulsos[pulsos.length - 1] === this.SEPARADOR) {
      pulsos.pop();
    }
    
    const checksum = this.calcularChecksum(pulsos);
    pulsos.push(-99, checksum);
    
    return pulsos;
  }

  /**
   * Convierte Codigo binario directo a pulsos
   */
  private binarioDirectoAPulsos(codigoBinario: string): number[] {
    const pulsos: number[] = [];
    const grupos = codigoBinario.trim().split(/\s+/);
    
    for (let i = 0; i < grupos.length; i++) {
      const grupo = grupos[i];
      
      for (const bit of grupo) {
        pulsos.push(parseInt(bit, 10));
      }
      
      if (i < grupos.length - 1) {
        pulsos.push(this.SEPARADOR);
      }
    }
    
    const checksum = this.calcularChecksum(pulsos);
    pulsos.push(-99, checksum);
    
    return pulsos;
  }

  decodificar(pulsos: number[]): string {
    let pulsosLimpios = [...pulsos];
    const markerIndex = pulsos.indexOf(-99);
    if (markerIndex !== -1) {
      pulsosLimpios = pulsos.slice(0, markerIndex);
    }

    let resultado = '';
    let buffer: number[] = [];
    
    for (const pulso of pulsosLimpios) {
      if (pulso === this.SEPARADOR) {
        if (buffer.length === this.BITS_POR_CARACTER) {
          const valor = this.bitsANumero(buffer);
          resultado += String.fromCharCode(valor);
        }
        buffer = [];
      } else if (pulso >= 0) {
        buffer.push(pulso);
      }
    }
    
    // Procesar último buffer
    if (buffer.length === this.BITS_POR_CARACTER) {
      const valor = this.bitsANumero(buffer);
      resultado += String.fromCharCode(valor);
    }
    
    return resultado;
  }

  private bitsANumero(bits: number[]): number {
    let valor = 0;
    for (let i = 0; i < bits.length; i++) {
      valor = (valor << 1) | bits[i];
    }
    return valor;
  }

  validarPulsos(pulsos: number[]): boolean {
    for (const pulso of pulsos) {
      if (pulso !== 0 && pulso !== 1 && pulso !== this.SEPARADOR && pulso !== -99) {
        if (pulso < 0 || pulso > 255) {
          return false;
        }
      }
    }
    return true;
  }

  calcularChecksum(pulsos: number[]): number {
    let checksum = 0;
    let byteActual = 0;
    let bitsContados = 0;
    
    for (const pulso of pulsos) {
      if (pulso >= 0 && pulso <= 1) {
        byteActual = (byteActual << 1) | pulso;
        bitsContados++;
        
        if (bitsContados === 8) {
          checksum ^= byteActual;
          byteActual = 0;
          bitsContados = 0;
        }
      }
    }
    
    return checksum;
  }

}
