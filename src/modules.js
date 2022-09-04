const { task, parallel } = require("gulp");
const Modulo = require("./Modulo");
const { hasModules, getModules } = require("./utils");

if (hasModules) {
    const clients = getModules();
    let cleanModules = [],
        copyModules = [],
        watchModules = [],
        backupModules = [],
        releaseModules = []

    for (let client in clients) {
        clients[client].forEach(name => {
            let module = new Modulo(name, client)

            cleanModules.push(module.cleanTask)
            copyModules.push(module.copyTask)
            watchModules.push(module.watchTask)
            backupModules.push(module.backupTask)
            releaseModules.push(module.releaseTask)
        })
    }

    task(`cleanModules`, parallel(...cleanModules));
    task(`copyModules`, parallel(...copyModules));
    task(`watchModules`, parallel(...watchModules));
    task(`backupModules`, parallel(...backupModules));
    task(`releaseModules`, parallel(...releaseModules));    
}