var xml2js = require('xml2js');
const js2xmlparser = require('js2xmlparser');
var fs = require('fs');
const capitalize = require('capitalize');

class ManifestReader {
    constructor(extension) {
        this.manifest = extension.manifestFullFileName;
        this.extType = extension.type;
    }

    set manifest(filename) {
        if (filename === null || filename === "" || filename === undefined) {
            throw new Error('The manifest file is required');
        };

        xml2js.parseString(fs.readFileSync(filename, 'utf-8'), (err, result) => {
            if (err) {
                console.error(err.stack);
                throw err;
            }

            this._manifest = result.extension;
        });
    }

    get manifest() {
        return this._manifest;
    }

    get config() {
        let config = {};
        config.useConfig = false;
        config.extension = this.extension;

        let simpleElements = ['name', 'author', 'creationDate', 'license', 'authorEmail', 'authorUrl', 'version', 'description', 'namespace', 'scriptfile'];

        simpleElements.forEach(element => {
            config[element] = this.getManifestElement(element);
        });
        config.librayname = this.librayname;
        config.files = this.files;
        config.languages = this.languages;

        if (this.extType === 'component') {
            config.site = {};
            config.site.folderName = config.files.folderName === undefined ? 'language' : config.files.folderName;
            config.site.folders = config.files.folders;
            config.site.files = config.files.files;
            config.site.language = config.languages;

            // remove config.files and config.languages
            delete config.files;
            delete config.languages;
        } else {
            config.ext = {};
            config.ext.folderName = config.files.folderName === undefined ? 'language' : config.files.folderName;
            config.ext.folders = config.files.folders;
            config.ext.files = config.files.files;
            config.ext.language = config.languages;

            // remove config.files and config.languages
            delete config.languages;
        }

        config.update_servers = this.updateservers;
        config.media = this.media;
        config.admin = this.administration;
        config.api = this.api;

        config.release = {
            folders: [],
            files: [],
            manifestObj: null
        };

        return config;
    }

    get extension() {
        let manifest = this._manifest;
        let extension = {
            type: manifest.$.type,
            client: manifest.$.client,
            group: manifest.$.group,
            method: manifest.$.method,
        }

        return extension;
    }

    get librayname() {
        let libraryname = {
            company: "",
            name: "",
        };

        return libraryname;
    }

    get files() {
        let f = this._manifest.files[0];
        let files = {};
        this.addFiles(f, files);
        return files;
    }

    get languages() {
        let l = this._manifest.languages[0];
        let languages = {};

        this.addLangData(l, languages);

        return languages;
    }

    get updateservers() {
        let m = this._manifest;
        let updateservers = {
            hasUpdateServer: false,
            servers: [],
            hasDownloadKey: false,
            download_key: {
                prefix: "",
                suffix: ""
            }
        };

        if (m.updateservers === undefined) {
            return updateservers;
        }

        m = m.updateservers[0];

        updateservers.hasUpdateServer = true;
        m.server.forEach(server => {
            let s = {
                server: server._,
                type: server.$.type,
                priority: server.$.priority,
                name: server.$.name
            };
            updateservers.servers.push(s);
        });

        if (this._manifest.dlid !== undefined) {
            updateservers.hasDownloadKey = true;
            updateservers.download_key = {
                prefix: this._manifest.dlid[0].$.prefix,
                suffix: this._manifest.dlid[0].$.suffix
            };
        }

        return updateservers;
    }

    get media() {
        let m = this.getManifestElement('media');
        let media = {};

        this.addFiles(m, media);
        return media;
    }

    get api() {
        let a = this.getManifestElement('api');
        let api = {};

        this.addFiles(a, api, 'api');
        return api;
    }

    get administration() {
        let a = this._manifest.administration;
        if (this._manifest.administration === undefined) {
            return {};
        }

        a = a[0];
        let ret = {};
        this.addFiles(a.files[0], ret);
        let administration = {
            folderName: ret.folderName,
            destination: ret.destination,
            folders: ret.folders,
            files: ret.files,
            language: {},
            sql: {},
            menus: {
                menu: "",
                submenus: []
            }
        };

        this.addLangData(a.languages[0], administration.language);
        if (this._manifest.install[0].sql !== undefined) {
            this.addSqlData(this._manifest.install[0].sql[0].file, administration.sql);
        }

        return administration;
    }

