const { srcDir,destDir, releaseDir, backupDir } = require('../config.json');
const capitalize = require('capitalize');
const Manifest = require('./Manifest');
const { limpiarRuta } = require('./utils');
const { task, series, src, dest, watch } = require('gulp');
const clean = require('gulp-clean');
const GulpZip = require('gulp-zip');

class Library {
    constructor(nombre) {
        this.cleanLibrary = [];
        this.copyLibrary =[];
        this.watchLibrary = [];

        
        let ruta = limpiarRuta(srcDir);
        nombre = nombre.toLowerCase();
        this.rutaDesde = `${ruta}libraries/${nombre}/`;
        this.nombre = nombre;
        this.cNombre = capitalize(nombre);
        
        let manifest = new Manifest(ruta, 'library', nombre);
        this.manifiesto = manifest.manifiesto;
        this.version = this.manifiesto.version;

        var rutaJoomla = limpiarRuta(destDir)
        this.rutaJoomlaLib = `${rutaJoomla}libraries/${this.nombre}/`;
        this.rutaJoomlaManif = `${rutaJoomla}administrator/manifests/libraries/`;
        this.rutaJoomlaLanguage = `${this.rutaJoomlaLib}language/`

        let destinoRelease = limpiarRuta(releaseDir);
        this.releaseDest = destinoRelease + 'libraries/' + this.nombre + '/';
        let destinoBackup = limpiarRuta(backupDir);
        this.backupDest = destinoBackup + 'libraries/' + this.nombre + '/';
    }

    // Zip FileName
    get zipFileName() {
        return `lib_${this.nombre}.v${this.version}.zip`;
    }

    // clean Task
    get cleanTask() {
        // clean manifiest
        this.cleanManifestTask;
        // clean Admin manifest
        this.cleanAdminManifestTask
        // clean library
        this.cleanLibraryTask;

        task(`cleanLibrary${this.cNombre}`, series(...this.cleanLibrary));

        return `cleanLibrary${this.cNombre}`;
    }

    // clean manifest
    get cleanManifestTask() {
        let fichero = `${this.rutaJoomlaLib}${this.nombre}.xml`
        task(`cleanLibrary${this.cNombre}Manifest`, function() {
            return src(fichero, { read:false, allowEmpty:true })
            .pipe(clean({ force:true }))
        })

        this.cleanLibrary.push(`cleanLibrary${this.cNombre}Manifest`);
    }

    // clean admin manifest
    get cleanAdminManifestTask() {
        let fichero = `${this.rutaJoomlaManif}${this.nombre}.xml`
        task(`cleanLibrary${this.cNombre}AdminManifest`, function() {
            return src(fichero, { read:false, allowEmpty:true })
            .pipe(clean({ force:true }))
        })

        this.cleanLibrary.push(`cleanLibrary${this.cNombre}AdminManifest`);
    }

    // clean Library
    get cleanLibraryTask() {
        let ruta = this.rutaJoomlaLib;
        task(`cleanLibrary${this.cNombre}Files`, function() {
            return src(ruta, { read:false, allowEmpty:true })
            .pipe(clean({ force:true }))
        })

        this.cleanLibrary.push(`cleanLibrary${this.cNombre}Files`);
    }

    // clean library

    // copy Task
    get copyTask() {
        // copy manifiest
        this.copyManifestTask;
        // copy library
        this.copyLibraryTask;
        // copy Admin Manifest
        this.copyAdminManifestTask;

        task(`copyLibrary${this.cNombre}`, series(...this.copyLibrary));

        return `copyLibrary${this.cNombre}`;
    }

    get copyManifestTask() {
        let destino = this.rutaJoomlaLib
        let fichero = `${this.rutaDesde}${this.nombre}.xml`;

        task(`copyLibrary${this.cNombre}Manifest`, series(`cleanLibrary${this.cNombre}Manifest`, function() {
            return src(fichero, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyLibrary.push(`copyLibrary${this.cNombre}Manifest`);
    }

    get copyAdminManifestTask() {
        let destino = this.rutaJoomlaManif
        let fichero = `${this.rutaDesde}${this.nombre}.xml`;

        task(`copyLibrary${this.cNombre}AdminManifest`, series(`cleanLibrary${this.cNombre}AdminManifest`, function() {
            return src(fichero, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyLibrary.push(`copyLibrary${this.cNombre}AdminManifest`);
    }

    get copyLibraryTask() {
        let origen = `${this.rutaDesde}**/*.*`;
        let destino = this.rutaJoomlaLib;

        task(`copyLibrary${this.cNombre}Files`, series(`cleanLibrary${this.cNombre}Files`, function() {
            return src(origen, { allowEmpty:true })
            .pipe(dest(destino))
        }))

        this.copyLibrary.push(`copyLibrary${this.cNombre}Files`)
    }
    // watch Task
    get watchTask() {
        let watchPath = `${this.rutaDesde}**/*`
        task(`watchLibrary${this.cNombre}`, () => {
            watch([watchPath], series(`copyLibrary${this.cNombre}`));
        });

        return `watchLibrary${this.cNombre}`;
    }

    // release Task
    get releaseTask() {
        // release all
        task(`releaseLibrary${this.cNombre}`, function() {

        })

        return `releaseLibrary${this.cNombre}`;
    }

    // release Task
    get releaseTask() {
        let desde = this.rutaDesde + '**';
        let destino = this.releaseDest;
        let filename = this.zipFileName;

        task(`releaseLibrary${this.cNombre}`, () => {
            return src(desde)
                .pipe(GulpZip(filename))
                .pipe(dest(destino))
        })

        return `releaseLibrary${this.cNombre}`
    }

    // backup Task
    get backupTask() {
        let desde = this.rutaDesde + '**';
        let destino = this.backupDest;

        task(`backupLibrary${this.cNombre}`, () => {
            return src(desde)
                .pipe(dest(destino))
        })

        return `backupLibrary${this.cNombre}`
    }
}

module.exports = Library