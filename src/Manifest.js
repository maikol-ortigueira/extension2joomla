var xml2js = require('xml2js');
var fs = require('fs');

// Clase Manifest
class Manifest {
    /**
     * @param string ruta 
     */
    constructor(ruta, tipo, nombre, grupo = '') {
        ruta = ruta.charAt(ruta.length - 1) == '/' ? ruta.toLowerCase() : ruta.toLowerCase() + '/';
        this.ruta = ruta;

        if (tipo.toLowerCase() === 'library')
        {
            tipo = 'libraries';
        } else {
            tipo = tipo.charAt(tipo.length - 1) == 's' ? tipo.toLowerCase() : tipo.toLowerCase() + 's';
        }
        this.tipo = tipo;

        nombre = nombre.toLowerCase();
        this.nombre = nombre;

        switch (tipo) {
            case 'modules':
                nombre = nombre.substring(0, 4) == 'mod_' ? nombre : 'mod_' + nombre;
                tipo = grupo.toLowerCase() == 'admin' || grupo.toLowerCase() == 'administrator' ? 'administrator/' + tipo : tipo;
                tipo = tipo + '/' + nombre + '/';
                this.prefijo = 'mod';
                break;
            case 'plugins':
                tipo = tipo + '/' + grupo.toLowerCase() + '/' + nombre + '/';
                this.prefijo = 'plg';
                break;
            case 'components':
            case 'libraries':
            case 'files':
            case 'templates':
                tipo = tipo + '/' + grupo + '/' + nombre + '/';
                break;
        }

        this.filename = this.tipo == 'templates' ? ruta + tipo + 'templateDetails.xml' : ruta + tipo + nombre + '.xml';

        let archivoManifiesto = fs.readFileSync(this.filename, 'utf-8');

        xml2js.parseString(archivoManifiesto, (err, result) => {
            if (err) {
                console.error(err);
                throw err;
            }

            this.manifest = result.extension;
        })
    }

    get manifiesto() {
        return this.manifest;
    }

    hasMedia() {
        return this.manifest.media !== undefined;
    }

    
    // set manifest() {
    //     xml2js.parseString(templateDetails, (err, result) => {
    //         if (err) {
    //             console.error(err);
    //             throw err;
    //         }
    
    //         let manifest = result.extension;
    
    //         let client = manifest.$.client; // cliente site o admin
    //         let folders = manifest.files[0].folder; // Array de nombres de carpetas de la plantilla
    //         let files = manifest.files[0].filename; // Array de nombres archivos de la plantilla
    //         let hasMedia = manifest.media !== undefined; // Comprobar si hay archivos media
    //         if (hasMedia) {
    //             var mediaSrc = manifest.media[0].$.destination; // destino de los archivos y carpetas media de la plantilla
    //             var mediaFiles = manifest.media[0].filename; // Array de nombres de archivos de la carpeta media
    //             var mediaFolders = manifest.media[0].folder; // Array de nombres de carpetas de media
    //         }
    //         let languages = manifest.languages[0] // idiomas
    //         let languagesFolder = languages.$.folder; // Nombre de la carpeta idiomas en el empaquetado
    //         let langs = languages.language  // Array con nombre y atributo tag de los ficheros de idioma en formato xx-XX/tpl_plantilla.ini
    //         // para recuperar el nombre debemos usar langs[n]._
    // }
}

module.exports = Manifest;