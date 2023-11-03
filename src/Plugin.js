const { task, series, src, dest, watch } = require('gulp')
const Manifest = require('./Manifest')
const { limpiarRuta, sourcePath, destPath, releasePath } = require('./utils')
const capitalize = require('capitalize')
const clean = require('gulp-clean')
const GulpZip = require('gulp-zip')

class Plugin {

    constructor(nombre, grupo) {
        this.cleanPlugin = [];
        this.copyPlugin = [];

        let ruta = limpiarRuta(sourcePath);
        nombre = nombre.toLowerCase();
        this.grupo = grupo.toLowerCase();
        this.rutaDesde = `${ruta}plugins/${this.grupo}/${nombre}/`;
        this.rutaMediaDesde = `${this.rutaDesde}media/`;
        this.nombre = nombre;
        this.cNombre = capitalize(nombre);
        this.cGrupo = capitalize(this.grupo);

        let manifest = new Manifest(ruta, 'plugin', nombre, this.grupo);
        this.manifiesto = manifest.manifiesto;
        this.version = this.manifiesto.version;

        let rutaJoomla = limpiarRuta(destPath);
        this.rutaJoomlaPlg = `${rutaJoomla}plugins/${this.grupo}/${this.nombre}/`;
        this.rutaJoomlaMedia = `${rutaJoomla}media/plg_${this.grupo}_${this.nombre}/`;
    
        let destinoRelease = limpiarRuta(releasePath);
        this.releaseDest = destinoRelease + 'plugins/' + this.grupo + '/' + this.nombre + '/';
    }

    get zipFileName() {
        return `plg_${this.grupo}_${this.nombre}.v${this.version}.zip`;
    }

    // clean tasks
    get cleanTask() {
        this.cleanMediaTask;
        this.cleanPluginFilesTask;
        this.cleanManifestFileTask;

        task(`cleanPlugin${this.cGrupo}${this.cNombre}`, series(...this.cleanPlugin));

        return `cleanPlugin${this.cGrupo}${this.cNombre}`;        
    }

    get cleanMediaTask() {
        let cleanPath = this.rutaJoomlaMedia;
        task(`cleanPlugin${this.cGrupo}${this.cNombre}Media`, () =>{
            return src(cleanPath, { read:false, allowEmpty:true })
                .pipe(clean({ force:true }))
        })

        this.cleanPlugin.push(`cleanPlugin${this.cGrupo}${this.cNombre}Media`)
    }

    get cleanPluginFilesTask() {
        let cleanPath = this.rutaJoomlaPlg;
        task(`cleanPlugin${this.cGrupo}${this.cNombre}Files`, () =>{
            return src(cleanPath, { read:false, allowEmpty:true })
                .pipe(clean({ force:true }))
        })

        this.cleanPlugin.push(`cleanPlugin${this.cGrupo}${this.cNombre}Files`)
    }

    get cleanManifestFileTask() {
        let cleanPath = `${this.rutaJoomlaPlg}${this.nombre}.xml`;
        task(`cleanPlugin${this.cGrupo}${this.cNombre}Manifest`, () =>{
            return src(cleanPath, { read:false, allowEmpty:true })
                .pipe(clean({ force:true }))
        })

        this.cleanPlugin.push(`cleanPlugin${this.cGrupo}${this.cNombre}Manifest`)
    }
    // copy tasks
    get copyTask() {
        this.copyMediaTask;
        this.copyPluginFilesTask;
        this.copyManifestFileTask;

        task(`copyPlugin${this.cGrupo}${this.cNombre}`, series(...this.copyPlugin));

        return `copyPlugin${this.cGrupo}${this.cNombre}`;        
    }

    get copyMediaTask() {
        let destino = this.rutaJoomlaMedia;
        let origen = `${this.rutaMediaDesde}**/*.*`

        task(`copyPlugin${this.cGrupo}${this.cNombre}Media`, series(`cleanPlugin${this.cGrupo}${this.cNombre}Media`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyPlugin.push(`copyPlugin${this.cGrupo}${this.cNombre}Media`);
    }

    get copyPluginFilesTask() {
        let destino = this.rutaJoomlaPlg;
        let origen = [
            `${this.rutaDesde}**/*.*`,
            `!${this.rutaMediaDesde}**`,
        ];

        task(`copyPlugin${this.cGrupo}${this.cNombre}Files`, series(`cleanPlugin${this.cGrupo}${this.cNombre}Files`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyPlugin.push(`copyPlugin${this.cGrupo}${this.cNombre}Files`);
    }

    get copyManifestFileTask() {
        let destino = this.rutaJoomlaPlg;
        let origen = `${this.rutaDesde}${this.nombre}.xml`

        task(`copyPlugin${this.cGrupo}${this.cNombre}Manifest`, series(`cleanPlugin${this.cGrupo}${this.cNombre}Manifest`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyPlugin.push(`copyPlugin${this.cGrupo}${this.cNombre}Manifest`);
    }

    // watch task
    get watchTask() {
        let watchPath = `${this.rutaDesde}**/*`
        task(`watchPlugin${this.cGrupo}${this.cNombre}`, () => {
            watch([watchPath], series(`copyPlugin${this.cGrupo}${this.cNombre}`));
        });

        return `watchPlugin${this.cGrupo}${this.cNombre}`;
    }

    // release task
    get releaseTask() {
        let desde = this.rutaDesde + '**';
        let destino = this.releaseDest;
        let filename = this.zipFileName;

        task(`releasePlugin${this.cGrupo}${this.cNombre}`, function(cb) {
            return src(desde)
                .pipe(GulpZip(filename))
                .pipe(dest(destino))
        })

        return `releasePlugin${this.cGrupo}${this.cNombre}`;        
    }
}

module.exports = Plugin