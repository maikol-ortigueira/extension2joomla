const ARSClient = require("./ARSClient");
const _slugify = require('slugify');
const marked = require('marked');
const fs = require('fs');

const slugify = (title) => {
    // check if title is not string
    if (typeof title !== 'string') {
        // convert to string
        title = title.toString();
    }

    // replace all dots with dash
    title = title.replace(/\./g, '-');
    
    return _slugify(title, {
        replacement: '-',
        lower: true,
        strict: true
    });
}

class ARS {
    constructor(data) {
        this.data = data;
    }

    async addNewItem() {
        let data = this.data;

        let ars = new ARSClient();
        let category_id, release_id = null;

        // check if category exists, if not create it and get the id
        console.log(`Checking if category \"${data.category.title}\" exists ...`);
        let category_data = {
            title: data.category.title,
            alias: slugify(data.category.title),
            description: data.category.description,
            directory: data.directory,
            published: data.published
        }
        let category = await ars.getCategoryByTitle(data.category.title);
        if (category === null) {
            console.log(`Category \"${data.category.title}\" not found, must create it ...`);
            // create category
            category_id = await ars.createCategory(category_data);
        } else {
            category_id = category.id;

            // update category
            console.log(`Trying to update it ...`);
            await ars.updateCategory(category_id, category_data);
        }

        // check if release exists, if not create it and get the id
        console.log(`Checking if release \"${data.version}\" exists ...`);
        let release_data = {
            version: data.version,
            alias: slugify(data.version),
            category_id: category_id,
            maturity: data.maturity,
            published: data.published,
            notes: this.getReleaseNotes(data.changelog_path)
        };

        let release = await ars.getRelease(category_id, data.version);
        if (release === null) {
            console.log(`Release \"${data.version}\" not found, must create it ...`);
            // create release
            release_id = await ars.createRelease(release_data);
        } else {
            release_id = release.id;

            // update release
            console.log(`Trying to update it ...`);
            await ars.updateRelease(release_id, release_data);
        }

        // check if item exists, if not create it
        console.log(`Checking if item \"${data.item.title}\" exists ...`);
        let item_data = {
            release_id: release_id,
            type: data.item.type,
            filename: data.filename,
            link: data.item.link,
            title: data.item.title,
            published: data.published
        };
        let item = await ars.getItem(release_id, data.item.title);
        if (item === null) {
            console.log(`Item \"${data.item.title}\" not found, must create it ...`);
            // create item
            await ars.createItem(item_data);
        } else {
            // update item
            console.log(`Trying to update it ...`);
            await ars.updateItem(item.id, item_data);
        }
    }

    set data(data) {
        let ars = data.ars;
        let parsedData = {
            category: ars.category,
            maturity: this.getMaturity(data.version.toString()),
            item: ars.item,
            filename: data.zipFileName,
            title: data.nombre,
            version: this.cleanVersion(data.version),
            directory: global.sftpRemotePath + '/' + data.uploadDest,
            published: ars.published,
            changelog_path: ars.changelog_path == undefined || ars.changelog_path == "" ? data.rutaDesde : ars.changelog_path
        };

        this._data = parsedData;
    }

    get data() {
        return this._data;
    }

    getReleaseNotes() {
        let filepath = this.data.changelog_path;
        let releaseNotes = this.parseReleaseNotes(filepath) + this.parseChangelog(filepath);

        return releaseNotes;
    }

    parseReleaseNotes() {
        let filepath = this.data.changelog_path;

        // check if file exists
        if (!fs.existsSync(`${filepath}RELEASENOTES.md`) && !fs.existsSync(`${filepath}RELEASENOTES.html`)) {
            console.error(`RELEASENOTES file not found at ${filepath}`);
            return "";
        }

        // check if file is markdown or html
        let releaseNotes = '';
        if (fs.existsSync(`${filepath}RELEASENOTES.md`)) {
            releaseNotes = fs.readFileSync(`${filepath}RELEASENOTES.md`, 'utf8');

            // convert markdown to html
            releaseNotes = marked.parse(releaseNotes);
        } else {
            releaseNotes = fs.readFileSync(`${filepath}RELEASENOTES.html`, 'utf8');
        }

        return releaseNotes;
    }

