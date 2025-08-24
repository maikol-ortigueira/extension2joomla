const { watch, task, series } = require('gulp');
const { ManifestCreator, ManifestReader } = require('./Manifest');
const { parsePath, sourcePath, destPath, releasePath, checkUndefinedLanguages, addCleanTask, addCopyTask, addCopyProTask, addWatchTaskSeries, releaseExtension, uploadFile } = require('./utils');
const capitalize = require('capitalize');
const fs = require('fs');
const ARS = require('./ARS/ARS');
const proConfig = global.proConfig;

class Extension {
    constructor(extension) {
        this.prefix = extension.prefix;
        this.type = extension.type;
        this.ms = extension.ms;
        this.md = extension.md;

        this.sPath = parsePath(sourcePath);
        this.dPath = parsePath(destPath);
        this.rPath = parsePath(releasePath);

        this.cleanExtensionTasks = [];
        this.copyExtensionTasks = [];
        this.copyProExtensionTasks = [];

        this.nombre = extension.name;
        this.name = extension.name;
        this.prefixedName = this.name;
        this.creationDate = extension.creationDate;
        this.packagename = extension.packagename;

        this.mainSource = `${this.sPath}${extension.ms}/${this._name}/`;
        this.ars = extension.ars !== undefined ? extension.ars : null;
        this.pro = extension.pro;

        if (extension.config !== undefined && extension.config !== null && extension.config.useConfig == true) {
            this.version = extension.version;
            this.config = extension.config;
        } else {
            this.config = null;
        }
    }

    /**
     * Set the release destination path
     * @param {string} rPath
     */
    set rPath(rPath) {
        this._rPath = rPath;
    }

    get rPath() {
        return this._rPath;
    }

    set pro(pro) {
        this._pro = pro;
    }

    get pro() {
        if (this._pro === undefined) {
            return null;
        }

        if (this._pro === null) {
            return null;
        }

        if (this._pro.hasPro === false) {
            return null;
        }

        if (this._pro.show == undefined || this._pro.show == "") {
            this._pro.show = "core"
        }

        if (this._pro.core_suffix == undefined) {
            this._pro.core_suffix = ""
        }

        if (this._pro.pro_suffix == undefined) {
            this._pro.pro_suffix = "pro"
        }

        if (this._pro.pro_files_suffix == undefined) {
            this._pro.pro_files_suffix = "-pro"
        }

        this._pro.sPath = this.mainSource;

        return this._pro;
    }

    set creationDate(creationDate) {
        if (creationDate === undefined || creationDate === null || creationDate === "" || creationDate === 'now') {
            creationDate = this.getToday();
        }
        this._creationDate = creationDate;
    }

    get creationDate() {
        return this._creationDate;
    }

    /**
     * Set the extension name without the prefix and in lowercase
     * @param {string} name
     */
    set name(name) {
        let n = name.toLowerCase();
        let p = this.prefix.toLowerCase();

        // clean prefix if exists
        if (n.startsWith(p)) {
            n = n.replace(p, '');
        }

        this._name = n;
    }

    get name() {
        return this._name;
    }

    set prefixedName(name) {
        this._name = name;
    }

    get prefixedName() {
        let n = this._name;
        let p = this.prefix.toLowerCase();
        return `${p}${n}`;
    }

    get manifestFileName() {
        let n = this._name;
        return `${n}.xml`;
    }

    set nombre(nombre) {
        this._nombre = nombre;
    }

    get nombre() {
        return this._nombre;
    }

    get cExtName() {
        return capitalize(this.nombre);
    }

