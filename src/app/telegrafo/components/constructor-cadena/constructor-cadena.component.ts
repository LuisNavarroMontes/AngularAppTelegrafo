import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { 
  RegistroComponentesService, 
  SistemaCoordinadorService,
  ConfiguracionSistema 
} from '../../../core/services';
import { 
  IComponenteMetadata, 
  IParametroConfigurable,
  TipoNodo 
} from '../../../core/interfaces';
import { ElementoCadena } from './constructor-cadena.interfaces';

/**
 * Constructor de Cadena
 * Interfaz visual para construir la cadena de componentes del telégrafo.
 * Permite añadir, configurar y reordenar componentes de forma interactiva.
 */
@Component({
  selector: 'app-constructor-cadena',
  templateUrl: './constructor-cadena.component.html',
  styleUrls: ['./constructor-cadena.component.scss']
})
export class ConstructorCadenaComponent implements OnInit {

  @Output() configuracionLista = new EventEmitter<ConfiguracionSistema>();
  @Output() sistemaIniciado = new EventEmitter<void>();

  emisoresDisponibles: IComponenteMetadata[] = [];
  canalesDisponibles: IComponenteMetadata[] = [];
  relesDisponibles: IComponenteMetadata[] = [];
  receptoresDisponibles: IComponenteMetadata[] = [];
  codificadoresDisponibles: { id: string; nombre: string; icono?: string }[] = [];

  emisoresSeleccionados: ElementoCadena[] = [];
  componentesIntermedios: ElementoCadena[] = [];
  receptoresSeleccionados: ElementoCadena[] = [];

  codificadorSeleccionadoId: string = 'codificador-morse';

  tabActiva: 'emisores' | 'canales' | 'reles' | 'receptores' | 'codificadores' = 'emisores';
  componenteEditando: ElementoCadena | null = null;
  mostrarPanelConfiguracion: boolean = false;
  
  mensajeEstado: string = '';
  tipoMensaje: 'info' | 'success' | 'error' = 'info';

  transmisionActiva: boolean = false;
  intervaloMs: number = 3000;
  mensajesEnviados: number = 0;
  ultimoMensaje: string = '';

  private contadorId = 0;

  constructor(
    private registro: RegistroComponentesService,
    private sistema: SistemaCoordinadorService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCatalogo();
    this.cargarConfiguracionActual();
  }

  /**
   * Carga la configuración actual del sistema si existe
   */
  private cargarConfiguracionActual(): void {
    const configActual = this.sistema.obtenerConfiguracionActual();
    if (configActual) {
      this.reconstruirDesdeConfiguracion(configActual);
    }
  }

