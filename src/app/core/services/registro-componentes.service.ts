import { Injectable } from '@angular/core';
import { 
  IEmisor, ICanal, IRele, IReceptor, ICodificador, TipoNodo 
} from '../interfaces';
import {
  IComponenteRegistro,
  IComponenteMetadata,
  ICodificadorRegistro,
  ICatalogoComponentes,
  ComponenteFactory
} from '../interfaces/componente-registro.interface';

import { EmisorManual, EmisorAutomatico, EmisorPruebas } from '../../emisores';
import { CanalTerrestre, CanalSubmarino, CanalSimulado } from '../../canales';
import { ReleSimple, ReleBateria, ReleInteligente } from '../../reles';
import { ReceptorConsola, ReceptorFichero, ReceptorMemoria } from '../../receptores';
import { CodificadorMorse, CodificadorBaudot, CodificadorBinario } from '../../codificadores';

/**
 * Servicio de Registro de Componentes
 * 
 * PATRÓN REGISTRY: Permite registrar y obtener componentes dinámicamente.
 * PRINCIPIO OPEN/CLOSED: Abierto a extensión, cerrado a modificación.
 */
@Injectable({
  providedIn: 'root'
})
export class RegistroComponentesService {

  private emisores: Map<string, IComponenteRegistro<IEmisor>> = new Map();
  private canales: Map<string, IComponenteRegistro<ICanal>> = new Map();
  private reles: Map<string, IComponenteRegistro<IRele>> = new Map();
  private receptores: Map<string, IComponenteRegistro<IReceptor>> = new Map();
  private codificadores: Map<string, ICodificadorRegistro> = new Map();
  private codificadorActivo: ICodificador;

  constructor() {
    this.codificadorActivo = new CodificadorMorse();
    this.registrarComponentesPredefinidos();
  }

  private registrarComponentesPredefinidos(): void {
    this.registrarEmisoresPredefinidos();
    this.registrarCanalesPredefinidos();
    this.registrarRelesPredefinidos();
    this.registrarReceptoresPredefinidos();
    this.registrarCodificadoresPredefinidos();
  }

  private registrarEmisoresPredefinidos(): void {
    this.registrarEmisor({
      id: 'emisor-manual',
      nombre: 'Emisor Manual',
      descripcion: 'Emisor controlado manualmente por el operador. Simula la velocidad y errores humanos.',
      tipoNodo: TipoNodo.EMISOR,
      subtipo: 'MANUAL',
      icono: '✋',
      parametrosConfigurables: [
        {
          nombre: 'Velocidad WPM',
          clave: 'velocidadWPM',
          tipo: 'number',
          valorDefecto: 20,
          min: 5,
          max: 40,
          descripcion: 'Palabras por minuto del operador'
        },
        {
          nombre: 'Tasa de error',
          clave: 'tasaErrorOperador',
          tipo: 'number',
          valorDefecto: 0.02,
          min: 0,
          max: 0.2,
          descripcion: 'Probabilidad de error del operador (0-1)'
        }
      ],
      habilitado: true
    }, (params) => {
      const emisor = new EmisorManual(this.codificadorActivo);
      if (params) Object.assign(emisor, params);
      return emisor;
    });

    this.registrarEmisor({
      id: 'emisor-automatico',
      nombre: 'Emisor Automático',
      descripcion: 'Transmite mensajes automáticamente. Alta velocidad, sin errores humanos, generación automática de mensajes.',
      tipoNodo: TipoNodo.EMISOR,
      subtipo: 'AUTOMATICO',
      icono: '🤖',
      parametrosConfigurables: [
        {
          nombre: 'Intervalo (ms)',
          clave: 'intervaloTransmision',
          tipo: 'number',
          valorDefecto: 3000,
          min: 500,
          max: 30000,
          descripcion: 'Intervalo entre mensajes automáticos'
        }
      ],
      habilitado: true
    }, (params) => {
      const emisor = new EmisorAutomatico(this.codificadorActivo);
      if (params) Object.assign(emisor, params);
      return emisor;
    });

    this.registrarEmisor({
      id: 'emisor-pruebas',
      nombre: 'Emisor de Pruebas',
      descripcion: 'Emisor para testing y diagnóstico del sistema. Permite configurar comportamientos específicos.',
      tipoNodo: TipoNodo.EMISOR,
      subtipo: 'PRUEBAS',
      icono: '🧪',
      parametrosConfigurables: [
        {
          nombre: 'Modo fallo',
          clave: 'modoFallo',
          tipo: 'boolean',
          valorDefecto: false,
          descripcion: 'Simular fallos en el emisor'
        }
      ],
      habilitado: true
    }, (params) => {
      const emisor = new EmisorPruebas(this.codificadorActivo);
      if (params) Object.assign(emisor, params);
      return emisor;
    });
  }

