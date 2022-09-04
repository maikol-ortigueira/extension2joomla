const Manifest = require("./Manifest");
const { limpiarRuta, getNotEmptyFolderNames } = require("./utils");
const { destDir, srcDir, releaseDir, backupDir } = require('../config.json');
const capitalize = require("capitalize");
const { task, src, dest, series, watch } = require("gulp");
const clean = require('gulp-clean');
const GulpZip = require("gulp-zip");

class Template {
    
    constructor(nombre, cliente = 'site') {
        this.cleanTemplate = [];
        this.copyTemplate = [];

        let ruta = limpiarRuta(srcDir);
        nombre = nombre.toLowerCase();
        this.cliente = cliente.toLowerCase() === 'site' ? 'site' : 'admin';
        this.rutaDesde = `${ruta}templates/${this.cliente}/${nombre}/`;
        this.rutaLanguagesDesde = `${this.rutaDesde}language/`;
        this.rutaMediaDesde = `${this.rutaDesde}/media/`;
        this.nombre = nombre;
        this.cNombre = capitalize(nombre);
        
        let manifest = new Manifest(ruta, 'template', nombre, this.cliente);
        this.manifiesto = manifest.manifiesto;
        this.version = this.manifiesto.version;
        
        var rutaJoomla = limpiarRuta(destDir);
        this.rutaCliente = cliente.toLowerCase() === 'site' ? '' : 'administrator/';
        this.rutaMediaCliente = cliente.toLowerCase() === 'site' ? 'site/' : 'administrator/';
        this.rutaJoomlaTmp = `${rutaJoomla}${this.rutaCliente}templates/${this.nombre}/`
        this.rutaJoomlaMedia = `${rutaJoomla}media/templates/${this.rutaMediaCliente}${this.nombre}/`
        this.rutaJoomlaLanguage = `${rutaJoomla}language/`;

        let destinoRelease = limpiarRuta(releaseDir);
        this.releaseDest = destinoRelease + 'templates/' + this.cliente + '/' + this.nombre + '/';
        let destinoBackup = limpiarRuta(backupDir);
        this.backupDest = destinoBackup + 'templates/' + this.cliente + '/' + this.nombre + '/';
    }
    get zipFileName() {
        return `tpl_${this.nombre}.v${this.version}.zip`;
    }

    get languageFileNames() {
        let languages = getNotEmptyFolderNames(this.rutaLanguagesDesde)
        let langFiles = [];
        languages.forEach(l => {
            langFiles.push(`${l}/tpl_${this.nombre}.ini`);    
            langFiles.push(`${l}/tpl_${this.nombre}.sys.ini`);    
        })

        return langFiles;
    }

    // clean tasks
    get cleanTask() {
        this.cleanMediaTask;
        //this.cleanLanguageTask;
        this.cleanTemplateFilesTask;
        this.cleanManifestFileTask;

        task(`cleanTemplate${this.cNombre}`, series(...this.cleanTemplate));

        return `cleanTemplate${this.cNombre}`;
    }

    get cleanMediaTask(){
        let cleanPath = this.rutaJoomlaMedia;
        task(`cleanTemplate${this.cNombre}Media`, () =>{
            return src(cleanPath, { read:false, allowEmpty:true })
                .pipe(clean({ force:true }))
        })

        this.cleanTemplate.push(`cleanTemplate${this.cNombre}Media`)
    }

    get cleanLanguageTask(){
        let cleanPath = this.languageFileNames.map(l => `${this.rutaJoomlaLanguage}${l}`);
        task(`cleanTemplate${this.cNombre}Language`, () =>{
            return src(cleanPath, { read:false, allowEmpty:true })
                .pipe(clean({ force:true }))
        })

        this.cleanTemplate.push(`cleanTemplate${this.cNombre}Language`)
    }

    get cleanTemplateFilesTask() {
        let cleanPath = this.rutaJoomlaTmp;
        task(`cleanTemplate${this.cNombre}Files`, () =>{
            return src(cleanPath, { read:false, allowEmpty:true })
                .pipe(clean({ force:true }))
        })

        this.cleanTemplate.push(`cleanTemplate${this.cNombre}Files`)
    }

    get cleanManifestFileTask() {
        let cleanPath = `${this.rutaJoomlaTmp}templateDetails.xml`;
        task(`cleanTemplate${this.cNombre}Manifest`, () =>{
            return src(cleanPath, { read:false, allowEmpty:true })
                .pipe(clean({ force:true }))
        })

        this.cleanTemplate.push(`cleanTemplate${this.cNombre}Manifest`)
    }

    // copy tasks
    get copyTask() {
        this.copyMediaTask;
        //this.copyLanguageTask;
        this.copyTemplateFilesTask;
        this.copyManifestFileTask;

        task(`copyTemplate${this.cNombre}`, series(...this.copyTemplate));

        return `copyTemplate${this.cNombre}`;
    }

    get copyMediaTask() {
        let destino = this.rutaJoomlaMedia;
        let origen = `${this.rutaMediaDesde}**/*.*`

        task(`copyTemplate${this.cNombre}Media`, series(`cleanTemplate${this.cNombre}Media`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyTemplate.push(`copyTemplate${this.cNombre}Media`);
    }

    get copyLanguageTask() {
        let destino = this.rutaJoomlaLanguage;
        let origen = this.languageFileNames.map(l => `${this.rutaLanguagesDesde}${l}`)

        task(`copyTemplate${this.cNombre}Language`, series(`cleanTemplate${this.cNombre}Language`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyTemplate.push(`copyTemplate${this.cNombre}Language`);
    }

    get copyTemplateFilesTask() {
        let destino = this.rutaJoomlaTmp;
        let origen = [
            `${this.rutaDesde}**/*.*`,
            `!${this.rutaMediaDesde}**`,
        ]

        task(`copyTemplate${this.cNombre}Files`, series(`cleanTemplate${this.cNombre}Files`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyTemplate.push(`copyTemplate${this.cNombre}Files`);
    }

    get copyManifestFileTask() {
        let destino = this.rutaJoomlaTmp;
        let origen = `${this.rutaDesde}templateDetails.xml`

        task(`copyTemplate${this.cNombre}Manifest`, series(`cleanTemplate${this.cNombre}Manifest`, () => {
            return src(origen, { allowEmpty: true })
            .pipe(dest(destino))
        }))

        this.copyTemplate.push(`copyTemplate${this.cNombre}Manifest`);
    }

    // watch task
    get watchTask() {
        let watchPath = `${this.rutaDesde}**/*`
        task(`watchTemplate${this.cNombre}`, () => {
            watch([watchPath], series(`copyTemplate${this.cNombre}`));
        });

        return `watchTemplate${this.cNombre}`;
    }

    // release task
    get releaseTask() {
        let desde = this.rutaDesde + '**';
        let destino = this.releaseDest;
        let filename = this.zipFileName;

        task(`releaseTemplate${this.cNombre}`, function(cb) {
            return src(desde)
                .pipe(GulpZip(filename))
                .pipe(dest(destino))
        })

        return `releaseTemplate${this.cNombre}`;        
    }

    // backup task
    get backupTask() {
        let desde = this.rutaDesde + '**';
        let destino = this.backupDest;

        task(`backupTemplate${this.cNombre}`, function(cb) {
            return src(desde)
                .pipe(dest(destino))
        })

        return `backupTemplate${this.cNombre}`;        
    }
}

module.exports = Template;