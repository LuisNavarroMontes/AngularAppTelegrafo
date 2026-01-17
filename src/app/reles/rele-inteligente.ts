import { ReleBase } from './rele-base';
import { ISenal, IResultadoTransmision } from '../core/interfaces';
import { Senal, ResultadoTransmisionFactory } from '../core/models/mensaje.model';
import { AnalisisSenal, EstadisticasRele } from './rele-inteligente.interfaces';

/**
 * Relé Inteligente
 * Relé avanzado con capacidades de análisis y optimización.
 * Características:
 * - Amplificación adaptativa según la calidad de la señal
 * - Detección y corrección de errores
 * - Estadísticas de rendimiento
 * - Auto-calibración
 */
export class ReleInteligente extends ReleBase {
  readonly id = 'rele-inteligente';
  readonly nombre = 'Relé Inteligente';
  
  /** Modo de corrección de errores activo */
  correccionErroresActiva: boolean = true;
  
  /** Modo adaptativo: ajusta amplificación según señal (configurable desde UI) */
  modoAdaptativo: boolean = true;
  
  /** Umbral de calidad mínima aceptable */
  private umbralCalidad: number = 60;
  
  /** Historial de señales para análisis */
  private historialSenales: AnalisisSenal[] = [];
  
  /** Factor de amplificación adaptativo (valor numérico interno) */
  private _amplificacionAdaptativa: number;

  constructor() {
    super(20, 1.5);
    this._amplificacionAdaptativa = this.factorAmplificacion;
  }

  protected procesarEspecifico(senal: ISenal): IResultadoTransmision {
    const analisis = this.analizarSenal(senal);
    this.historialSenales.push(analisis);

    this.ajustarAmplificacion(analisis);

    let senalProcesada = senal;
    if (this.correccionErroresActiva && analisis.erroresDetectados > 0) {
      senalProcesada = this.corregirErrores(senal, analisis);
    }

    if (analisis.calidad < this.umbralCalidad && !this.correccionErroresActiva) {
      return ResultadoTransmisionFactory.error(
        `Calidad de señal insuficiente: ${analisis.calidad.toFixed(1)}%`,
        'CALIDAD_INSUFICIENTE'
      );
    }

    return ResultadoTransmisionFactory.exito(senalProcesada);
  }

  /**
   * Analiza la calidad de una señal
   */
  private analizarSenal(senal: ISenal): AnalisisSenal {
    const calidad = senal.intensidad;
    const nivelRuido = Math.max(0, 100 - senal.intensidad - Math.random() * 10);
    
    let erroresDetectados = 0;
    for (let i = 1; i < senal.pulsos.length; i++) {
      if (senal.pulsos[i] < 0 || senal.pulsos[i] > 5) {
        erroresDetectados++;
      }
    }

    return {
      timestamp: new Date(),
      intensidadOriginal: senal.intensidad,
      calidad,
      nivelRuido,
      erroresDetectados,
      longitudPulsos: senal.pulsos.length
    };
  }

  /**
   * Ajusta la amplificación basándose en el análisis
   */
  private ajustarAmplificacion(analisis: AnalisisSenal): void {
    if (!this.modoAdaptativo) {
      return;
    }
    
    if (analisis.calidad < 30) {
      this._amplificacionAdaptativa = Math.min(4.0, this._amplificacionAdaptativa * 1.2);
    } else if (analisis.calidad > 70) {
      this._amplificacionAdaptativa = Math.max(1.2, this._amplificacionAdaptativa * 0.9);
    }
    
    this.factorAmplificacion = this._amplificacionAdaptativa;
  }

  /**
   * Intenta corregir errores en la señal
   */
  private corregirErrores(senal: ISenal, analisis: AnalisisSenal): ISenal {
    const pulsosCorrregidos = senal.pulsos.map(pulso => {
      if (pulso < 0) return 0;
      if (pulso > 5) return 3; // Asumir raya
      return pulso;
    });

    return new Senal(
      pulsosCorrregidos,
      senal.mensajeOrigenId,
      senal.intensidad,
      senal.frecuencia
    );
  }

  /**
   * Realiza auto-calibración basada en el historial
   */
  autoCalibrar(): void {
    if (this.historialSenales.length < 5) {
      return;
    }

    const recientes = this.historialSenales.slice(-10);
    const promedioCalidad = recientes.reduce((sum, a) => sum + a.calidad, 0) / recientes.length;
    const promedioErrores = recientes.reduce((sum, a) => sum + a.erroresDetectados, 0) / recientes.length;

    this.umbralDeteccion = Math.max(15, Math.min(50, 100 - promedioCalidad));
    this.umbralCalidad = Math.max(40, promedioCalidad - 10);
  }

  /**
   * Obtiene estadísticas del relé
   */
  obtenerEstadisticas(): EstadisticasRele {
    const total = this.historialSenales.length;
    if (total === 0) {
      return {
        totalProcesadas: 0,
        calidadPromedio: 0,
        erroresCorregidos: 0,
        tasaExito: 'N/A'
      };
    }

    const calidadPromedio = this.historialSenales.reduce((sum, a) => sum + a.calidad, 0) / total;
    const erroresCorregidos = this.historialSenales.reduce((sum, a) => sum + a.erroresDetectados, 0);
    const exitosas = this.historialSenales.filter(a => a.calidad >= this.umbralCalidad).length;

    return {
      totalProcesadas: total,
      calidadPromedio,
      erroresCorregidos,
      tasaExito: ((exitosas / total) * 100).toFixed(1) + '%'
    };
  }

  /**
   * Limpia el historial de análisis
   */
  limpiarHistorial(): void {
    this.historialSenales = [];
  }
}

