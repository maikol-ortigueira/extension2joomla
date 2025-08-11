const capitalize = require('capitalize');
const Extension = require('./Extension');

class Library extends Extension {
    constructor(extension) {
        this.type = 'library';
        extension.ms = `libraries`;
        extension.md = `libraries`;
        extension.type = this.type;
        extension.prefix = 'lib_';
        super(extension);

        this.taskName = `Library${capitalize(this._name)}`;
    }
}

module.exports = Library