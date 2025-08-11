const Extension = require('./Extension');
const capitalize = require('capitalize')

class Plugin extends Extension {
    constructor(extension) {
        extension.ms = `plugins/${extension.group.toLowerCase()}`;
        extension.md = `plugins/${extension.group.toLowerCase()}`;
        extension.type = 'plugin';
        extension.prefix = 'plg_';
        super(extension);

        this.group = extension.group.toLowerCase();
        this.taskName = `Plugin${capitalize(this.group)}${capitalize(this._name)}`;
    }

    get zipFileName() {
        let suffix = '';

        if (this.pro !== null) {
            suffix = this.pro.core_suffix;

            if (!suffix.startsWith('-') && suffix !== '') {
                suffix = `-${suffix}`;
            }
        }

        return `plg_${this.group}_${this._name}${suffix}.v${this.version}.zip`;
    }

    get proZipFileName() {
        let suffix = '-pro';

        if (this.pro !== null) {
            suffix = this.pro.pro_suffix;

            if (!suffix.startsWith('-') && suffix !== '') {
                suffix = `-${suffix}`;
            }
        }
        return `plg_${this.group}_${this._name}${suffix}.v${this.version}.zip`;
    }

    get langfileName() {
        return `plg_${this.group}_${this._name}`;
    }

    get langDest() {
        return `${this.dPath}administrator/language/`;
    }
}

module.exports = Plugin