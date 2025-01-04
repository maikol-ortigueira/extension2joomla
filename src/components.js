const { task, parallel } = require("gulp");
const Component = require("./Component");
const { hasComponents, getComponents } = require("./utils");

if (hasComponents) {
    const components = getComponents();
    let cleanComponents = [], 
        copyComponents = [], 
        watchComponents = [],
        releaseComponents = [],
        uploadComponents = [],
        arsComponents = [];

    components.forEach(extension => {
        let componentName = extension;
        let ars = {};

        if (typeof extension === 'object') {
            componentName = extension.name;
            ars = extension.ars;
        }
        let component = new Component(componentName, ars);

        cleanComponents.push(component.cleanTask);
        copyComponents.push(component.copyTask);
        watchComponents.push(component.watchTask);
        releaseComponents.push(component.releaseTask);
        uploadComponents.push(component.uploadTask);
        arsComponents.push(component.arsTask);
    });

    task(`cleanComponents`, parallel(...cleanComponents));
    task(`copyComponents`, parallel(...copyComponents));
    task(`watchComponents`, parallel(...watchComponents));
    task(`releaseComponents`, parallel(...releaseComponents));
    task(`uploadComponents`, parallel(...uploadComponents));
    task(`arsComponents`, parallel(...arsComponents));
}