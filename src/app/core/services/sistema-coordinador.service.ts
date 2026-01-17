import { Injectable } from '@angular/core';
import { 
  IEmisor, ICanal, IRele, IReceptor, 
  IMensaje, ISenal, IResultadoTransmision,
  TipoNodo, ConfiguracionNodo, ICodificador,
  IErrorTransmision, TipoCodificador,
  IComponenteMetadata, ICatalogoComponentes
} from '../interfaces';
import { Mensaje } from '../models/mensaje.model';
import { RegistroComponentesService } from './registro-componentes.service';
import { Component } from '../components/component';
import {
  EstadoSistema,
  ConfiguracionSistema,
  ComponenteCadena,
  RegistroTransmision,
  ResultadoEnvio,
  InfoBateria,
  ComponenteIntermedioInfo,
  InformacionSistema
} from './sistema-coordinador.interfaces';

/**
 * Sistema Coordinador
 * 
 * Factory Pattern via RegistroComponentesService
 * Strategy Pattern para codificación intercambiable
 */
@Injectable({
  providedIn: 'root'
})
export class SistemaCoordinadorService {
  
  private cadena: ComponenteCadena[] = [];
  private emisores: IEmisor[] = [];
  private receptores: IReceptor[] = [];
  private emisor: IEmisor | null = null;
  private receptor: IReceptor | null = null;
  private historialTransmisiones: RegistroTransmision[] = [];
  private estadoSistema: EstadoSistema = EstadoSistema.DETENIDO;
  private configuracionActual: ConfiguracionSistema | null = null;
  private registroErroresGlobal: IErrorTransmision[] = [];
  private timerAutomatico: ReturnType<typeof setInterval> | null = null;
  private _transmisionAutomaticaActiva: boolean = false;
  private intervaloTransmision: number = 3000;
  private contadorMensajesAuto: number = 0;
  private onMensajeEnviado?: (resultado: ResultadoEnvio) => void;
  private readonly mensajesAutomaticos: string[] = [
    'SOS', 'HOLA MUNDO', 'MENSAJE URGENTE', 'CONFIRMAR RECEPCION',
    'TRANSMISION OK', 'FIN DE MENSAJE', 'ESPERANDO RESPUESTA',
    'RECIBIDO', 'ENTENDIDO', 'REPETIR MENSAJE', 'LISTO PARA RECIBIR',
    'INICIO TRANSMISION', 'PRUEBA DE LINEA', 'TODO CORRECTO',
    'AYUDA', 'EMERGENCIA', 'STOP', 'CONTINUAR', 'ESPERE', 'ADELANTE',
    'BUENOS DIAS', 'BUENAS NOCHES', 'GRACIAS', 'DE ACUERDO',
    'NEGATIVO', 'AFIRMATIVO', 'CAMBIO', 'CAMBIO Y CORTO'
  ];
  private readonly palabrasAleatorias: string[] = [
    'ALFA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL',
    'INDIA', 'JULIET', 'KILO', 'LIMA', 'MIKE', 'NOVEMBER', 'OSCAR', 'PAPA',
    'QUEBEC', 'ROMEO', 'SIERRA', 'TANGO', 'UNIFORM', 'VICTOR', 'WHISKEY',
    'XRAY', 'YANKEE', 'ZULU', 'NORTE', 'SUR', 'ESTE', 'OESTE'
  ];

  constructor(private registro: RegistroComponentesService) {
  }

