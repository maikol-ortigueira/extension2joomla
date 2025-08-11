const { task, parallel } = require("gulp");
const Component = require("./Component");
const { has, get } = require("./utils");

if (has('components')) {
    const components = get('components');
    let cleanComponents = [], 
        copyComponents = [],
        copyProComponents = [],
        watchComponents = [],
        releaseComponents = [],
        uploadComponents = [],
        arsComponents = [];

    components.forEach(extension => {

        let component = new Component(extension);

        cleanComponents.push(component.cleanTask);
        copyComponents.push(component.copyTask);
        copyProComponents.push(component.copyProTask);
        watchComponents.push(component.watchTask);
        releaseComponents.push(component.releaseTask);
        uploadComponents.push(component.uploadTask);
        arsComponents.push(component.arsTask);
    });

    task(`cleanComponents`, parallel(...cleanComponents));
    task(`copyComponents`, parallel(...copyComponents));
    task(`copyProComponents`, parallel(...copyProComponents));
    task(`watchComponents`, parallel(...watchComponents));
    task(`releaseComponents`, parallel(...releaseComponents));
    task(`uploadComponents`, parallel(...uploadComponents));
    task(`arsComponents`, parallel(...arsComponents));
}