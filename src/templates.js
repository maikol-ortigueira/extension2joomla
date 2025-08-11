const Template = require("./Template");
const { has, get } = require("./utils");
const { task, parallel } = require("gulp");

if (has('templates')) {
    const templates = get('templates');
    let cleanTemplates = [],
        copyTemplates = [],
        copyProTemplates = [],
        watchTemplates = [],
        releaseTemplates = [],
        uploadTemplates = [],
        arsTemplates = [];

    for (let client in templates) {
        templates[client].forEach(extension => {
            extension.client = client;

            let temp = new Template(extension)

            cleanTemplates.push(temp.cleanTask)
            copyTemplates.push(temp.copyTask)
            copyProTemplates.push(temp.copyProTask)
            watchTemplates.push(temp.watchTask)
            releaseTemplates.push(temp.releaseTask)
            uploadTemplates.push(temp.uploadTask)
            arsTemplates.push(temp.arsTask)
        })
    }

    task(`cleanTemplates`, parallel(...cleanTemplates));
    task(`copyTemplates`, parallel(...copyTemplates));
    task(`copyProTemplates`, parallel(...copyProTemplates));
    task(`watchTemplates`, parallel(...watchTemplates));
    task(`releaseTemplates`, parallel(...releaseTemplates));
    task(`uploadTemplates`, parallel(...uploadTemplates));
    task(`arsTemplates`, parallel(...arsTemplates));
}