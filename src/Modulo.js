const capitalize = require('capitalize')
const { task, src, series, dest, watch } = require('gulp')
const clean = require('gulp-clean')
const GulpZip = require('gulp-zip')
const Manifest = require('./Manifest')
const { limpiarRuta, sourcePath, destPath, releasePath } = require("./utils")

class Modulo {

    /**
     * 
     * @param {string} nombre Nombre del módulo
     * @param {string} cliente Cliente del módulo (site|admin)
     */
    constructor(nombre, cliente = 'site') {
        this.cleanModule = [];
        this.copyModule = [];

        let ruta = limpiarRuta(sourcePath);
        nombre = nombre.toLowerCase();
        this.cliente = cliente.toLowerCase();
        this.rutaDesde = `${ruta}modules/${this.cliente}/${nombre}/`;
        this.rutaMediaDesde = `${this.rutaDesde}media/`;
        this.nombre = nombre;
        this.cNombre = capitalize(nombre);
        this.cCliente = capitalize(this.cliente);
        
        let manifest = new Manifest(ruta, 'module', nombre, this.cliente);
        this.manifiesto = manifest.manifiesto;
        this.version = this.manifiesto.version;
        
        this.rutaCliente = this.cliente === 'site' ? '' : 'administrator/';
        let rutaJoomla = limpiarRuta(destPath);

        this.rutaJoomlaMod = `${rutaJoomla}${this.rutaCliente}modules/mod_${this.nombre}/`;
        this.rutaJoomlaMedia = `${rutaJoomla}media/mod_${this.nombre}/`;

        let destinoRelease = limpiarRuta(releasePath);
        this.releaseDest = destinoRelease + 'modules/' + this.cliente + '/' + this.nombre + '/';
    }

    get zipFileName() {
        return `mod_${this.cliente}_${this.nombre}.v${this.version}.zip`;        
    }

    // clean tasks
    get cleanTask() {
        this.cleanMediaTask;
        this.cleanModulesFilesTask;
        this.cleanManifestFileTask;

        task(`cleanModules${this.cCliente}${this.cNombre}`, series(...this.cleanModule));

        return `cleanModules${this.cCliente}${this.cNombre}`;        
    }

    get cleanMediaTask() {
        let cleanPath = this.rutaJoomlaMedia;
        task(`cleanModule${this.cCliente}${this.cNombre}Media`, () =>{
            return src(cleanPath, { read:false, allowEmpty:true })
                .pipe(clean({ force:true }))
        })

        this.cleanModule.push(`cleanModule${this.cCliente}${this.cNombre}Media`)
    }

    get cleanModulesFilesTask() {
        let cleanPath = this.rutaJoomlaMod;
        task(`cleanModule${this.cCliente}${this.cNombre}Files`, () =>{
            return src(cleanPath, { read:false, allowEmpty:true })
                .pipe(clean({ force:true }))
        })

        this.cleanModule.push(`cleanModule${this.cCliente}${this.cNombre}Files`)
    }

    get cleanManifestFileTask() {
        let cleanPath = `${this.rutaJoomlaMod}mod_${this.nombre}.xml`;
        task(`cleanModule${this.cCliente}${this.cNombre}Manifest`, () =>{
            return src(cleanPath, { read:false, allowEmpty:true })
                .pipe(clean({ force:true }))
        })

        this.cleanModule.push(`cleanModule${this.cCliente}${this.cNombre}Manifest`)
    }

    // copy tasks
    get copyTask() {
        this.copyMediaTask;
        this.copyModuleFilesTask;
        this.copyManifestFileTask;

        task(`copyModule${this.cCliente}${this.cNombre}`, series(...this.copyModule));

        return `copyModule${this.cCliente}${this.cNombre}`;        
    }

    get copyMediaTask() {
        let destino = this.rutaJoomlaMedia;
        let origen = `${this.rutaMediaDesde}**/*.*`

        task(`copyModule${this.cCliente}${this.cNombre}Media`, series(`cleanModule${this.cCliente}${this.cNombre}Media`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyModule.push(`copyModule${this.cCliente}${this.cNombre}Media`);
    }

    get copyModuleFilesTask() {
        let destino = this.rutaJoomlaMod;
        let origen = [
            `${this.rutaDesde}**/*.*`,
            `!${this.rutaMediaDesde}**`,
        ];

        task(`copyModule${this.cCliente}${this.cNombre}Files`, series(`cleanModule${this.cCliente}${this.cNombre}Files`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyModule.push(`copyModule${this.cCliente}${this.cNombre}Files`);
    }

    get copyManifestFileTask() {
        let destino = this.rutaJoomlaMod;
        let origen = `${this.rutaDesde}mod_${this.nombre}.xml`

        task(`copyModule${this.cCliente}${this.cNombre}Manifest`, series(`cleanModule${this.cCliente}${this.cNombre}Manifest`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyModule.push(`copyModule${this.cCliente}${this.cNombre}Manifest`);
    }

    // watch task
    get watchTask() {
        let watchPath = `${this.rutaDesde}**/*`
        task(`watchModule${this.cCliente}${this.cNombre}`, () => {
            watch([watchPath], series(`copyModule${this.cCliente}${this.cNombre}`));
        });

        return `watchModule${this.cCliente}${this.cNombre}`;
    }

    // release task
    get releaseTask() {
        let desde = this.rutaDesde + '**';
        let destino = this.releaseDest;
        let filename = this.zipFileName;

        task(`releaseModule${this.cCliente}${this.cNombre}`, function(cb) {
            return src(desde)
                .pipe(GulpZip(filename))
                .pipe(dest(destino))
        })

        return `releaseModule${this.cCliente}${this.cNombre}`;        
    }
}

module.exports = Modulo