  /**
   * STRATEGY PATTERN: Permite cambiar el sistema de codificación
   * sin modificar emisores ni receptores
   */
  setCodificador(tipo: TipoCodificador | string | ICodificador): void {
    if (typeof tipo === 'object') {
      this.registro.setCodificadorActivo(tipo);
    } else {
      const idCodificador = this.mapearTipoCodificadorAId(tipo);
      this.registro.setCodificadorActivo(idCodificador);
    }
    
    const codificadorActivo = this.registro.getCodificadorActivo();
    
    this.emisores.forEach(emisor => {
      (emisor as any).setCodificador?.(codificadorActivo);
    });
    if (this.emisor) {
      (this.emisor as any).setCodificador?.(codificadorActivo);
    }
    
    this.receptores.forEach(receptor => {
      (receptor as any).setCodificador?.(codificadorActivo);
    });
    if (this.receptor) {
      (this.receptor as any).setCodificador?.(codificadorActivo);
    }
  }

  private mapearTipoCodificadorAId(tipo: TipoCodificador | string): string {
    switch (tipo) {
      case TipoCodificador.MORSE:
      case 'MORSE':
        return 'codificador-morse';
      case TipoCodificador.BAUDOT:
      case 'BAUDOT':
        return 'codificador-baudot';
      case TipoCodificador.BINARIO:
      case TipoCodificador.ASCII:
      case 'BINARIO':
      case 'ASCII':
        return 'codificador-binario';
      default:
        return 'codificador-morse';
    }
  }

  getCodificador(): ICodificador {
    return this.registro.getCodificadorActivo();
  }

  construirSistema(configuracion: ConfiguracionSistema): void {
    this.limpiarSistema();
    this.configuracionActual = { ...configuracion };
    const emisoresConfig = configuracion.emisores || (configuracion.emisor ? [configuracion.emisor] : []);
    
    this.emisores = [];
    for (const config of emisoresConfig) {
      const emisor = this.crearComponente(config) as IEmisor;
      this.emisores.push(emisor);
    }
    
    if (this.emisores.length > 0) {
      this.emisor = this.emisores[0];
    }
    
    this.cadena = [];
    let componenteAnterior: Component | null = null;
    
    for (const config of configuracion.componentesIntermedios) {
      const componente = this.crearComponente(config) as ICanal | IRele;
      this.cadena.push({ tipo: config.tipo, componente });
      
      if (componenteAnterior) {
        (componenteAnterior as any).setSiguiente(componente as any);
      }
      componenteAnterior = componente as any;
    }
    
    const receptoresConfig = configuracion.receptores || (configuracion.receptor ? [configuracion.receptor] : []);
    
    this.receptores = [];
    for (const config of receptoresConfig) {
      const receptor = this.crearComponente(config) as IReceptor;
      this.receptores.push(receptor);
    }
    
    if (this.receptores.length > 0) {
      this.receptor = this.receptores[0];
    }
    
    this.estadoSistema = EstadoSistema.LISTO;
  }

  obtenerConfiguracionActual(): ConfiguracionSistema | null {
    return this.configuracionActual ? { ...this.configuracionActual } : null;
  }

  /**
   * Factory method para crear componentes usando el RegistroComponentesService
   */
  private crearComponente(config: ConfiguracionNodo): IEmisor | ICanal | IRele | IReceptor {
    const { tipo, subtipo, parametros } = config;
    
    switch (tipo) {
      case TipoNodo.EMISOR:
        return this.registro.crearEmisor(subtipo, parametros);
      case TipoNodo.CANAL:
        return this.registro.crearCanal(subtipo, parametros);
      case TipoNodo.RELE:
        return this.registro.crearRele(subtipo, parametros);
      case TipoNodo.RECEPTOR:
        return this.registro.crearReceptor(subtipo, parametros);
      default:
        throw new Error(`Tipo de componente no reconocido: ${tipo}`);
    }
  }

