const { has, get } = require("./utils");

const Component = require("./Component");
const Archivo = require("./Archivo")
const Plugin = require('./Plugin');
const Template = require("./Template");
const Modulo = require("./Modulo");
const Library = require("./Library");

const Extension = require("./Extension");
const { ManifestCreator } = require("./Manifest");
const path = require("path");
const os = require("os");
const ADMZip = require("adm-zip");
const fs = require("fs-extra");

class Package extends Extension {
    hasPro = false;

    constructor() {
        let extension = get('package');
        extension.ms = `packages`;
        extension.md = `packages`;
        extension.type = 'package';
        extension.prefix = 'pkg_';
        extension.config = { useConfig: true };
        super(extension);

        this.description = `${extension.config.name}_XML_DESCRIPTION`;
        this.language = extension.language;
        this.language.folderName = 'language';
        this.language.extensions = ['sys.ini'];
        this.scriptFile = extension.scriptFile;
        this.update_servers = extension.update_servers;
        this.extensions = [];
    }

    set extensions(arr) {
        arr = [
            ...this.get('components'),
            ...this.get('plugins'),
            ...this.get('templates'),
            ...this.get('modules'),
            ...this.get('libraries'),
        ];
        this._extensions = arr;
    }

    get extensions() {
        return this._extensions;
    }

    get manifestFileName() {
        return `pkg_${this.nombre}.xml`;
    }

    releasePackage() {
        let zip = new ADMZip();
        let destPath = path.join(this._config.dest.release, this.zipFileName);
        let tempDir = path.join(os.tmpdir(), 'tempPackageZipFiles');

        this.copyManifestFile();

        // clean temp dir
        if (fs.existsSync(tempDir)) {
            fs.removeSync(tempDir);
        }

        fs.mkdirSync(tempDir, { recursive: true });
        // Copy src path to temp path
        fs.copySync(this._config.src, tempDir);

        // copy extensions zip files to temp path
        this.extensions.forEach(extension => {
            let src = path.join(extension.zip.src.release, extension.content);
            let dest = path.join(tempDir, extension.content);
            fs.copySync(src, dest);
        });

        zip.addLocalFolder(tempDir);
        zip.writeZip(destPath);
    }

    copyManifestFile() {
        let manifest = new ManifestCreator(this);
        manifest.set('name', `pkg_${this.name}`.toUpperCase());
        manifest.set('description', this.description);

        let extensions = this.extensions;
        let files = []
        if (extensions.length > 0) {
            extensions.forEach(extension => {
                let obj = {};
                obj.content = extension.content;
                obj.attributes = extension.attributes;
                files.push(obj);
            });
            manifest.addFiles('files', null, [], files);
        }
        manifest.createManifestFile();
    }

    get(type) {
        if (!has(type)) return [];
        let extensions = get(type);
        let arr = [];
        const extensionClasses = {
            components: Component,
            plugins: Plugin,
            templates: Template,
            modules: Modulo,
            libraries: Library,
            files: Archivo
        };

        if (Array.isArray(extensions)) {
            extensions.forEach(element => {
                let extension = new extensionClasses[type](element);
                let obj = this.getExtensionObject(extension);
                arr.push(obj);
            });
        } else {
            for (let key in extensions) {
                extensions[key].forEach(element => {
                    let extension = new extensionClasses[type](element);
                    let obj = this.getExtensionObject(extension);
                    arr.push(obj);
                });
            }
        }

        return arr;
    }

    getExtensionObject(extension) {
        let obj = {
            content: '',
            attributes: {},
            zip: {},
            pro: { hasPro: false }
        };
        obj.zip.src = extension._config.dest;
        obj.content = extension.zipFileName;
        obj.attributes.id = extension.type === 'plugin' ? extension.name : extension.prefixedName;
        obj.attributes.type = extension.type;
        if (extension.group) {
            obj.attributes.group = extension.group;
        }
        if (extension.client) {
            obj.attributes.client = extension.client;
        }
        obj.pro.hasPro = extension.pro !== null;
        obj.pro.content = extension.proZipFileName;
        obj.pro.attributes = obj.attributes;

        if (obj.pro.hasPro) {
            this.hasPro = true;
        }

        return obj;
    }
}

module.exports = Package;
