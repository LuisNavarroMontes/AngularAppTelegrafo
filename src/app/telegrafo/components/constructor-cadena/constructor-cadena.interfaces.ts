import { IComponenteMetadata } from '../../../core/interfaces';

/**
 * Elemento de la cadena de configuración
 */
export interface ElementoCadena {
  id: string;
  metadata: IComponenteMetadata;
  parametros: Record<string, unknown>;
  orden: number;
}
