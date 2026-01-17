import { CanalBase } from './canal-base';

/**
 * Canal de Cable Terrestre
 * Simula un cable telegráfico tendido sobre tierra.
 * 
 * CARACTERÍSTICAS:
 * - Atenuación moderada (0.8% por km)
 * - Susceptible a condiciones climáticas
 * - Pérdida total si distancia > ~300km sin relé
 * 
 * Nota: Creado por Factory en SistemaCoordinadorService
 */
export class CanalTerrestre extends CanalBase {
  readonly id = 'canal-terrestre';
  readonly nombre = 'Cable Terrestre';
  
  private condicionClimatica: CondicionClimatica = CondicionClimatica.NORMAL;

  constructor() {
    super(100, 0.008, 0.03);
  }

  protected calcularLatencia(): number {
    const latenciaBase = 5;
    const latenciaPorKm = 0.005;
    return latenciaBase + (this.distancia * latenciaPorKm);
  }

  /**
   * Establece la condición climática que afecta la transmisión
   */
  establecerCondicionClimatica(condicion: CondicionClimatica): void {
    this.condicionClimatica = condicion;
    
    switch (condicion) {
      case CondicionClimatica.NORMAL:
        this.probabilidadFallo = 0.03;
        this.factorAtenuacion = 0.008;
        break;
      case CondicionClimatica.LLUVIA:
        this.probabilidadFallo = 0.08;
        this.factorAtenuacion = 0.012;
        break;
      case CondicionClimatica.TORMENTA:
        this.probabilidadFallo = 0.25;
        this.factorAtenuacion = 0.02;
        break;
      case CondicionClimatica.NIEVE:
        this.probabilidadFallo = 0.15;
        this.factorAtenuacion = 0.015;
        break;
    }
    
  }

  /**
   * Simula daño en el cable
   */
  simularDano(porcentaje: number): void {
    this.factorAtenuacion += porcentaje * 0.001;
    this.probabilidadFallo += porcentaje * 0.005;
  }

  reparar(): void {
    this.factorAtenuacion = 0.008;
    this.probabilidadFallo = 0.03;
    this.operativo = true;
  }
}

export enum CondicionClimatica {
  NORMAL = 'NORMAL',
  LLUVIA = 'LLUVIA',
  TORMENTA = 'TORMENTA',
  NIEVE = 'NIEVE'
}
