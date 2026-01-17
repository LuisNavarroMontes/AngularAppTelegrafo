import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Componentes
import { PanelControlComponent } from './components/panel-control/panel-control.component';
import { HistorialMensajesComponent } from './components/historial-mensajes/historial-mensajes.component';
import { ConfiguradorSistemaComponent } from './components/configurador-sistema/configurador-sistema.component';
import { ConstructorCadenaComponent } from './components/constructor-cadena/constructor-cadena.component';

const routes: Routes = [
  {
    path: '',
    component: PanelControlComponent
  },
  {
    path: 'constructor',
    component: ConstructorCadenaComponent
  }
];

@NgModule({
  declarations: [
    PanelControlComponent,
    HistorialMensajesComponent,
    ConfiguradorSistemaComponent,
    ConstructorCadenaComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    PanelControlComponent,
    HistorialMensajesComponent,
    ConstructorCadenaComponent
  ]
})
export class TelegrafoModule { }
