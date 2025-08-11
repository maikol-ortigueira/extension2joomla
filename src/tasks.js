const { series } = require('gulp');
const Package = require('./Package');
const { has } = require('./utils');

var cleanTasks = []
    copyTasks = [],
    copyProTasks = [],
    releaseTasks = [],
    uploadTasks = [],
    arsTasks = [],
    watchTasks = [];

if (has('components')) {
    var componentsTasks = require('./components');

    // Add tasks to gulp main tasks
    cleanTasks.push('cleanComponents');
    copyTasks.push('copyComponents');
    copyProTasks.push('copyProComponents');
    releaseTasks.push('releaseComponents');
    uploadTasks.push('uploadComponents');
    arsTasks.push('arsComponents');
    watchTasks.push('watchComponents');
}

if (has('plugins')) {
    const pluginsTasks = require('./plugins');

    // Add tasks to gulp main tasks
    cleanTasks.push('cleanPlugins');
    copyTasks.push('copyPlugins');
    copyProTasks.push('copyProPlugins');
    releaseTasks.push('releasePlugins');
    uploadTasks.push('uploadPlugins');
    arsTasks.push('arsPlugins');
    watchTasks.push('watchPlugins');
}

if (has('modules')) {
    const modulesTasks = require('./modules');

    // Add tasks to gulp main tasks
    cleanTasks.push('cleanModules');
    copyTasks.push('copyModules');
    releaseTasks.push('releaseModules');
    watchTasks.push('watchModules');
}

if (has('templates')) {
    const templateTasks = require('./templates')

    // Add tasks to gulp main tasks
    cleanTasks.push('cleanTemplates');
    copyTasks.push('copyTemplates');
    releaseTasks.push('releaseTemplates');
    watchTasks.push('watchTemplates');
}

if (has('files')) {
    const filesTasks = require('./files');

    // Add tasks to gulp main tasks
    cleanTasks.push('cleanFiles');
    copyTasks.push('copyFiles');
    releaseTasks.push('releaseFiles');
}

if (has('libraries')) {
    const librariesTasks = require('./libraries');

    // Add tasks to gulp main tasks
    cleanTasks.push('cleanLibraries');
    copyTasks.push('copyLibraries');
    releaseTasks.push('releaseLibraries');
    watchTasks.push('watchLibraries');
}


exports.cleanTasks = cleanTasks;
exports.copyTasks = copyTasks;
exports.releaseTasks = releaseTasks;
exports.watchTasks = watchTasks;
exports.uploadTasks = uploadTasks;
exports.arsTasks = arsTasks;
