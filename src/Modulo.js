const capitalize = require('capitalize')
const Extension = require('./Extension')

class Modulo extends Extension {
    constructor(extension) {
        extension.ms = `modules/${extension.client}`;
        extension.md = `modules/${extension.client}`;
        extension.type = 'module';
        extension.prefix = 'mod_';
        super(extension);

        this.client = extension.client.toLowerCase();
        this.type = 'module';
        this.taskName = `Module${capitalize(this.client)}${capitalize(this._name)}`;
    }

    get manifestFileName() {
        return `${this.prefixedName}.xml`;
    }
}

module.exports = Modulo