  enviarMensaje(contenido: string, remitente: string, destinatario: string, indiceEmisor: number = 0): ResultadoEnvio {
    if (this.estadoSistema !== EstadoSistema.LISTO) {
      return { exito: false, error: 'El sistema no está listo. Configure el sistema primero.' };
    }

    const emisorAUsar = this.emisores.length > 0 
      ? (indiceEmisor >= 0 && indiceEmisor < this.emisores.length ? this.emisores[indiceEmisor] : this.emisores[0])
      : this.emisor;

    if (!emisorAUsar || (!this.receptor && this.receptores.length === 0)) {
      return { exito: false, error: 'Sistema incompleto: falta emisor o receptor' };
    }

    const todosLosReceptores: IReceptor[] = [];
    if (this.receptores.length > 0) {
      todosLosReceptores.push(...this.receptores);
    }
    if (this.receptor && !todosLosReceptores.includes(this.receptor)) {
      todosLosReceptores.push(this.receptor);
    }

    if (todosLosReceptores.length === 0) {
      return { exito: false, error: 'Sistema incompleto: falta receptor' };
    }

    const inicioTransmision = Date.now();

    const mensaje = new Mensaje(contenido, remitente, destinatario);
    let componenteActual = '';

    try {
      componenteActual = emisorAUsar.nombre;
      emisorAUsar.encender();
      const senal = emisorAUsar.codificarMensaje(mensaje);
      
      const codificador = this.registro.getCodificadorActivo();
      let representacionVisual = '';
      
      if (codificador) {
        representacionVisual = codificador.obtenerRepresentacion(contenido);
      }
      
      if (!emisorAUsar.sendPulseOk(senal)) {
        throw new Error(`Verificación de pulso fallida en ${componenteActual}`);
      }
      
      let primerComponenteIntermedio: Component | null = null;
      if (this.cadena.length > 0) {
        primerComponenteIntermedio = this.cadena[0].componente as any;
        (emisorAUsar as any).setSiguiente(primerComponenteIntermedio);
      }
      
      let resultado: IResultadoTransmision;
      if (primerComponenteIntermedio) {
        resultado = (emisorAUsar as any).enviarPulsos(senal);
      } else {
        resultado = (emisorAUsar as any).enviarPulsos(senal);
      }
      
      if (!resultado.exito) {
        throw new Error(`${resultado.mensajeError}`);
      }
      
      const senalActual = resultado.senal || senal;
      
      const resultadosReceptores: Array<{ receptor: IReceptor; exito: boolean; mensajeDecodificado?: string; error?: string }> = [];
      let todosExitosos = true;
      let primerMensajeDecodificado = contenido;
      
      for (const receptorActual of todosLosReceptores) {
        componenteActual = receptorActual.nombre;
        
        try {
          resultado = receptorActual.recibirPulsos(senalActual);
          
          if (!resultado.exito) {
            todosExitosos = false;
            resultadosReceptores.push({
              receptor: receptorActual,
              exito: false,
              error: resultado.mensajeError
            });
            continue;
          }
          
          const historialReceptor = receptorActual.obtenerHistorial();
          const mensajeDecodificado = historialReceptor.length > 0 
            ? historialReceptor[historialReceptor.length - 1].contenido 
            : contenido;
          
          if (resultadosReceptores.length === 0) {
            primerMensajeDecodificado = mensajeDecodificado;
          }
          
          resultadosReceptores.push({
            receptor: receptorActual,
            exito: true,
            mensajeDecodificado
          });
        } catch (error) {
          todosExitosos = false;
          const errorMsg = error instanceof Error ? error.message : String(error);
          resultadosReceptores.push({
            receptor: receptorActual,
            exito: false,
            error: errorMsg
          });
        }
      }
      
      emisorAUsar.apagar();
      
      const tiempoTotal = Date.now() - inicioTransmision;
      const nombreCodificador = codificador?.nombre || 'Desconocido';
      
      this.historialTransmisiones.push({
        mensaje,
        exito: todosExitosos,
        tiempoMs: tiempoTotal,
        timestamp: new Date(),
        contenidoEnviado: contenido,
        contenidoRecibido: todosExitosos ? primerMensajeDecodificado : undefined,
        codificadorUsado: nombreCodificador
      });
      
      if (todosExitosos) {
        return { exito: true, mensaje, tiempoTransmisionMs: tiempoTotal, mensajeDecodificado: primerMensajeDecodificado };
      } else {
        const receptoresFallidos = resultadosReceptores.filter(r => !r.exito).map(r => r.receptor.nombre).join(', ');
        return { 
          exito: false, 
          error: `Transmisión fallida en algunos receptores: ${receptoresFallidos}`,
          mensaje,
          tiempoTransmisionMs: tiempoTotal
        };
      }
      
    } catch (error) {
      const tiempoTotal = Date.now() - inicioTransmision;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const codificadorCatch = this.registro.getCodificadorActivo();
      const nombreCodificador = codificadorCatch?.nombre || 'Desconocido';
      
      this.historialTransmisiones.push({
        mensaje,
        exito: false,
        error: errorMsg,
        componenteFallo: componenteActual,
        tiempoMs: tiempoTotal,
        timestamp: new Date(),
        contenidoEnviado: contenido,
        contenidoRecibido: undefined,
        codificadorUsado: nombreCodificador
      });
      
      return { exito: false, error: errorMsg, componenteFallo: componenteActual };
    }
  }

