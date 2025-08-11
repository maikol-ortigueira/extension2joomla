const { task, parallel } = require("gulp");
const Library = require("./Library");
const { has, get } = require("./utils");

if (has('libraries')) {
    const libraries = get('libraries');
    let cleanLibraries = [], 
        copyLibraries = [],
        copyProLibraries = [],
        watchLibraries = [],
        releaseLibraries = [],
        uploadLibraries = [],
        arsLibraries = [];

    libraries.forEach(extension => {
        let library = new Library(extension);

        cleanLibraries.push(library.cleanTask);
        copyLibraries.push(library.copyTask);
        copyProLibraries.push(library.copyProTask);
        watchLibraries.push(library.watchTask);
        releaseLibraries.push(library.releaseTask);
        uploadLibraries.push(library.uploadTask);
        arsLibraries.push(library.arsTask);
    });

    task(`cleanLibraries`, parallel(...cleanLibraries));
    task(`copyLibraries`, parallel(...copyLibraries));
    task(`copyProLibraries`, parallel(...copyProLibraries));
    task(`watchLibraries`, parallel(...watchLibraries));
    task(`releaseLibraries`, parallel(...releaseLibraries));
    task(`uploadLibraries`, parallel(...uploadLibraries));
    task(`arsLibraries`, parallel(...arsLibraries));
}