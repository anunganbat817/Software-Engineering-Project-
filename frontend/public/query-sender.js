/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:4321/query", true);
        xhr.onload = function () {
            if (this.readyState === 4 && this.status === 200) {
                fulfill(xhr.response);
            } else if (this.readyState === 4) {
                reject(xhr.response);
            }
        };
        xhr.send(JSON.stringify(query));
    });
};