  private registrarCanalesPredefinidos(): void {
    this.registrarCanal({
      id: 'canal-terrestre',
      nombre: 'Cable Terrestre',
      descripcion: 'Canal de cable terrestre. Atenuación media, buena fiabilidad.',
      tipoNodo: TipoNodo.CANAL,
      subtipo: 'TERRESTRE',
      icono: '🏔️',
      parametrosConfigurables: [
        {
          nombre: 'Distancia (km)',
          clave: 'distancia',
          tipo: 'number',
          valorDefecto: 100,
          min: 1,
          max: 1000,
          descripcion: 'Longitud del cable en kilómetros'
        },
        {
          nombre: 'Factor atenuación',
          clave: 'factorAtenuacion',
          tipo: 'number',
          valorDefecto: 0.02,
          min: 0.001,
          max: 0.1,
          descripcion: 'Pérdida de señal por km'
        }
      ],
      habilitado: true
    }, (params) => {
      const canal = new CanalTerrestre();
      if (params) Object.assign(canal, params);
      return canal;
    });

    this.registrarCanal({
      id: 'canal-submarino',
      nombre: 'Cable Submarino',
      descripcion: 'Canal de cable submarino. Mayor atenuación, posibles interferencias.',
      tipoNodo: TipoNodo.CANAL,
      subtipo: 'SUBMARINO',
      icono: '🌊',
      parametrosConfigurables: [
        {
          nombre: 'Distancia (km)',
          clave: 'distancia',
          tipo: 'number',
          valorDefecto: 500,
          min: 10,
          max: 5000,
          descripcion: 'Longitud del cable submarino'
        },
        {
          nombre: 'Factor atenuación',
          clave: 'factorAtenuacion',
          tipo: 'number',
          valorDefecto: 0.05,
          min: 0.01,
          max: 0.15,
          descripcion: 'Pérdida de señal por km (mayor en agua)'
        },
        {
          nombre: 'Prob. fallo',
          clave: 'probabilidadFallo',
          tipo: 'number',
          valorDefecto: 0.05,
          min: 0,
          max: 0.3,
          descripcion: 'Probabilidad de fallo por interferencias'
        }
      ],
      habilitado: true
    }, (params) => {
      const canal = new CanalSubmarino();
      if (params) Object.assign(canal, params);
      return canal;
    });

    this.registrarCanal({
      id: 'canal-simulado',
      nombre: 'Enlace Simulado',
      descripcion: 'Canal virtual para pruebas. Comportamiento configurable.',
      tipoNodo: TipoNodo.CANAL,
      subtipo: 'SIMULADO',
      icono: '💻',
      parametrosConfigurables: [
        {
          nombre: 'Distancia (km)',
          clave: 'distancia',
          tipo: 'number',
          valorDefecto: 50,
          min: 1,
          max: 10000
        },
        {
          nombre: 'Factor atenuación',
          clave: 'factorAtenuacion',
          tipo: 'number',
          valorDefecto: 0.01,
          min: 0,
          max: 0.5
        },
        {
          nombre: 'Prob. fallo',
          clave: 'probabilidadFallo',
          tipo: 'number',
          valorDefecto: 0,
          min: 0,
          max: 1
        }
      ],
      habilitado: true
    }, (params) => {
      const canal = new CanalSimulado();
      if (params) Object.assign(canal, params);
      return canal;
    });
  }

