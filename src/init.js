let destDir = '';
let srcDir = '';
let releaseDir = '';
let extName = '';
let extConfig = '';
const configFileName = 'config';
const extConfigFileName = 'extensions-config';

const fs = require('fs');

const path = require('path');
const os = require('os');
const log = require('log-beautify');
const JSON5 = require('json5');
const mainConfigJsonFile = path.join(__dirname, '../');

function checkConfigJsonFile() {
    let jsonFileName = getJsonFileName(mainConfigJsonFile, configFileName);
    if (jsonFileName === false) {
        log.show();
        log.error_(`Falta el fichero de configuración principal`);
        log.show();
        log.show(`Edita el fichero "${configFileName}.json5.dist" que se encuentra en ${resolveHome(mainConfigJsonFile)}`);
        log.show();
        log.show(`configura con las opciones de tu extensión y guarda en ${resolveHome(mainConfigJsonFile)}`);
        log.show();
        log.warn_(`Recuerda renombrar el fichero a ${configFileName}.json5`);
        log.show();
        log.info(`Posteriormente también podras crear un fichero de configuración para cada extensión`);
        log.show();
        process.exit(1);
    }

    setConfigVars();
};

function setConfigVars() {
    let mainExtConf = parseJsonFile(mainConfigJsonFile, configFileName);
    let extConf = mainExtConf;
    let filePath = mainExtConf.srcDir;
    let jsonFileName = getJsonFileName(filePath, configFileName);

    if (jsonFileName !== false) {
        extConf = parseJsonFile(filePath, configFileName);
    }

    filePath = resolveHome(`${mainExtConf.srcDir}/${mainExtConf.extName}`);
    jsonFileName = getJsonFileName(filePath, configFileName);

    if (jsonFileName !== false) {
        extConf = parseJsonFile(filePath, configFileName);
    }

    destDir = resolveHome(getConfigVar('destDir', mainExtConf, extConf));
    srcDir = resolveHome(getConfigVar('srcDir', mainExtConf, extConf));
    releaseDir = resolveHome(getConfigVar('releaseDir', mainExtConf, extConf));
    extName = getConfigVar('extName', mainExtConf, extConf);

    // GitHub Vars
    global.gitUser = getConfigVar('github.owner', mainExtConf, extConf);
    global.gitRepo = getConfigVar('github.repo', mainExtConf, extConf);
    global.gitToken = getConfigVar('github.token', mainExtConf, extConf);

    // Sftp Vars
    global.sftpHost = getConfigVar('sftp.host', mainExtConf, extConf);
    global.sftpUser = getConfigVar('sftp.user', mainExtConf, extConf);
    global.sftpPass = getConfigVar('sftp.pass', mainExtConf, extConf);
    global.sftpPort = getConfigVar('sftp.port', mainExtConf, extConf);
    global.sftpRemotePath = getConfigVar('sftp.remotePath', mainExtConf, extConf);
    global.sftpPrivateKey = resolveHome(getConfigVar('sftp.privateKey', mainExtConf, extConf));
    
    // ARS Vars
    global.ARShost = getConfigVar('ars.host', mainExtConf, extConf);
    global.ARStoken = getConfigVar('ars.token', mainExtConf, extConf);

    checkExtensionConfigJsonFile(srcDir);
}

function checkExtensionConfigJsonFile(srcPath) {
    let jsonFileName = getJsonFileName(srcPath, extConfigFileName);
    if (jsonFileName === false) {
        log.show();
        log.error_(`Falta el fichero de configuración de la extensión`);
        log.show();
        log.show(`Edita el fichero "${extConfigFileName}.json5.dist" que se encuentra en ${path.join(__dirname, '..')}`);
        log.show();
        log.show(`configura con las opciones de tu extensión y guarda en ${srcPath}`);
        log.show();
        log.warn_(`Recuerda renombrar el fichero a ${extConfigFileName}.json5`);
        log.show();
        process.exit(1);
    }
    extConfig = parseJsonFile(srcPath, extConfigFileName);
}

function getJsonFileName(filepath, filename) {
    filepath = resolveHome(filepath);
    let json5File = `${filename}.json5`;
    let jsonFile = `${filename}.json`;

    if (hasFile(filepath, json5File)) {
        return json5File;
    }

    if (hasFile(filepath, jsonFile)) {
        return jsonFile;
    }

    return false;
}

function parseJsonFile(filapath, filename) {
    // check if filapath ends with a slash
    if (!filapath.endsWith('/')) {
        filapath = `${filapath}/`;
    }
    
    let jsonFileName = getJsonFileName(filapath, filename);

    // check if jsonFileName extension is json5
    if (jsonFileName.indexOf('.json5') > -1) {
        // parse json5 file
        let fileContent = fs.readFileSync(`${filapath}${filename}.json5`, 'utf8');

        return JSON5.parse(fileContent);
    }

    return require(`${filapath}${jsonFileName}`);
}

function getConfigVar(varName, mainExtConf, extConf) {
    let varValue = '';

    // check if varName has dot notation
    if (varName.indexOf('.') > -1) {
        let varNameParts = varName.split('.');
        let mainVarName = varNameParts[0];
        let subVarName = varNameParts[1];
        if (mainExtConf.hasOwnProperty(mainVarName)) {
            if (mainExtConf[mainVarName].hasOwnProperty(subVarName)) {
                varValue = mainExtConf[mainVarName][subVarName];
            }
        }
        if (extConf.hasOwnProperty(mainVarName)) {
            if (extConf[mainVarName].hasOwnProperty(subVarName)) {
                varValue = extConf[mainVarName][subVarName];
            }
        }
        return varValue;
    }

    if (mainExtConf.hasOwnProperty(varName)) {
        varValue = mainExtConf[varName];
    }

    if (extConf.hasOwnProperty(varName)) {
        varValue = extConf[varName];
    }

    return varValue;
}

/**
 * Function to check if a file exists
 *
 * @param {String} filePath The path to the file
 * @param {String} fileName The file name without extension
 * @returns {Boolean} True if the file exists, false otherwise
 */
function hasFile(filePath, fileName) {
    // check if filePath ends with a slash
    if (!filePath.endsWith('/')) {
        filePath = `${filePath}/`;
    }
    let file = `${resolveHome(filePath)}${fileName}`;
    return fs.existsSync(`${file}`);
}

function resolveHome(filePath) {
    return filePath.replace('~', os.homedir());
}

function initVars() {
    checkConfigJsonFile();
    global.destPath = destDir;
    global.sourcePath = srcDir;
    global.releasePath = releaseDir;
    global.extName = extName;
    global.extConfig = extConfig;
}

initVars();
