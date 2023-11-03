const { series } = require('gulp');
const Package = require('./Package');
const utils = require('./utils');

var cleanTasks = []
    copyTasks = [],
    releaseTasks = [],
    backupTasks = [],
    watchTasks = [];

var releasePackage;

if (utils.hasComponents()) {
    var componentsTasks = require('./components');

    // Add tasks to gulp main tasks
    cleanTasks.push('cleanComponents');
    copyTasks.push('copyComponents');
    releaseTasks.push('releaseComponents');
    backupTasks.push('backupComponents');
    watchTasks.push('watchComponents');
}

if (utils.hasPlugins()) {
    const pluginsTasks = require('./plugins');

    // Add tasks to gulp main tasks
    cleanTasks.push('cleanPlugins');
    copyTasks.push('copyPlugins');
    releaseTasks.push('releasePlugins');
    backupTasks.push('backupPlugins');
    watchTasks.push('watchPlugins');
}

if (utils.hasModules()) {
    const modulesTasks = require('./modules');

    // Add tasks to gulp main tasks
    cleanTasks.push('cleanModules');
    copyTasks.push('copyModules');
    releaseTasks.push('releaseModules');
    backupTasks.push('backupModules');
    watchTasks.push('watchModules');
}

if (utils.hasTemplates()) {
    const templateTasks = require('./templates')

    // Add tasks to gulp main tasks
    cleanTasks.push('cleanTemplates');
    copyTasks.push('copyTemplates');
    releaseTasks.push('releaseTemplates');
    backupTasks.push('backupTemplates');
    watchTasks.push('watchTemplates');
}

if (utils.hasFiles()) {
    const filesTasks = require('./files');

    // Add tasks to gulp main tasks
    cleanTasks.push('cleanFiles');
    copyTasks.push('copyFiles');
    releaseTasks.push('releaseFiles');
    // backupTasks.push('backupFiles');
}

if (utils.hasPackages()) {
    let pkg = new Package();
    releasePackage = series(pkg.cleanTask, pkg.copyTask, pkg.releaseTask)
}

if (utils.hasLibraries()) {
    const librariesTasks = require('./libraries');

    // Add tasks to gulp main tasks
    cleanTasks.push('cleanLibraries');
    copyTasks.push('copyLibraries');
    releaseTasks.push('releaseLibraries');
    backupTasks.push('backupLibraries');
    watchTasks.push('watchLibraries');
}

exports.cleanTasks = cleanTasks;
exports.copyTasks = copyTasks;
exports.releaseTasks = releaseTasks;
exports.backupTasks = backupTasks;
exports.watchTasks = watchTasks;
exports.releasePackage = releasePackage
