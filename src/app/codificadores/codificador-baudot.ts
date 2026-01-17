import { Injectable } from '@angular/core';
import { ICodificador } from '../core/interfaces/codificador.interface';
import { CodificadorBase } from './codificador-base';

/**
 * Codificador Baudot
 * Sistema de codificación de 5 bits usado en teletipos.
 * Demuestra la capacidad de intercambiar sistemas de codificación.
 */
@Injectable({
  providedIn: 'root'
})
export class CodificadorBaudot extends CodificadorBase implements ICodificador {
  readonly id = 'codificador-baudot';
  readonly nombre = 'Codigo Baudot';
  readonly descripcion = 'Sistema de codificación de 5 bits usado en teletipos (ITA2)';

  /** Tabla Baudot ITA2 - Letras */
  private readonly tablaLetras: Map<string, number[]> = new Map([
    ['A', [1,1,0,0,0]], ['B', [1,0,0,1,1]], ['C', [0,1,1,1,0]], ['D', [1,0,0,1,0]],
    ['E', [1,0,0,0,0]], ['F', [1,0,1,1,0]], ['G', [0,1,0,1,1]], ['H', [0,0,1,0,1]],
    ['I', [0,1,1,0,0]], ['J', [1,1,0,1,0]], ['K', [1,1,1,1,0]], ['L', [0,1,0,0,1]],
    ['M', [0,0,1,1,1]], ['N', [0,0,1,1,0]], ['O', [0,0,0,1,1]], ['P', [0,1,1,0,1]],
    ['Q', [1,1,1,0,1]], ['R', [0,1,0,1,0]], ['S', [1,0,1,0,0]], ['T', [0,0,0,0,1]],
    ['U', [1,1,1,0,0]], ['V', [0,1,1,1,1]], ['W', [1,1,0,0,1]], ['X', [1,0,1,1,1]],
    ['Y', [1,0,1,0,1]], ['Z', [1,0,0,0,1]], [' ', [0,0,1,0,0]]
  ]);

  /** Tabla inversa para decodificación */
  private readonly tablaInversa: Map<string, string>;

  /** Codigo especial para cambio a figuras */
  private readonly SHIFT_FIGURAS = [1,1,0,1,1];
  
  /** Codigo especial para cambio a letras */
  private readonly SHIFT_LETRAS = [1,1,1,1,1];

  constructor() {
    super();
    this.tablaInversa = new Map();
    this.tablaLetras.forEach((codigo, letra) => {
      this.tablaInversa.set(codigo.join(''), letra);
    });
  }

  /**
   * Detecta si la entrada es Codigo Baudot directo (grupos de 5 bits)
   * Ejemplos válidos: "11000", "11000 10000", "11000 10000 01110"
   */
  esCodigoBaudot(texto: string): boolean {
    const patronBaudot = /^[01]{5}(\s+[01]{5})*$/;
    return patronBaudot.test(texto.trim());
  }

  /**
   * Traduce Codigo Baudot directo a texto
   * Ejemplo: "11000 10000" → "AE"
   */
  traducirBaudotATexto(codigoBaudot: string): string {
    const grupos = codigoBaudot.trim().split(/\s+/);
    let resultado = '';
    
    for (const grupo of grupos) {
      const caracter = this.tablaInversa.get(grupo);
      resultado += caracter || '?';
    }
    
    return resultado;
  }

  /**
   * Obtiene la representación visual en Baudot de un texto
   * Ejemplo: "AE" → "11000 10000"
   */
  obtenerRepresentacion(texto: string): string {
    if (this.esCodigoBaudot(texto)) {
      return texto;
    }
    
    const textoNormalizado = texto.toUpperCase();
    const partes: string[] = [];
    
    for (const caracter of textoNormalizado) {
      const codigo = this.tablaLetras.get(caracter);
      if (codigo) {
        partes.push(codigo.join(''));
      }
    }
    
    return partes.join(' ');
  }

  codificar(texto: string): number[] {
    const pulsos: number[] = [];
    
    if (this.esCodigoBaudot(texto)) {
      return this.baudotDirectoAPulsos(texto);
    }
    const textoNormalizado = texto.toUpperCase();
    
    for (const caracter of textoNormalizado) {
      const codigo = this.tablaLetras.get(caracter);
      if (codigo) {
        pulsos.push(...codigo);
        pulsos.push(-1);
      }
    }
    
    // Remover último separador
    if (pulsos[pulsos.length - 1] === -1) {
      pulsos.pop();
    }
    
    // Añadir checksum
    const checksum = this.calcularChecksum(pulsos);
    pulsos.push(-99, checksum);
    
    return pulsos;
  }

  /**
   * Convierte Codigo Baudot directo a pulsos
   */
  private baudotDirectoAPulsos(codigoBaudot: string): number[] {
    const pulsos: number[] = [];
    const grupos = codigoBaudot.trim().split(/\s+/);
    
    for (let i = 0; i < grupos.length; i++) {
      const grupo = grupos[i];
      
      for (const bit of grupo) {
        pulsos.push(parseInt(bit, 10));
      }
      
      if (i < grupos.length - 1) {
        pulsos.push(-1);
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
      if (pulso === -1) {
        if (buffer.length === 5) {
          const codigo = buffer.join('');
          const caracter = this.tablaInversa.get(codigo);
          resultado += caracter || '?';
        }
        buffer = [];
      } else if (pulso >= 0) {
        buffer.push(pulso);
      }
    }
    
    if (buffer.length === 5) {
      const codigo = buffer.join('');
      const caracter = this.tablaInversa.get(codigo);
      resultado += caracter || '?';
    }
    
    return resultado;
  }

  validarPulsos(pulsos: number[]): boolean {
    for (const pulso of pulsos) {
      if (pulso !== 0 && pulso !== 1 && pulso !== -1 && pulso !== -99) {
        if (pulso < 0 || pulso > 255) {
          return false;
        }
      }
    }
    return true;
  }

  calcularChecksum(pulsos: number[]): number {
    let suma = 0;
    for (const pulso of pulsos) {
      if (pulso >= 0) {
        suma += pulso;
      }
    }
    return suma % 256;
  }

}