    addFiles(files, obj, folderName = null) {
        if (files === undefined) {
            obj = undefined;
            return;
        }

        if (folderName !== null) {
            obj.folderName = folderName;
        } else {
            obj.folderName = files.$ === undefined || files.$.folder === undefined ? '' : files.$.folder;
        }
        obj.destination = files.$ === undefined || files.$.destination === undefined ? '' : files.$.destination;
        if (files.folder !== undefined) {
            obj.folders = files.folder.map(folder => {
                return folder;
            });
        };

        if (files.filename !== undefined) {
            obj.files = files.filename.map(file => {
                return file;
            });
        };

        if (files.file !== undefined) {
            obj.files = files.file.map(file => {
                return file;
            });
        };
    }

    addLangData(langs, obj) {
        obj.folder = langs.$ === undefined || langs.$.folder === undefined ? 'language' : langs.$.folder;
        langs = langs.language;
        if (langs !== undefined) {
            let t = new Set(langs.map(l => {
                return l.$.tag;
            }));

            obj.tags = [...t];

            let e = new Set(langs.map(l => {
                let filename = l._.split('.');
                if (filename.length === 2) {
                    return filename[1];
                }

                if (filename.length === 3) {
                    return `${filename[1]}.${filename[2]}`;
                }
            }));

            obj.extensions = [...e];

            obj.folderName = 'language';
        }
    }

    addSqlData(installFiles, obj) {
        if (installFiles === undefined) {
            obj = undefined;
            return;
        }
        let drivers = new Set(installFiles.map(f => {
            return f.$.driver;
        }));
        let charset = installFiles[0].$.charset;
        obj.drivers = [...drivers];
        obj.charset = charset;
    }

    getManifestElement(element) {
        return this._manifest[element] === undefined ? undefined : this._manifest[element][0];
    }
}

class ManifestCreator {
    constructor(extension) {
        this.extension = extension;
        this.mainSource = extension.mainSource;
        this.manifestFileName = extension.manifestFileName;
        this.config = extension;
    }

    /**
     * Method to set the extension properties.
     * 
     * @param {Object} extension The extension object
     */
    set extension(extension) {
        // install method
        if (this._elAttrs === undefined) {
            this._extension = {};
        }

        this.ext_prefix = extension.prefix;
        this.extName = extension.extName;
        this._name = extension.name;
        this._extension.type = extension.type;
        this._extension.method = extension.method !== undefined ? extension.method : 'upgrade';
        if (extension.client !== undefined) {
            this._extension.client = extension.client;
        }
        if (extension.group !== undefined) {
            this._extension.group = extension.group;
        }

        let manifesGlobalArray = ['author', 'copyright', 'license', 'authorEmail', 'authorUrl', 'packagename'];
        manifesGlobalArray.forEach(element => {
            // check if extension has the element
            if (extension[element] !== undefined) {
                this[`_${element}`] = extension[element];
            } else if (global.manifest[element] !== "") {
                this[`_${element}`] = global.manifest[element];
            }
        });
        this._creationDate = extension._creationDate;

        let isNameSpaceExtension = ['component', 'plugin', 'module', 'template', 'library'].includes(extension.type);
        if (global.manifest.namespaceVendor !== "" && isNameSpaceExtension) {
            this.namespace = global.manifest.namespaceVendor;
        }

        this._version = extension.version;
    }

    /**
     * Method to set the extension namespace.
     * 
     * @param {String} vendor The vendor name
     */
    set namespace(vendor) {
        let namespace = `${capitalize(vendor)}\\${capitalize(this._extension.type)}\\${capitalize(this.extName)}`;
        this._namespace = namespace;
    }

    /**
     * Method to set the extension configuration.
     * 
     * @param {Object} config The configuration object
     */
    set config(config) {
        if (config.scriptFile !== undefined && config.scriptFile !== "") {
            this._scriptfile = config.scriptFile;
        }
        let el = null;

        if (config.admin !== undefined) {
            el = config.admin;
            this.addFiles('administration.files', el.folderName, el.folders, el.files);
            this.addLanguages('administration.languages', el.folderName, el.language.tags, el.language.extensions, el.language.folderName);
            this.addSQL(el.sql.drivers, el.sql.charset);
            this.addMenus(el.menus);
        }
        if (config.site !== undefined) {
            el = config.site;
            this.addFiles('files', el.folderName, el.folders, el.files);
            this.addLanguages('languages', el.folderName, el.language.tags, el.language.extensions, el.language.folderName);
        };

        if (config.language !== undefined) {
            el = config.language;
            this.addLanguages('languages', null, el.tags, el.extensions, el.folderName);
        }

        if (config.media !== undefined) {
            el = config.media
            this.addMedia(el.folderName, this._name.toLowerCase(), el.folders, el.files);
        }

        if (config.api !== undefined) {
            el = config.api;
            this.addFiles('api.files', el.folderName, el.folders, el.files);
        }

        if (config.update_servers !== undefined) {
            el = config.update_servers;
            this.addUpdateServer(el);
        }

        if (config.dashboards !== undefined) {
            el = config.dashboards;
            this.addDashboards(el);
        }
    }

