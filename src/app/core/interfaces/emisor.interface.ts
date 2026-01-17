import { IMensaje, ISenal, IResultadoTransmision } from './mensaje.interface';

/**
 * Interfaz que define el contrato para todos los emisores del sistema.
 * Un emisor transforma texto en señales eléctricas (pulsos).
 * 
 * Responsabilidades:
 * - Encenderse y apagarse
 * - Codificar mensajes (texto → señal)
 * - Iniciar el envío de pulsos
 */
export interface IEmisor {
  /** Identificador único del emisor */
  readonly id: string;
  
  /** Nombre descriptivo del emisor */
  readonly nombre: string;
  
  /** Indica si el emisor está encendido */
  encendido: boolean;

  /**
   * Enciende el emisor para que pueda operar
   */
  encender(): void;

  /**
   * Apaga el emisor
   */
  apagar(): void;

  /**
   * Codifica un mensaje de texto en una señal eléctrica
   * @param mensaje El mensaje a codificar
   * @returns La señal codificada
   */
  codificarMensaje(mensaje: IMensaje): ISenal;

  /**
   * Inicia el envío de pulsos a través del canal conectado
   * @param senal La señal a enviar
   * @returns Resultado de la operación de envío
   */
  enviarPulsos(senal: ISenal): IResultadoTransmision;

  /**
   * Método que verifica si el envío de pulso fue exitoso
   * @param senal La señal enviada
   * @returns true si el pulso se envió correctamente
   */
  sendPulseOk(senal: ISenal): boolean;
}

/**
 * Tipo de emisor disponible en el sistema
 */
export enum TipoEmisor {
  MANUAL = 'MANUAL',
  AUTOMATICO = 'AUTOMATICO',
  PRUEBAS = 'PRUEBAS'
}
