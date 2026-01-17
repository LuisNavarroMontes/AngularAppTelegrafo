import { ISenal } from '../core/interfaces';

/**
 * Configuración para el canal simulado
 */
export interface ConfiguracionCanalSimulado {
  distancia?: number;
  atenuacion?: number;
  probabilidadFallo?: number;
  latenciaFija?: number | null;
  modoSinPerdida?: boolean;
}

/**
 * Registro de una transmisión
 */
export interface TransmisionRegistrada {
  timestamp: Date;
  senalEntrada: ISenal;
  senalSalida?: ISenal;
  exito: boolean;
  latencia?: number;
}
