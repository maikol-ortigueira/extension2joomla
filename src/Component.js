const Extension = require('./Extension');
const { checkUndefinedLanguages, uploadFile, releaseExtension, addCleanTask, addCopyTask, addCopyProTask, addWatchTaskSeries } = require("./utils");
const { task, series, watch } = require('gulp');
const ARS = require('./ARS/ARS');
const capitalize = require('capitalize');

class Component extends Extension {
    constructor(extension) {
        // extension main source. If has group, ${group}/extType
        extension.ms = 'components';
        // extension main destination. If has group, ${group}/extType
        extension.md = 'components';
        extension.prefix = 'com_';
        extension.type = 'component';
        super(extension);
        this.type = 'component';

        this.taskName = `Component${capitalize(this._name)}`;
   }

    addSourcePaths(config) {
        config = super.addSourcePaths(config);

        // admin source paths
        config.admin.src = `${this.mainSource}${config.admin.folderName}/`;
        config.admin.language = checkUndefinedLanguages(config.admin.language, config.admin.src);
        if (config.admin.language !== null) {
            config.admin.language.src = `${this.mainSource}${config.admin.folderName}/${config.admin.language.folderName}/`;
        }

        // Add release admin folder
        config.release.folders.push(config.admin.src);

        // site source paths
        config.site.src = `${this.mainSource}${config.site.folderName}/`;
        config.site.language = checkUndefinedLanguages(config.site.language, config.site.src);
        if (config.site.language !== null) {
            config.site.language.src = `${this.mainSource}${config.site.folderName}/${config.site.language.folderName}/`;
        }
        // Add release site folder
        config.release.folders.push(config.site.src);

        return config;
    }

    addDestinyPaths(config) {
        config = super.addDestinyPaths(config);
        
        // admin destiny paths
        config.admin.dest = `${this.dPath}administrator/components/${this.prefixedName}/`;
        config.admin.language.dest = config.admin.language.folderName !== undefined ? `${this.dPath}administrator/language/` : null;

        // site destiny paths
        config.site.dest = config.site.folderName !== undefined ? `${this.dPath}components/${this.prefixedName}/` : null;
        config.site.language.dest = config.site.language.folderName !== undefined ? `${this.dPath}language/` : null;

        return config;
    }

    // clean Task
    get cleanTask() {
        // clean Site Files
        this.cleanSiteFilesTask;
        // clean Site Language
        this.cleanSiteLanguageTask;
        // clean Media Files
        this.cleanMediaFilesTask;
        // clean Api Files
        this.cleanApiFilesTask;
        // clean Admin Files
        this.cleanAdminFilesTask;
        // clean Admin Language
        this.cleanAdminLanguageTask;
        // clean Manifest File
        this.cleanManifestFileTask;

        task(`clean${this.taskName}`, series(...this.cleanExtensionTasks))

        return `clean${this.taskName}`;
    }

    get cleanSiteFilesTask() {
        if (this.config.site.folderName === null) {
            return;
        }

        addCleanTask(this.config.site.dest, `${this.taskName}Site`, this.cleanExtensionTasks);
    }

    get cleanSiteLanguageTask() {
        if (this.config.site.language === null) {
            return;
        }

        let siteLanguages = this.getLanguageFileNames('site');
        if (siteLanguages === false)
            return
        let origen = siteLanguages.map(l => `${this.config.site.language.dest}${l}`);
        addCleanTask(origen, `${this.taskName}SiteLanguage`, this.cleanExtensionTasks);
    }

    get cleanMediaFilesTask() {
        if (this.config.media.dest === null) {
            return;
        }

        addCleanTask(this.config.media.dest, `${this.taskName}Media`, this.cleanExtensionTasks);
    }

    get cleanApiFilesTask() {
        if (this.config.api.dest === null) {
            return;
        }

        addCleanTask(this.config.api.dest, `${this.taskName}Api`, this.cleanExtensionTasks);
    }

    get cleanAdminFilesTask() {
        addCleanTask(this.config.admin.dest, `${this.taskName}Admin`, this.cleanExtensionTasks, [this.manifestFileName]);
    }

    get cleanAdminLanguageTask() {
        if (this.config.admin.language === null) {
            return;
        }
        let origen = this.getLanguageFileNames('admin').map(l => `${this.config.admin.language.dest}${l}`);

        addCleanTask(origen, `${this.taskName}AdminLanguage`, this.cleanExtensionTasks);
    }

    get cleanManifestFileTask() {
        if (this.config.useConfig === true) {
            return;
        }
        addCleanTask(`${this.config.admin.dest}${this.manifestFileName}`, `${this.taskName}Manifest`, this.cleanExtensionTasks);
    }

    // copy Task
    get copyTask() {
        this.copySiteFilesTask;
        this.copySiteLanguagesTask;
        this.copyMediaFilesTask;
        this.copyApiFilesTask;
        this.copyAdminFilesTask;
        this.copyAdminLanguagesTask;
        this.copyManifestFile;

        task(`copy${this.taskName}`, series(...this.copyExtensionTasks));

        return `copy${this.taskName}`;
    }