  /**
   * Reconstruye la cadena del constructor desde una configuración
   */
  private reconstruirDesdeConfiguracion(config: ConfiguracionSistema): void {
    this.emisoresSeleccionados = [];
    this.componentesIntermedios = [];
    this.receptoresSeleccionados = [];

    const emisoresConfig = config.emisores || (config.emisor ? [config.emisor] : []);
    for (const emisorConfig of emisoresConfig) {
      const metadata = this.emisoresDisponibles.find(e => e.subtipo === emisorConfig.subtipo);
      if (metadata) {
        const elemento: ElementoCadena = {
          id: `emisor-${this.contadorId++}`,
          metadata,
          parametros: {},
          orden: this.emisoresSeleccionados.length
        };
        this.emisoresSeleccionados.push(elemento);
      }
    }

    for (const compConfig of config.componentesIntermedios) {
      let metadata: IComponenteMetadata | undefined;
      if (compConfig.tipo === TipoNodo.CANAL) {
        metadata = this.canalesDisponibles.find(c => c.subtipo === compConfig.subtipo);
      } else if (compConfig.tipo === TipoNodo.RELE) {
        metadata = this.relesDisponibles.find(r => r.subtipo === compConfig.subtipo);
      }
      
      if (metadata) {
        const elemento: ElementoCadena = {
          id: `${compConfig.tipo.toLowerCase()}-${this.contadorId++}`,
          metadata,
          parametros: compConfig.parametros || {},
          orden: this.componentesIntermedios.length
        };
        this.componentesIntermedios.push(elemento);
      }
    }

    const receptoresConfig = config.receptores || (config.receptor ? [config.receptor] : []);
    this.receptoresSeleccionados = [];
    for (const receptorConfig of receptoresConfig) {
      const metadata = this.receptoresDisponibles.find(r => r.subtipo === receptorConfig.subtipo);
      if (metadata) {
        const receptor = this.crearElementoCadena(metadata);
        receptor.parametros = receptorConfig.parametros || {};
        this.receptoresSeleccionados.push(receptor);
      }
    }

    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private cargarCatalogo(): void {
    this.emisoresDisponibles = this.registro.obtenerEmisoresDisponibles();
    this.canalesDisponibles = this.registro.obtenerCanalesDisponibles();
    this.relesDisponibles = this.registro.obtenerRelesDisponibles();
    this.receptoresDisponibles = this.registro.obtenerReceptoresDisponibles();
    this.codificadoresDisponibles = this.registro.obtenerCodificadoresDisponibles();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SELECCIÓN DE COMPONENTES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Añade un emisor a la cadena
   */
  seleccionarEmisor(metadata: IComponenteMetadata): void {
    const elemento = this.crearElementoCadena(metadata);
    elemento.orden = this.emisoresSeleccionados.length;
    this.emisoresSeleccionados = [...this.emisoresSeleccionados, elemento];
    this.mostrarMensaje(`Emisor "${metadata.nombre}" añadido (${this.emisoresSeleccionados.length} en total)`, 'success');
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  /**
   * Selecciona un receptor (puede haber múltiples)
   */
  seleccionarReceptor(metadata: IComponenteMetadata): void {
    const receptor = this.crearElementoCadena(metadata);
    this.receptoresSeleccionados.push(receptor);
    this.mostrarMensaje(`Receptor "${metadata.nombre}" añadido (${this.receptoresSeleccionados.length} receptor${this.receptoresSeleccionados.length > 1 ? 'es' : ''})`, 'success');
  }

  /**
   * Elimina un receptor por su índice
   */
  eliminarReceptor(index: number): void {
    if (index >= 0 && index < this.receptoresSeleccionados.length) {
      const receptor = this.receptoresSeleccionados[index];
      this.receptoresSeleccionados.splice(index, 1);
      this.mostrarMensaje(`Receptor "${receptor.metadata.nombre}" eliminado`, 'info');
    }
  }

  /**
   * Cuenta cuántos receptores de un tipo específico hay
   */
  contarReceptores(id: string): number {
    return this.receptoresSeleccionados.filter(r => r.metadata.id === id).length;
  }

  /**
   * Añade un componente intermedio (canal o relé)
   */
  agregarComponenteIntermedio(metadata: IComponenteMetadata): void {
    const elemento = this.crearElementoCadena(metadata);
    elemento.orden = this.componentesIntermedios.length;
    this.componentesIntermedios.push(elemento);
    this.mostrarMensaje(`${metadata.nombre} añadido a la cadena`, 'success');
  }

  /**
   * Elimina un componente intermedio
   */
  eliminarComponenteIntermedio(index: number): void {
    const eliminado = this.componentesIntermedios.splice(index, 1)[0];
    this.reordenarComponentes();
    this.mostrarMensaje(`${eliminado.metadata.nombre} eliminado`, 'info');
  }

  /**
   * Mueve un componente hacia arriba
   */
  moverArriba(index: number): void {
    if (index > 0) {
      [this.componentesIntermedios[index - 1], this.componentesIntermedios[index]] = 
      [this.componentesIntermedios[index], this.componentesIntermedios[index - 1]];
      this.reordenarComponentes();
    }
  }

  /**
   * Mueve un componente hacia abajo
   */
  moverAbajo(index: number): void {
    if (index < this.componentesIntermedios.length - 1) {
      [this.componentesIntermedios[index], this.componentesIntermedios[index + 1]] = 
      [this.componentesIntermedios[index + 1], this.componentesIntermedios[index]];
      this.reordenarComponentes();
    }
  }

  /**
   * Elimina un emisor de la cadena
   */
  eliminarEmisor(index: number): void {
    const eliminado = this.emisoresSeleccionados[index];
    this.emisoresSeleccionados = this.emisoresSeleccionados.filter((_, i) => i !== index);
    this.reordenarEmisores();
    this.mostrarMensaje(`Emisor "${eliminado.metadata.nombre}" eliminado`, 'info');
    this.cdr.detectChanges();
  }

  /**
   * Reordena los emisores
   */
  private reordenarEmisores(): void {
    this.emisoresSeleccionados.forEach((emisor, index) => {
      emisor.orden = index;
    });
  }

  /**
   * Limpia todos los receptores seleccionados
   */
  limpiarReceptores(): void {
    this.receptoresSeleccionados = [];
  }

  /**
   * Limpia toda la cadena
   */
  limpiarCadena(): void {
    this.emisoresSeleccionados = [];
    this.componentesIntermedios = [];
    this.receptoresSeleccionados = [];
    this.mostrarMensaje('Cadena limpiada', 'info');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE PARÁMETROS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Abre el panel de configuración de un componente
   */
  editarComponente(elemento: ElementoCadena): void {
    // No permitir editar emisores manuales
    if (this.esEmisorManual(elemento)) {
      this.mostrarMensaje('El emisor manual no se puede editar', 'error');
      return;
    }
    
    this.componenteEditando = elemento;
    this.mostrarPanelConfiguracion = true;
  }

  /**
   * Cierra el panel de configuración
   */
  cerrarPanelConfiguracion(): void {
    this.componenteEditando = null;
    this.mostrarPanelConfiguracion = false;
  }

  /**
   * Actualiza un parámetro del componente que se está editando
   */
  actualizarParametro(clave: string, valor: unknown): void {
    if (this.componenteEditando) {
      this.componenteEditando.parametros[clave] = valor;
    }
  }

  /**
   * Obtiene el valor de un parámetro del componente editando
   */
  obtenerValorParametro(param: IParametroConfigurable): unknown {
    if (!this.componenteEditando) return param.valorDefecto;
    return this.componenteEditando.parametros[param.clave] ?? param.valorDefecto;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CODIFICADOR
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Cambia el codificador activo
   */
  cambiarCodificador(id: string): void {
    this.codificadorSeleccionadoId = id;
    this.registro.setCodificadorActivo(id);
    const codificador = this.codificadoresDisponibles.find(c => c.id === id);
    this.mostrarMensaje(`Codificador cambiado a: ${codificador?.nombre}`, 'success');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCCIÓN Y EJECUCIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verifica si la configuración es válida
   */
  esConfiguracionValida(): boolean {
    return this.emisoresSeleccionados.length > 0 && 
           this.receptoresSeleccionados.length > 0;
  }

  /**
   * Construye la configuración del sistema
   */
  construirConfiguracion(): ConfiguracionSistema {
    if (this.emisoresSeleccionados.length === 0 || this.receptoresSeleccionados.length === 0) {
      throw new Error('Configuración incompleta');
    }

    return {
      emisores: this.emisoresSeleccionados.map(emisor => ({
        tipo: TipoNodo.EMISOR,
        subtipo: emisor.metadata.subtipo,
        parametros: emisor.parametros
      })),
      componentesIntermedios: this.componentesIntermedios.map(comp => ({
        tipo: comp.metadata.tipoNodo,
        subtipo: comp.metadata.subtipo,
        parametros: comp.parametros
      })),
      receptores: this.receptoresSeleccionados.map(receptor => ({
        tipo: TipoNodo.RECEPTOR,
        subtipo: receptor.metadata.subtipo,
        parametros: receptor.parametros
      }))
    };
  }

  /**
   * Aplica la configuración y construye el sistema
   * @param navegar Si es true, navega al Panel de Control después de construir
   */
  aplicarConfiguracion(navegar: boolean = false): void {
    if (!this.esConfiguracionValida()) {
      this.mostrarMensaje('Debes seleccionar al menos un emisor y un receptor', 'error');
      return;
    }

    try {
      const config = this.construirConfiguracion();
      this.sistema.construirSistema(config);
      this.configuracionLista.emit(config);
      this.mostrarMensaje('Sistema construido correctamente', 'success');
      
      if (navegar) {
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 500); // Pequeño delay para ver el mensaje de éxito
      }
    } catch (error) {
      this.mostrarMensaje(`Error: ${error}`, 'error');
    }
  }

  /**
   * Aplica la configuración e inicia el sistema, navegando al Panel de Control
   */
  iniciarSistema(): void {
    this.aplicarConfiguracion(true); // Navegar al Panel de Control
    this.sistemaIniciado.emit();
  }

  /**
   * Construye el sistema y navega al Panel de Control
   */
  construirYNavegar(): void {
    this.aplicarConfiguracion(true);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSMISIÓN AUTOMÁTICA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Inicia la transmisión automática de mensajes
   */
  iniciarTransmisionAutomatica(): void {
    if (!this.esConfiguracionValida()) {
      this.mostrarMensaje('Debes configurar el sistema primero', 'error');
      return;
    }

    this.aplicarConfiguracion();

    // Iniciar transmisión
    this.sistema.iniciarTransmisionAutomatica(this.intervaloMs, (resultado) => {
      this.mensajesEnviados = this.sistema.mensajesAutomaticosEnviados;
      if (resultado.exito && resultado.mensaje) {
        this.ultimoMensaje = resultado.mensaje.contenido;
      }
    });

    this.transmisionActiva = true;
    this.mostrarMensaje('Transmisión automática iniciada', 'success');
  }

  /**
   * Detiene la transmisión automática
   */
  detenerTransmisionAutomatica(): void {
    this.sistema.detenerTransmisionAutomatica();
    this.transmisionActiva = false;
    this.mostrarMensaje('Transmisión automática detenida', 'info');
  }

  /**
   * Alterna el estado de la transmisión automática
   */
  toggleTransmisionAutomatica(): void {
    if (this.transmisionActiva) {
      this.detenerTransmisionAutomatica();
    } else {
      this.iniciarTransmisionAutomatica();
    }
  }

  /**
   * Cambia el intervalo de transmisión
   */
  cambiarIntervalo(nuevoIntervalo: number): void {
    this.intervaloMs = Math.max(1000, nuevoIntervalo);
    if (this.transmisionActiva) {
      this.sistema.setIntervaloTransmision(this.intervaloMs);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLANTILLAS PREDEFINIDAS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Carga una plantilla básica
   */
  cargarPlantillaBasica(): void {
    this.limpiarCadena();
    
    const emisor = this.emisoresDisponibles.find(e => e.subtipo === 'AUTOMATICO');
    const canal = this.canalesDisponibles.find(c => c.subtipo === 'TERRESTRE');
    const rele = this.relesDisponibles.find(r => r.subtipo === 'SIMPLE');
    const receptor = this.receptoresDisponibles.find(r => r.subtipo === 'CONSOLA');
    
    if (emisor) this.seleccionarEmisor(emisor);
    if (canal) this.agregarComponenteIntermedio(canal);
    if (rele) this.agregarComponenteIntermedio(rele);
    if (canal) this.agregarComponenteIntermedio(canal);
    if (rele) this.agregarComponenteIntermedio(rele);
    if (receptor) this.seleccionarReceptor(receptor);
    
    this.mostrarMensaje('Plantilla básica cargada', 'success');
  }

  /**
   * Carga una plantilla de larga distancia
   */
  cargarPlantillaLargaDistancia(): void {
    this.limpiarCadena();
    
    const emisor = this.emisoresDisponibles.find(e => e.subtipo === 'AUTOMATICO');
    const canalSubmarino = this.canalesDisponibles.find(c => c.subtipo === 'SUBMARINO');
    const canalTerrestre = this.canalesDisponibles.find(c => c.subtipo === 'TERRESTRE');
    const releInteligente = this.relesDisponibles.find(r => r.subtipo === 'INTELIGENTE');
    const releBateria = this.relesDisponibles.find(r => r.subtipo === 'BATERIA');
    const receptor = this.receptoresDisponibles.find(r => r.subtipo === 'MEMORIA');
    
    if (emisor) this.seleccionarEmisor(emisor);
    if (canalTerrestre) {
      const elem = this.crearElementoCadena(canalTerrestre);
      elem.parametros['distancia'] = 200;
      elem.orden = this.componentesIntermedios.length;
      this.componentesIntermedios.push(elem);
    }
    if (releInteligente) this.agregarComponenteIntermedio(releInteligente);
    if (canalSubmarino) {
      const elem = this.crearElementoCadena(canalSubmarino);
      elem.parametros['distancia'] = 500;
      elem.orden = this.componentesIntermedios.length;
      this.componentesIntermedios.push(elem);
    }
    if (releBateria) this.agregarComponenteIntermedio(releBateria);
    if (canalTerrestre) {
      const elem = this.crearElementoCadena(canalTerrestre);
      elem.parametros['distancia'] = 150;
      elem.orden = this.componentesIntermedios.length;
      this.componentesIntermedios.push(elem);
    }
    const releFinal = this.relesDisponibles.find(r => r.subtipo === 'SIMPLE');
    if (releFinal) this.agregarComponenteIntermedio(releFinal);
    if (receptor) this.seleccionarReceptor(receptor);
    
    this.mostrarMensaje('Plantilla larga distancia cargada', 'success');
  }

  /**
   * Carga una plantilla de pruebas
   */
  cargarPlantillaPruebas(): void {
    this.limpiarCadena();
    
    const emisor = this.emisoresDisponibles.find(e => e.subtipo === 'PRUEBAS');
    const canal = this.canalesDisponibles.find(c => c.subtipo === 'SIMULADO');
    const rele = this.relesDisponibles.find(r => r.subtipo === 'SIMPLE');
    const receptor = this.receptoresDisponibles.find(r => r.subtipo === 'MEMORIA');
    
    if (emisor) this.seleccionarEmisor(emisor);
    if (canal) this.agregarComponenteIntermedio(canal);
    if (rele) this.agregarComponenteIntermedio(rele);
    if (receptor) this.seleccionarReceptor(receptor);
    
    this.mostrarMensaje('Plantilla de pruebas cargada', 'success');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Crea un elemento de cadena a partir de metadata
   */
  private crearElementoCadena(metadata: IComponenteMetadata): ElementoCadena {
    const parametros: Record<string, unknown> = {};
    
    if (metadata.parametrosConfigurables) {
      for (const param of metadata.parametrosConfigurables) {
        parametros[param.clave] = param.valorDefecto;
      }
    }
    
    return {
      id: `comp-${++this.contadorId}`,
      metadata,
      parametros,
      orden: 0
    };
  }

  /**
   * Reordena los componentes intermedios
   */
  private reordenarComponentes(): void {
    this.componentesIntermedios.forEach((comp, index) => {
      comp.orden = index;
    });
  }

  /**
   * Muestra un mensaje de estado
   */
  private mostrarMensaje(texto: string, tipo: 'info' | 'success' | 'error'): void {
    this.mensajeEstado = texto;
    this.tipoMensaje = tipo;
    
    setTimeout(() => {
      this.mensajeEstado = '';
    }, 3000);
  }

  /**
   * Obtiene el icono del tipo de nodo
   */
  getIconoTipo(tipo: TipoNodo): string {
    switch (tipo) {
      case TipoNodo.EMISOR: return '📤';
      case TipoNodo.CANAL: return '📡';
      case TipoNodo.RELE: return '🔌';
      case TipoNodo.RECEPTOR: return '📥';
      default: return '❓';
    }
  }

  /**
   * Track by function para ngFor
   */
  trackByFn(index: number, item: ElementoCadena): string {
    return item.id;
  }

  /**
   * Track by function para emisores disponibles
   */
  trackByEmisorId(index: number, item: IComponenteMetadata): string {
    return item.id;
  }

  /**
   * Track by function para receptores disponibles
   */
  trackByReceptorId(index: number, item: IComponenteMetadata): string {
    return item.id;
  }

  /**
   * Obtiene el nombre del codificador seleccionado
   */
  getNombreCodificadorSeleccionado(): string {
    const cod = this.codificadoresDisponibles.find(c => c.id === this.codificadorSeleccionadoId);
    return cod?.nombre || this.codificadorSeleccionadoId;
  }

  /**
   * Verifica si un emisor es de tipo manual
   */
  esEmisorManual(elemento: ElementoCadena | null): boolean {
    return elemento?.metadata?.subtipo === 'MANUAL';
  }

  /**
   * Verifica si un emisor está seleccionado
   */
  estaEmisorSeleccionado(emisorId: string): boolean {
    return this.emisoresSeleccionados.some(e => e.metadata.id === emisorId);
  }

  /**
   * Cuenta cuántas veces se ha añadido un emisor específico
   */
  contarEmisores(emisorId: string): number {
    return this.emisoresSeleccionados.filter(e => e.metadata.id === emisorId).length;
  }

}
