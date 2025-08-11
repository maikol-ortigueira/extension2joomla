const { task, parallel } = require("gulp");
const Modulo = require("./Modulo");
const { has, get } = require("./utils");

if (has('modules')) {
    const clients = get('modules');
    let cleanModules = [],
        copyModules = [],
        copyProMudules = [],
        watchModules = [],
        releaseModules = [],
        uploadModules = [],
        arsModules = [];

    for (let client in clients) {
        clients[client].forEach(extension => {
            extension.client = client;

            let module = new Modulo(extension);

            cleanModules.push(module.cleanTask)
            copyModules.push(module.copyTask)
            copyProMudules.push(module.copyProTask)
            watchModules.push(module.watchTask)
            releaseModules.push(module.releaseTask)
            uploadModules.push(module.uploadTask)
            arsModules.push(module.arsTask)
        })
    }

    task(`cleanModules`, parallel(...cleanModules));
    task(`copyModules`, parallel(...copyModules));
    task(`copyProModules`, parallel(...copyProMudules));
    task(`watchModules`, parallel(...watchModules));
    task(`releaseModules`, parallel(...releaseModules));
    task(`uploadModules`, parallel(...uploadModules));
    task(`arsModules`, parallel(...arsModules));
}