import { ReceptorBase } from './receptor-base';
import { IMensaje, ICodificador } from '../core/interfaces';

/**
 * Receptor de Consola
 * Muestra los mensajes recibidos por consola.
 */
export class ReceptorConsola extends ReceptorBase {
  readonly id = 'receptor-consola';
  readonly nombre = 'Receptor Consola';
  
  nivelDetalle: NivelDetalle = NivelDetalle.NORMAL;
  prefijo: string = '📨';

  constructor(codificador: ICodificador) {
    super(codificador);
  }

  producirSalida(mensaje: IMensaje): void {
    const timestamp = mensaje.timestamp.toLocaleTimeString();
    
    switch (this.nivelDetalle) {
      case NivelDetalle.MINIMO:
        console.log(`${this.prefijo} ${mensaje.contenido}`);
        break;
        
      case NivelDetalle.NORMAL:
        console.log(`\n${this.prefijo} ══════════════════════════════════`);
        console.log(`   Mensaje recibido: ${timestamp}`);
        console.log(`   Contenido: ${mensaje.contenido}`);
        console.log(`══════════════════════════════════════\n`);
        break;
        
      case NivelDetalle.COMPLETO:
        console.log(`\n${this.prefijo} ══════════════════════════════════`);
        console.log(`   📬 MENSAJE RECIBIDO CORRECTAMENTE`);
        console.log(`   ─────────────────────────────────`);
        console.log(`   ID: ${mensaje.id}`);
        console.log(`   Timestamp: ${timestamp}`);
        console.log(`   De: ${mensaje.remitente}`);
        console.log(`   Para: ${mensaje.destinatario}`);
        console.log(`   Prioridad: ${mensaje.prioridad}`);
        console.log(`   ─────────────────────────────────`);
        console.log(`   CONTENIDO:`);
        console.log(`   ${mensaje.contenido}`);
        console.log(`══════════════════════════════════════\n`);
        break;
    }
  }

  establecerNivelDetalle(nivel: NivelDetalle): void {
    this.nivelDetalle = nivel;
  }

  mostrarResumen(): void {
    console.log(`\n📊 RESUMEN DE MENSAJES RECIBIDOS`);
    console.log(`═══════════════════════════════════`);
    console.log(`Total: ${this.mensajesRecibidos.length} mensajes\n`);
    
    this.mensajesRecibidos.forEach((msg, index) => {
      const preview = msg.contenido.substring(0, 30);
      console.log(`${index + 1}. [${msg.timestamp.toLocaleTimeString()}] ${preview}...`);
    });
  }
}

export enum NivelDetalle {
  MINIMO = 'MINIMO',
  NORMAL = 'NORMAL',
  COMPLETO = 'COMPLETO'
}