    parseChangelog() {
        let filepath = this.data.changelog_path;

        // check if file exists
        if (!fs.existsSync(`${filepath}CHANGELOG.md`) && !fs.existsSync(`${filepath}CHANGELOG`)) {
            console.error(`CHANGELOG file not found at ${filepath}`);
            return "";
        }

        let changelog = '';
        // read the file
        if (fs.existsSync(`${filepath}CHANGELOG`)) {
            changelog = fs.readFileSync(`${filepath}CHANGELOG`, 'utf8');
        } else {
            changelog = fs.readFileSync(`${filepath}CHANGELOG.md`, 'utf8');
        }

        // loop rows and remove until first line with === or ---
        changelog = changelog.split('\n');

        let start = false;
        let thisChangelog = [];
        for (let line of changelog) {
            if (start) {
                thisChangelog.push(line);
            }

            if (line.match(/^={3,}/) || line.match(/^-{3,}/)) {
                start = true;
            }

            // stop when line is empty
            if (line.trim() === '') {
                break;
            }
        }

        if (thisChangelog.length === 0) {
            return '';
        }

        // sort the array
        thisChangelog.sort();

        // Pick lines by type
        let sorted = {
            security: [],
            critical: [],
            new: [],
            removed: [],
            change: [],
            bugfix: [],
            language: [],
            misc: []
        };

        for (let line in thisChangelog) {
            // split line by space
            // first word is the type && the rest is text
            let words = thisChangelog[line].split(' ');
            let type = words.shift();
            let text = words.join(' ');

            switch (type) {
                case '*':
                    sorted.security.push(text);
                    break;
                case '+':
                    sorted.new.push(text);
                    break;
                case '-':
                    sorted.removed.push(text);
                    break;
                case '^':
                    sorted.change.push(text);
                    break;
                case '#':
                    sorted.bugfix.push(text);
                    break;
                case '$':
                    sorted.language.push(text);
                    break;
                case '~':
                    sorted.misc.push(text);
                    break;
                case '!':
                case '!!':
                    sorted.critical.push(text);
                    break;
            }
        }

        // Format the changelog
        let htmlChangelog = '<h3>Changelog</h3>';

        // types titles
        let types_titles = {
            security: 'Security fixes',
            bugfix: 'Bug fixes',
            language: 'Language fixes or changes',
            new: 'New features',
            change: 'Changes',
            misc: 'Miscellaneous changes',
            removed: 'Removed features',
            critical: 'Critical bugs and important changes'
        };

        for (let type in sorted) {
            if (sorted[type].length > 0) {
                htmlChangelog += `<h4>${types_titles[type]}</h4>`;
                htmlChangelog += '<ul>';
                for (let line of sorted[type]) {
                    htmlChangelog += `<li>${line}</li>`;
                }
                htmlChangelog += '</ul>';
            }
        }

        return htmlChangelog;
    }

    getMaturity(version) {
        version = version.toLowerCase();
        let versionParts = version.split('.');
        let lastPart = versionParts[versionParts.length - 1];

        // if last part starts with an "a" letter, it's a beta
        if (lastPart.startsWith('a')) {
            return 'alpha';
        }

        if (lastPart.startsWith('b')) {
            return 'beta';
        }

        if (lastPart.startsWith('rc')) {
            return 'rc';
        }

        return 'stable';
    }

    cleanVersion(version) {
        version = version.toString();
        // split version by dots
        let versionParts = version.split('.');
        let cleanParts = versionParts.map(v => {
            let numbers = v.match(/\d+/g);
            return numbers ? numbers.join('') : '';
        });

        return cleanParts.join('.');
    }
}

module.exports = ARS;
