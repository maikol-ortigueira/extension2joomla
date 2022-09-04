const { srcDir, destDir, releaseDir, backupDir } = require('../config.json');
const capitalize = require('capitalize');
const Manifest = require('./Manifest');
const { limpiarRuta, getNotEmptyFolderNames } = require("./utils");
const { task, src, dest, series, watch } = require('gulp');
const clean = require('gulp-clean');
const GulpZip = require('gulp-zip');

class Component {

    constructor(nombre) {

        this.cleanComponent = [];
        this.copyComponent = [];
        
        let ruta = limpiarRuta(srcDir)
        nombre = nombre.toLowerCase();
        this.rutaDesde = `${ruta}components/${nombre}/`;
        this.rutaSiteDesde = `${this.rutaDesde}site/`
        this.rutaAdminDesde = `${this.rutaDesde}admin/`
        this.nombre = nombre;
        this.cNombre = capitalize(nombre);

        let manifest = new Manifest(ruta, 'component', nombre);
        this.manifiesto = manifest.manifiesto;
        this.version = this.manifiesto.version;

        var rutaJoomla = limpiarRuta(destDir);
        this.rutaJoomlaComSite = `${rutaJoomla}components/com_${this.nombre}/`;
        this.rutaJoomlaComMedia = `${rutaJoomla}media/com_${this.nombre}/`;
        this.rutaJoomlaComAdmin = `${rutaJoomla}administrator/components/com_${this.nombre}/`;
        this.rutaJoomlaLanguageSite = `${rutaJoomla}language/`;
        this.rutaJoomlaLanguageAdmin = `${rutaJoomla}administrator/language/`;

        let destinoRelease = limpiarRuta(releaseDir);
        this.releaseDest = destinoRelease + 'components/' + this.nombre + '/';

        let destinoBackup = limpiarRuta(backupDir);
        this.backupDest = destinoBackup + 'components/' + this.nombre + '/';
    }

    get zipFileName() {
        return `com_${this.nombre}.v${this.version}.zip`;
    }

    get siteLanguageFileNames() {
        let languages = getNotEmptyFolderNames(`${this.rutaSiteDesde}language/`)
        let langFiles = []
        languages.forEach(l => {
            langFiles.push(`${l}/com_${this.nombre}.ini`)
        })

        return langFiles;
    }

    get adminLanguageFileNames() {
        let languages = getNotEmptyFolderNames(`${this.rutaAdminDesde}language/`)
        let langFiles = [];
        languages.forEach(l => {
            langFiles.push(`${l}/com_${this.nombre}.ini`);    
            langFiles.push(`${l}/com_${this.nombre}.sys.ini`);    
        })

        return langFiles;
    }

    // clean Task
    get cleanTask() {
        // clean Site Files
        this.cleanSiteFilesTask;
        // clean Site Language
        this.cleanSiteLanguageTask;
        // clean Media Files
        this.cleanMediaFilesTask;
        // clean Admin Files
        this.cleanAdminFilesTask;
        // clean Admin Language
        this.cleanAdminLanguageTask;
        // clean Manifest File
        this.cleanManifestFileTask;

        task(`cleanComponent${this.cNombre}`, series(...this.cleanComponent))

        return `cleanComponent${this.cNombre}`;
    }

    get cleanSiteFilesTask() {
        let cleanPath = this.rutaJoomlaComSite;
        task(`cleanComponent${this.cNombre}Site`, () =>{
            return src(cleanPath, { read:false, allowEmpty:true })
                .pipe(clean({ force:true }))
        })

        this.cleanComponent.push(`cleanComponent${this.cNombre}Site`)
    }

    get cleanSiteLanguageTask() {
        let origen = this.siteLanguageFileNames.map(l => `${this.rutaJoomlaLanguageSite}${l}`);
        task(`cleanComponent${this.cNombre}SiteLanguage`, () => {
            return src(origen, { read:false, allowEmpty:true })
            .pipe(clean({ force:true }))
        })

        this.cleanComponent.push(`cleanComponent${this.cNombre}SiteLanguage`);
    }

    get cleanMediaFilesTask() {
        let cleanPath = this.rutaJoomlaComMedia;
        task(`cleanComponent${this.cNombre}Media`, () =>{
            return src(cleanPath, { read:false, allowEmpty:true })
                .pipe(clean({ force:true }))
        })

        this.cleanComponent.push(`cleanComponent${this.cNombre}Media`)
    }

    get cleanAdminFilesTask() {
        let origen = this.rutaJoomlaComAdmin;
        task(`cleanComponent${this.cNombre}Admin`, () => {
            return src(origen, { read:false, allowEmpty:true })
            .pipe(clean({ force:true }))
        })

        this.cleanComponent.push(`cleanComponent${this.cNombre}Admin`);
    }

