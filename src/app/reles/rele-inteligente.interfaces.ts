/**
 * Resultado del análisis de una señal
 */
export interface AnalisisSenal {
  timestamp: Date;
  intensidadOriginal: number;
  calidad: number;
  nivelRuido: number;
  erroresDetectados: number;
  longitudPulsos: number;
}

/**
 * Estadísticas del relé inteligente
 */
export interface EstadisticasRele {
  totalProcesadas: number;
  calidadPromedio: number;
  erroresCorregidos: number;
  tasaExito: string;
}
