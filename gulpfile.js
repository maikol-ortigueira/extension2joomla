require(`./src/init`)

const tareas = require('./src/tasks');
const utils = require('./src/utils')
const {task, series, parallel} = require('gulp');
const ARSClient = require('./src/ARS/ARSClient');

task('clean', series(...tareas.cleanTasks));
task('copy', series(...tareas.copyTasks));
task('upload', series(...tareas.uploadTasks));

task('ars', async function() {
    let ars = new ARSClient();
    let hasConnection = await ars.checkConnection();
    if (hasConnection) {
        console.log('ARS connection OK');
        return series(...tareas.arsTasks)();
    } else {
        console.log('Connection failed');
    }
});

task('release', series(...tareas.releaseTasks, cb => {
    if (utils.hasPackages()) {
        tareas.releasePackage
    } 
    cb()
}));
task('watch', parallel(...tareas.watchTasks));

task('default', series('watch'));