  obtenerCatalogo(): ICatalogoComponentes {
    return this.registro.obtenerCatalogo();
  }

  obtenerEmisoresDisponibles(): IComponenteMetadata[] {
    return this.registro.obtenerEmisoresDisponibles();
  }

  obtenerCanalesDisponibles(): IComponenteMetadata[] {
    return this.registro.obtenerCanalesDisponibles();
  }

  obtenerRelesDisponibles(): IComponenteMetadata[] {
    return this.registro.obtenerRelesDisponibles();
  }

  obtenerReceptoresDisponibles(): IComponenteMetadata[] {
    return this.registro.obtenerReceptoresDisponibles();
  }

  obtenerCodificadoresDisponibles() {
    return this.registro.obtenerCodificadoresDisponibles();
  }

  getRegistro(): RegistroComponentesService {
    return this.registro;
  }

  iniciarTransmisionAutomatica(
    intervaloMs: number = 3000,
    callback?: (resultado: ResultadoEnvio) => void
  ): void {
    if (this._transmisionAutomaticaActiva) {
      return;
    }

    if (this.estadoSistema !== EstadoSistema.LISTO) {
      return;
    }

    this.intervaloTransmision = Math.max(1000, intervaloMs);
    this.onMensajeEnviado = callback;
    this._transmisionAutomaticaActiva = true;
    this.contadorMensajesAuto = 0;

    this.enviarMensajeAutomatico();

    this.timerAutomatico = setInterval(() => {
      if (this._transmisionAutomaticaActiva) {
        this.enviarMensajeAutomatico();
      }
    }, this.intervaloTransmision);
  }

  detenerTransmisionAutomatica(): void {
    if (!this._transmisionAutomaticaActiva) {
      return;
    }

    if (this.timerAutomatico) {
      clearInterval(this.timerAutomatico);
      this.timerAutomatico = null;
    }

    this._transmisionAutomaticaActiva = false;
  }

  get transmisionAutomaticaActiva(): boolean {
    return this._transmisionAutomaticaActiva;
  }

  get mensajesAutomaticosEnviados(): number {
    return this.contadorMensajesAuto;
  }

  setIntervaloTransmision(intervaloMs: number): void {
    this.intervaloTransmision = Math.max(1000, intervaloMs);

    if (this._transmisionAutomaticaActiva && this.timerAutomatico) {
      clearInterval(this.timerAutomatico);
      this.timerAutomatico = setInterval(() => {
        if (this._transmisionAutomaticaActiva) {
          this.enviarMensajeAutomatico();
        }
      }, this.intervaloTransmision);
    }
  }