  private registrarRelesPredefinidos(): void {
    this.registrarRele({
      id: 'rele-simple',
      nombre: 'Relé Simple',
      descripcion: 'Relé básico con amplificación fija. Fiable y económico.',
      tipoNodo: TipoNodo.RELE,
      subtipo: 'SIMPLE',
      icono: '🔌',
      parametrosConfigurables: [
        {
          nombre: 'Reanimar si señal > (%)',
          clave: 'umbralDeteccion',
          tipo: 'number',
          valorDefecto: 30,
          min: 1,
          max: 100,
          descripcion: 'Porcentaje de intensidad de señal. El relé reanimará la señal cuando sea superior a este valor.'
        },
        {
          nombre: 'Factor amplificación',
          clave: 'factorAmplificacion',
          tipo: 'number',
          valorDefecto: 1.5,
          min: 1,
          max: 3,
          descripcion: 'Multiplicador de intensidad'
        }
      ],
      habilitado: true
    }, (params) => {
      const rele = new ReleSimple();
      if (params) Object.assign(rele, params);
      return rele;
    });

    this.registrarRele({
      id: 'rele-bateria',
      nombre: 'Relé con Batería',
      descripcion: 'Relé con batería limitada. Mayor amplificación pero se agota.',
      tipoNodo: TipoNodo.RELE,
      subtipo: 'BATERIA',
      icono: '🔋',
      parametrosConfigurables: [
        {
          nombre: 'Reanimar si señal > (%)',
          clave: 'umbralDeteccion',
          tipo: 'number',
          valorDefecto: 30,
          min: 1,
          max: 100,
          descripcion: 'Porcentaje de intensidad de señal. El relé reanimará la señal cuando sea superior a este valor.'
        },
        {
          nombre: 'Factor amplificación',
          clave: 'factorAmplificacion',
          tipo: 'number',
          valorDefecto: 2.0,
          min: 1.5,
          max: 4
        },
        {
          nombre: 'Capacidad batería',
          clave: 'capacidadBateria',
          tipo: 'number',
          valorDefecto: 100,
          min: 10,
          max: 500,
          descripcion: 'Número de amplificaciones disponibles'
        }
      ],
      habilitado: true
    }, (params) => {
      const rele = new ReleBateria();
      if (params) Object.assign(rele, params);
      return rele;
    });

    this.registrarRele({
      id: 'rele-inteligente',
      nombre: 'Relé Inteligente',
      descripcion: 'Relé con amplificación adaptativa según la calidad de la señal.',
      tipoNodo: TipoNodo.RELE,
      subtipo: 'INTELIGENTE',
      icono: '🧠',
      parametrosConfigurables: [
        {
          nombre: 'Reanimar si señal > (%)',
          clave: 'umbralDeteccion',
          tipo: 'number',
          valorDefecto: 30,
          min: 1,
          max: 100,
          descripcion: 'Porcentaje de intensidad de señal. El relé reanimará la señal cuando sea superior a este valor.'
        },
        {
          nombre: 'Factor amplificación base',
          clave: 'factorAmplificacion',
          tipo: 'number',
          valorDefecto: 1.8,
          min: 1,
          max: 5
        },
        {
          nombre: 'Modo adaptativo',
          clave: 'modoAdaptativo',
          tipo: 'boolean',
          valorDefecto: true,
          descripcion: 'Ajustar amplificación según señal'
        }
      ],
      habilitado: true
    }, (params) => {
      const rele = new ReleInteligente();
      if (params) Object.assign(rele, params);
      return rele;
    });
  }

