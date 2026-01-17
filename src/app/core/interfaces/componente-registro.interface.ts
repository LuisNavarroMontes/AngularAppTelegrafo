import { IEmisor, ICanal, IRele, IReceptor, ICodificador, TipoNodo } from './index';

/**
 * Metadatos de un componente registrado
 * Permite describir componentes de forma uniforme para el sistema de registro
 */
export interface IComponenteMetadata {
  /** Identificador único del tipo de componente */
  id: string;
  
  /** Nombre descriptivo para mostrar */
  nombre: string;
  
  /** Descripción del componente */
  descripcion: string;
  
  /** Tipo de nodo (EMISOR, CANAL, RELE, RECEPTOR) */
  tipoNodo: TipoNodo;
  
  /** Subtipo específico (ej: MANUAL, AUTOMATICO, TERRESTRE, etc.) */
  subtipo: string;
  
  /** Icono para la UI (emoji o clase de icono) */
  icono?: string;
  
  /** Parámetros configurables del componente */
  parametrosConfigurables?: IParametroConfigurable[];
  
  /** Indica si el componente está habilitado */
  habilitado?: boolean;
}

/**
 * Parámetro configurable de un componente
 */
export interface IParametroConfigurable {
  /** Nombre del parámetro */
  nombre: string;
  
  /** Clave para asignar el valor */
  clave: string;
  
  /** Tipo de dato */
  tipo: 'number' | 'string' | 'boolean' | 'select';
  
  /** Valor por defecto */
  valorDefecto: unknown;
  
  /** Valor mínimo (para números) */
  min?: number;
  
  /** Valor máximo (para números) */
  max?: number;
  
  /** Opciones disponibles (para tipo select) */
  opciones?: { valor: unknown; etiqueta: string }[];
  
  /** Descripción del parámetro */
  descripcion?: string;
}

/**
 * Factory function para crear instancias de componentes
 */
export type ComponenteFactory<T> = (parametros?: Record<string, unknown>) => T;

/**
 * Registro de un componente con su metadata y factory
 */
export interface IComponenteRegistro<T = IEmisor | ICanal | IRele | IReceptor> {
  /** Metadatos del componente */
  metadata: IComponenteMetadata;
  
  /** Factory para crear instancias */
  factory: ComponenteFactory<T>;
}

/**
 * Registro de un codificador
 */
export interface ICodificadorRegistro {
  /** Metadatos del codificador */
  metadata: {
    id: string;
    nombre: string;
    descripcion: string;
    caracteresValidos: string;
    icono?: string;
  };
  
  /** Factory para crear instancias */
  factory: () => ICodificador;
}

/**
 * Catálogo completo de componentes disponibles
 */
export interface ICatalogoComponentes {
  emisores: IComponenteRegistro<IEmisor>[];
  canales: IComponenteRegistro<ICanal>[];
  reles: IComponenteRegistro<IRele>[];
  receptores: IComponenteRegistro<IReceptor>[];
  codificadores: ICodificadorRegistro[];
}
