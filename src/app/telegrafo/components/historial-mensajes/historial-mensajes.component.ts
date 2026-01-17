import { Component, OnInit } from '@angular/core';
import { SistemaCoordinadorService, RegistroTransmision } from '../../../core/services';

@Component({
  selector: 'app-historial-mensajes',
  templateUrl: './historial-mensajes.component.html',
  styleUrls: ['./historial-mensajes.component.scss']
})
export class HistorialMensajesComponent implements OnInit {
  
  historial: RegistroTransmision[] = [];
  filtroActivo: 'todos' | 'exitosos' | 'fallidos' = 'todos';
  
  constructor(private sistemaCoordinador: SistemaCoordinadorService) {}
  
  ngOnInit(): void {
    this.actualizarHistorial();
  }
  
  actualizarHistorial(): void {
    this.historial = this.sistemaCoordinador.obtenerHistorial();
  }
  
  get historialFiltrado(): RegistroTransmision[] {
    switch (this.filtroActivo) {
      case 'exitosos':
        return this.historial.filter(h => h.exito);
      case 'fallidos':
        return this.historial.filter(h => !h.exito);
      default:
        return this.historial;
    }
  }
  
  setFiltro(filtro: 'todos' | 'exitosos' | 'fallidos'): void {
    this.filtroActivo = filtro;
  }
  
  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleString();
  }
  
  get estadisticas() {
    const total = this.historial.length;
    const exitosos = this.historial.filter(h => h.exito).length;
    const fallidos = total - exitosos;
    const tiempoPromedio = total > 0 
      ? this.historial.reduce((sum, h) => sum + h.tiempoMs, 0) / total 
      : 0;
    
    return { total, exitosos, fallidos, tiempoPromedio };
  }
}