  private registrarReceptoresPredefinidos(): void {
    this.registrarReceptor({
      id: 'receptor-consola',
      nombre: 'Receptor Consola',
      descripcion: 'Muestra los mensajes decodificados en la consola del navegador.',
      tipoNodo: TipoNodo.RECEPTOR,
      subtipo: 'CONSOLA',
      icono: '🖥️',
      parametrosConfigurables: [],
      habilitado: true
    }, (params) => {
      const receptor = new ReceptorConsola(this.codificadorActivo);
      if (params) Object.assign(receptor, params);
      return receptor;
    });

    this.registrarReceptor({
      id: 'receptor-fichero',
      nombre: 'Receptor Fichero',
      descripcion: 'Guarda los mensajes en un fichero virtual descargable.',
      tipoNodo: TipoNodo.RECEPTOR,
      subtipo: 'FICHERO',
      icono: '📁',
      parametrosConfigurables: [
        {
          nombre: 'Nombre fichero',
          clave: 'nombreFichero',
          tipo: 'string',
          valorDefecto: 'mensajes_telegrafo.txt',
          descripcion: 'Nombre del archivo de salida'
        }
      ],
      habilitado: true
    }, (params) => {
      const receptor = new ReceptorFichero(this.codificadorActivo);
      if (params) Object.assign(receptor, params);
      return receptor;
    });

    this.registrarReceptor({
      id: 'receptor-memoria',
      nombre: 'Receptor Memoria',
      descripcion: 'Almacena mensajes en memoria para procesamiento posterior.',
      tipoNodo: TipoNodo.RECEPTOR,
      subtipo: 'MEMORIA',
      icono: '💾',
      parametrosConfigurables: [
        {
          nombre: 'Límite mensajes',
          clave: 'limiteMensajes',
          tipo: 'number',
          valorDefecto: 100,
          min: 10,
          max: 1000,
          descripcion: 'Máximo de mensajes en memoria'
        }
      ],
      habilitado: true
    }, (params) => {
      const receptor = new ReceptorMemoria(this.codificadorActivo);
      if (params) Object.assign(receptor, params);
      return receptor;
    });
  }

  private registrarCodificadoresPredefinidos(): void {
    this.registrarCodificador({
      id: 'codificador-morse',
      nombre: 'Codigo Morse',
      descripcion: 'Sistema clasico de puntos y rayas',
      caracteresValidos: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?! ',
      icono: '📡'
    }, () => new CodificadorMorse());

    this.registrarCodificador({
      id: 'codificador-baudot',
      nombre: 'Codigo Baudot',
      descripcion: 'Sistema de 5 bits usado en teletipos',
      caracteresValidos: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ',
      icono: '📠'
    }, () => new CodificadorBaudot());

    this.registrarCodificador({
      id: 'codificador-binario',
      nombre: 'Codigo Binario ASCII',
      descripcion: 'Codificación binaria de 8 bits',
      caracteresValidos: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
      icono: '💻'
    }, () => new CodificadorBinario());
  }

  registrarEmisor(
    metadata: IComponenteMetadata, 
    factory: ComponenteFactory<IEmisor>
  ): void {
    this.emisores.set(metadata.subtipo.toUpperCase(), { metadata, factory });
  }

  registrarCanal(
    metadata: IComponenteMetadata, 
    factory: ComponenteFactory<ICanal>
  ): void {
    this.canales.set(metadata.subtipo.toUpperCase(), { metadata, factory });
  }

  registrarRele(
    metadata: IComponenteMetadata, 
    factory: ComponenteFactory<IRele>
  ): void {
    this.reles.set(metadata.subtipo.toUpperCase(), { metadata, factory });
  }

  registrarReceptor(
    metadata: IComponenteMetadata, 
    factory: ComponenteFactory<IReceptor>
  ): void {
    this.receptores.set(metadata.subtipo.toUpperCase(), { metadata, factory });
  }

  registrarCodificador(
    metadata: ICodificadorRegistro['metadata'],
    factory: () => ICodificador
  ): void {
    this.codificadores.set(metadata.id, { metadata, factory });
  }

  crearEmisor(subtipo: string, parametros?: Record<string, unknown>): IEmisor {
    const registro = this.emisores.get(subtipo.toUpperCase());
    if (!registro) {
      throw new Error(`Emisor no encontrado: ${subtipo}. Disponibles: ${this.obtenerSubtiposEmisores().join(', ')}`);
    }
    return registro.factory(parametros);
  }

  crearCanal(subtipo: string, parametros?: Record<string, unknown>): ICanal {
    const registro = this.canales.get(subtipo.toUpperCase());
    if (!registro) {
      throw new Error(`Canal no encontrado: ${subtipo}. Disponibles: ${this.obtenerSubtiposCanales().join(', ')}`);
    }
    return registro.factory(parametros);
  }