  private enviarMensajeAutomatico(): void {
    let textoNatural: string;
    let indiceEmisor = 0;
    let esEmisorPruebas = false;
    
    if (this.emisores.length > 0) {
      const emisorAutomaticoIndex = this.emisores.findIndex(e => 
        e.nombre.includes('Automático') || e.nombre.includes('AUTOMATICO')
      );
      if (emisorAutomaticoIndex >= 0) {
        indiceEmisor = emisorAutomaticoIndex;
      } else {
        const emisorPruebasIndex = this.emisores.findIndex(e => 
          e.nombre.includes('Pruebas') || e.nombre.includes('PRUEBAS')
        );
        if (emisorPruebasIndex >= 0) {
          indiceEmisor = emisorPruebasIndex;
          esEmisorPruebas = true;
        }
      }
    }

    if (esEmisorPruebas) {
      textoNatural = this.generarLetraSimple();
    } else {
      textoNatural = this.generarMensajeAleatorio();
    }
    
    const contenidoCodificado = this.convertirALenguajeCodificador(textoNatural);
    this.contadorMensajesAuto++;

    const resultado = this.enviarMensaje(contenidoCodificado, 'SISTEMA_AUTO', 'RECEPTOR', indiceEmisor);

    if (this.onMensajeEnviado) {
      this.onMensajeEnviado(resultado);
    }
  }

  private generarLetraSimple(): string {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const indiceAleatorio = Math.floor(Math.random() * letras.length);
    return letras[indiceAleatorio];
  }

  convertirALenguajeCodificador(texto: string): string {
    const codificador = this.registro.getCodificadorActivo();
    
    switch (codificador.id) {
      case 'codificador-morse':
        return this.textoAMorse(texto);
      case 'codificador-baudot':
        return this.textoABaudot(texto);
      case 'codificador-binario':
        return this.textoABinario(texto);
      default:
        return texto;
    }
  }

  private textoAMorse(texto: string): string {
    const tablaMorse: Record<string, string> = {
      'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',
      'E': '.',     'F': '..-.',  'G': '--.',   'H': '....',
      'I': '..',    'J': '.---',  'K': '-.-',   'L': '.-..',
      'M': '--',    'N': '-.',    'O': '---',   'P': '.--.',
      'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
      'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',
      'Y': '-.--',  'Z': '--..',
      '0': '-----', '1': '.----', '2': '..---', '3': '...--',
      '4': '....-', '5': '.....', '6': '-....', '7': '--...',
      '8': '---..', '9': '----.',
      ' ': '/'
    };
    
    const partes: string[] = [];
    for (const char of texto.toUpperCase()) {
      const morse = tablaMorse[char];
      if (morse) {
        partes.push(morse);
      }
    }
    return partes.join(' ');
  }

  private textoABaudot(texto: string): string {
    const tablaBaudot: Record<string, string> = {
      'A': '11000', 'B': '10011', 'C': '01110', 'D': '10010',
      'E': '10000', 'F': '10110', 'G': '01011', 'H': '00101',
      'I': '01100', 'J': '11010', 'K': '11110', 'L': '01001',
      'M': '00111', 'N': '00110', 'O': '00011', 'P': '01101',
      'Q': '11101', 'R': '01010', 'S': '10100', 'T': '00001',
      'U': '11100', 'V': '01111', 'W': '11001', 'X': '10111',
      'Y': '10101', 'Z': '10001', ' ': '00100'
    };
    
    const partes: string[] = [];
    for (const char of texto.toUpperCase()) {
      const baudot = tablaBaudot[char];
      if (baudot) {
        partes.push(baudot);
      }
    }
    return partes.join(' ');
  }

  private textoABinario(texto: string): string {
    const partes: string[] = [];
    for (const char of texto) {
      const codigoAscii = char.charCodeAt(0);
      const binario = codigoAscii.toString(2).padStart(8, '0');
      partes.push(binario);
    }
    return partes.join(' ');
  }

