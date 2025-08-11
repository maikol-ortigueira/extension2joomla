const capitalize = require("capitalize");
const Extension = require("./Extension");

class Template extends Extension {
    constructor(extension) {
        this.client = extension.client.toLowerCase();
        this.type = 'template';
        extension.ms = `template/${extension.client}`;
        extension.md = `template/${extension.client}`;
        extension.type = this.type;
        extension.prefix = 'tpl_';
        super(extension);

        this.taskName = `Template${capitalize(this.client)}${capitalize(this._name)}`;
    }

    get manifestFileName() {
        return `templateDetails.xml`;
    }
}

module.exports = Template;