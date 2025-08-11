const capitalize = require('capitalize');
const Extension = require('./Extension');

class Archivo extends Extension {
    constructor(extension) {
        this.type = 'file';
        extension.ms = `files`;
        extension.md = `files`;
        extension.type = this.type;
        extension.prefix = '';
        super(extension);

        this.taskName = `File${capitalize(this._name)}`;
    }
}

module.exports = Archivo;