  generarMensajeAleatorio(): string {
    const tipoGeneracion = Math.random();

    if (tipoGeneracion < 0.5) {
      const indice = Math.floor(Math.random() * this.mensajesAutomaticos.length);
      return this.ajustarMensajeAlCodificador(this.mensajesAutomaticos[indice]);
    } else {
      const numPalabras = Math.floor(Math.random() * 3) + 2;
      const palabras: string[] = [];
      
      for (let i = 0; i < numPalabras; i++) {
        const indice = Math.floor(Math.random() * this.palabrasAleatorias.length);
        palabras.push(this.palabrasAleatorias[indice]);
      }
      
      return this.ajustarMensajeAlCodificador(palabras.join(' '));
    }
  }

  private ajustarMensajeAlCodificador(mensaje: string): string {
    const codificador = this.registro.getCodificadorActivo();
    const caracteresValidos: Record<string, string> = {
      'codificador-morse': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
      'codificador-baudot': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ',
      'codificador-binario': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 '
    };

    const validos = caracteresValidos[codificador.id] || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
    let resultado = '';

    for (const char of mensaje.toUpperCase()) {
      if (validos.includes(char)) {
        resultado += char;
      }
    }

    return resultado.trim().replace(/\s+/g, ' ');
  }

  obtenerEstado(): InformacionSistema {
    const emisoresInfo = this.emisores.map(e => ({ nombre: e.nombre, encendido: e.encendido }));
    const receptoresInfo = this.receptores.map(r => {
      return {
        nombre: r.nombre, 
        activo: r.activo, 
        mensajesRecibidos: r.mensajesRecibidos.length
      };
    });
    
    return {
      estado: this.estadoSistema,
      codificador: this.registro.getCodificadorActivo().nombre,
      emisores: emisoresInfo,
      componentesIntermedios: this.cadena.map(c => {
        const componente = c.componente as any;
        const info: ComponenteIntermedioInfo = {
          tipo: c.tipo,
          nombre: componente.nombre
        };
        
        if (c.tipo === TipoNodo.CANAL && componente.distancia !== undefined) {
          info.parametros = {
            distancia: componente.distancia
          };
        }
        
        if (componente.nivelBateria !== undefined) {
          info.bateria = {
            nivel: componente.nivelBateria,
            capacidadMaxima: componente.capacidadMaxima || 100,
            critico: componente.nivelBateria < 20,
            agotada: componente.nivelBateria <= 0
          };
        }
        
        return info;
      }),
      receptores: receptoresInfo,
      transmisionesRealizadas: this.historialTransmisiones.length,
      transmisionesExitosas: this.historialTransmisiones.filter(t => t.exito).length,
      transmisionAutomaticaActiva: this._transmisionAutomaticaActiva,
      mensajesAutomaticosEnviados: this.contadorMensajesAuto,
      intervaloTransmision: this.intervaloTransmision,
      emisor: this.emisor ? { nombre: this.emisor.nombre, encendido: this.emisor.encendido } : null,
      receptor: this.receptor ? {
        nombre: this.receptor.nombre,
        activo: this.receptor.activo,
        mensajesRecibidos: this.receptor.mensajesRecibidos.length
      } : null
    };
  }

  obtenerHistorial(): RegistroTransmision[] {
    return [...this.historialTransmisiones];
  }

  limpiarSistema(): void {
    if (this._transmisionAutomaticaActiva) {
      this.detenerTransmisionAutomatica();
    }
    
    this.cadena = [];
    this.emisores = [];
    this.receptores = [];
    this.emisor = null;
    this.receptor = null;
    this.estadoSistema = EstadoSistema.DETENIDO;
    this.registroErroresGlobal = [];
    this.contadorMensajesAuto = 0;
    this.historialTransmisiones = [];
  }

  obtenerReceptores(): IReceptor[] {
    return [...this.receptores];
  }
  
  obtenerReceptorPorIndice(indice: number): IReceptor | null {
    if (indice >= 0 && indice < this.receptores.length) {
      return this.receptores[indice];
    }
    return null;
  }
}

