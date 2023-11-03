const { task, parallel } = require("gulp");
const Component = require("./Component");
const { hasComponents, getComponentsNames } = require("./utils");

if (hasComponents) {
    const components = getComponentsNames();
    let cleanComponents = [], 
        copyComponents = [], 
        watchComponents = [],
        releaseComponents = [];

    components.forEach(name => {
        let component = new Component(name);

        cleanComponents.push(component.cleanTask);
        copyComponents.push(component.copyTask);
        watchComponents.push(component.watchTask);
        releaseComponents.push(component.releaseTask);
    });

    task(`cleanComponents`, parallel(...cleanComponents));
    task(`copyComponents`, parallel(...copyComponents));
    task(`watchComponents`, parallel(...watchComponents));
    task(`releaseComponents`, parallel(...releaseComponents));
}