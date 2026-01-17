/**
 * Tipos de nodo en el sistema
 */
export enum TipoNodo {
  EMISOR = 'EMISOR',
  CANAL = 'CANAL',
  RELE = 'RELE',
  RECEPTOR = 'RECEPTOR'
}

/**
 * Configuración para crear un nodo dinámicamente
 */
export interface ConfiguracionNodo {
  tipo: TipoNodo;
  subtipo: string;
  parametros?: Record<string, unknown>;
}
