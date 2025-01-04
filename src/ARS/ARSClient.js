const axios = require('axios');
const base64 = require('base-64');

const user = "usuario";
const password = "joomla@2025";

class ARSClient {
    constructor() {
        let host = global.ARShost;

        // Check http|https prefix
        if (!host.includes('http')) {
            host = 'https://' + host;
        }
        
        this.apiUrl = host + '/api/index.php/v1/ars/';
        this.headers = {
            'Accept': 'application/vnd.api+json',
            'X-Joomla-Token': global.ARStoken,
            'Authorization': 'Basic ' + base64.encode(user + ':' + password)
        }
        this.content_type = 'text/json';
    }

    async checkConnection() {
        // check config vars
        let checkGlobalVars =[
            {
                'globalName':'ARShost',
                'varName':'ars_host'
            }, 
            {
                'globalName':'ARStoken',
                'varName':'ars_token'
            }
        ];

        for (let i = 0; i < checkGlobalVars.length; i++) {
            console.log(`Checking ${checkGlobalVars[i].varName} ...`);
            if (global[checkGlobalVars[i].globalName] === '') {
                console.error(`Error: ${checkGlobalVars[i].varName} is empty or not defined in config.json`);
                return false;
            }
            console.log(`${checkGlobalVars[i].varName} is OK`);
        }

        // check connection
        try {
            console.log(`Checking connection to ARS API on ${this.apiUrl}...`);
            let response = await axios.get(this.apiUrl + 'categories', {headers: this.headers});
            console.log('The connection to ARS API is OK');
            return true;
        } catch (error) {
            console.error('Error connecting to ARS API:', error.response ? error.response.data : error.message);
            return false;
        }
    }

    /**
     * Search for a category in ARS by title
     *
     * @param {String} title The category title to search
     * @returns {Promise<Object|null>} The category object or null if not found
     */
    async getCategoryByTitle(title) {
        // escape spaces
        title = title.replace(' ', '%20');

        try {
            console.log('Searching category with title: ', title);
            let url = this.apiUrl + 'categories?search=' + title;
            let response = await axios.get(url, {
                headers: this.headers
            });
            let data = response.data.data;
            if (data.length > 0) {
                console.log(`Found category: ${data[0].attributes.title} with ID: ${data[0].id}`);
                return data[0].attributes;
            }

            console.log(`Category with title: ${title} not found`);
            return null;
        } catch (error) {
            console.error('Error searching category by title:', error.response ? error.response.data : error.message);
        }
    }

    /**
     * Create a new category in ARS 
     * Category required fields are: title, alias, directory
     * 
     * @param {Object} category The category data
     * @returns {Promise<String>} The category ID created or false if error
     */
    async createCategory(category) {
        try {
            console.log('Creating category: ', category.title);
            let url = this.apiUrl + 'categories';
            let response = await axios.post(url, category, {
                headers: {
                    ...this.headers,
                    'Content-Type': this.content_type
                }
            });
            console.log('Category created with ID: ', response.data.data.id);
            return response.data.data.id;
        } catch (error) {
            console.error('Error creating category:', error.response ? error.response.data : error.message);
            return false;
        }
    }

    /**
     * Update a category in ARS by ID.
     * Must provide the ID of the category to update and the data to update.
     * 
     * @param {string} id The category ID
     * @param {Object} data The data to update
     * @returns {Promise<Boolean>} true if success, false if error
     */
    async updateCategory(id, data) {
        try {
            console.log('Updating category: ', id);
            let url = this.apiUrl + 'categories/' + id;
            let response = await axios.patch(url, data, {
                headers: {
                    ...this.headers,
                    'Content-Type': this.content_type
                }
            });
            console.log(`Category with title: ${response.data.data.attributes.title} updated`);
            return true;
        } catch (error) {
            console.error('Error updating category:', error.response ? error.response.data : error.message);
            return false;
        }
    }

    /**
     * Delete a category in ARS by ID
     *
     * @param {String} categoryId The category ID to delete
     * @returns {Promise<Boolean>} true if success, false if error
     */
    async deleteCategory(categoryId) {
        try {
            console.log('Deleting category: ', categoryId);
            let url = this.apiUrl + 'categories/' + categoryId;
            let response = await axios.delete(url, {headers: this.headers});
            console.log('Category deleted: ', categoryId);
            return true;
        } catch (error) {
            console.error('Error deleting category:', error.response ? error.response.data : error.message);
            return false;
        }
    }

