import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { 
  SistemaCoordinadorService, 
  ConfiguracionSistema,
  ResultadoEnvio,
  InformacionSistema
} from '../../../core/services';
import { TipoNodo } from '../../../core/interfaces';
import { IEntradaMemoria } from '../../../receptores';

@Component({
  selector: 'app-panel-control',
  templateUrl: './panel-control.component.html',
  styleUrls: ['./panel-control.component.scss']
})
export class PanelControlComponent implements OnInit, OnDestroy {
  
  mensajeForm: FormGroup;
  
  infoSistema: InformacionSistema | null = null;
  sistemaConfigurado = false;
  
  ultimoResultado: ResultadoEnvio | null = null;
  transmitiendo = false;
  
  configuracionActual: ConfiguracionSistema | null = null;
  
  emisorSeleccionadoIndex = 0;
  
  tiposEmisor = ['MANUAL', 'AUTOMATICO', 'PRUEBAS'];
  tiposCanal = ['TERRESTRE', 'SUBMARINO', 'SIMULADO'];
  tiposRele = ['SIMPLE', 'BATERIA', 'INTELIGENTE'];
  tiposReceptor = ['CONSOLA', 'FICHERO', 'MEMORIA'];

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSMISIÓN AUTOMÁTICA
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** Estado de transmisión automática por emisor (índice del emisor -> estado) */
  transmisionesActivas: Map<number, boolean> = new Map();
  
  /** Timers de transmisión automática por emisor (índice del emisor -> timer) */
  timersPorEmisor: Map<number, ReturnType<typeof setInterval>> = new Map();
  
  /** Intervalo entre mensajes automáticos por emisor (índice del emisor -> intervalo) */
  intervalosPorEmisor: Map<number, number> = new Map();
  
  /** Contador de mensajes enviados automáticamente por emisor */
  mensajesAutomaticosPorEmisor: Map<number, number> = new Map();
  
  /** Último mensaje enviado automáticamente por emisor */
  ultimosMensajesAutomaticos: Map<number, string> = new Map();
  
  /** Opciones de intervalo predefinidas */
  opcionesIntervalo = [
    { valor: 1000, etiqueta: '1 segundo' },
    { valor: 2000, etiqueta: '2 segundos' },
    { valor: 3000, etiqueta: '3 segundos' },
    { valor: 5000, etiqueta: '5 segundos' },
    { valor: 10000, etiqueta: '10 segundos' },
    { valor: 15000, etiqueta: '15 segundos' },
    { valor: 30000, etiqueta: '30 segundos' }
  ];

  mostrarModalMemoria: boolean = false;
  memoriaActual: IEntradaMemoria[] = [];
  receptorMemoriaActual: number = -1;