    set config(config) {
        if (config === null) {
            config = { useConfig: false };
        }

        config.release = {
            files: [],
            folders: []
        };

        if (config.useConfig !== true) {
            this.manifestFullFileName = `${this.mainSource}${this.manifestFileName}`;
            let man = new ManifestReader(this);
            config = man.config;

            config.release.files = [this.manifestFullFileName];

            this.version = config.version;

            if (config.files !== undefined) {
                if (config.files.files !== undefined) {
                    config.files.files.forEach(f => {
                        if (f._ !== undefined) {
                            f = f._;
                        }
                        config.release.files.push(`${this.mainSource}${f}`);
                    });
                }
            }

            // Script file
            if (config.scriptfile !== undefined) {
                config.release.files.push(`${this.mainSource}${config.scriptFile}`);
            }
        } else {
            config.extName = this._name;
            config.name = this.prefixedName.toUpperCase();
            config.type = this.type;
            config.version = this.version;
            config.packagename = this.packagename;

            // create manifest file
            let manifest = new ManifestCreator(config);
            config.release.manifestObj = {
                content: manifest.content,
                filename: this.manifestFileName,
            }

            // Script file
            if (config.scriptFile !== undefined && config.scriptFile !== null && config.scriptFile !== "" && config.scriptFile !== false) {
                if (config.scriptFile === true) {
                    config.scriptFile = 'script.php';
                }
                config.release.files.push(`${this.mainSource}${config.scriptFile}`);
            }

            this.manifestFullFileName = null;
        }

        config.extName = this._name;

        config = this.addSourcePaths(config);
        config = this.addDestinyPaths(config);
        config.ars = this.ars;
        this._config = config;
    }

    get config() {
        return this._config;
    }

    get zipFileName() {
        let suffix = '';

        if (this.pro !== null) {
            suffix = proConfig.core_suffix;

            if (!suffix.startsWith('-') && suffix !== '') {
                suffix = `-${suffix}`;
            }
        }

        return `${this.prefixedName}${suffix}.v${this.version}.zip`;
    }

    get proZipFileName() {
        let suffix = '-pro';

        if (this.pro !== null) {
            suffix = proConfig.pro_suffix;

            if (!suffix.startsWith('-') && suffix !== '') {
                suffix = `-${suffix}`;
            }
        }
        return `${this.prefixedName}${suffix}.v${this.version}.zip`;
    }

    get langfileName() {
        return `${this.prefixedName}`;
    }

    get langDest() {
        return `${this.dPath}language/`;
    }

    addSourcePaths(config) {
        let mainSource = this.mainSource;
        config.release.folders = [];
        config.src = mainSource;

        // media source paths
        if (config.media !== undefined && config.media.folderName !== undefined) {
            config.media.src = `${mainSource}${config.media.folderName}/`;
            config.release.folders.push(config.media.src);
        } else {
            config.media = { src: null };
        }

        // api source paths
        if (config.api !== undefined && config.api.folderName !== undefined) {
            config.api.src = `${mainSource}${config.api.folderName}/`;
            config.release.folders.push(config.api.src);
        } else {
            config.api = { src: null };
        }

        if (this.type !== 'component') {
            if (config.ext === undefined) {
                config.ext = {};
            }

            config.ext.src = mainSource;
            config.ext.language = checkUndefinedLanguages(config.ext.language, config.ext.src);
            if (config.ext.language !== null) {
                config.ext.language.src = `${mainSource}${config.ext.language.folderName}/`;
                config.release.folders.push(config.ext.language.src);
            }
            if (config.ext.folders !== undefined) {
                config.ext.folders.forEach(f => {
                    if (f._ !== undefined) {
                        f = f._;
                    }
                    config.release.folders.push(`${mainSource}${f}/`);
                });
            }
        }

        return config;
    }

    addDestinyPaths(config) {
        let eName = this.prefixedName;

        config.media.dest = config.media.folderName !== undefined ? `${this.dPath}media/${eName}/` : null;
        config.api.dest = config.api.folderName !== undefined ? `${this.dPath}api/${eName}/` : null;

        if (this.type !== 'component' && this.type !== 'package') {
            config.ext.dest = `${this.dPath}${this.md}/${this._name}/`;
            config.ext.language.dest = config.ext.language !== null ? `${this.langDest}` : null;
        }

        config.dest = {};
        config.dest.release = `${this.rPath}${this.md}/${this._name}/`;
        config.dest.upload = `${this.md}/${this._name}/`;

        return config;
    }

