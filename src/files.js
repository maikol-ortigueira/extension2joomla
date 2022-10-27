const { task, parallel } = require("gulp");
const Archivo = require("./Archivo");
const { hasFiles, getFilesNames } = require("./utils");

if (hasFiles) {
    const files = getFilesNames();
    let cleanFiles = [],
        copyFiles = [],
        releaseFiles = [];

    files.forEach(name => {
        let file = new Archivo(name);

        cleanFiles.push(file.cleanTask);
        copyFiles.push(file.copyTask);
        releaseFiles.push(file.releaseTask);
    });

    task(`cleanFiles`, parallel(...cleanFiles));
    task(`copyFiles`, parallel(...copyFiles));
    task(`releaseFiles`, parallel(...releaseFiles));
}