const {
    extName,
    srcDir,
    destDir
} = require('../config.json');
var fs = require('fs'),
    xmlQuery = require('xml-query'),
    xmlReader = require('xml-reader');

const path = require('path');
const log = require('log-beautify');

var configPath = path.join(__dirname, '..');

if (extName == 'undefined' || extName == '') {
    console.error('\x1b[1m\x1b[33m=============================================================================================== ');
    console.error("\x1b[37m|\n|   \x1b[31m!Error en el fichero \x1b[37m\"config.json\"\x1b[31m!\x1b[37m\n|");
    console.error("|   Este fichero se encuentra en la carpeta:\n|");
    console.error("|\x1b[32m   " + configPath + "\n\x1b[37m|");
    console.error("|   Falta indicar el nombre de la extensión en la variable \x1b[34m\"extName\": \"\x1b[36mnombre_de_la_extension\x1b[34m\"\x1b[31m\n\x1b[37m|");
    console.error('\x1b[33m===============================================================================================\x1b[0m');

    return false;
}

if (!fs.existsSync(`${srcDir}/extensions-config.json`)) {
    console.error('\x1b[1m\x1b[33m=============================================================================================== ');
    console.error("\x1b[37m|\n|   \x1b[31m¡¡Error!!\x1b[37m   Falta el fichero de configuración de la extensión\n|");
    console.error("|   Debes crear un fichero con el nombre \"\x1b[32mextensions-config.json\x1b[37m\" en la siguiente carpeta:\n|")
    console.error("|   \x1b[32m" + `${srcDir}/`);
    console.error("\x1b[37m|\n|   Puedes copiar, pegar y sustituir los valores del fichero \"extension-config.json.dist\".");
    console.error("|   Deberás renombrarlo eliminando la extension \".dist\"\n|");
    console.error('\x1b[33m===============================================================================================\x1b[0m');
}
const extConfig = require(`${srcDir}/extensions-config.json`);

const hasComponents = () => {
    let hasComponents = extConfig.hasOwnProperty('components') &&
        extConfig.components.length > 0 &&
        extConfig.components[0] != ''

    return hasComponents
}

const getComponentsNames = () => {
    if (hasComponents()) {
        return extConfig.components;
    }
    return false;
}

const hasLibraries = () => {
    let hasLibraries = extConfig.hasOwnProperty('libraries') &&
        extConfig.libraries.length > 0 &&
        extConfig.libraries[0] != ''

    return hasLibraries
}

const getLibrariesNames = () => {
    if (hasLibraries()) {
        return extConfig.libraries;
    }
    return false;
}

const hasFiles = () => {
    return (
        extConfig.hasOwnProperty('files') &&
        extConfig.files.length > 0 &&
        extConfig.files[0] != ''
    );
}

const getFilesNames = () => {
    return extConfig.files;
}

const hasPackages = () => {
    return (
        extConfig.hasOwnProperty('package') &&
        extConfig.package.name != ''
    );
}

const getPackageName = () => {
    if (hasPackages()) {
        return extConfig.package;
    }
    return false;
}

const hasPlugins = () => {
    if (extConfig.hasOwnProperty('plugins')) {
        var groups = extConfig.plugins;
        for (let group in groups) {
            if (
                extConfig.plugins[group].length > 0 &&
                extConfig.plugins[group][0] != ''
            ) {
                return true
            }
        }
    }
    return false;
}

const getPlugins = () => {
    if (hasPlugins()) {
        return extConfig.plugins;
    }
    return false;
}

const hasModules = () => {
    if (extConfig.hasOwnProperty('modules')) {
        var clients = extConfig.modules;
        for (let client in clients) {
            if (
                extConfig.modules[client].length > 0 &&
                extConfig.modules[client][0] != ''
            ) {
                return true
            }
        }
    }
    return false;
}

const getModules = () => {
    if (hasModules()) {
        return extConfig.modules;
    }
    return false;
}

const hasTemplates = () => {
    if (extConfig.hasOwnProperty('templates')) {
        let clients = extConfig.templates
        for (let client in clients) {
            if (
                extConfig.templates[client].length > 0 &&
                extConfig.templates[client][0] != ''
            ) {
                return true
            }
        }

        return false;
    }
}

const getTemplates = () => {
    if (hasTemplates()) {
        return extConfig.templates
    }

    return false;
}

/**
 *
 * @param {string} element The element to retrieve
 * @param {string} file the file absolute path
 * @returns {string}
 */
const getXmlElement = (element, file) => {
    var xml = fs.readFileSync(file, 'utf-8');

    var ast = xmlReader.parseSync(xml);
    var xq = xmlQuery(ast);

    return xq.find(element).text();
}

const limpiarRuta = (ruta) => {
    ruta = ruta.charAt(ruta.length - 1) == '/' ? ruta : ruta + '/';
    return ruta;
}

const getManisfestFiles = (files, rutaDesde) => {
    let ficheros = [];
    if (files[0].filename === undefined) {
        return ficheros;
    }
    files[0].filename.forEach(file => {
        if (file['_'] !== undefined) {
            file = file['_']
        }
        ficheros.push(`${rutaDesde}${file}`)
    });

    return ficheros;
}

const getManisfestFolders = (files, rutaDesde) => {
    let carpetas = [];
    if (files[0].folder === undefined) {
        return carpetas;
    }
    files[0].folder.forEach(folder => {
        carpetas.push(`${rutaDesde}${folder}/**/*.*`)
    });

    return carpetas;
}

const getManifestLanguages = (languages, rutaLanguageDesde, folder = '') => {
    let idiomas = [];
    let lngs = languages[0].language;
    if (lngs === undefined) {
        return idiomas;
    }

    if (folder === '') {
        folder = languages[0].$.folder;
    }

    var tags = [];
    lngs.forEach(l => {
        if (!tags.includes(l.$.tag)) {
            tags.push(l.$.tag)
        }
    })
    tags.forEach(t => {
        idiomas[t] = {
            "files": [],
            "destFolder": ''
        }
    })

    lngs.forEach(l => {
        let langArray = l['_'].split('/');
        let file = langArray.pop();
        let destFolder = folder + '/' + langArray.join('/');
        idiomas[l.$.tag].files.push(file);
        idiomas[l.$.tag].destFolder = destFolder;
    })

    let fullnames = [];

    for (const lang in idiomas) {
        idiomas[lang].files.forEach(file => {
            fullnames.push(`${rutaLanguageDesde}${lang}/${file}`)
        })
    }

    return fullnames;
}

const getDefault = (busca, predeterminado) => {
    return busca !== undefined && busca !== '' ? busca : predeterminado
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
    let prueba = fs.existsSync(p)

    if (fs.existsSync(p) === false)
        return false
    return fs.readdirSync(p, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && fs.readdirSync(`${p}${dirent.name}`).length !== 0)
        .map(dirent => dirent.name)
}

module.exports = {
    hasComponents,
    getComponentsNames,
    hasLibraries,
    getLibrariesNames,
    hasFiles,
    getFilesNames,
    hasPackages,
    getPackageName,
    hasPlugins,
    getPlugins,
    hasModules,
    getModules,
    hasTemplates,
    getTemplates,
    getXmlElement,
    limpiarRuta,
    getManisfestFiles,
    getManisfestFolders,
    getManifestLanguages,
    getDefault,
    getFecha,
    getNotEmptyFolderNames
}
