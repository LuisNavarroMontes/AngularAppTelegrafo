/**
 * Estado de la batería del relé
 */
export interface EstadoBateria {
  nivelActual: number;
  capacidadMaxima: number;
  porcentaje: number;
  critico: boolean;
  agotada: boolean;
}
