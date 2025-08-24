const sourcePath = global.sourcePath;
const destPath = global.destPath;
const releasePath = global.releasePath;
const extConfig = global.extConfig;
const proConfig = global.proConfig;

const path = require('path');
const os = require('os');

var fs = require('fs');

const SFTPClient = require('ssh2-sftp-client');
const ADMZip = require('adm-zip');
const { task, series, src, dest } = require('gulp');
const clean = require('gulp-clean');
const through2 = require('through2');
const rename = require('gulp-rename');

/**
 * Method to check if an extension type exists in the extensions-config.json5 file
 * 
 * @param {string} extType The plural name of the extension type e.g. 'components', 'plugins', 'modules', 'templates', 'libraries', 'files'
 * @returns {boolean} True if the extension type exists, false otherwise
 */
const has = (extType) => {
    if (!extConfig.hasOwnProperty(extType)) {
        return false;
    }

    let hasExtensions = false;
    switch (extType) {
        case 'components':
        case 'libraries':
        case 'files':
            hasExtensions = extConfig[extType].length > 0 &&
                extConfig[extType][0] != '';
            break;
        case 'package':
        case 'packages':
            hasExtensions = extConfig.package !== undefined
                && extConfig.package.pack_extensions !== undefined
                && extConfig.package.pack_extensions == true
                && extConfig.package.pack_extensions !== ''
                && extConfig.package.version !== undefined
                && extConfig.package.version !== ''
                && extConfig.package.name !== undefined
                && extConfig.package.name !== '';
            break;
        case 'plugins':
        case 'modules':
        case 'templates':
            let groups = extConfig[extType];
            for (let group in groups) {
                if (extConfig[extType][group].length > 0 &&
                    extConfig[extType][group][0] != '') {
                    hasExtensions = true;
                    break;
                }
            }
            break;
    }
    return hasExtensions;
}

/**
 * Method to get the data of an extension type from the extensions-config.json5 file
 * 
 * @param {string} extType The plural name of the extension type e.g. 'components', 'plugins', 'modules', 'templates', 'libraries', 'files'
 * @returns {object|array|false} The object with the extension type data, an array of objects, or false if the extension type does not exist
 */
const get = (extType) => {
    if (has(extType)) {
        if (extType === 'packages') {
            return extConfig.package;
        }

        if (extType === 'templates') {
            if (extConfig.templates.site === undefined && extConfig.templates.admin === undefined) {
                let templates = {};
                templates.site = extConfig.templates;
                return templates;
            }
            return extConfig.templates;
        }

        return extConfig[extType];
    } else {
        return false;
    }
}

