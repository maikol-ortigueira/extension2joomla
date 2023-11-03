const log = require('log-beautify');

const path = require('path');
const configPath = path.join(__dirname, '..');
const fs = require('fs');

if (hasConfigJsonFile()) {
    var {
        extName,
        srcDir,
        destDir
    } = require('../config.json');

    // getConfigJsonInfo();
    // getExtensionConfigJsonInfo();

    destDir = path.join(__dirname, destDir);
    srcDir = path.join(__dirname, srcDir);
}

function getExtensionConfigJsonInfo(){
    if (!hasExtensionConfigFile()){
        log.error('Falta el fichero de configuración de la extensión ');
        log.show();
        log.debug_('INSTRUCCIONES ')
        log.show('Edita el fichero \"extension-config.json.dist\" que se encuentra en');
        log.show(configPath);
        log.show();
        log.show('configura con las opciones de tu extensión y guarda en');
        log.debug(`${srcDir}/${extName}/`)
        log.show();
        log.warn('Recuerda renombrar el fichero a extension-config.json')
        log.show();
    } else {
        log.success_('Fichero extension-config.json ');
        log.show();
        log.show('Este fichero contiene los datos de configuración de tus extensiones');
        log.show();
        log.show('Existe el fichero y se encuentra en:')
        log.success(`${destDir}/${extName}/`);
        correctMessage();
    }
}

function initialInfo() {
    console.log('Información - Joomla2Extension');

    log.debug("Instrucciones de configuración:");
    log.show();
    if (fs.existsSync(path.join(configPath, 'config.json'))) {
        log.info('Debes configurar el fichero config.json');
        log.show('Este fichero se encuentra en la siguiente ruta:');
        log.success(configPath);
    } else {
        log.error_('Falta el fichero config.json');
        log.show();
        log.show('================================================================================');
        log.show('Abre el fichero config.json.dist que se encuentra en la ruta:')
        log.success(configPath);
        log.show();
        log.show('configura sus opciones, renómbralo a config.json y guarda en la misma carpeta');
        log.show('================================================================================');
        log.show();
    }

}

function getConfigJsonInfo() {
    log.show();

    if (!hasExtensionName) {
        log.error_('Error ');
        log.error('Debes revisar el fichero config.json');
    } else {
        log.success_('Fichero config.json ');
        log.show();
        log.info_('Configuración actual ')
        log.show("El nombre de la extensión es:");
        log.success(extName);
        log.show();
        log.show("La ruta absoluta a la instalación de joomla es:");
        log.success(srcDir);
        log.show();
        log.show("Los paquetes generados serán alojados en la siguiente ruta:");
        log.success(`${destDir}/${extName}`);
        correctMessage();
    }
}

function hasExtensionName() {

    if (extName == 'undefined' || extName == '') {
        log.show('Debes indicar en la constante \"extName\" el nombre de la extensión');
        return false;
    }

    return true;
}

function hasConfigJsonFile() {
    if (fs.existsSync(path.join(configPath, 'config.json'))) {
        return true;
    }

    return false;
}

function hasExtensionConfigFile(){
    if (fs.existsSync(`${srcDir}/${extName}/extensions-config.json`)){
        return true;
    }
    return false;
}

function correctMessage(){
    console.log('Comprueba que estos datos sean correctos\nSi no es así corríjalos')
}

module.exports = {
    initialInfo,
    hasConfigJsonFile
}