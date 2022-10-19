const Template = require("./Template");
const { getTemplates } = require("./utils");
const { task, parallel } = require("gulp");

if (getTemplates !== false) {
    const templates = getTemplates();
    let cleanTemplates = [],
        copyTemplates = [],
        watchTemplates = [],
        backupTemplates = [],
        releaseTemplates = [];

    templates.forEach(name => {
        let temp = new Template(name)

        cleanTemplates.push(temp.cleanTask)
        copyTemplates.push(temp.copyTask)
        watchTemplates.push(temp.watchTask)
        backupTemplates.push(temp.backupTask)
        releaseTemplates.push(temp.releaseTask)
    })

    task(`cleanTemplates`, parallel(...cleanTemplates));
    task(`copyTemplates`, parallel(...copyTemplates));
    task(`watchTemplates`, parallel(...watchTemplates));
    task(`backupTemplates`, parallel(...backupTemplates));
    task(`releaseTemplates`, parallel(...releaseTemplates));
}