var xml2js = require('xml2js');
var fs = require('fs');
const { limpiarRuta } = require('./utils');

// Clase Manifest
class Manifest {
    /**
     * @param string ruta
     */
    constructor(ruta, tipo, nombre, grupo = '') {
        this.ruta = ruta;
        this.tipo = tipo;
        this.nombre = nombre;
        this.grupo = grupo;
        this.extFileName = this.nombre;
        this.extFilePath = this.tipo;
        this.filename = "";
        this.manifesto = this.filename;
    }

    /**
     * @param {string} tipo
     */
    set tipo(tipo) {
        if (tipo.toLowerCase() === 'library')
        {
            tipo = 'libraries';
        } else {
            tipo = tipo.charAt(tipo.length - 1) == 's' ? tipo.toLowerCase() : tipo.toLowerCase() + 's';
        }

        this._tipo = tipo;
    }

    get tipo() {
        return this._tipo;
    }

    set nombre(nombre) {
        nombre = nombre.toLowerCase();
        this._nombre = nombre;
    }

    get nombre() {
        return this._nombre;
    }

    set ruta(ruta) {
        ruta = limpiarRuta(ruta);
        this._ruta = ruta;
    }

    get ruta() {
        return this._ruta;
    }

    set grupo(grupo) {
        grupo = grupo.toLowerCase();
        this._grupo = grupo;
    }

    get grupo() {
        return this._grupo;
    }

    set filename(vacio) {
        this._filename = this.extFilePath + this.extFileName + '.xml';
    }

    get filename() {
        return this._filename;
    }

    set extFileName(nombre) {

        if (this.tipo == 'templates') {
            nombre = 'templateDetails';
        }

        if (this.tipo == 'modules') {
            nombre = nombre.substring(0, 4) == 'mod_' ? nombre : 'mod_' + nombre;
        }

        this._extFileName = nombre;
    }

    get extFileName() {
        return this._extFileName;
    }

    set extFilePath(tipo) {
        let nombre = this.nombre;
        let filePath = this.ruta + tipo + '/';
        let grupo = this.grupo;

        if (tipo == 'modules') {
            grupo = grupo == 'admin' || grupo == 'administrator' ? 'admin' : grupo;
        }

        if (grupo !== '') {
            filePath = filePath + grupo + '/';
        }

        filePath = filePath + nombre + '/';

        this._extFilePath = filePath;
    }

    get extFilePath() {
        return this._extFilePath;
    }

    set manifesto(filename) {
        let archivoManifiesto = fs.readFileSync(filename, 'utf-8');

        xml2js.parseString(archivoManifiesto, (err, result) => {
            if (err) {
                console.error(err);
                throw err;
            }

            this._manifest = result.extension;
        });
    }

    get manifiesto() {
        return this._manifest;
    }

    hasMedia() {
        return this.manifesto.media !== undefined;
    }
}

module.exports = Manifest;