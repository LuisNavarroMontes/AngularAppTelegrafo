import { CanalBase } from './canal-base';
import { ISenal, IResultadoTransmision } from '../core/interfaces';
import { ResultadoTransmisionFactory } from '../core/models/mensaje.model';
import { ConfiguracionCanalSimulado, TransmisionRegistrada } from './canal-simulado.interfaces';

/**
 * Enlace Simulado
 * Canal virtual para pruebas y desarrollo.
 * Características:
 * - Comportamiento 100% configurable
 * - Sin pérdida real de señal (opcional)
 * - Latencia configurable
 * - Ideal para testing
 * 
 * Nota: Creado por Factory en SistemaCoordinadorService
 */
export class CanalSimulado extends CanalBase {
  readonly id = 'canal-simulado';
  readonly nombre = 'Enlace Simulado';
  
  /** Modo sin pérdida */
  modoSinPerdida: boolean = false;
  
  /** Latencia fija configurable (ms) */
  latenciaFija: number | null = null;
  
  /** Forzar siguiente resultado */
  private resultadoForzado: 'exito' | 'fallo' | null = null;
  
  /** Registro de transmisiones para análisis */
  private registro: TransmisionRegistrada[] = [];

  constructor() {
    super(0, 0, 0);
  }

  protected calcularLatencia(): number {
    if (this.latenciaFija !== null) {
      return this.latenciaFija;
    }
    return 1;
  }

  override transportar(senal: ISenal): IResultadoTransmision {
    const inicio = Date.now();
    
    if (this.resultadoForzado === 'fallo') {
      this.resultadoForzado = null;
      return this.registrarYRetornar(senal, 
        ResultadoTransmisionFactory.error('Fallo forzado', 'FALLO_SIMULADO')
      );
    }
    
    if (this.resultadoForzado === 'exito' || this.modoSinPerdida) {
      this.resultadoForzado = null;
      return this.registrarYRetornar(senal,
        ResultadoTransmisionFactory.exito(senal, this.calcularLatencia())
      );
    }
    
    return this.registrarYRetornar(senal, super.transportar(senal));
  }

  /**
   * Configura el canal con parámetros específicos
   */
  configurar(config: ConfiguracionCanalSimulado): void {
    if (config.distancia !== undefined) this.distancia = config.distancia;
    if (config.atenuacion !== undefined) this.factorAtenuacion = config.atenuacion;
    if (config.probabilidadFallo !== undefined) this.probabilidadFallo = config.probabilidadFallo;
    if (config.latenciaFija !== undefined) this.latenciaFija = config.latenciaFija;
    if (config.modoSinPerdida !== undefined) this.modoSinPerdida = config.modoSinPerdida;
  }

  /**
   * Fuerza el resultado de la siguiente transmisión
   */
  forzarResultado(resultado: 'exito' | 'fallo'): void {
    this.resultadoForzado = resultado;
  }

  /**
   * Obtiene el registro de transmisiones
   */
  obtenerRegistro(): TransmisionRegistrada[] {
    return [...this.registro];
  }

  /**
   * Limpia el registro
   */
  limpiarRegistro(): void {
    this.registro = [];
  }

  private registrarYRetornar(senal: ISenal, resultado: IResultadoTransmision): IResultadoTransmision {
    this.registro.push({
      timestamp: new Date(),
      senalEntrada: senal,
      senalSalida: resultado.senal,
      exito: resultado.exito,
      latencia: resultado.latenciaMs
    });
    return resultado;
  }
}