    get cleanAdminLanguageTask() {
        let origen = this.adminLanguageFileNames.map(l => `${this.rutaJoomlaLanguageAdmin}${l}`);

        task(`cleanComponent${this.cNombre}AdminLanguage`, () => {
            return src(origen, { read:false, allowEmpty:true })
            .pipe(clean({ force:true }))
        })

        this.cleanComponent.push(`cleanComponent${this.cNombre}AdminLanguage`);
    }

    get cleanManifestFileTask() {
        let origen = `${this.rutaJoomlaComAdmin}${this.nombre}.xml`

        task(`cleanComponent${this.cNombre}Manifest`, () => {
            return src(origen, { read:false, allowEmpty:true })
            .pipe(clean({ force:true }))
        })

        this.cleanComponent.push(`cleanComponent${this.cNombre}Manifest`);
    }

    // copy Task
    get copyTask() {
        this.copySiteFilesTask;
        this.copySiteLanguagesTask;
        this.copyMediaFilesTask;
        this.copyAdminFilesTask;
        this.copyAdminLanguagesTask;
        this.copyManifestFile;

        task(`copyComponent${this.cNombre}`, series(...this.copyComponent));

        return `copyComponent${this.cNombre}`;
    }

    get copySiteFilesTask() {
        let destino = this.rutaJoomlaComSite;
        let origen  = `${this.rutaSiteDesde}**/*.*`;

        task(`copyComponent${this.cNombre}Site`, series(`cleanComponent${this.cNombre}Site`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyComponent.push(`copyComponent${this.cNombre}Site`);
    }

    get copySiteLanguagesTask() {
        let destino = this.rutaJoomlaLanguageSite;
        let origen  = this.siteLanguageFileNames.map(l => `${this.rutaSiteDesde}language/${l}`)

        task(`copyComponent${this.cNombre}SiteLanguage`, series(`cleanComponent${this.cNombre}SiteLanguage`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyComponent.push(`copyComponent${this.cNombre}SiteLanguage`);
    }

    get copyMediaFilesTask() {
        let destino = this.rutaJoomlaComMedia;
        let origen = `${this.rutaDesde}media/**/*.*`

        task(`copyComponent${this.cNombre}Media`, series(`cleanComponent${this.cNombre}Media`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyComponent.push(`copyComponent${this.cNombre}Media`);
    }

    get copyAdminFilesTask() {
        let destino = this.rutaJoomlaComAdmin;
        let origen  = `${this.rutaAdminDesde}**/*.*`

        task(`copyComponent${this.cNombre}Admin`, series(`cleanComponent${this.cNombre}Admin`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyComponent.push(`copyComponent${this.cNombre}Admin`);
    }

    get copyAdminLanguagesTask() {
        let destino = this.rutaJoomlaLanguageAdmin;
        let origen  = this.adminLanguageFileNames.map(l => `${this.rutaAdminDesde}language/${l}`)

        task(`copyComponent${this.cNombre}AdminLanguage`, series(`cleanComponent${this.cNombre}AdminLanguage`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyComponent.push(`copyComponent${this.cNombre}AdminLanguage`);
    }

    get copyManifestFile() {
        let destino = this.rutaJoomlaComAdmin;
        let origen = `${this.rutaDesde}${this.nombre}.xml`

        task(`copyComponent${this.cNombre}Manifest`, series(`cleanComponent${this.cNombre}Manifest`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyComponent.push(`copyComponent${this.cNombre}Manifest`);
    }

    // watch Task
    get watchTask() {
        let watchPath = `${this.rutaDesde}**/*`
        task(`watchComponent${this.cNombre}`, () => {
            watch([watchPath], series(`copyComponent${this.cNombre}`));
        });

        return `watchComponent${this.cNombre}`;
    }

    // release Task
    get releaseTask() {
        let desde = this.rutaDesde + '**';
        let destino = this.releaseDest;
        let filename = this.zipFileName;

        task(`releaseComponent${this.cNombre}`, function(cb) {
            return src(desde)
                .pipe(GulpZip(filename))
                .pipe(dest(destino))
        })

        return `releaseComponent${this.cNombre}`;        
    }

    // backup Task
    get backupTask() {
        let desde = this.rutaDesde + '**';
        let destino = this.backupDest;

        task(`backupComponent${this.cNombre}`, function(cb) {
            return src(desde)
                .pipe(dest(destino))
        })

        return `backupComponent${this.cNombre}`;        

    }
}

module.exports = Component;