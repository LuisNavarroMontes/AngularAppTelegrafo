# AngularAppTelegrafo

Este proyecto fue generado con [Angular CLI](https://github.com/angular/angular-cli) versión 18.2.16.

## Requisitos del Sistema

### Versiones Requeridas

- **Node.js**: 18.9.0 o superior (recomendado: 18.x LTS o 20.x LTS)
- **Angular**: 18.2.0
- **Angular CLI**: 18.2.16
- **npm**: 9.0.0 o superior (incluido con Node.js)

### Verificar Versiones

Para verificar las versiones instaladas en tu sistema, ejecuta:

```bash
node --version
npm --version
ng version
```

## Instalación

1. Clona o descarga este repositorio
2. Navega a la carpeta del proyecto:
   ```bash
   cd AngularAppTelegrafo
   ```
3. Instala las dependencias del proyecto:
   ```bash
   npm install --force
   ```

> **Nota**: Se utiliza `--force` para resolver posibles conflictos de dependencias y asegurar la instalación correcta de todos los paquetes.

## Ejecutar la Aplicación

Para iniciar el servidor de desarrollo, ejecuta:

```bash
ng serve -o
```

Este comando:
- Inicia el servidor de desarrollo de Angular
- Abre automáticamente la aplicación en tu navegador predeterminado (`http://localhost:4200/`)
- La aplicación se recargará automáticamente si cambias alguno de los archivos fuente

## Comandos Adicionales

### Servidor de desarrollo (sin abrir navegador)
```bash
ng serve
```

### Compilar para producción
```bash
ng build
```
Los archivos compilados se almacenarán en el directorio `dist/`.

### Ejecutar pruebas unitarias
```bash
ng test
```
Ejecuta las pruebas unitarias mediante [Karma](https://karma-runner.github.io).

### Generar componentes
```bash
ng generate component nombre-componente
```
También puedes usar `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Ayuda Adicional

Para obtener más ayuda sobre Angular CLI, ejecuta `ng help` o visita la [página de referencia de Angular CLI](https://angular.dev/tools/cli).
