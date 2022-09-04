const { task, parallel } = require("gulp");
const Library = require("./Library");
const { hasLibraries, getLibrariesNames } = require("./utils");

if (hasLibraries) {
    const libraries = getLibrariesNames();
    let cleanLibraries = [], 
        copyLibraries = [], 
        watchLibraries = [],
        backupLibraries = [],
        releaseLibraries = [];

    libraries.forEach(name => {
        let library = new Library(name);

        cleanLibraries.push(library.cleanTask);
        copyLibraries.push(library.copyTask);
        watchLibraries.push(library.watchTask);
        backupLibraries.push(library.backupTask);
        releaseLibraries.push(library.releaseTask);
    });

    task(`cleanLibraries`, parallel(...cleanLibraries));
    task(`copyLibraries`, parallel(...copyLibraries));
    task(`watchLibraries`, parallel(...watchLibraries));
    task(`backupLibraries`, parallel(...backupLibraries));
    task(`releaseLibraries`, parallel(...releaseLibraries));
}