    /**
     * Method to set an simple element value.
     * 
     * @param {String} element The element to set
     * @param {String} value The element value
     */
    set(element, value) {
        this[`_${element}`] = value;
    }

    get xmlObj() {
        let xml = {};
        xml["@"] = this._extension;

        let elementsArray = [
            'name', 'packagename', 'author', 'creationDate', 'copyright', "license", "authorEmail", "authorUrl", 'version', 'description', 'namespace',
            'scriptfile', 'install', 'update', 'uninstall', 'files', 'languages', 'media', 'administration', 'dashboards', 'dlid', 'updateservers'
        ];

        elementsArray.forEach(element => {
            if (this[`_${element}`] !== undefined) {
                xml[element] = this[`_${element}`];
            }
        });

        return xml;
    }

    get content() {
        let xml = this.xmlObj;

        return js2xmlparser.parse('extension', xml);
    }

    createManifestFile() {
        let content = this.content;
        // create folder if not exists
        if (!fs.existsSync(this.mainSource)) {
            fs.mkdirSync(this.mainSource);
        }
        let filename = `${this.mainSource}${this.manifestFileName}`;
        fs.writeFileSync(filename, content);
    }

    addSQL(drivers, charset) {
        if (Array.isArray(drivers)) {
            drivers.forEach(driver => {
                this.addSqlDriver(driver, charset);
            });
        } else {
            this.addSqlDriver(drivers, charset);
        }
    }

    addSqlDriver(driver, charset) {
        let options = ['install', 'uninstall', 'update'];
        options.forEach(option => {
            if (this[`_${option}`] === undefined) {
                this[`_${option}`] = {};
            }

            if (option === 'update') {
                if (this._update.schemas === undefined) {
                    this._update.schemas = { schemapath: [] };
                }
                let content = `sql/updates/${driver}`;
                let attributes = { type: driver };
                this._update.schemas.schemapath.push(this.parseElement(content, attributes));
            } else {
                if (this[`_${option}`].sql === undefined) {
                    this[`_${option}`].sql = { file: [] };
                }
                let content = `sql/${option}.${driver}.${charset}.sql`;
                let attributes = { driver: driver, charset: charset };
                this[`_${option}`].sql.file.push(this.parseElement(content, attributes));
            }
        });
    }

    /**
     * Method to add files and folders to the extension.
     *
     * @param {String} element Dot separated element to add (e.g. administrator.files)
     * @param {String} folder Folder to add
     * @param {Array} folders Folder array to add
     * @param {Array} files Files array to add
     * 
     * @return {void}
     */
    addFiles(element = 'files', folder = null, folders = [], files = []) {
        this.addComplexElement(element, this.parseFilesElement(folder, folders, files));
    };

    addLanguages(element = 'languages', folder = null, tags = ['en-GB'], extensions = ['ini'], folderName = 'language') {
        this.addComplexElement(element, this.parseLanguagesElement(folder, tags, extensions, folderName));
    }

    /**
     * Adds a media to the extension.
     * 
     * @param {String} folder Source folder
     * @param {String} destination Destination folder
     * @param {Array} folders Array of folders to add
     * @param {Array} files Array of files to add
     * 
     * @return {void} 
     */
    addMedia(folder, destination, folders = [], files = []) {
        this.addComplexElement('media', this.parseFilesElement(folder, folders, files, destination));
    }

    addMenus(menus) {
        if (menus === undefined) {
            return;
        }

        if (this._administration === undefined) {
            this._administration = {};
        }

        // Allways needs a menu
        if (menus.menu === undefined) {
            this._administration.menu = this.parseMenu(this._name);
        } else {
            this._administration.menu = this.parseMenu(menus.menu);
        }

        // Check if there are submenus
        if (menus.submenus !== undefined && menus.submenus.length > 0) {
            this._administration.submenu = { menu: [] };
            menus.submenus.forEach(submenu => {
                this._administration.submenu.menu.push(this.parseMenu(submenu));
            });
        }
    }

