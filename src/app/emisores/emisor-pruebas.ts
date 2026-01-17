import { EmisorBase } from './emisor-base';
import { ISenal, IMensaje, IResultadoTransmision, ICodificador } from '../core/interfaces';
import { Senal, ResultadoTransmisionFactory } from '../core/models/mensaje.model';

/**
 * Emisor de Pruebas
 * Diseñado para testing y diagnóstico del sistema.
 * Características:
 * - Genera patrones de prueba predefinidos
 * - Permite simular errores controlados
 * - Registro detallado de todas las operaciones
 * - Modo de verificación de integridad
 * 
 * Nota: Creado por Factory en SistemaCoordinadorService
 */
export class EmisorPruebas extends EmisorBase {
  readonly id = 'emisor-pruebas';
  readonly nombre = 'Emisor de Pruebas';
  
  /** Historial de todas las transmisiones */
  private historial: Array<{senal: ISenal, resultado: IResultadoTransmision, timestamp: Date}> = [];
  
  /** Modo de fallo forzado para testing */
  modoFalloForzado: boolean = false;
  
  /** Contador de transmisiones */
  private contadorTransmisiones: number = 0;

  constructor(codificador: ICodificador) {
    super(codificador);
  }

  protected procesarEnvio(senal: ISenal): IResultadoTransmision {
    this.contadorTransmisiones++;
    
    if (this.modoFalloForzado) {
      const resultado = ResultadoTransmisionFactory.error(
        'Fallo forzado para pruebas',
        'FALLO_TEST'
      );
      this.registrarEnHistorial(senal, resultado);
      return resultado;
    }

    
    const resultado = ResultadoTransmisionFactory.exito(senal);
    this.registrarEnHistorial(senal, resultado);
    
    return resultado;
  }

  /**
   * Genera una señal de prueba estándar (patrón SOS)
   */
  generarSenalPrueba(): ISenal {
    const pulsosSOS = [1, 0, 1, 0, 1, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 0, 1, 0, 1, 0, 1];
    return new Senal(pulsosSOS, 'TEST-SOS', 100, 1000);
  }

  /**
   * Genera un patrón de calibración
   */
  generarPatronCalibracion(): ISenal {
    const patron: number[] = [];
    for (let i = 0; i < 10; i++) {
      patron.push(1, 0, 3, 0); // punto, pausa, raya, pausa
    }
    return new Senal(patron, 'TEST-CALIBRACION', 100, 1000);
  }

  /**
   * Ejecuta una batería de pruebas completa
   */
  ejecutarBateriaPruebas(): {exitosas: number, fallidas: number, detalles: string[]} {
    const detalles: string[] = [];
    let exitosas = 0;
    let fallidas = 0;

    const senalSOS = this.generarSenalPrueba();
    const resultadoSOS = this.enviarPulsos(senalSOS);
    if (resultadoSOS.exito) {
      exitosas++;
      detalles.push('✓ Prueba SOS: OK');
    } else {
      fallidas++;
      detalles.push('✗ Prueba SOS: FALLO');
    }

    const senalCal = this.generarPatronCalibracion();
    const resultadoCal = this.enviarPulsos(senalCal);
    if (resultadoCal.exito) {
      exitosas++;
      detalles.push('✓ Prueba Calibración: OK');
    } else {
      fallidas++;
      detalles.push('✗ Prueba Calibración: FALLO');
    }

    const validacion = this.sendPulseOk(senalSOS);
    if (validacion) {
      exitosas++;
      detalles.push('✓ Prueba sendPulseOk: OK');
    } else {
      fallidas++;
      detalles.push('✗ Prueba sendPulseOk: FALLO');
    }

    return { exitosas, fallidas, detalles };
  }

  private registrarEnHistorial(senal: ISenal, resultado: IResultadoTransmision): void {
    this.historial.push({
      senal,
      resultado,
      timestamp: new Date()
    });
  }

  /**
   * Obtiene el historial de transmisiones
   */
  obtenerHistorial() {
    return [...this.historial];
  }

  /**
   * Limpia el historial
   */
  limpiarHistorial(): void {
    this.historial = [];
    this.contadorTransmisiones = 0;
  }

  /**
   * Obtiene estadísticas del emisor
   */
  obtenerEstadisticas() {
    const exitosas = this.historial.filter(h => h.resultado.exito).length;
    const fallidas = this.historial.filter(h => !h.resultado.exito).length;
    
    return {
      totalTransmisiones: this.contadorTransmisiones,
      exitosas,
      fallidas,
      tasaExito: this.contadorTransmisiones > 0 
        ? (exitosas / this.contadorTransmisiones * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }
}
