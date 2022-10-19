const tareas = require('./src/tasks');
const {task, series, parallel} = require('gulp')

task('clean', series(...tareas.cleanTasks));
task('copy', series(...tareas.copyTasks));
task('release', series(...tareas.releaseTasks, tareas.releasePackage));
task('watch', parallel(...tareas.watchTasks));
task('backup', parallel(...tareas.backupTasks));

task('default', series('watch'));