    addUpdateServer(element) {
        if (element.hasUpdateServer !== undefined && element.hasUpdateServer === false) {
            return;
        }
        if (element.servers === undefined || element.servers.length === 0) {
            return;
        }
        this._updateservers = { server: [] };
        let type = element.type === undefined || element.type === "" ? 'extension' : element.type;
        let priority = element.priority === undefined || element.priority === "" ? '1' : element.priority;
        element.servers.forEach(s => {
            if (s.server === undefined || s.server === "") {
                return;
            }
            let t = s.type === undefined || s.type === "" ? type : s.type;
            let p = s.priority === undefined || s.priority === "" ? priority : s.priority;
            let n = s.name === undefined ? "" : s.name;
            this._updateservers.server.push(this.parseElement(s.server, { type: t, priority: p, name: n }));
        });

        // download key
        if (element.hasDownloadKey !== undefined && element.hasDownloadKey === true) {
            let att = element.download_key === undefined ? {} : element.download_key;
            let attributes = {
                prefix: att.prefix === undefined ? '' : att.prefix,
                suffix: att.suffix === undefined ? '' : att.suffix
            }
            this._dlid = this.parseElement(null, attributes);
        }
    }

    addDashboards(dashboards) {
        if (dashboards === undefined) {
            return;
        }

        if (this._dashboards === undefined) {
            this._dashboards = { dashboard: [] };
        }

        dashboards.forEach(dashboard => {
            let attrs = dashboard;
            let content = dashboard.text;
            delete attrs.text

            this._dashboards.dashboard.push(this.parseElement(content, attrs));
        });
    }

    addComplexElement(element, content) {
        let elemParts = element.split('.');
        let mainElement = elemParts.shift();
        if (this[`_${mainElement}`] === undefined) {
            this[`_${mainElement}`] = {};
        }

        if (elemParts.length === 0) {
            this[`_${mainElement}`] = content;
            return;
        }

        let elem = this[`_${mainElement}`];
        elemParts.forEach((part, index) => {
            if (index === elemParts.length - 1) {
                elem[part] = content;
            } else {
                if (elem[part] === undefined) {
                    elem[part] = {};
                }
                elem = elem[part];
            }
        });
    }

    parseFilesElement(folder = null, folders = [], files = [], destination = null) {
        let element = {};
        if (folder !== null || destination !== null) {
            element['@'] = {};

            if (folder !== null) {
                element['@'].folder = folder;
            }

            if (destination !== null) {
                element['@'].destination = destination;
            }
        }

        if (folders.length > 0) {
            element.folder = folders.map(f => { return this.parseElement(f) });
        }

        if (files.length > 0) {
            let fn = typeof files[0] === 'object' ? 'file' : 'filename';
            element[fn] = files.map(f => {
                if (typeof f === 'object') {
                    return this.parseElement(f.content, f.attributes);
                }
                return this.parseElement(f)
            });
        }

        return element;
    }

    parseLanguagesElement(folder = null, tags = ['en-GB'], extensions = ['ini'], folderName = 'language') {
        let element = {};
        if (folder !== null) {
            element['@'] = { folder: folder };
        }

        element.language = [];

        let lang_filename = `${this.ext_prefix}${this._name}`;
        tags.forEach(tag => {
            let langs = extensions.map(ext => {
                let content = `${folderName}/${tag}/${lang_filename.toLowerCase()}.${ext}`;
                return this.parseElement(content, { tag: tag });
            });
            // add langs to element
            langs.forEach(lang => {
                element.language.push(lang);
            });
        });

        return element;
    }

    /**
     * Adds an administration menu to the extension.
     * The content will be prefixed with EXT_EXTENSIONNAME_TITLE_, so remember to add the CONSTANT to the language.
     * 
     * @param {String} content The menu title to add, will be prefixed with EXT_EXTENSIONNAME_TITLE_
     * @param {Object} attributes The attributes to add to the menu element
     * 
     * @returns {Object} The parsed menu element
     */
    parseMenu(menu) {
        let content = "";
        let attributes = {};
        let title = "";

        if (typeof menu === 'object') {
            // title is uppercase and replace spaces with underscores
            content = this.parseMenuTitleContent(menu.title);
            attributes = menu;
            delete attributes.title;
        } else {
            content = this.parseMenuTitleContent(menu);
        }

        return this.parseElement(content, attributes);
    }

    parseMenuTitleContent(title) {
        if (title === undefined) {
            return this._name.toUpperCase();
        }

        title = title.toUpperCase().replace(' ', '_');
        return this._name.toUpperCase() + '_TITLE_' + title;
    }

    parseElement(content = null, attributes = null) {
        if (attributes === null && content !== null) {
            return content;
        }
        let element = {};
        if (typeof content === 'object' && content !== null) {
            element = content;
        } else {
            if (content !== null) {
                element["#"] = content;
            }
        }
        element["@"] = attributes;

        return element;
    }
}

module.exports.ManifestCreator = ManifestCreator;
module.exports.ManifestReader = ManifestReader;