    getLanguageFileNames(client = 'ext') {
        let language = this.config[client].language;
        if (language === null) {
            return false;
        }
        let langFiles = []
        let languages = language.tags;

        // check if languages is an array
        if (Array.isArray(languages)) {
            languages.forEach(l => {
                // check if language file exists
                if (fs.existsSync(`${language.src}${l}/${this.langfileName}.ini`)) {
                    langFiles.push(`${l}/${this.langfileName}.ini`)
                } else {
                    console.log(`${capitalize(client)} Language file ${l}/${this.langfileName}.ini does not exist`);
                }

                if (fs.existsSync(`${language.src}${l}/${this.langfileName}.sys.ini`)) {
                    langFiles.push(`${l}/${this.langfileName}.sys.ini`)
                }
            });
        } else {
            // ckeck if language file exists
            if (fs.existsSync(`${language.src}${languages}/${this.langfileName}.ini`)) {
                langFiles.push(`${languages}/${this.langfileName}.ini`)
            } else {
                console.log(`${capitalize(client)} Language file ${languages}/${this.langfileName}.ini does not exist`);
            }

            if (fs.existsSync(`${language.src}${languages}/${this.langfileName}.sys.ini`)) {
                langFiles.push(`${languages}/${this.langfileName}.sys.ini`)
            }
        }

        return langFiles;
    }

    getDefault(property, defaultValue = "") {
        return property !== undefined ? property : defaultValue;
    }

    // clean tasks
    get cleanTask() {
        this.cleanMediaTask;
        this.cleanExtensionFilesTask;
        this.cleanLanguageTask;
        this.cleanManifestFileTask;

        task(`clean${this.taskName}`, series(...this.cleanExtensionTasks));

        return `clean${this.taskName}`;
    }

    get cleanMediaTask() {
        if (this.config.media.dest === null)
            return;
        addCleanTask(this.config.media.dest, `${this.taskName}Media`, this.cleanExtensionTasks);
    }

    get cleanExtensionFilesTask() {
        addCleanTask(this.config.ext.dest, `${this.taskName}Files`, this.cleanExtensionTasks, [this.manifestFileName]);
    }

    get cleanLanguageTask() {
        if (this.config.ext.languages === null)
            return;

        let langs = this.getLanguageFileNames();
        if (langs === false)
            return;

        let origen = langs.map(l => `${this.config.ext.language.dest}${l}`);
        addCleanTask(origen, `${this.taskName}Language`, this.cleanExtensionTasks);
    }

    get cleanManifestFileTask() {
        if (this.config.useConfig === true) {
            return;
        }
        addCleanTask(`${this.config.ext.dest}${this.manifestFileName}`, `${this.taskName}Manifest`, this.cleanExtensionTasks);
    }

    // copy tasks
    get copyTask() {
        this.copyMediaTask;
        this.copyExtensionFilesTask;
        this.copyLanguageTask;
        this.copyManifestFileTask;

        task(`copy${this.taskName}`, series(...this.copyExtensionTasks));

        return `copy${this.taskName}`;
    }

    get copyMediaTask() {
        if (this.config.media.dest === null) {
            return;
        }
        let destino = this.config.media.dest;
        let origen = `${this.config.media.src}**/*.*`
        let taskName = `${this.taskName}Media`;

        addCopyTask(origen, destino, taskName, this.copyExtensionTasks, this.pro);
        addCopyProTask(this.pro, origen, destino, taskName, this.copyProExtensionTasks);
    }

    get copyExtensionFilesTask() {
        let dest = this.config.ext.dest;
        let origen = `${this.config.ext.src}**/*.*`
        let taskName = `${this.taskName}Files`;

        addCopyTask(origen, dest, taskName, this.copyExtensionTasks, this.pro);
        addCopyProTask(this.pro, origen, dest, taskName, this.copyProExtensionTasks);
    }

