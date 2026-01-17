import { EmisorBase } from './emisor-base';
import { ISenal, IResultadoTransmision, ICodificador, IMensaje, TipoCodificador } from '../core/interfaces';
import { ResultadoTransmisionFactory, Mensaje, Senal } from '../core/models/mensaje.model';

/**
 * Emisor Automático
 * Transmite mensajes de forma automática y continua.
 * Características:
 * - Alta velocidad de transmisión
 * - Sin errores humanos
 * - Cola de mensajes pendientes
 * - Transmisión en lote
 * - GENERACIÓN AUTOMÁTICA de mensajes aleatorios
 * 
 * Nota: Creado por Factory en SistemaCoordinadorService
 */
export class EmisorAutomatico extends EmisorBase {
  readonly id = 'emisor-automatico';
  readonly nombre = 'Emisor Automático';
  
  /** Velocidad fija de transmisión (palabras por minuto) */
  readonly velocidadWPM: number = 50;
  
  /** Cola de señales pendientes */
  private colaPendientes: ISenal[] = [];
  
  /** Indica si está procesando la cola */
  private procesando: boolean = false;

  /** Timer para transmisión automática */
  private timerAutomatico: ReturnType<typeof setInterval> | null = null;

  /** Indica si la transmisión automática está activa */
  private _transmisionAutomaticaActiva: boolean = false;

  /** Intervalo entre mensajes automáticos (ms) */
  private intervaloTransmision: number = 3000;

  /** Callback para notificar mensajes generados */
  private onMensajeGenerado?: (mensaje: IMensaje, senal: ISenal) => void;

