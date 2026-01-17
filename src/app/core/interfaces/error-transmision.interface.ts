import { TipoNodo } from './nodo.interface';

/**
 * Interfaz para errores de transmisión detallados.
 * Permite identificar exactamente dónde y por qué falló la transmisión.
 */
export interface IErrorTransmision {
  /** Codigo único del error */
  codigo: string;
  
  /** Mensaje descriptivo del error */
  mensaje: string;
  
  /** Tipo de componente donde ocurrió el error */
  tipoComponente: TipoNodo;
  
  /** ID del componente que falló */
  componenteId: string;
  
  /** Nombre del componente que falló */
  componenteNombre: string;
  
  /** Timestamp del error */
  timestamp: Date;
  
  /** Información adicional del contexto */
  contexto?: Record<string, unknown>;
  
  /** Si el error es recuperable */
  recuperable: boolean;
  
  /** Sugerencia de acción para resolver */
  sugerencia?: string;
}

/**
 * Codigos de error del sistema
 */
export enum CodigoError {
  EMISOR_APAGADO = 'E001',
  EMISOR_ERROR_CODIFICACION = 'E002',
  EMISOR_PULSO_INVALIDO = 'E003',
  
  CANAL_INOPERATIVO = 'C001',
  CANAL_SENAL_PERDIDA = 'C002',
  CANAL_FALLO_TRANSMISION = 'C003',
  CANAL_DISTANCIA_EXCESIVA = 'C004',
  
  RELE_INACTIVO = 'R001',
  RELE_BATERIA_AGOTADA = 'R002',
  RELE_SENAL_IRRECUPERABLE = 'R003',
  
  RECEPTOR_INACTIVO = 'X001',
  RECEPTOR_SENAL_DEBIL = 'X002',
  RECEPTOR_CORRUPCION_DETECTADA = 'X003',
  RECEPTOR_CHECKSUM_INVALIDO = 'X004',
  RECEPTOR_DECODIFICACION_FALLIDA = 'X005',
  
  SISTEMA_NO_CONFIGURADO = 'S001',
  COMPONENTE_NO_ENCONTRADO = 'S002'
}

/**
 * Factory para crear errores de transmisión estandarizados
 */
export class ErrorTransmisionFactory {
  
  static crear(
    codigo: CodigoError,
    mensaje: string,
    tipoComponente: TipoNodo,
    componenteId: string,
    componenteNombre: string,
    opciones?: {
      contexto?: Record<string, unknown>;
      recuperable?: boolean;
      sugerencia?: string;
    }
  ): IErrorTransmision {
    return {
      codigo,
      mensaje,
      tipoComponente,
      componenteId,
      componenteNombre,
      timestamp: new Date(),
      contexto: opciones?.contexto,
      recuperable: opciones?.recuperable ?? false,
      sugerencia: opciones?.sugerencia
    };
  }

  static canalSenalPerdida(
    componenteId: string,
    componenteNombre: string,
    distancia: number,
    intensidadFinal: number
  ): IErrorTransmision {
    return this.crear(
      CodigoError.CANAL_SENAL_PERDIDA,
      `ERROR: señal degradada irreversiblemente en ${componenteNombre} km ${distancia}`,
      TipoNodo.CANAL,
      componenteId,
      componenteNombre,
      {
        contexto: { distancia, intensidadFinal },
        recuperable: false,
        sugerencia: 'Añadir un relé intermedio para regenerar la señal'
      }
    );
  }

  static releBateriaAgotada(
    componenteId: string,
    componenteNombre: string
  ): IErrorTransmision {
    return this.crear(
      CodigoError.RELE_BATERIA_AGOTADA,
      `ERROR: ${componenteNombre} sin energía, no puede amplificar`,
      TipoNodo.RELE,
      componenteId,
      componenteNombre,
      {
        recuperable: true,
        sugerencia: 'Recargar la batería del relé'
      }
    );
  }

  static receptorCorrupcion(
    componenteId: string,
    componenteNombre: string,
    checksumEsperado: number,
    checksumRecibido: number
  ): IErrorTransmision {
    return this.crear(
      CodigoError.RECEPTOR_CORRUPCION_DETECTADA,
      `ERROR: corrupción detectada en ${componenteNombre}. Checksum inválido.`,
      TipoNodo.RECEPTOR,
      componenteId,
      componenteNombre,
      {
        contexto: { checksumEsperado, checksumRecibido },
        recuperable: false,
        sugerencia: 'Retransmitir el mensaje'
      }
    );
  }
}
