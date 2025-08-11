const { task, parallel } = require("gulp");
const Archivo = require("./Archivo");
const { has, get } = require("./utils");

if (has('files')) {
    const files = get('files');
    let cleanFiles = [],
        copyFiles = [],
        copyProFiles = [],
        releaseFiles = [],
        uploadFiles = [],
        arsFiles = [];

    files.forEach(extension => {
        let file = new Archivo(extension);

        cleanFiles.push(file.cleanTask);
        copyFiles.push(file.copyTask);
        copyProFiles.push(file.copyProTask);
        releaseFiles.push(file.releaseTask);
        uploadFiles.push(file.uploadTask);
        arsFiles.push(file.arsTask);
    });

    task(`cleanFiles`, parallel(...cleanFiles));
    task(`copyFiles`, parallel(...copyFiles));
    task(`copyProFiles`, parallel(...copyProFiles));
    task(`releaseFiles`, parallel(...releaseFiles));
    task(`uploadFiles`, parallel(...uploadFiles));
    task(`arsFiles`, parallel(...arsFiles));
}