  /** Caracteres válidos para cada tipo de codificador */
  private readonly caracteresPorCodificador: Map<string, string> = new Map([
    ['codificador-morse', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '],
    ['codificador-baudot', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ '],
    ['codificador-binario', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ']
  ]);

  /** Mensajes predefinidos típicos de telégrafo */
  private readonly mensajesPredefinidos: string[] = [
    'SOS',
    'HOLA MUNDO',
    'MENSAJE URGENTE',
    'CONFIRMAR RECEPCION',
    'TRANSMISION OK',
    'FIN DE MENSAJE',
    'ESPERANDO RESPUESTA',
    'RECIBIDO',
    'ENTENDIDO',
    'REPETIR MENSAJE',
    'LISTO PARA RECIBIR',
    'INICIO TRANSMISION',
    'PRUEBA DE LINEA',
    'TODO CORRECTO',
    'AYUDA',
    'EMERGENCIA',
    'STOP',
    'CONTINUAR',
    'ESPERE',
    'ADELANTE'
  ];

  /** Palabras para generar mensajes aleatorios */
  private readonly palabrasAleatorias: string[] = [
    'ALFA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL',
    'INDIA', 'JULIET', 'KILO', 'LIMA', 'MIKE', 'NOVEMBER', 'OSCAR', 'PAPA',
    'QUEBEC', 'ROMEO', 'SIERRA', 'TANGO', 'UNIFORM', 'VICTOR', 'WHISKEY',
    'XRAY', 'YANKEE', 'ZULU', 'NORTE', 'SUR', 'ESTE', 'OESTE', 'ALTO',
    'BAJO', 'RAPIDO', 'LENTO', 'BUENO', 'MALO', 'GRANDE', 'PEQUEÑO',
    'PRIMERO', 'ULTIMO', 'HOY', 'MAÑANA', 'AYER', 'AHORA', 'PRONTO',
    'TARDE', 'NUNCA', 'SIEMPRE', 'AQUI', 'ALLA', 'CERCA', 'LEJOS'
  ];

  /** Contador de mensajes enviados automáticamente */
  private contadorMensajes: number = 0;

  constructor(codificador: ICodificador) {
    super(codificador);
  }

  protected procesarEnvio(senal: ISenal): IResultadoTransmision {
    return ResultadoTransmisionFactory.exito(senal);
  }

  /**
   * Agrega una señal a la cola de transmisión
   */
  agregarACola(senal: ISenal): void {
    this.colaPendientes.push(senal);
  }

  /**
   * Procesa todas las señales en la cola
   */
  procesarCola(): IResultadoTransmision[] {
    if (!this.encendido) {
      return [ResultadoTransmisionFactory.error('Emisor apagado', 'EMISOR_APAGADO')];
    }

    this.procesando = true;
    const resultados: IResultadoTransmision[] = [];

    while (this.colaPendientes.length > 0) {
      const senal = this.colaPendientes.shift()!;
      const resultado = this.enviarPulsos(senal);
      resultados.push(resultado);
    }

    this.procesando = false;
    
    return resultados;
  }

  /**
   * Obtiene el número de mensajes pendientes
   */
  get pendientes(): number {
    return this.colaPendientes.length;
  }

  /**
   * Limpia la cola de pendientes
   */
  limpiarCola(): void {
    this.colaPendientes = [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS DE GENERACIÓN Y TRANSMISIÓN AUTOMÁTICA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Inicia la transmisión automática de mensajes aleatorios
   * @param intervaloMs Intervalo entre mensajes en milisegundos (default: 3000)
   * @param callback Función a ejecutar cuando se genera un mensaje
   */
  iniciarTransmisionAutomatica(
    intervaloMs: number = 3000,
    callback?: (mensaje: IMensaje, senal: ISenal) => void
  ): void {
    if (this._transmisionAutomaticaActiva) {
      return;
    }

    if (!this.encendido) {
      this.encender();
    }

    this.intervaloTransmision = intervaloMs;
    this.onMensajeGenerado = callback;
    this._transmisionAutomaticaActiva = true;

    this.generarYTransmitirMensaje();

    this.timerAutomatico = setInterval(() => {
      if (this._transmisionAutomaticaActiva && this.encendido) {
        this.generarYTransmitirMensaje();
      }
    }, this.intervaloTransmision);
  }

  /**
   * Detiene la transmisión automática
   */
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

  /**
   * Indica si la transmisión automática está activa
   */
  get transmisionAutomaticaActiva(): boolean {
    return this._transmisionAutomaticaActiva;
  }

  /**
   * Obtiene el número de mensajes enviados automáticamente
   */
  get mensajesEnviados(): number {
    return this.contadorMensajes;
  }

  /**
   * Configura el intervalo de transmisión (se aplica en el próximo ciclo)
   */
  setIntervaloTransmision(intervaloMs: number): void {
    this.intervaloTransmision = Math.max(500, intervaloMs);

    if (this._transmisionAutomaticaActiva && this.timerAutomatico) {
      clearInterval(this.timerAutomatico);
      this.timerAutomatico = setInterval(() => {
        if (this._transmisionAutomaticaActiva && this.encendido) {
          this.generarYTransmitirMensaje();
        }
      }, this.intervaloTransmision);
    }
  }

  /**
   * Genera y transmite un mensaje aleatorio EN EL LENGUAJE DEL CODIFICADOR
   * Es decir, envía "... --- ..." en lugar de "SOS" si usa Morse
   */
  private generarYTransmitirMensaje(): void {
    const textoNatural = this.generarMensajeAleatorio();
    const contenidoCodificado = this.obtenerRepresentacionCodificada(textoNatural);
    
    const mensaje = new Mensaje(contenidoCodificado, 'EMISOR_AUTO', 'RECEPTOR');
    
    try {
      const senal = this.codificarMensaje(mensaje);
      this.contadorMensajes++;

      this.agregarACola(senal);

      if (this.onMensajeGenerado) {
        this.onMensajeGenerado(mensaje, senal);
      }

    } catch (error) {
    }
  }

  /**
   * Obtiene la representación del texto en el lenguaje del codificador activo
   * - Morse: "SOS" → "... --- ..."
   * - Baudot: "AE" → "11000 10000"
   * - Binario: "HI" → "01001000 01001001"
   */
  private obtenerRepresentacionCodificada(texto: string): string {
    const codificadorId = this.codificador.id;
    
    switch (codificadorId) {
      case 'codificador-morse':
        return this.textoAMorse(texto);
      case 'codificador-baudot':
        return this.textoABaudot(texto);
      case 'codificador-binario':
        return this.textoABinario(texto);
      default:
        if ('obtenerRepresentacionMorse' in this.codificador) {
          return (this.codificador as any).obtenerRepresentacionMorse(texto);
        }
        return texto;
    }
  }

  /**
   * Convierte texto a representación Morse
   * "SOS" → "... --- ..."
   */
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

  /**
   * Convierte texto a representación Baudot (5 bits)
   * "AE" → "11000 10000"
   */
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

  /**
   * Convierte texto a representación Binario ASCII (8 bits)
   * "HI" → "01001000 01001001"
   */
  private textoABinario(texto: string): string {
    const partes: string[] = [];
    for (const char of texto) {
      const codigoAscii = char.charCodeAt(0);
      const binario = codigoAscii.toString(2).padStart(8, '0');
      partes.push(binario);
    }
    return partes.join(' ');
  }

  /**
   * Genera un mensaje aleatorio válido para el codificador actual
   */
  generarMensajeAleatorio(): string {
    const tipoGeneracion = Math.random();

    if (tipoGeneracion < 0.4) {
      return this.obtenerMensajePredefinido();
    } else if (tipoGeneracion < 0.7) {
      return this.generarFraseAleatoria();
    } else {
      return this.generarTextoAleatorio();
    }
  }

  /**
   * Obtiene un mensaje predefinido aleatorio
   */
  private obtenerMensajePredefinido(): string {
    const indice = Math.floor(Math.random() * this.mensajesPredefinidos.length);
    return this.ajustarAlCodificador(this.mensajesPredefinidos[indice]);
  }

  /**
   * Genera una frase combinando palabras aleatorias
   */
  private generarFraseAleatoria(): string {
    const numPalabras = Math.floor(Math.random() * 3) + 2; // 2-4 palabras
    const palabras: string[] = [];

    for (let i = 0; i < numPalabras; i++) {
      const indice = Math.floor(Math.random() * this.palabrasAleatorias.length);
      palabras.push(this.palabrasAleatorias[indice]);
    }

    return this.ajustarAlCodificador(palabras.join(' '));
  }

  /**
   * Genera texto completamente aleatorio usando caracteres válidos
   */
  private generarTextoAleatorio(): string {
    const caracteres = this.obtenerCaracteresValidos();
    const longitud = Math.floor(Math.random() * 8) + 3; // 3-10 caracteres
    let texto = '';

    for (let i = 0; i < longitud; i++) {
      const indice = Math.floor(Math.random() * caracteres.length);
      texto += caracteres[indice];
    }

    return texto.trim().replace(/\s+/g, ' ');
  }

  /**
   * Obtiene los caracteres válidos para el codificador actual
   */
  private obtenerCaracteresValidos(): string {
    const caracteres = this.caracteresPorCodificador.get(this.codificador.id);
    return caracteres || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
  }

  /**
   * Ajusta un texto para que solo contenga caracteres válidos del codificador
   */
  private ajustarAlCodificador(texto: string): string {
    const caracteresValidos = this.obtenerCaracteresValidos();
    let resultado = '';

    for (const char of texto.toUpperCase()) {
      if (caracteresValidos.includes(char)) {
        resultado += char;
      }
    }

    return resultado.trim().replace(/\s+/g, ' ');
  }

  /**
   * Genera un mensaje de prueba específico EN EL LENGUAJE DEL CODIFICADOR
   */
  generarMensajePrueba(): IMensaje {
    const textoNatural = this.generarMensajeAleatorio();
    const contenidoCodificado = this.obtenerRepresentacionCodificada(textoNatural);
    return new Mensaje(contenidoCodificado, 'EMISOR_AUTO_TEST', 'RECEPTOR_TEST');
  }

  /**
   * Resetea el contador de mensajes
   */
  resetearContador(): void {
    this.contadorMensajes = 0;
  }

  /**
   * Sobrescribe apagar para detener transmisión automática
   */
  override apagar(): void {
    if (this._transmisionAutomaticaActiva) {
      this.detenerTransmisionAutomatica();
    }
    super.apagar();
  }
}