const resolveHome = (filepath) => {
    if (filepath[0] === '~') {
        return path.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
}

/**
 * Function to parse the folder and return it with a '/' at the end
 * 
 * @param {String} folder The folder to parse
 * @returns The parsed folder ending with '/'
 */
const parsePath = (folder) => {
    folder = folder.charAt(folder.length - 1) == '/' ? folder : folder + '/';
    return resolveHome(folder);
}

const getDefault = (search, df) => {
    return search !== undefined && search !== '' ? search : df
}

const getFecha = (local = 'es-ES') => {
    let hoy = new Date()

    let fecha = {};
    fecha.dia = hoy.toLocaleDateString(local, { day: 'numeric' })
    fecha.mes = hoy.toLocaleDateString(local, { month: 'long' })
    fecha.ano = hoy.toLocaleDateString(local, { year: 'numeric' })

    return fecha
}

const getNotEmptyFolderNames = (p) => {
    if (fs.existsSync(p) === false)
        return false
    return fs.readdirSync(p, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && fs.readdirSync(`${p}${dirent.name}`).length !== 0)
        .map(dirent => dirent.name)
}

const checkUndefinedLanguages = (langObj, srcPath) => {
    if (langObj === undefined || langObj === null) {
        return null;
    }

    if (srcPath === undefined || srcPath === '') {
        return null;
    }

    if (langObj.folderName === undefined || langObj.folderName === '') {
        return null;
    }

    if (langObj.tags === undefined || langObj.tags === '' || langObj.tags.length === 0) {
        return null;
    }

    if (langObj.extensions === undefined || langObj.extensions === '' || langObj.extensions.length === 0) {
        langObj.extensions = ['ini'];
    }

    // Ckeck if the folder exists
    let folderPath = path.join(srcPath, langObj.folderName);
    if (!fs.existsSync(folderPath)) {
        return null;
    }

    // ckech if tags folders exists
    let tags = langObj.tags;
    tags.forEach(tag => {
        let tagFolder = path.join(folderPath, tag);
        if (!fs.existsSync(tagFolder)) {
            // delete tag from tags array
            let index = tags.indexOf(tag);
            langObj.tags.splice(index, 1);
            return;
        }

        // check if each extension file exists
        let files = fs.readdirSync(tagFolder);
        let extensions = langObj.extensions;
        extensions.forEach(ext => {
            // if ext has dot
            let hasFile = false;
            if (ext.includes('.')) {
                hasFile = files.some(file => file.endsWith(ext));
            } else {
                hasFile = files.some(file => path.extname(file) === `.${ext}`);
            }
            if (hasFile) {
                return;
            } else {
                let index = extensions.indexOf(ext);
                langObj.extensions.splice(index, 1);
            }
        });
    });

    return langObj;
}

/**
 * Upload a file to a SFTP server
 * 
 * @param {string} localFilePath Full file path to upload
 * @param {string} fileName Base name of the file
 * 
 * @returns {Promise}
 */
const uploadFile = async (localFilePath, fileName) => {
    const sftp = new SFTPClient();
    const remoteFilePath = `${global.sftpRemotePath}/${fileName}`;

    console.log('Fichero a subir: ', localFilePath);
    console.log('Ruta remota: ', remoteFilePath);

    let config = {
        host: global.sftpHost,
        port: global.sftpPort,
        username: global.sftpUser,
    }

    // Comprobar si se ha configurado privateKey
    if (global.sftpPrivateKey !== '') {
        config.privateKey = fs.readFileSync(global.sftpPrivateKey);
    } else {
        config.password = global.sftpPass;
    }

    try {
        console.log('Conectando al servidor SFTP...');
        await sftp.connect(config);

        // Obtener la ruta del directorio remoto
        let remoteDir = path.dirname(remoteFilePath);

        // Verificar si el directorio remoto existe, si no, crearlo
        console.log('Comprobando si el directorio remoto existe...');
        let dirExists = await sftp.exists(remoteDir);
        if (!dirExists) {
            console.log('Creando directorio remoto...');
            await sftp.mkdir(remoteDir, true);
        }

        console.log(`Subiendo fichero ${localFilePath} a ${remoteFilePath}...`);
        await sftp.put(localFilePath, remoteFilePath);

        console.log('Fichero subido correctamente');
    } catch (err) {
        console.error('Error durante la operación SFTP: ', err.message);
    } finally {
        console.log('Cerrando conexión SFTP...');
        await sftp.end();
    }
}

/**
 * Function to get the value of an object
 *
 * @param {Object} obj The object to search
 * @param {String} value The value to search
 * @param {any} default_return The default value to return. Default is null
 * @returns {any} The value of the object or the default value
 */
const getObjectValue = (obj, value, default_return = null) => {
    if (obj.hasOwnProperty(value)) {
        return obj[value];
    }
    return default_return;
}

/**
 * Function to release an joomla extension
 *
 * @param {String} dest Release destination path
 * @param {String} zipFileName The name of the zip file
 * @param {Array} folders Array of folders to include in the zip file
 * @param {Array} files Array of files to include in the zip file
 * @param {Object|null} manifestObj Object with the manifest data (content: "<?xml vers...", filename: "extFilename.xml")
 * @param {Object|null} proConfig Object with the pro configuration
 * @param {String|null} proZipFileName The name of the pro zip file
 * 
 * @returns {void} writes the zip file to the destination path
 */
const releaseExtension = (dest, zipFileName, folders, files, manifestObj = null, pro_config = null, proZipFileName = null) => {
    let core_suffix = '';
    let pro_suffix = proConfig.pro_suffix;
    let pro_files_suffix = proConfig.pro_files_suffix;
    let hasPro = false;
    let removePro = { files: [], folders: [] };

    if (pro_config !== null) {
        hasPro = pro_config.hasPro !== undefined ? pro_config.hasPro : hasPro;
        if (hasPro === true) {
            core_suffix = proConfig.core_suffix;

            // check if core_suffix begins with '-'
            if (!core_suffix.startsWith('-')) {
                core_suffix = `-${core_suffix}`;
            }

            // check if pro_suffix begins with '-'
            if (!pro_suffix.startsWith('-')) {
                pro_suffix = `-${pro_suffix}`;
            }

            if (pro_config.remove !== undefined) {
                removePro.files = pro_config.remove.files !== undefined ? pro_config.remove.files : removePro.files;
                removePro.folders = pro_config.remove.folders !== undefined ? pro_config.remove.folders : removePro.folders;
            }
        }
    }

    let zip = new ADMZip();

    // Add core files
    let destPath = path.join(dest, zipFileName);

    console.log(`Releasing file ${zipFileName} to ${dest}...`);

    folders.forEach(folder => {
        // get the folder name
        let folderName = path.basename(folder);
        zip.addLocalFolder(folder, folderName, (name) => {
            return !path.basename(name, path.extname(name)).endsWith(pro_files_suffix);
        });
    });

    files.forEach(file => {
        if (!file.endsWith(pro_files_suffix)) {
            zip.addLocalFile(file);
        }
    });

    // Add manifest file if not null
    if (manifestObj !== null) {
        zip.addFile(manifestObj.filename, Buffer.alloc(manifestObj.content.length, manifestObj.content));
    }

    zip.writeZip(destPath);

    console.log('Extension released successfully');

    if (hasPro === true) {
        let zipPro = new ADMZip();

        // Add pro files
        let proDestPath = path.join(dest, proZipFileName);

        console.log(`Releasing file ${proZipFileName} to ${dest}...`);

        // create a tmp folder to store the pro files
        let tempDir = path.join(os.tmpdir(), 'tempZipFiles');

        // create the temp folder if not exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        deleteFolderRecursive(tempDir);
        fs.mkdirSync(tempDir);

        // Copiar y renombrar archivos en las carpetas antes de añadirlos al ZIP
        folders.forEach(folder => {
            const folderName = path.basename(folder);
            const tempFolder = path.join(tempDir, folderName);
            copyAndRenameFiles(folder, tempFolder, pro_files_suffix, removePro);
        });

        // Copiar y renombrar archivos individuales
        files.reverse().forEach(file => {
            const baseName = path.basename(file, path.extname(file));
            let newFileName = path.basename(file);
            let proFileName = `${baseName}${pro_files_suffix}${path.extname(file)}`;

            // ckeck if proFileName exists
            if (fs.existsSync(path.join(path.dirname(file), proFileName))) {
                // copy the pro file
                fs.copyFileSync(path.join(path.dirname(file), proFileName), path.join(tempDir, newFileName));
            } else {
                // copy the file
                fs.copyFileSync(file, path.join(tempDir, newFileName));
            }
        });

        // Añadir el contenido de la carpeta temporal al ZIP
        console.log('Adding pro files to the ZIP...' + tempDir);

        // remove pro folders if exists
        removePro.folders.forEach(folder => {
            let folderPath = path.join(tempDir, folder);
            if (fs.existsSync(folderPath)) {
                console.log(`Removing folder ${folderPath}`);
                deleteFolderRecursive(folderPath);
            }
        });

        // remove pro files if exists
        removePro.files.forEach(file => {
            let filePath = path.join(tempDir, file);
            if (fs.existsSync(filePath)) {
                console.log(`Removing file ${filePath}`);
                fs.unlinkSync(filePath);
            }
        });

        zipPro.addLocalFolder(tempDir);

        // read tempDir root files
        fs.readdirSync(tempDir).forEach(file => {
            // check if file is a directory
            if (!fs.lstatSync(path.join(tempDir, file)).isDirectory()) {
                zipPro.addLocalFile(path.join(tempDir, file));
            }
        });

        // Add manifest file if not null
        if (manifestObj !== null) {
            zipPro.addFile(manifestObj.filename, Buffer.alloc(manifestObj.content.length, manifestObj.content));
        }

        zipPro.writeZip(proDestPath);

        console.log('Pro Extension released successfully');
    }
}

const copyAndRenameFiles = (src, dest, pro_files_suffix) => {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    fs.readdirSync(src).reverse().forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        if (fs.lstatSync(srcPath).isDirectory()) {
            // Recursively copy and rename files in subdirectories
            copyAndRenameFiles(srcPath, destPath, pro_files_suffix);
        } else {
            let newDestPath = destPath;
            const baseName = path.basename(item, path.extname(item));
            if (baseName.endsWith(pro_files_suffix)) {
                const newBaseName = baseName.replace(pro_files_suffix, '');
                newDestPath = path.join(dest, `${newBaseName}${path.extname(item)}`);
            }
            fs.copyFileSync(srcPath, newDestPath);
        }
    });
}

