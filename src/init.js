let destDir = '';
let srcDir = '';
let releaseDir = '';
let extName = '';
let extConfig = '';
const configFileName = 'config.json';
const extConfigFileName = 'extensions-config.json';

const fs = require('fs');
const path = require('path');
const os = require('os');
const log = require('log-beautify');
const mainConfigJsonFile = path.join(__dirname, '../');

function checkConfigJsonFile() {
    if (!hasFile(mainConfigJsonFile, configFileName)) {
        log.show();
        log.error_(`Falta el fichero de configuración principal`);
        log.show();
        log.show(`Edita el fichero "${configFileName}.dist" que se encuentra en ${resolveHome(mainConfigJsonFile)}`);
        log.show();
        log.show(`configura con las opciones de tu extensión y guarda en ${resolveHome(mainConfigJsonFile)}`);
        log.show();
        log.warn_(`Recuerda renombrar el fichero a ${configFileName}`);
        log.show();
        log.info(`Posteriormente también podras crear un fichero de configuración para cada extensión`);
        log.show();
        process.exit(1);
    }

    setConfigVars();
};

function setConfigVars() {
    let mainExtConf = require(`${mainConfigJsonFile}/${configFileName}`);
    let extConf = mainExtConf;
    let filePath = '';

    if (hasFile(filePath = resolveHome(mainExtConf.srcDir), configFileName)) {
        extConf = require(`${filePath}/${configFileName}`);
    }

    if (hasFile(filePath = resolveHome(`${mainExtConf.srcDir}/${mainExtConf.extName}`), configFileName)) {
        extConf = require(`${filePath}/${configFileName}`);
    }

    destDir = resolveHome(getConfigVar('destDir', mainExtConf, extConf));
    srcDir = resolveHome(getConfigVar('srcDir', mainExtConf, extConf));
    releaseDir = resolveHome(getConfigVar('releaseDir', mainExtConf, extConf));
    extName = getConfigVar('extName', mainExtConf, extConf);
    checkExtensionConfigJsonFile(srcDir);
}

function checkExtensionConfigJsonFile(srcPath) {
    if (!hasFile(srcPath, extConfigFileName)) {
        log.show();
        log.error_(`Falta el fichero de configuración de la extensión`);
        log.show();
        log.show(`Edita el fichero "${extConfigFileName}.dist" que se encuentra en ${path.join(__dirname, '..')}`);
        log.show();
        log.show(`configura con las opciones de tu extensión y guarda en ${srcPath}`);
        log.show();
        log.warn_(`Recuerda renombrar el fichero a ${extConfigFileName}`);
        log.show();
        process.exit(1);
    }
    extConfig = require(`${srcPath}/${extConfigFileName}`);
}

function getConfigVar(varName, mainExtConf, extConf) {
    let varValue = '';
    if (mainExtConf.hasOwnProperty(varName)) {
        varValue = mainExtConf[varName];
    }

    if (extConf.hasOwnProperty(varName)) {
        varValue = extConf[varName];
    }

    return varValue;
}

function hasFile(filePath, fileName) {
    return fs.existsSync(`${resolveHome(filePath)}/${fileName}`);
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
