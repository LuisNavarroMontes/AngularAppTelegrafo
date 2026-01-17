import { Injectable } from '@angular/core';
import { ICodificador } from '../core/interfaces/codificador.interface';

/**
 * Clase base abstracta para todos los codificadores.
 * Proporciona una interfaz uniforme y el método traducir que delega a codificar.
 */
@Injectable()
export abstract class CodificadorBase implements ICodificador {
  abstract readonly id: string;
  abstract readonly nombre: string;
  abstract readonly descripcion: string;

  /**
   * Traduce un texto al lenguaje del codificador.
   * Este método simplemente llama a codificar, proporcionando una interfaz uniforme.
   * @param texto El texto a traducir/codificar
   * @returns Array de pulsos numéricos
   */
  traducir(texto: string): number[] {
    return this.codificar(texto);
  }

  /**
   * Método abstracto que debe ser implementado por cada codificador concreto.
   * Codifica un texto en un array de pulsos numéricos según el lenguaje específico.
   * @param texto El texto a codificar
   * @returns Array de números representando los pulsos
   */
  abstract codificar(texto: string): number[];

  /**
   * Método abstracto que debe ser implementado por cada codificador concreto.
   * Decodifica un array de pulsos en texto.
   * @param pulsos Array de números
   * @returns Texto decodificado
   */
  abstract decodificar(pulsos: number[]): string;

  /**
   * Método abstracto que debe ser implementado por cada codificador concreto.
   * Verifica si un array de pulsos es válido para este codificador.
   * @param pulsos Array de pulsos a validar
   * @returns true si los pulsos son válidos
   */
  abstract validarPulsos(pulsos: number[]): boolean;

  /**
   * Método abstracto que debe ser implementado por cada codificador concreto.
   * Calcula un checksum para detectar corrupción.
   * @param pulsos Array de pulsos
   * @returns Valor de checksum
   */
  abstract calcularChecksum(pulsos: number[]): number;

  /**
   * Método abstracto que debe ser implementado por cada codificador concreto.
   * Obtiene la representación visual del texto codificado.
   * @param texto El texto a representar
   * @returns Representación visual del texto codificado
   */
  abstract obtenerRepresentacion(texto: string): string;
}
