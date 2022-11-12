const capitalize = require('capitalize');
const { task, src, series, dest } = require('gulp');
const gulpClean = require('gulp-clean');
const gulpForeach = require('gulp-foreach');
const GulpZip = require('gulp-zip');
const { srcDir, destDir, releaseDir } = require('../config.json');
const Manifest = require('./Manifest');
const { limpiarRuta, getManisfestFiles, getManisfestFolders } = require('./utils')

class Archivo {
    constructor(nombre) {
        let ruta = limpiarRuta(srcDir);
        this.rutaDesde = `${ruta}files/${nombre}/`;
        this.nombre = nombre.toLowerCase();
        this.cNombre = capitalize(this.nombre);
        let manifest = new Manifest(ruta, 'file', nombre);
        this.manifiesto = manifest.manifiesto;
        this.version = this.manifiesto.version;
        this.rutaCompletaDesde = `${ruta}${this.manifiesto.fileset[0].files[0].$.target}/`;
        let destino = destDir.charAt(destDir.length - 1) == '/' ? destDir : destDir + '/';
        this.destino = `${destino}files/${this.nombre}/`;
        if (this.manifiesto.fileset[0].files[0] !== undefined) {
            this.destinoFicheros = `${this.destino}${this.manifiesto.fileset[0].files[0].$.folder}/`
        }

        this.copyFile = [];

        let destinoRelease = releaseDir.charAt(releaseDir.length - 1) == '/' ? releaseDir : releaseDir + '/';
        this.releaseDest = destinoRelease + 'files/' + this.nombre + '/';

        this.srcPathArrayLong = this.rutaCompletaDesde.replace(/^\/+|\/+$/g, '').split('/').length;
    }

    get files() {
        return getManisfestFiles(this.manifiesto.fileset[0].files, this.rutaCompletaDesde);
    }

    get folders() {
        return getManisfestFolders(this.manifiesto.fileset[0].files, this.rutaCompletaDesde);
    }

    // get manifestFile() {
    //     return `${this.rutaDesde}administrator/manifests/files/${this.nombre}.xml`;
    // }

    get zipFileName() {
        return `${this.nombre}.v${this.version}.zip`;
    }

    get cleanTask() {
        let destino = this.destino;

        task(`cleanFile${this.cNombre}`, function () {
            return src(destino, { read: false, allowEmpty: true })
                .pipe(gulpClean({ force: true }))
        });

        return `cleanFile${this.cNombre}`;
    }

    get copyTask() {
        this.copyFilesTask;
        this.copyFoldersTask;
        this.copyManifestTask;

        task(`copyFile${this.cNombre}`, series(...this.copyFile));

        return `copyFile${this.cNombre}`;
    }

    // release Task
    get releaseTask() {
        let desde = this.rutaDesde + '**';
        let destino = this.releaseDest;
        let filename = this.zipFileName;

        task(`releaseFile${this.cNombre}`, function (cb) {
            return src(desde)
                .pipe(GulpZip(filename))
                .pipe(dest(destino))
        })

        return `releaseFile${this.cNombre}`;
    }

    get copyFilesTask() {
        let files = this.files;

        if (files.length > 0) {
            let destino = this.destinoFicheros;
            task(`copyFileFiles${this.cNombre}`, function () {
                return src(files, { allowEmpty: true })
                    .pipe(dest(destino))
            });

            this.copyFile.push(`copyFileFiles${this.cNombre}`);
        }
    }

    get copyFoldersTask() {
        let folders = this.folders;

        if (folders.length > 0) {
            let destino = this.destinoFicheros;
            let long = this.srcPathArrayLong;

            task(`copyFileFolders${this.cNombre}`, function () {
                return src(folders, { allowEmpty: true })
                    .pipe(gulpForeach(function (stream, file) {
                        let destFolderName = file.path.replace(/^\/+|\/+$/g, '').split('/')[long];
                        let destinoF = `${destino}${destFolderName}/`;
                        return stream
                            .pipe(dest(destinoF))
                    }))
            })

            this.copyFile.push(`copyFileFolders${this.cNombre}`);
        }
    }

    get copyManifestTask() {
        let manifest = this.manifestFile;
        let destino = this.destino;

        task(`copyManifest${this.cNombre}`, function () {
            return src(manifest, { allowEmpty: true })
                .pipe(dest(destino))
        });

        this.copyFile.push(`copyManifest${this.cNombre}`);
    }
}

module.exports = Archivo;