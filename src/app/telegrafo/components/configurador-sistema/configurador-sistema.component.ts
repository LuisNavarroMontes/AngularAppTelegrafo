import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ConfiguracionSistema } from '../../../core/services';
import { TipoNodo } from '../../../core/interfaces';

@Component({
  selector: 'app-configurador-sistema',
  templateUrl: './configurador-sistema.component.html',
  styleUrls: ['./configurador-sistema.component.scss']
})
export class ConfiguradorSistemaComponent implements OnChanges {
  
  TipoNodo = TipoNodo;
  
  @Input() tiposEmisor: string[] = [];
  @Input() tiposCanal: string[] = [];
  @Input() tiposRele: string[] = [];
  @Input() tiposReceptor: string[] = [];
  
  /** Configuración actual del sistema (para sincronizar desde Constructor) */
  @Input() configuracionActual: ConfiguracionSistema | null = null;
  
  @Output() configuracionCambiada = new EventEmitter<ConfiguracionSistema>();
  
  // Emisores dinámicos
  emisores: Array<{
    subtipo: string;
  }> = [
    { subtipo: 'AUTOMATICO' }
  ];
  
  tipoEmisorSeleccionado: string = 'AUTOMATICO';
  
  receptores: Array<{
    subtipo: string;
  }> = [
    { subtipo: 'CONSOLA' }
  ];
  
  componentesIntermedios: Array<{
    tipo: TipoNodo;
    subtipo: string;
    distancia?: number;
  }> = [
    { tipo: TipoNodo.CANAL, subtipo: 'TERRESTRE', distancia: 100 },
    { tipo: TipoNodo.RELE, subtipo: 'SIMPLE' },
    { tipo: TipoNodo.CANAL, subtipo: 'TERRESTRE', distancia: 150 },
    { tipo: TipoNodo.RELE, subtipo: 'SIMPLE' }
  ];

  /**
   * Detecta cambios en la configuración actual y sincroniza los selectores
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configuracionActual'] && this.configuracionActual) {
      this.sincronizarDesdeConfiguracion(this.configuracionActual);
    }
  }

  /**
   * Sincroniza los valores de los selectores desde una configuración existente
   */
  private sincronizarDesdeConfiguracion(config: ConfiguracionSistema): void {
    if (config.emisores && config.emisores.length > 0) {
      this.emisores = config.emisores.map(e => ({ subtipo: e.subtipo }));
    } else if (config.emisor?.subtipo) {
      this.emisores = [{ subtipo: config.emisor.subtipo }];
    } else {
      this.emisores = [{ subtipo: 'AUTOMATICO' }];
    }

    if (config.receptores && config.receptores.length > 0) {
      this.receptores = config.receptores.map(r => ({ subtipo: r.subtipo }));
    } else if (config.receptor?.subtipo) {
      this.receptores = [{ subtipo: config.receptor.subtipo }];
    } else {
      this.receptores = [{ subtipo: 'CONSOLA' }];
    }

    if (config.componentesIntermedios && config.componentesIntermedios.length > 0) {
      this.componentesIntermedios = config.componentesIntermedios.map(comp => ({
        tipo: comp.tipo,
        subtipo: comp.subtipo,
        distancia: comp.tipo === TipoNodo.CANAL 
          ? (comp.parametros?.['distancia'] as number || 100)
          : undefined
      }));
    } else {
      this.componentesIntermedios = [
        { tipo: TipoNodo.CANAL, subtipo: 'TERRESTRE', distancia: 100 },
        { tipo: TipoNodo.RELE, subtipo: 'SIMPLE' },
        { tipo: TipoNodo.CANAL, subtipo: 'TERRESTRE', distancia: 150 }
      ];
    }
  }
  
  aplicarConfiguracion(): void {
    const config: ConfiguracionSistema = {
      emisores: this.emisores.map(e => ({
        tipo: TipoNodo.EMISOR,
        subtipo: e.subtipo
      })),
      componentesIntermedios: this.componentesIntermedios.map(comp => ({
        tipo: comp.tipo,
        subtipo: comp.subtipo,
        parametros: comp.tipo === TipoNodo.CANAL && comp.distancia 
          ? { distancia: comp.distancia }
          : undefined
      })),
      receptores: this.receptores.map(r => ({
        tipo: TipoNodo.RECEPTOR,
        subtipo: r.subtipo
      }))
    };
    
    this.configuracionCambiada.emit(config);
  }

  /**
   * Añade un emisor del tipo seleccionado
   */
  agregarEmisor(): void {
    this.emisores.push({ subtipo: this.tipoEmisorSeleccionado || 'AUTOMATICO' });
  }

  /**
   * Elimina un emisor
   */
  eliminarEmisor(index: number): void {
    if (this.emisores.length > 1) {
      this.emisores.splice(index, 1);
    }
  }

  /**
   * Añade un receptor
   */
  agregarReceptor(): void {
    this.receptores.push({ subtipo: 'CONSOLA' });
  }

  /**
   * Elimina un receptor
   */
  eliminarReceptor(index: number): void {
    if (this.receptores.length > 1) {
      this.receptores.splice(index, 1);
    }
  }

  /**
   * Añade un componente intermedio
   */
  agregarComponente(tipo: string): void {
    if (tipo === 'CANAL') {
      this.componentesIntermedios.push({ 
        tipo: TipoNodo.CANAL, 
        subtipo: 'TERRESTRE', 
        distancia: 100 
      });
    } else if (tipo === 'RELE') {
      this.componentesIntermedios.push({ 
        tipo: TipoNodo.RELE, 
        subtipo: 'SIMPLE' 
      });
    }
  }

  /**
   * Elimina un componente intermedio
   */
  eliminarComponente(index: number): void {
    if (this.componentesIntermedios.length <= 1) {
      return; // No se puede eliminar si solo queda uno
    }

    this.componentesIntermedios.splice(index, 1);
  }

  /**
   * Mueve un componente hacia arriba
   */
  moverArriba(index: number): void {
    if (index > 0) {
      [this.componentesIntermedios[index - 1], this.componentesIntermedios[index]] = 
      [this.componentesIntermedios[index], this.componentesIntermedios[index - 1]];
    }
  }

  /**
   * Mueve un componente hacia abajo
   */
  moverAbajo(index: number): void {
    if (index < this.componentesIntermedios.length - 1) {
      [this.componentesIntermedios[index], this.componentesIntermedios[index + 1]] = 
      [this.componentesIntermedios[index + 1], this.componentesIntermedios[index]];
    }
  }

}