  crearRele(subtipo: string, parametros?: Record<string, unknown>): IRele {
    const registro = this.reles.get(subtipo.toUpperCase());
    if (!registro) {
      throw new Error(`Relé no encontrado: ${subtipo}. Disponibles: ${this.obtenerSubtiposReles().join(', ')}`);
    }
    return registro.factory(parametros);
  }

  crearReceptor(subtipo: string, parametros?: Record<string, unknown>): IReceptor {
    const registro = this.receptores.get(subtipo.toUpperCase());
    if (!registro) {
      throw new Error(`Receptor no encontrado: ${subtipo}. Disponibles: ${this.obtenerSubtiposReceptores().join(', ')}`);
    }
    return registro.factory(parametros);
  }

  crearCodificador(id: string): ICodificador {
    const registro = this.codificadores.get(id);
    if (!registro) {
      throw new Error(`Codificador no encontrado: ${id}`);
    }
    return registro.factory();
  }

  obtenerEmisoresDisponibles(): IComponenteMetadata[] {
    return Array.from(this.emisores.values()).map(r => r.metadata);
  }

  obtenerCanalesDisponibles(): IComponenteMetadata[] {
    return Array.from(this.canales.values()).map(r => r.metadata);
  }

  obtenerRelesDisponibles(): IComponenteMetadata[] {
    return Array.from(this.reles.values()).map(r => r.metadata);
  }

  obtenerReceptoresDisponibles(): IComponenteMetadata[] {
    return Array.from(this.receptores.values()).map(r => r.metadata);
  }

  obtenerCodificadoresDisponibles(): ICodificadorRegistro['metadata'][] {
    return Array.from(this.codificadores.values()).map(r => r.metadata);
  }

  obtenerSubtiposEmisores(): string[] {
    return Array.from(this.emisores.keys());
  }

  obtenerSubtiposCanales(): string[] {
    return Array.from(this.canales.keys());
  }

  obtenerSubtiposReles(): string[] {
    return Array.from(this.reles.keys());
  }

  obtenerSubtiposReceptores(): string[] {
    return Array.from(this.receptores.keys());
  }

  obtenerCatalogo(): ICatalogoComponentes {
    return {
      emisores: Array.from(this.emisores.values()),
      canales: Array.from(this.canales.values()),
      reles: Array.from(this.reles.values()),
      receptores: Array.from(this.receptores.values()),
      codificadores: Array.from(this.codificadores.values())
    };
  }

  setCodificadorActivo(idOInstancia: string | ICodificador): void {
    if (typeof idOInstancia === 'string') {
      this.codificadorActivo = this.crearCodificador(idOInstancia);
    } else {
      this.codificadorActivo = idOInstancia;
    }
  }

  getCodificadorActivo(): ICodificador {
    return this.codificadorActivo;
  }

  existeComponente(tipo: TipoNodo, subtipo: string): boolean {
    const subtipoUpper = subtipo.toUpperCase();
    switch (tipo) {
      case TipoNodo.EMISOR:
        return this.emisores.has(subtipoUpper);
      case TipoNodo.CANAL:
        return this.canales.has(subtipoUpper);
      case TipoNodo.RELE:
        return this.reles.has(subtipoUpper);
      case TipoNodo.RECEPTOR:
        return this.receptores.has(subtipoUpper);
      default:
        return false;
    }
  }

  obtenerMetadata(tipo: TipoNodo, subtipo: string): IComponenteMetadata | null {
    const subtipoUpper = subtipo.toUpperCase();
    let registro;
    
    switch (tipo) {
      case TipoNodo.EMISOR:
        registro = this.emisores.get(subtipoUpper);
        break;
      case TipoNodo.CANAL:
        registro = this.canales.get(subtipoUpper);
        break;
      case TipoNodo.RELE:
        registro = this.reles.get(subtipoUpper);
        break;
      case TipoNodo.RECEPTOR:
        registro = this.receptores.get(subtipoUpper);
        break;
    }
    
    return registro?.metadata || null;
  }

  imprimirCatalogo(): void {
  }
}