const deleteFolderRecursive = (folderPath) => {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach(file => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // Recursively delete subdirectories
                deleteFolderRecursive(curPath);
            } else {
                // Delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

const addCleanTask = (from, taskName, tasksArray, excludeFiles = []) => {
    const excludePatterns = excludeFiles.map(file => `!${from}${file}`);
    const srcPatterns = [`${from}**/*.*`, ...excludePatterns];
    task(`clean${taskName}`, function () {
        return src(srcPatterns, { read: false, allowEmpty: true }).pipe(clean({ force: true }));
    });

    tasksArray.push(`clean${taskName}`);
}

const addCleanSingleFileTask = (filename, taskName, tasksArray) => {
    task(`clean${taskName}`, function () {
        return src(filename, { read: false, allowEmpty: true }).pipe(clean({ force: true }));
    });

    tasksArray.push(`clean${taskName}`);
}

const addCopyTask = (from, to, taskName, tasksArray, config) => {
    let proSuffix = '-pro';
    let removeFiles = [];
    let removeFolders = [];

    if (config !== null && config.show === 'pro') {
        proSuffix = config.pro_files_suffix !== undefined ? config.pro_files_suffix : proSuffix;
        let rFiles = config.remove !== undefined && config.remove.files !== undefined && config.remove.files.length > 0
            ? config.remove.files
            : removeFiles;
        rFiles.forEach(file => {
            removeFiles.push(`${config.sPath}${file}`);
        });
        let rFolders = config.remove !== undefined && config.remove.folders !== undefined && config.remove.folders.length > 0
            ? config.remove.folders
            : removeFolders;
        rFolders.forEach(folder => {
            removeFolders.push(`${config.sPath}${folder}`);
        });
    }
    task(`copy${taskName}`, series(`clean${taskName}`, () => {
        return src(from, { allowEmpty: true })
            .pipe(through2.obj(function (file, _, cb) {
                let baseName = path.basename(file.path, path.extname(file.path));
                if (baseName.endsWith(proSuffix)) {
                    return cb();
                }
                // if folder in removeFolders, do not copy
                let folderName = path.dirname(file.path);
                if (removeFolders.includes(folderName)) {
                    return cb();
                }
                if (removeFiles.includes(file.path)) {
                    return cb();
                }
                this.push(file);
                cb();
            }))
            .pipe(dest(to));
    }));

    tasksArray.push(`copy${taskName}`);
}

const addCopySingleFileTask = (from, to, taskName, tasksArray) => {
    task(`copy${taskName}`, series(`clean${taskName}`, () => {
        return src(from, { allowEmpty: true })
            .pipe(dest(to));
    }));
    tasksArray.push(`copy${taskName}`);
}

const addCopyProTask = (config, from, to, taskName, tasksArray) => {
    if (config !== null && config.hasPro === true && config.show === 'pro') {
        let proSuffix = proConfig.pro_files_suffix;
        task(`copyPro${taskName}`, () => {
            return src(from, { allowEmpty: true })
                .pipe(through2.obj(function (file, _, cb) {
                    let baseName = path.basename(file.path, path.extname(file.path));
                    if (baseName.endsWith(proSuffix)) {
                        console.log(`Removing pro suffix from ${file.path}`);
                        // remove pro suffix
                        baseName = baseName.replace(proSuffix, '');
                        this.push(file);
                    }
                    cb();
                }))
                .pipe(rename(function (path) {
                    path.basename = path.basename.replace(proSuffix, '');
                }))
                .pipe(dest(to))
                .on('end', () => {
                    console.log('Pro files copied successfully to ' + to);
                });
        });
    } else {
        task(`copyPro${taskName}`, function () {
            return;
        });
    }

    tasksArray.push(`copyPro${taskName}`);
}

const addWatchTaskSeries = (taskName, config = null) => {
    if (config !== null && config.hasPro === true && config.show === 'pro') {
        return series(`copy${taskName}`, `copyPro${taskName}`);
    } else {
        return series(`copy${taskName}`);
    }
}

module.exports = {
    has,
    get,
    parsePath,
    getDefault,
    getFecha,
    getNotEmptyFolderNames,
    resolveHome,
    uploadFile,
    getObjectValue,
    checkUndefinedLanguages,
    releaseExtension,
    addCleanTask,
    addCleanSingleFileTask,
    addCopyTask,
    addCopySingleFileTask,
    addCopyProTask,
    addWatchTaskSeries,
    sourcePath,
    destPath,
    releasePath
}