    get copySiteFilesTask() {
        if (this.config.site.folderName === null) {
            return;
        }
        let dest = this.config.site.dest;
        let origen = `${this.config.site.src}**/*.*`;
        let taskName = `${this.taskName}Site`;

        addCopyTask(origen, dest, taskName, this.copyExtensionTasks, this.pro);
        addCopyProTask(this.pro, origen, dest, taskName, this.copyProExtensionTasks);
    }

    get copySiteLanguagesTask() {
        if (this.config.site.language === null) {
            return;
        }
        let siteLanguages = this.getLanguageFileNames('site');

        if (siteLanguages === false)
            return;
        let destino = this.config.site.language.dest;
        let origen  = siteLanguages.map(l => `${this.config.site.language.src}${l}`)
        let taskName = `${this.taskName}SiteLanguage`;

        addCopyTask(origen, destino, taskName, this.copyExtensionTasks, this.pro);
        addCopyProTask(this.pro, origen, destino, taskName, this.copyProExtensionTasks);
    }

    get copyMediaFilesTask() {
        if (this.config.media.dest === null) {
            return;
        }
        let destino = this.config.media.dest;
        let origen = `${this.config.media.src}**/*.*`
        let taskName = `${this.taskName}Media`;

        addCopyTask(origen, destino, taskName, this.copyExtensionTasks, this.pro);
        addCopyProTask(this.pro, origen, destino, taskName, this.copyProExtensionTasks);
    }

    get copyApiFilesTask() {
        if (this.config.api.dest === null) {
            return;
        }
        let destino = this.config.api.dest;
        let origen = `${this.config.api.src}**/*.*`
        let taskName = `${this.taskName}Api`;

        addCopyTask(origen, destino, taskName, this.copyExtensionTasks, this.pro);
        addCopyProTask(this.pro, origen, destino, taskName, this.copyProExtensionTasks);
    }

    get copyAdminFilesTask() {
        let destino = this.config.admin.dest;
        let origen  = `${this.config.admin.src}**/*.*`;
        let taskName = `${this.taskName}Admin`;

        addCopyTask(origen, destino, taskName, this.copyExtensionTasks, this.pro);
        addCopyProTask(this.pro, origen, destino, taskName, this.copyProExtensionTasks);
    }

    get copyAdminLanguagesTask() {
        if (this.config.admin.language === null) {
            return;
        }
        let destino = this.config.admin.language.dest;
        let origen  = this.getLanguageFileNames('admin').map(l => `${this.config.admin.language.src}${l}`)
        let taskName = `${this.taskName}AdminLanguage`;

        addCopyTask(origen, destino, taskName, this.copyExtensionTasks, this.pro);
        addCopyProTask(this.pro, origen, destino, taskName, this.copyProExtensionTasks);
    }

    get copyManifestFile() {
        if (this.config.useConfig === true) {
            return;
        }
        let destino = this.config.admin.dest;
        let origen = `${this.config.src}${this.manifestFileName}`
        let taskName = `${this.taskName}Manifest`;

        addCopyTask(origen, destino, taskName, this.copyExtensionTasks, this.pro);
        addCopyProTask(this.pro, origen, destino, taskName, this.copyProExtensionTasks);
    }

    // watch Task
    get watchTask() {
        task(`watch${this.taskName}`, () => {
            // watch admin files
            watch(`${this._config.admin.src}**/*`, addWatchTaskSeries(`${this.taskName}Admin`, this.pro));
            if (this._config.admin.language !== null) {
                watch(`${this._config.admin.language.src}**/*`, addWatchTaskSeries(`${this.taskName}AdminLanguage`, this.pro));
            }

            // watch site files
            watch(`${this._config.site.src}**/*`, addWatchTaskSeries(`${this.taskName}Site`, this.pro));
            if (this._config.site.language !== null) {
                watch(`${this._config.site.language.src}**/*`, addWatchTaskSeries(`${this.taskName}SiteLanguage`, this.pro));
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
        let proConfig = this.pro;
        let proZipFileName = this.proZipFileName;

        task(`release${this.taskName}`, function(cb) {
            releaseExtension(dest, zipFileName, folders, files, manifestObj, proConfig, proZipFileName);
            cb();
        })

        return `release${this.taskName}`;        
    }

    // Upload Task
    get uploadTask() {
        let desde = this.config.dest.release + this.zipFileName;
        let fichero = this.config.dest.upload + this.zipFileName;

        task(`upload${this.taskName}`, async function() {
            await uploadFile(desde, fichero);
        })

        return `upload${this.taskName}`;
    }

    // ARS Task
    get arsTask() {
        // if empty object, create a task that does nothing
        if (this.config.ars === null) {
            task(`ars${this.taskName}`, async function() {
                return;
            });
        } else {
            this.config.zipFileName = this.zipFileName;
            this.config.version = this.version;
            let ars = new ARS(this.config);

            task(`ars${this.taskName}`, async function() {
                await ars.addNewItem();
            });
        }

        return `ars${this.taskName}`;
    }
}

module.exports = Component;