    get copyLanguageTask() {
        if (this.config.ext.language === null) {
            return;
        }
        let langs = this.getLanguageFileNames();

        if (langs === false)
            return;
        let destino = this.config.ext.language.dest;
        let origen = langs.map(l => `${this.config.ext.language.src}${l}`)
        let taskName = `${this.taskName}Language`;

        addCopyTask(origen, destino, taskName, this.copyExtensionTasks, this.pro);
        addCopyProTask(this.pro, origen, destino, taskName, this.copyProExtensionTasks);
    }

    get copyManifestFileTask() {
        if (this.config.useConfig === true) {
            return;
        }
        let dest = this.config.ext.dest;
        let origen = `${this.config.ext.src}${this.manifestFileName}`;
        let taskName = `${this.taskName}Manifest`;

        addCopyTask(origen, dest, taskName, this.copyExtensionTasks, this.pro);
        addCopyProTask(this.pro, origen, dest, taskName, this.copyProExtensionTasks);
    }

    get copyProTask() {
        task(`copyPro${this.taskName}`, series(...this.copyProExtensionTasks));

        return `copyPro${this.taskName}`;
    }

    // watch Task
    get watchTask() {
        task(`watch${this.taskName}`, () => {
            watch(`${this._config.ext.src}**/*`, addWatchTaskSeries(`${this.taskName}Files`, this.pro));
            if (this._config.ext.language !== null) {
                watch(`${this._config.ext.language.src}**/*`, addWatchTaskSeries(`${this.taskName}Language`, this.pro));
            }

            // watch media and api files
            if (this._config.media.src !== null) {
                watch(`${this._config.media.src}**/*`, addWatchTaskSeries(`${this.taskName}Media`, this.pro));
            }
            if (this._config.api.src !== null) {
                watch(`${this._config.api.src}**/*`, addWatchTaskSeries(`${this.taskName}Api`, this.pro));
            }

            // watch manifest file
            if (this.manifestFullFileName !== null) {
                watch(this.manifestFullFileName, addWatchTaskSeries(`${this.taskName}Manifest`, this.pro));
            }
        });

        return `watch${this.taskName}`;
    }

    // release Task
    get releaseTask() {
        let dest = this._config.dest.release;
        let zipFileName = this.zipFileName;
        let folders = this._config.release.folders;
        let files = this._config.release.files;
        let manifestObj = this._config.release.manifestObj;
        let pro_config = this.pro;
        let proZipFileName = this.proZipFileName;

        task(`release${this.taskName}`, function (cb) {
            releaseExtension(dest, zipFileName, folders, files, manifestObj, pro_config, proZipFileName);
            cb();
        })

        return `release${this.taskName}`;
    }

    // Upload Task
    get uploadTask() {
        let desde = this.config.dest.release + this.zipFileName;
        let fichero = this.config.dest.upload + this.zipFileName;

        task(`upload${this.taskName}`, async function () {
            await uploadFile(desde, fichero);
        })

        return `upload${this.taskName}`;
    }

    // ARS Task
    get arsTask() {
        // if empty object, create a task that does nothing
        if (this.config.ars === null) {
            task(`ars${this.taskName}`, async function () {
                return;
            });
        } else {
            this.config.zipFileName = this.zipFileName;
            this.config.version = this.version;
            let ars = new ARS(this.config);

            task(`ars${this.taskName}`, async function () {
                await ars.addNewItem();
            });
        }

        return `ars${this.taskName}`;
    }

    getToday() {
        const today = new Date();

        const yyyy = today.getFullYear();
        let mm = String(today.getMonth() + 1).padStart(2, '0');
        let dd = String(today.getDate()).padStart(2, '0');

        return `${yyyy}-${mm}-${dd}`;
    }
}

module.exports = Extension;