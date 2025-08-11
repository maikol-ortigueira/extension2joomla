const { task, parallel } = require("gulp");
const { has, get } = require("./utils");
const Plugin = require('./Plugin');

if (has('plugins')) {
    const groups = get('plugins');

    let cleanPlugins = [],
        copyPlugins = [],
        copyProPlugins = [],
        watchPlugins = [],
        releasePlugins = [],
        uploadPlugins = [],
        arsPlugins = [];

    for (let type in groups) {
        groups[type].forEach(extension => {
            extension.group = type;

            let plugin = new Plugin(extension);

            cleanPlugins.push(plugin.cleanTask)
            copyPlugins.push(plugin.copyTask)
            copyProPlugins.push(plugin.copyProTask)
            watchPlugins.push(plugin.watchTask)
            releasePlugins.push(plugin.releaseTask)
            uploadPlugins.push(plugin.uploadTask)
            arsPlugins.push(plugin.arsTask)
        })
    }

    task(`cleanPlugins`, parallel(...cleanPlugins));
    task(`copyPlugins`, parallel(...copyPlugins));
    task(`copyProPlugins`, parallel(...copyProPlugins));
    task(`watchPlugins`, parallel(...watchPlugins));
    task(`releasePlugins`, parallel(...releasePlugins));
    task(`uploadPlugins`, parallel(...uploadPlugins));
    task(`arsPlugins`, parallel(...arsPlugins));
}