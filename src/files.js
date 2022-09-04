const { task, parallel } = require("gulp");
const Archivo = require("./Archivo");
const { hasFiles, getFilesNames } = require("./utils");

if (hasFiles) {
    const files = getFilesNames();
    let cleanFiles = [],
        copyFiles = [],
        watchFiles = [],
        releaseFiles = [];

    files.forEach(name => {
        let file = new Archivo(name);

        cleanFiles.push(file.cleanTask);
        copyFiles.push(file.copyTask);
        watchFiles.push(file.watchTask);
        releaseFiles.push(file.releaseTask);
    });

    task(`cleanFiles`, parallel(...cleanFiles));
    task(`copyFiles`, parallel(...copyFiles));
    task(`watchFiles`, parallel(...watchFiles));
    task(`releaseFiles`, parallel(...releaseFiles));
}