    /**
     * Search for a release in ARS by category ID and version
     *
     * @param {String} category_id The category ID
     * @param {String} version The release version to search
     * @returns {Promise<Object|null>} The release object or null if not found
     */
    async getRelease(category_id, version) {
        try {
            console.log(`Searching release: ${version} in category: ${category_id}`);
            let url = this.apiUrl + 'releases?category_id=' + category_id + '&search=' + version;
            let response = await axios.get(url, {headers: this.headers});
            let data = response.data.data;
            if (data.length > 0) {
                console.log(`Found release: ${data[0].attributes.version} with ID: ${data[0].id}`);
                return data[0].attributes;
            }
            console.log(`Release with version: ${version} not found`);
            return null;
        } catch (error) {
            console.error('Error searching category:', error.response ? error.response.data : error.message);
        }
    }

    /**
     * Create a new release in ARS
     * Release required fields are: version, category_id, alias, maturity
     * 
     * maturity options are: alpha, beta, rc, stable
     * Optional fields are: notes, access, show_unauth_links, redirect_unauth, published, language
     * @param {Object} release 
     * @returns {Promise<String>} The release ID created or false if error
     */
    async createRelease(release) {
        try {
            console.log('Creating release: ', release.version);
            let url = this.apiUrl + 'releases';
            let response = await axios.post(url, release, {headers: this.headers});
            return response.data.data.id;
        } catch (error) {
            console.error('Error creating release:', error.response ? error.response.data : error.message);
        }
    }

    /**
     * Update a release in ARS by ID.
     * Must provide the ID of the release to update and the data to update.
     * 
     * @param {string} id The release ID
     * @param {Object} data The data to update
     * @returns {Promise<Boolean>} true if success, false if error
     */
    async updateRelease(id, data) {
        try {
            console.log('Updating release: ', id);
            let url = this.apiUrl + 'releases/' + id;
            let response = await axios.patch(url, data, {
                headers: {
                    ...this.headers,
                    'Content-Type': this.content_type
                }
            });
            console.log(`Release with version: ${response.data.data.attributes.version} updated`);
            return true;
        } catch (error) {
            console.error('Error updating release:', error.response ? error.response.data : error.message);
            return false;
        }
    }

    /**
     * Search for an item in ARS by release ID and title
     *
     * @param {String} release_id The release ID
     * @param {String} title The item title to search
     * @returns {Promise<Object|null>} The item object or null if not found
     */
    async getItem(release_id, title) {
        try {
            console.log(`Searching item: ${title} in release with ID: ${release_id}`);
            let url = this.apiUrl + 'items?release_id=' + release_id + '&search=' + title;
            let response = await axios.get(url, {headers: this.headers});
            let data = response.data.data;
            if (data.length > 0) {
                console.log(`Found item: ${data[0].attributes.title} with ID: ${data[0].id}`);
                return data[0].attributes;
            }
            console.log(`Item with title: ${title} not found`);
            return null;
        } catch (error) {
            console.error('Error searching item:', error.response ? error.response.data : error.message);
        }
    }

    /**
     * Create a new item in ARS
     * Item required fields are: release_id, type
     * 
     * type options are: file, link
     * if file is selected, filename is required
     * if link is selected, url is required
     * 
     * Optional fields are: title, alias, description, access, show_unauth_links, redirect_unauth, published, language
     *      updatestream, md5, sha1, sha256, sha384, sha512, filesize, environments
     * @param {Object} item 
     * @returns {Promise<Object>} The item created or false if error
     */
    async createItem(item) {
        try {
            console.log('Creating item: ', item.title);
            let url = this.apiUrl + 'items';
            let response = await axios.post(url, item, {
                headers: {
                    ...this.headers,
                    'Content-Type': this.content_type
                }
            });
            console.log('Item created with ID: ', response.data.data.id);
            return response.data;
        } catch (error) {
            console.error('Error creating item:', error.response ? error.response.data : error.message);
        }
    }

    async updateItem(id, data) {
        try {
            console.log('Updating item: ', id);
            let url = this.apiUrl + 'items/' + id;
            let response = await axios.patch(url, data, {
                headers: {
                    ...this.headers,
                    'Content-Type': this.content_type
                }
            });
            console.log(`Item with title: ${response.data.data.attributes.title} updated`);
            return true;
        } catch (error) {
            console.error('Error updating item:', error.response ? error.response.data : error.message);
            return false;
        }
    }
}

module.exports = ARSClient;