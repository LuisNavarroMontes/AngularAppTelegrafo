import { Injectable } from '@angular/core';
import { ICodificador } from '../core/interfaces/codificador.interface';
import { CodificadorBase } from './codificador-base';

/**
 * Codificador Morse
 * Implementa el sistema de codificaci?n Morse est?ndar.
 * Puede ser sustituido por cualquier otro codificador que implemente ICodificador.
 */
@Injectable({
  providedIn: 'root'
})
export class CodificadorMorse extends CodificadorBase implements ICodificador {
  readonly id = 'codificador-morse';
  readonly nombre = 'Codigo Morse';
  readonly descripcion = 'Sistema de codificaci?n mediante puntos y rayas inventado por Samuel Morse';

  private readonly PUNTO = 1;
  private readonly RAYA = 3;

  /** Tabla de codificaci?n Morse */
  private readonly tablaMorse: Map<string, string> = new Map([
    ['A', '.-'],    ['B', '-...'],  ['C', '-.-.'],  ['D', '-..'],
    ['E', '.'],     ['F', '..-.'],  ['G', '--.'],   ['H', '....'],
    ['I', '..'],    ['J', '.---'],  ['K', '-.-'],   ['L', '.-..'],
    ['M', '--'],    ['N', '-.'],    ['O', '---'],   ['P', '.--.'],
    ['Q', '--.-'],  ['R', '.-.'],   ['S', '...'],   ['T', '-'],
    ['U', '..-'],   ['V', '...-'],  ['W', '.--'],   ['X', '-..-'],
    ['Y', '-.--'],  ['Z', '--..'],
    ['0', '-----'], ['1', '.----'], ['2', '..---'], ['3', '...--'],
    ['4', '....-'], ['5', '.....'], ['6', '-....'], ['7', '--...'],
    ['8', '---..'], ['9', '----.'],
    ['.', '.-.-.-'], [',', '--..--'], ['?', '..--..'], ['!', '-.-.--'],
    [' ', '/']
  ]);

  private readonly tablaInversa: Map<string, string>;

  constructor() {
    super();
    this.tablaInversa = new Map();
    this.tablaMorse.forEach((morse, caracter) => {
      if (caracter !== ' ') {
        this.tablaInversa.set(morse, caracter);
      }
    });
  }

  /**
   * Obtiene la representaci?n visual en Morse de un texto
   * Ejemplo: "SOS" ? "... --- ..."
   */
  obtenerRepresentacion(texto: string): string {
    if (this.esCodigoMorse(texto)) {
      return texto;
    }
    
    const textoNormalizado = texto.toUpperCase();
    const partes: string[] = [];
    
    for (const caracter of textoNormalizado) {
      const morse = this.tablaMorse.get(caracter);
      if (morse) {
        partes.push(morse);
      }
    }
    
    return partes.join(' ');
  }

  /**
   * Detecta si el texto de entrada es codigo Morse (puntos, rayas, espacios y /)
   * Ejemplos validos: ".-", "... --- ...", ".- -... / -.-."
   */
  esCodigoMorse(texto: string): boolean {
    const patronMorse = /^[\.\-\s\/]+$/;
    return patronMorse.test(texto) && texto.includes('.') || texto.includes('-');
  }

  /**
   * Traduce codigo Morse directo (ej: ".- -...") a texto (ej: "AB")
   */
  traducirMorseATexto(codigoMorse: string): string {
    const palabras = codigoMorse.split('/').map(p => p.trim());
    const resultado: string[] = [];
    
    for (const palabra of palabras) {
      const letras = palabra.split(' ').filter(l => l.length > 0);
      let palabraTraducida = '';
      
      for (const letraMorse of letras) {
        const caracter = this.tablaInversa.get(letraMorse);
        palabraTraducida += caracter || '?';
      }
      
      if (palabraTraducida) {
        resultado.push(palabraTraducida);
      }
    }
    
    return resultado.join(' ');
  }

  codificar(texto: string): number[] {
    const pulsos: number[] = [];
    
    if (this.esCodigoMorse(texto)) {
      return this.morseDirectoAPulsos(texto);
    }
    const textoNormalizado = texto.toUpperCase();
    
    for (let i = 0; i < textoNormalizado.length; i++) {
      const caracter = textoNormalizado[i];
      const morse = this.tablaMorse.get(caracter);
      
      if (morse) {
        if (caracter === ' ') {
          pulsos.push(0, 0, 0, 0, 0, 0, 0);
        } else {
          for (let j = 0; j < morse.length; j++) {
            if (morse[j] === '.') {
              pulsos.push(this.PUNTO);
            } else if (morse[j] === '-') {
              pulsos.push(this.RAYA);
            }
            
            if (j < morse.length - 1) {
              pulsos.push(0);
            }
          }
          
          if (i < textoNormalizado.length - 1 && textoNormalizado[i + 1] !== ' ') {
            pulsos.push(0, 0, 0);
          }
        }
      }
    }
    
    const checksum = this.calcularChecksum(pulsos);
    pulsos.push(-99, checksum);
    
    return pulsos;
  }

  /**
   * Convierte codigo Morse directo (ej: ".- -...") a pulsos
   */
  private morseDirectoAPulsos(codigoMorse: string): number[] {
    const pulsos: number[] = [];
    const palabras = codigoMorse.split('/');
    
    for (let p = 0; p < palabras.length; p++) {
      const palabra = palabras[p].trim();
      const letras = palabra.split(' ').filter(l => l.length > 0);
      
      for (let i = 0; i < letras.length; i++) {
        const letraMorse = letras[i];
        
        for (let j = 0; j < letraMorse.length; j++) {
          if (letraMorse[j] === '.') {
            pulsos.push(this.PUNTO);
          } else if (letraMorse[j] === '-') {
            pulsos.push(this.RAYA);
          }
          
          if (j < letraMorse.length - 1) {
            pulsos.push(0);
          }
        }
        
        if (i < letras.length - 1) {
          pulsos.push(0, 0, 0);
        }
      }
      
      if (p < palabras.length - 1) {
        pulsos.push(0, 0, 0, 0, 0, 0, 0);
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

    let morse = '';
    let espacios = 0;
    
    for (const pulso of pulsosLimpios) {
      if (pulso === 0) {
        espacios++;
      } else if (pulso > 0) {
        if (espacios >= 7) {
          morse += ' / ';
        } else if (espacios >= 3) {
          morse += ' ';
        }
        espacios = 0;
        
        morse += pulso === this.PUNTO ? '.' : '-';
      }
    }

    const palabras = morse.split(' / ');
    const resultado: string[] = [];

    for (const palabra of palabras) {
      const letras = palabra.trim().split(' ');
      let palabraDecodificada = '';
      
      for (const letra of letras) {
        if (letra) {
          const caracter = this.tablaInversa.get(letra);
          palabraDecodificada += caracter || '?';
        }
      }
      resultado.push(palabraDecodificada);
    }

    return resultado.join(' ');
  }

  validarPulsos(pulsos: number[]): boolean {
    // Verificar que solo contiene valores v?lidos
    for (const pulso of pulsos) {
      if (pulso !== 0 && pulso !== this.PUNTO && pulso !== this.RAYA && 
          pulso !== -99 && pulso < -99) {
        // Permitir 0, 1, 3, y marcadores especiales
        if (pulso < 0 && pulso !== -99) continue; // Checksum value
        if (pulso > 3) return false;
      }
    }
    return true;
  }

  calcularChecksum(pulsos: number[]): number {
    let suma = 0;
    for (const pulso of pulsos) {
      if (pulso > 0) {
        suma += pulso;
      }
    }
    return suma % 256;
  }
}
