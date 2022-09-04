const { hasComponents, getComponentsNames, hasFiles, getFilesNames, hasPlugins, getPlugins, hasTemplates, getTemplates, limpiarRuta, hasModules, getModules, getPackageName, getDefault, getFecha } = require("./utils");
const { srcDir, destDir, releaseDir, packageDest } = require('../config.json');
const Component = require("./Component");
const Archivo = require("./Archivo")
const js2xml = require('js2xmlparser');
const Plugin = require('./Plugin');
const Template = require("./Template");
const {  writeFileSync } = require("fs");
const { task, src, series, dest } = require("gulp");
const gulpClean = require("gulp-clean");
const GulpZip = require("gulp-zip");
const Modulo = require("./Modulo");


class Package {

    constructor() {
        this.package = getPackageName();
        this.nombre = this.package.name.toLowerCase();
        this.extensionVersion = '4.0';
        this.name = `PKG_${this.nombre.toUpperCase()}`
        this.author = getDefault(this.package.author, 'Maikol Fustes')
        let fechaHoy = getFecha();
        let mesAnoHoy = `${fechaHoy.mes} ${fechaHoy.ano}`
        this.creationDate = getDefault(this.package.creationDate, mesAnoHoy);
        this.packagename = getDefault(this.package.packagename, this.package.name)
        this.version = getDefault(this.package.version, '1.0.0')
        this.description = `PKG_${this.nombre.toUpperCase()}_DESC`;
        this.files = [];
        this.zipFiles = [];
        this.copyPackage = [];
        let ruta = limpiarRuta(srcDir);

        let destinoRelease = releaseDir.charAt(releaseDir.length - 1) == '/' ? releaseDir : releaseDir + '/';
        this.releaseDest = destinoRelease + 'packages/' + this.nombre + '/';

        let destino = packageDest.charAt(packageDest.length - 1) == '/' ? packageDest : packageDest + '/';
        this.destino = destino

        if (hasComponents) {
            let components = getComponentsNames();
            
            components.forEach(name => {
                let comp = new Component(name);
                this.zipFiles.push(`${comp.releaseDest}${comp.zipFileName}`)
                this.files.push(this.parseElementFile('component', `com_${name}`, comp.zipFileName));
            })
        }

        if (hasFiles) {
            let archivos = getFilesNames();

             archivos.forEach(name => {
                 let f = new Archivo(name);
                 this.zipFiles.push(`${f.releaseDest}${f.zipFileName}`);
                 this.files.push(this.parseElementFile('file', name, f.zipFileName));
             })
        }

        if (hasTemplates) {
            let templates = getTemplates();

            for (const client in templates) {
                let tmps = templates[client]
                if (tmps.length > 0) {
                    tmps.forEach(name => {
                        let template = new Template(name, client)
                        this.zipFiles.push(`${template.releaseDest}${template.zipFileName}`)
                        this.files.push(this.parseTemplageElementFile(name, template.zipFileName, client))
                    })
                }
            }

        }

        if (hasPlugins) {
            let groups = getPlugins();

            for (const type in groups) {
                let plugins = groups[type];
                if (plugins.length > 0) {
                    plugins.forEach(name => {
                        let p = new Plugin(name, type);
                        this.zipFiles.push(`${p.releaseDest}${p.zipFileName}`);
                        this.files.push(this.parsePluginElementFile(name, p.zipFileName, type))
                    })
                }
            }
        }

        if (hasModules) {
            let clients = getModules()

            for (const client in clients) {
                let modules = clients[client]
                if (modules.length > 0) {
                    modules.forEach(name => {
                        let m = new Modulo(name, client)
                        this.zipFiles.push(`${m.releaseDest}${m.zipFileName}`)
                        this.files.push(this.parseModuleElementFile(name, m.zipFileName, client))
                    })
                }
            }
        }
    }

    parseElementFile (type, id, content) {
        let element = {
            "@": {
                type: type,
                id: id
            },
            "#": content
        }

        return element;
    }

    parsePluginElementFile (id, content, group) {
        let element = {
            "@": {
                type: 'plugin',
                id: id,
                group: group
            },
            "#": content
        }

        return element;
    }

    parseModuleElementFile (id, content, client) {
        return this.parseClientElementFile(id, content, client, 'module');
    }

    parseTemplageElementFile (id, content, client) {
        return this.parseClientElementFile(id, content, client, 'template');
    }

    parseClientElementFile (id, content, client, type) {
        let element = {
            "@": {
                type: type,
                id: id,
                client: client
            },
            "#": content
        }

        return element;
    }

    get manifestFileName () {
        return `pkg_${this.nombre}.xml`;
    }

    get zipFileName() {
        return `pkg_${this.nombre}.v${this.version}.zip`;
    }

    get xml() {
        let xml = {
            "@": {
                type: "package",
                version: this.extensionVersion,
                method: "upgrade"
            },
            name: this.name,
            author: this.author,
            creationDate: this.creationDate,
            packagename: this.packagename,
            version: this.version,
            description: this.description,
            files: {
                "@": {
                    folder: "packages"
                }, 
                file: [
                    this.files
                ]
            }
        }
        return js2xml.parse("extension", xml)
    }

    // makeManifestFile() {
    //     let filename = `${this.destino}${this.manifestFileName}`
    //     if (!existsSync(this.destino)) {
    //         mkdirSync(this.destino);
    //     }
    //     writeFileSync(filename, this.xml);
    // }

    // gulp tasks
    get cleanTask() {
        let destino = this.destino;

        task(`cleanPackage`, function() {
            return src(destino, { read: false, allowEmpty: true })
            .pipe(gulpClean({ force: true }))
        })

        return `cleanPackage`;
    }

    get copyTask() {
        this.copyZipFilesTask;
        this.copyManifestFile;

        task(`copyPackage`, series(...this.copyPackage));

        return `copyPackage`;
    }

    get copyZipFilesTask() {
        let files = this.zipFiles;
        
        if (files.length > 0) {
            let destino = this.destino + 'packages/';
            
            task(`copyZipFiles`,  function() {
                return src(files, { allowEmpty: true })
                .pipe(dest(destino))
            })
            
            this.copyPackage.push(`copyZipFiles`);
        }
    }

    get copyManifestFile() {
        let manifestFileName = `../${this.manifestFileName}`;
        writeFileSync(manifestFileName, this.xml)
        let destino = this.destino;

        task(`copyPackageManifest`, function() {
            return src(manifestFileName)
            .pipe(dest(destino))
        })

        this.copyPackage.push(`copyPackageManifest`);
    }

    get releaseTask() {
        let desde = this.destino + '/**';
        let destino = this.releaseDest;
        let filename = this.zipFileName;

        task(`releasePackage`, function () {
            return src(desde)
            .pipe(GulpZip(filename))
            .pipe(dest(destino))
        })

        return `releasePackage`;
    }
}

module.exports = Package;