  private routerSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private sistemaCoordinador: SistemaCoordinadorService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.mensajeForm = this.fb.group({
      contenido: ['', [Validators.required, Validators.minLength(1)]],
      remitente: ['Operador', Validators.required],
      destinatario: ['Receptor', Validators.required],
      emisorSeleccionado: [0, Validators.required]
    });
  }

  ngOnInit(): void {
    this.sincronizarConSistema();
    
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/' || event.urlAfterRedirects === '/') {
          this.sincronizarConSistema();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    
    this.timersPorEmisor.forEach((timer, indice) => {
      clearInterval(timer);
    });
    this.timersPorEmisor.clear();
  }

  /**
   * Sincroniza el estado local con el sistema coordinador
   * Si ya hay un sistema construido, lo usa; si no, configura uno por defecto
   */
  private sincronizarConSistema(): void {
    const estadoActual = this.sistemaCoordinador.obtenerEstado();
    
    const tieneEmisores = (estadoActual.emisores && estadoActual.emisores.length > 0) || estadoActual.emisor;
    if (estadoActual.estado === 'LISTO' && tieneEmisores) {
      this.sistemaConfigurado = true;
      this.infoSistema = estadoActual;
      
      this.configuracionActual = this.reconstruirConfiguracionDesdeEstado(estadoActual);
      
      this.formulariosEmisores.clear();
      const todosEmisores = this.todosLosEmisores;
      todosEmisores.forEach(emisor => {
        if (emisor.esManual) {
          this.obtenerFormularioEmisor(emisor.index);
        }
        if (emisor.esAutomatico || emisor.esPruebas) {
          if (!this.intervalosPorEmisor.has(emisor.index)) {
            this.intervalosPorEmisor.set(emisor.index, 3000);
          }
        }
      });
      
      const emisoresManuales = this.emisoresManuales;
      if (emisoresManuales.length > 0) {
        this.mensajeForm.patchValue({ emisorSeleccionado: emisoresManuales[0].index });
      }
      
      this.actualizarEstado();
    } else {
      this.configurarSistemaPorDefecto();
    }
  }

  /**
   * Reconstruye la configuración basándose en el estado del sistema
   */
  private reconstruirConfiguracionDesdeEstado(estado: InformacionSistema): ConfiguracionSistema {
    const emisores = estado.emisores && estado.emisores.length > 0
      ? estado.emisores.map(e => ({
          tipo: TipoNodo.EMISOR,
          subtipo: this.extraerSubtipo(e.nombre)
        }))
      : estado.emisor
        ? [{
            tipo: TipoNodo.EMISOR,
            subtipo: this.extraerSubtipo(estado.emisor.nombre)
          }]
        : [{ tipo: TipoNodo.EMISOR, subtipo: 'AUTOMATICO' }];

    const receptores = estado.receptores && estado.receptores.length > 0
      ? estado.receptores.map(r => ({
          tipo: TipoNodo.RECEPTOR,
          subtipo: this.extraerSubtipo(r.nombre)
        }))
      : estado.receptor
        ? [{
            tipo: TipoNodo.RECEPTOR,
            subtipo: this.extraerSubtipo(estado.receptor.nombre)
          }]
        : [{ tipo: TipoNodo.RECEPTOR, subtipo: 'CONSOLA' }];

    return {
      emisores,
      componentesIntermedios: estado.componentesIntermedios.map(comp => ({
        tipo: comp.tipo,
        subtipo: this.extraerSubtipo(comp.nombre),
        parametros: comp.parametros || undefined
      })),
      receptores
    };
  }

  /**
   * Extrae el subtipo del nombre del componente
   */
  private extraerSubtipo(nombre: string): string {
    const mapeos: Record<string, string> = {
      'Emisor Manual': 'MANUAL',
      'Emisor Automático': 'AUTOMATICO',
      'Emisor de Pruebas': 'PRUEBAS',
      'Cable Terrestre': 'TERRESTRE',
      'Canal Terrestre': 'TERRESTRE', // Por compatibilidad
      'Cable Submarino': 'SUBMARINO',
      'Canal Submarino': 'SUBMARINO', // Por compatibilidad
      'Enlace Simulado': 'SIMULADO',
      'Canal Simulado': 'SIMULADO', // Por compatibilidad
      'Relé Simple': 'SIMPLE',
      'Relé con Batería': 'BATERIA',
      'Relé Inteligente': 'INTELIGENTE',
      'Receptor Consola': 'CONSOLA',
      'Receptor Fichero': 'FICHERO',
      'Receptor Memoria': 'MEMORIA'
    };
    
    return mapeos[nombre] || nombre.toUpperCase();
  }

  /**
   * Configura el sistema con valores por defecto
   */
  configurarSistemaPorDefecto(): void {
    const config: ConfiguracionSistema = {
      emisores: [{ tipo: TipoNodo.EMISOR, subtipo: 'AUTOMATICO' }],
      componentesIntermedios: [
        { tipo: TipoNodo.CANAL, subtipo: 'TERRESTRE', parametros: { distancia: 100 } },
        { tipo: TipoNodo.RELE, subtipo: 'SIMPLE' },
        { tipo: TipoNodo.CANAL, subtipo: 'TERRESTRE', parametros: { distancia: 150 } }
      ],
      receptores: [{ tipo: TipoNodo.RECEPTOR, subtipo: 'CONSOLA' }]
    };
    
    this.aplicarConfiguracion(config);
  }

  /**
   * Aplica una configuración al sistema
   */
  aplicarConfiguracion(config: ConfiguracionSistema): void {
    try {
      this.timersPorEmisor.forEach((timer, indice) => {
        clearInterval(timer);
        this.transmisionesActivas.set(indice, false);
      });
      this.timersPorEmisor.clear();
      
      this.sistemaCoordinador.construirSistema(config);
      this.configuracionActual = config;
      this.sistemaConfigurado = true;
      
      this.actualizarEstado();
      
      this.formulariosEmisores.clear();
      const todosEmisores = this.todosLosEmisores;
      todosEmisores.forEach(emisor => {
        if (emisor.esManual) {
          this.obtenerFormularioEmisor(emisor.index);
        }
        if (emisor.esAutomatico || emisor.esPruebas) {
          if (!this.intervalosPorEmisor.has(emisor.index)) {
            this.intervalosPorEmisor.set(emisor.index, 3000);
          }
        }
      });
      
      const emisoresManuales = this.emisoresManuales;
      if (emisoresManuales.length > 0) {
        this.mensajeForm.patchValue({ emisorSeleccionado: emisoresManuales[0].index });
      }
      
      this.cdr.detectChanges();
      this.cdr.markForCheck();
      
      setTimeout(() => {
        this.actualizarEstado();
        this.cdr.detectChanges();
      }, 100);
    } catch (error) {
      this.sistemaConfigurado = false;
    }
  }

  /**
   * Envía el mensaje actual
   */
  enviarMensaje(indiceEmisor?: number): void {
    if (!this.mensajeForm.valid || !this.sistemaConfigurado) {
      return;
    }

    this.transmitiendo = true;
    const { contenido, remitente, destinatario, emisorSeleccionado } = this.mensajeForm.value;
    const indice = indiceEmisor !== undefined ? indiceEmisor : (emisorSeleccionado || 0);
    
    setTimeout(() => {
      this.ultimoResultado = this.sistemaCoordinador.enviarMensaje(
        contenido, 
        remitente, 
        destinatario,
        indice
      );
      
      this.transmitiendo = false;
      this.actualizarEstado();
      
      if (this.ultimoResultado.exito) {
        this.mensajeForm.patchValue({ contenido: '' });
      }
    }, 100);
  }

  /**
   * Crea un formulario para un emisor específico
   */
  crearFormularioEmisor(indiceEmisor: number): FormGroup {
    return this.fb.group({
      contenido: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  /**
   * Almacena los formularios de cada emisor
   */
  formulariosEmisores: Map<number, FormGroup> = new Map();

  /**
   * Obtiene o crea el formulario para un emisor específico
   */
  obtenerFormularioEmisor(indiceEmisor: number): FormGroup {
    if (!this.formulariosEmisores.has(indiceEmisor)) {
      this.formulariosEmisores.set(indiceEmisor, this.crearFormularioEmisor(indiceEmisor));
    }
    const form = this.formulariosEmisores.get(indiceEmisor);
    if (!form) {
      // Si por alguna razón no existe, crear uno nuevo
      const nuevoForm = this.crearFormularioEmisor(indiceEmisor);
      this.formulariosEmisores.set(indiceEmisor, nuevoForm);
      return nuevoForm;
    }
    return form;
  }

  /**
   * Envía mensaje desde un emisor específico
   */
  enviarMensajeDesdeEmisor(indiceEmisor: number): void {
    const form = this.obtenerFormularioEmisor(indiceEmisor);
    if (!form.valid || !this.sistemaConfigurado) {
      return;
    }

    this.transmitiendo = true;
    const { contenido } = form.value;
    const remitente = 'Operador';
    const destinatario = 'Receptor';
    
    setTimeout(() => {
      this.ultimoResultado = this.sistemaCoordinador.enviarMensaje(
        contenido, 
        remitente, 
        destinatario,
        indiceEmisor
      );
      
      this.transmitiendo = false;
      this.actualizarEstado();
      
      if (this.ultimoResultado.exito) {
        form.patchValue({ contenido: '' });
      }
    }, 100);
  }

  /**
   * Obtiene los emisores manuales disponibles
   */
  get emisoresManuales(): Array<{ nombre: string; index: number }> {
    if (!this.infoSistema || !this.configuracionActual) return [];
    
    const emisores = this.infoSistema.emisores || (this.infoSistema.emisor ? [this.infoSistema.emisor] : []);
    const emisoresConfig = this.configuracionActual.emisores || 
      (this.configuracionActual.emisor ? [this.configuracionActual.emisor] : []);
    
    return emisores
      .map((e, index) => ({ nombre: e.nombre, index }))
      .filter((_, index) => {
        if (index < emisoresConfig.length) {
          return emisoresConfig[index].subtipo === 'MANUAL';
        }
        return false;
      });
  }

  /**
   * Obtiene todos los emisores con su información completa
   */
  get todosLosEmisores(): Array<{ nombre: string; index: number; esManual: boolean; esAutomatico: boolean; esPruebas: boolean }> {
    if (!this.infoSistema || !this.configuracionActual) {
      return [];
    }
    
    try {
      const emisores = this.infoSistema.emisores || (this.infoSistema.emisor ? [this.infoSistema.emisor] : []);
      const emisoresConfig = this.configuracionActual.emisores || 
        (this.configuracionActual.emisor ? [this.configuracionActual.emisor] : []);
      
      if (!emisores || emisores.length === 0) {
        return [];
      }
      
      return emisores.map((e, index) => {
        const subtipo = index < emisoresConfig.length ? emisoresConfig[index].subtipo : 'AUTOMATICO';
        return {
          nombre: e.nombre || 'Emisor',
          index,
          esManual: subtipo === 'MANUAL',
          esAutomatico: subtipo === 'AUTOMATICO',
          esPruebas: subtipo === 'PRUEBAS'
        };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Verifica si hay emisores automáticos
   */
  get hayEmisoresAutomaticos(): boolean {
    return this.todosLosEmisores.some(e => e.esAutomatico);
  }

  /**
   * Obtiene el primer índice de emisor automático
   */
  get primerEmisorAutomaticoIndex(): number {
    const automatico = this.todosLosEmisores.find(e => e.esAutomatico);
    return automatico ? automatico.index : -1;
  }

  /**
   * Obtiene el primer índice de emisor de pruebas
   */
  get primerEmisorPruebasIndex(): number {
    const pruebas = this.todosLosEmisores.find(e => e.esPruebas);
    return pruebas ? pruebas.index : -1;
  }

  /**
   * Obtiene el número de emisores de pruebas
   */
  get numeroEmisoresPruebas(): number {
    return this.todosLosEmisores.filter(e => e.esPruebas).length;
  }

  /**
   * Obtiene el número de emisores automáticos
   */
  get numeroEmisoresAutomaticos(): number {
    return this.todosLosEmisores.filter(e => e.esAutomatico).length;
  }

  /**
   * Obtiene el número total de emisores
   */
  get numeroTotalEmisores(): number {
    return this.todosLosEmisores.length;
  }

  /**
   * TrackBy function para el ngFor de emisores
   */
  trackByEmisorIndex(index: number, emisor: { nombre: string; index: number; esManual: boolean; esAutomatico: boolean }): number {
    return emisor.index;
  }

  /**
   * TrackBy function para el ngFor de receptores
   */
  trackByReceptorIndex(index: number, receptor: { nombre: string; index: number; tipo: string }): number {
    return receptor.index;
  }

  /**
   * Obtiene todos los receptores con su información
   */
  get todosLosReceptores(): Array<{ nombre: string; index: number; tipo: string; activo: boolean; mensajesRecibidos: number }> {
    if (!this.infoSistema || !this.sistemaConfigurado) {
      return [];
    }
    
    const receptores = this.infoSistema.receptores || (this.infoSistema.receptor ? [this.infoSistema.receptor] : []);
    const receptoresConfig = this.configuracionActual?.receptores || 
      (this.configuracionActual?.receptor ? [this.configuracionActual.receptor] : []);
    
    return receptores.map((r, index) => {
      const subtipo = index < receptoresConfig.length ? receptoresConfig[index].subtipo : 'CONSOLA';
      return {
        nombre: r.nombre || 'Receptor',
        index,
        tipo: subtipo,
        activo: r.activo,
        mensajesRecibidos: r.mensajesRecibidos
      };
    });
  }

  /**
   * Obtiene los mensajes recibidos por un receptor específico
   * No muestra mensajes en la página principal - solo en consola o modal de memoria
   */
  obtenerMensajesReceptor(indiceReceptor: number): any[] {
    return [];
  }
  
  /**
   * Verifica si un receptor es de tipo memoria
   */
  esReceptorMemoria(indiceReceptor: number): boolean {
    const receptorInfo = this.todosLosReceptores.find(r => r.index === indiceReceptor);
    return receptorInfo?.tipo === 'MEMORIA';
  }
  
  /**
   * Abre el modal de consulta de memoria
   */
  consultarMemoria(indiceReceptor: number): void {
    const receptor = this.sistemaCoordinador.obtenerReceptorPorIndice(indiceReceptor);
    if (!receptor || !('obtenerMemoriaCompleta' in receptor)) {
      return;
    }
    
    const receptorMemoria = receptor as any;
    const memoriaReceptor = receptorMemoria.obtenerMemoriaCompleta();
    
    // Filtrar solo mensajes recibidos correctos (sin errores ni mensajes enviados)
    const mensajesRecibidos = memoriaReceptor
      .filter((e: IEntradaMemoria) => e.tipo === 'mensaje')
      .sort((a: IEntradaMemoria, b: IEntradaMemoria) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const memoriaCompleta = mensajesRecibidos;
    
    this.memoriaActual = memoriaCompleta;
    this.receptorMemoriaActual = indiceReceptor;
    this.mostrarModalMemoria = true;
  }
  
  /**
   * Cierra el modal de memoria
   */
  cerrarModalMemoria(): void {
    this.mostrarModalMemoria = false;
    this.memoriaActual = [];
    this.receptorMemoriaActual = -1;
  }
  
  /**
   * Obtiene el número de mensajes recibidos en la memoria actual
   */
  get totalMensajesMemoria(): number {
    return this.memoriaActual.filter(e => e.tipo === 'mensaje').length;
  }
  
  /**
   * Obtiene el número de errores en la memoria actual
   */
  get totalErroresMemoria(): number {
    return this.memoriaActual.filter(e => e.tipo === 'error').length;
  }
  
  /**
   * Obtiene el número de mensajes enviados en la memoria actual
   */
  get totalMensajesEnviadosMemoria(): number {
    return this.memoriaActual.filter(e => e.tipo === 'enviado').length;
  }
  
  /**
   * Verifica si una entrada es un mensaje recibido
   */
  esMensaje(entrada: IEntradaMemoria): boolean {
    return entrada.tipo === 'mensaje';
  }
  
  /**
   * Verifica si una entrada es un error
   */
  esError(entrada: IEntradaMemoria): boolean {
    return entrada.tipo === 'error';
  }
  
  /**
   * Verifica si una entrada es un mensaje enviado
   */
  esMensajeEnviado(entrada: IEntradaMemoria): boolean {
    return entrada.tipo === 'enviado';
  }
  
  /**
   * Obtiene el mensaje recibido de una entrada
   */
  obtenerMensaje(entrada: IEntradaMemoria): any {
    return entrada.tipo === 'mensaje' ? entrada.datos : null;
  }
  
  /**
   * Obtiene el error de una entrada
   */
  obtenerError(entrada: IEntradaMemoria): any {
    return entrada.tipo === 'error' ? entrada.datos : null;
  }
  
  /**
   * Obtiene el mensaje enviado de una entrada
   */
  obtenerMensajeEnviado(entrada: IEntradaMemoria): any {
    return entrada.tipo === 'enviado' ? entrada.datos : null;
  }

  /**
   * Descarga el fichero de un receptor FICHERO
   */
  descargarFicheroReceptor(indiceReceptor: number): void {
    const receptor = this.sistemaCoordinador.obtenerReceptorPorIndice(indiceReceptor);
    if (!receptor) {
      return;
    }

    if ('exportarFichero' in receptor) {
      const fichero = (receptor as any).exportarFichero();
      
      const blob = new Blob([fichero.contenido], { type: fichero.tipo });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fichero.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }

  /**
   * Actualiza el estado del sistema
   */
  actualizarEstado(): void {
    this.infoSistema = this.sistemaCoordinador.obtenerEstado();
    if (this.cdr) {
      this.cdr.markForCheck();
    }
  }

  /**
   * Reinicia el sistema
   */
  reiniciarSistema(): void {
    this.sistemaCoordinador.limpiarSistema();
    this.sistemaConfigurado = false;
    this.ultimoResultado = null;
    this.infoSistema = null;
  }

  /**
   * Verifica si algún emisor seleccionado es manual
   * La ventana de enviar mensaje solo aparece con emisor manual
   */
  get esEmisorManual(): boolean {
    if (!this.configuracionActual) return false;
    if (this.configuracionActual.emisores) {
      return this.configuracionActual.emisores.some(e => e.subtipo === 'MANUAL');
    }
    return this.configuracionActual.emisor?.subtipo === 'MANUAL';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS DE TRANSMISIÓN AUTOMÁTICA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene el estado de transmisión automática de un emisor
   */
  esTransmisionActiva(indiceEmisor: number): boolean {
    return this.transmisionesActivas.get(indiceEmisor) || false;
  }

  /**
   * Obtiene el intervalo configurado para un emisor
   */
  obtenerIntervaloEmisor(indiceEmisor: number): number {
    return this.intervalosPorEmisor.get(indiceEmisor) || 3000;
  }

  /**
   * Obtiene el contador de mensajes de un emisor
   */
  obtenerMensajesEnviados(indiceEmisor: number): number {
    return this.mensajesAutomaticosPorEmisor.get(indiceEmisor) || 0;
  }

  /**
   * Obtiene el último mensaje de un emisor
   */
  obtenerUltimoMensaje(indiceEmisor: number): string {
    return this.ultimosMensajesAutomaticos.get(indiceEmisor) || '';
  }

  /**
   * Inicia la transmisión automática para un emisor específico
   * Cada emisor tiene su propio timer independiente
   */
  iniciarTransmisionAutomatica(indiceEmisor: number): void {
    if (!this.sistemaConfigurado) {
      return;
    }

    if (this.timersPorEmisor.has(indiceEmisor)) {
      return;
    }

    const intervalo = this.obtenerIntervaloEmisor(indiceEmisor);
    
    this.enviarMensajeAutomaticoParaEmisor(indiceEmisor);

    const timer = setInterval(() => {
      if (this.transmisionesActivas.get(indiceEmisor)) {
        this.enviarMensajeAutomaticoParaEmisor(indiceEmisor);
      }
    }, intervalo);

    this.timersPorEmisor.set(indiceEmisor, timer);
    this.transmisionesActivas.set(indiceEmisor, true);
  }

  /**
   * Envía un mensaje automático para un emisor específico
   */
  private enviarMensajeAutomaticoParaEmisor(indiceEmisor: number): void {
    if (!this.infoSistema || !this.configuracionActual) {
      return;
    }

    const emisores = this.infoSistema.emisores || (this.infoSistema.emisor ? [this.infoSistema.emisor] : []);
    if (indiceEmisor >= emisores.length) {
      return;
    }

    const emisor = emisores[indiceEmisor];
    const emisoresConfig = this.configuracionActual.emisores || 
      (this.configuracionActual.emisor ? [this.configuracionActual.emisor] : []);
    
    if (indiceEmisor >= emisoresConfig.length) {
      return;
    }

    const subtipo = emisoresConfig[indiceEmisor].subtipo;
    const esPruebas = subtipo === 'PRUEBAS';
    
    let textoNatural: string;
    if (esPruebas) {
      textoNatural = this.generarLetraSimple();
    } else {
      textoNatural = this.generarMensajeAleatorio();
    }

    const mensajeCodificado = this.sistemaCoordinador.convertirALenguajeCodificador(textoNatural);

    const resultado = this.sistemaCoordinador.enviarMensaje(
      mensajeCodificado,
      'SISTEMA_AUTO',
      'RECEPTOR',
      indiceEmisor
    );

    const mensajesActuales = this.obtenerMensajesEnviados(indiceEmisor);
    this.mensajesAutomaticosPorEmisor.set(indiceEmisor, mensajesActuales + 1);
    
    if (resultado.exito && resultado.mensaje) {
      this.ultimosMensajesAutomaticos.set(indiceEmisor, resultado.mensaje.contenido);
    }
    
    this.ultimoResultado = resultado;
    this.actualizarEstado();
    this.cdr.detectChanges();
  }

  /**
   * Genera una letra simple aleatoria (A-Z)
   */
  private generarLetraSimple(): string {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const indiceAleatorio = Math.floor(Math.random() * letras.length);
    return letras[indiceAleatorio];
  }

  /**
   * Genera un mensaje aleatorio
   */
  private generarMensajeAleatorio(): string {
    const mensajes = [
      'SOS',
      'TEST',
      'HELLO',
      'MESSAGE',
      'TRANSMISSION',
      'SIGNAL',
      'DATA',
      'INFO',
      'REPORT',
      'STATUS'
    ];
    return mensajes[Math.floor(Math.random() * mensajes.length)];
  }

  /**
   * Detiene la transmisión automática de un emisor específico
   */
  detenerTransmisionAutomatica(indiceEmisor: number): void {
    const timer = this.timersPorEmisor.get(indiceEmisor);
    if (timer) {
      clearInterval(timer);
      this.timersPorEmisor.delete(indiceEmisor);
    }
    
    this.transmisionesActivas.set(indiceEmisor, false);
  }

  /**
   * Alterna el estado de la transmisión automática para un emisor específico
   */
  toggleTransmisionAutomatica(indiceEmisor: number): void {
    if (this.esTransmisionActiva(indiceEmisor)) {
      this.detenerTransmisionAutomatica(indiceEmisor);
    } else {
      this.iniciarTransmisionAutomatica(indiceEmisor);
    }
  }

  /**
   * Cambia el intervalo de transmisión automática para un emisor específico
   */
  cambiarIntervalo(nuevoIntervalo: number | string, indiceEmisor: number): void {
    const intervalo = typeof nuevoIntervalo === 'string' ? Number(nuevoIntervalo) : nuevoIntervalo;
    this.intervalosPorEmisor.set(indiceEmisor, intervalo);
    
    if (this.esTransmisionActiva(indiceEmisor)) {
      const timerAnterior = this.timersPorEmisor.get(indiceEmisor);
      if (timerAnterior) {
        clearInterval(timerAnterior);
      }
      
      // Crear nuevo timer con el nuevo intervalo
      const nuevoTimer = setInterval(() => {
        if (this.transmisionesActivas.get(indiceEmisor)) {
          this.enviarMensajeAutomaticoParaEmisor(indiceEmisor);
        }
      }, intervalo);
      
      this.timersPorEmisor.set(indiceEmisor, nuevoTimer);
    }
  }
}
