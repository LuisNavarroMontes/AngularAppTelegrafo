import { ISenal, IResultadoTransmision, TipoNodo } from '../interfaces';
import { ResultadoTransmisionFactory } from '../models/mensaje.model';

/**
 * Clase base abstracta para todos los componentes del sistema de telégrafo.
 * Implementa el patrón Chain of Responsibility para el flujo de señales.
 */
export abstract class Component {
  abstract readonly id: string;
  abstract readonly nombre: string;
  abstract readonly tipo: TipoNodo;

  protected siguiente: Component | null = null;

  setSiguiente(componente: Component | null): void {
    this.siguiente = componente;
  }

  getSiguiente(): Component | null {
    return this.siguiente;
  }

  protected abstract procesar(senal: ISenal): IResultadoTransmision;
  
  enviarSenalSiguiente(senal: ISenal): IResultadoTransmision {
    const resultado = this.procesar(senal);

    if (!this.siguiente) {
      return resultado;
    }

    const senalProcesada = resultado.senal || senal;

    if (!resultado.exito && senalProcesada) {
      const resultadoSiguiente = this.siguiente.enviarSenalSiguiente(senalProcesada);
      return {
        ...resultadoSiguiente,
        exito: false,
        mensajeError: resultado.mensajeError || resultadoSiguiente.mensajeError,
        codigoError: resultado.codigoError || resultadoSiguiente.codigoError
      };
    }

    if (!resultado.exito) {
      return resultado;
    }

    return this.siguiente.enviarSenalSiguiente(senalProcesada);
  }

  enviarPulsos(senal: ISenal): IResultadoTransmision {
    return this.enviarSenalSiguiente(senal);
  }
}
