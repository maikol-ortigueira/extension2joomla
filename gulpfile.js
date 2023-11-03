const { hasConfigJsonFile, initialInfo } = require('./src/info');

if (hasConfigJsonFile() === false) {
    initialInfo();
} else {
    const tareas = require('./src/tasks');
    const utils = require('./src/utils')
    const {task, series, parallel} = require('gulp')
    
    task('clean', series(...tareas.cleanTasks));
    task('copy', series(...tareas.copyTasks));
    task('release', series(...tareas.releaseTasks, cb => {
        if (utils.hasPackages()) {
            tareas.releasePackage
        } 
        cb()
    }));
    task('watch', parallel(...tareas.watchTasks));
    
    task('default', series('watch'));
}