"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const util_1 = require("util");
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const Query_1 = require("./Query");
const TMath_1 = require("./TMath");
class InsightFacade {
    constructor() {
        this.courselist = [];
        this.dataSets = [];
        this.buildingname = [];
        this.queryResults = [];
        Util_1.default.trace("InsightFacadeImpl::init()");
    }
    addDataset(id, content, kind) {
        const that = this;
        return new Promise((fulfill, reject) => {
            if (kind === IInsightFacade_1.InsightDatasetKind.Courses) {
                const jszip = require("jszip");
                const arraycoursespromise = [];
                let response;
                jszip.loadAsync(content, { base64: true }).then((zip) => {
                    const objectkeys = Object.keys(zip.files);
                    if (objectkeys.length === 0) {
                        response = { code: 400, body: { error: "unsuccessful" } };
                        reject(response);
                    }
                    for (const name of objectkeys) {
                        const fileobj = zip.files[name];
                        if (!fileobj.dir) {
                            arraycoursespromise.push(fileobj.async("string").catch((err) => {
                                reject(response);
                            }));
                        }
                    }
                    Promise.all(arraycoursespromise).then((result) => {
                        this.parseInsight(result);
                        if (content == null || id == null || util_1.isUndefined(content) || util_1.isUndefined(id)) {
                            reject({ code: 400, body: { error: "empty" } });
                            return;
                        }
                        else {
                            const parsedJson = JSON.stringify(this.courselist);
                            if (fs.existsSync(id + ".txt")) {
                                reject({ code: 400, body: { error: "exists" } });
                                return;
                            }
                            else {
                                fulfill({ code: 204, body: { result: "exists" } });
                            }
                            fs.writeFileSync(id + ".txt", parsedJson);
                            const numRows = this.courselist.length;
                            const foo = { id, kind, numRows };
                            this.dataSets.push(foo);
                            fulfill({ code: 204, body: { result: "successfully added Dataset" } });
                            global.console.log("what happened here");
                        }
                    }).catch(function (err) {
                        reject({ code: 400, body: { error: "my text" } });
                    });
                }).catch(function (err) {
                    reject({ code: 400, body: { error: "my text" } });
                });
            }
            else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
                const jszip = require("jszip");
                const arraycoursespromise = [];
                const parsedlist = [];
                let lists;
                const par = require("parse5");
                let response;
                if (content == null || id == null || util_1.isUndefined(content) || util_1.isUndefined(id)) {
                    reject({ code: 400, body: { error: "empty" } });
                    throw new Error();
                }
                jszip.loadAsync(content, { base64: true }).then((zip) => {
                    const objectkeys = Object.keys(zip.files);
                    if (objectkeys.length === 0) {
                        response = { code: 400, body: { error: "unsuccessful" } };
                        reject(response);
                    }
                    for (const name of objectkeys) {
                        const fileobj = zip.files[name];
                        if (!fileobj.dir || fileobj["name"] === "index.htm") {
                            arraycoursespromise.push(fileobj.async("string").catch((err) => {
                                reject(response);
                            }));
                        }
                    }
                    Promise.all(arraycoursespromise).then((result) => {
                        const parsedIndex = par.parse(result[result.length - 1]);
                        const tbody = that.bodytag(parsedIndex.childNodes[6], []);
                        that.buildingnametbody(tbody);
                        for (const results of result) {
                            try {
                                const shortname = that.getstring(results, '<link rel="canonical" href="', '" />');
                                if (that.buildingname.indexOf(shortname) > -1) {
                                    const parsedRoom = this.htmlparse(results);
                                    parsedlist.push(parsedRoom);
                                }
                            }
                            catch (e) {
                                global.console.log("invalid data file");
                            }
                        }
                        Promise.all(parsedlist).then(function (res) {
                            if (res.length === 0) {
                                reject({ code: 400, body: { error: "empty" } });
                            }
                            else {
                                lists = [];
                                for (const f of res) {
                                    lists = lists.concat(f);
                                }
                            }
                            const parsedJson = JSON.stringify(lists);
                            if (fs.existsSync(id + ".txt")) {
                                reject({ code: 400, body: { error: "error if it already exists" } });
                                return;
                            }
                            else {
                                fulfill({ code: 204, body: { result: "write it to disk " } });
                            }
                            fs.writeFileSync(id + ".txt", parsedJson);
                            const numRows = lists.length;
                            const foo = { id, kind, numRows };
                            that.dataSets.push(foo);
                            fulfill({ code: 204, body: { result: "successfully parsed" } });
                        }).catch(function (err) {
                            reject({ code: 400, body: { error: "fail" } });
                        });
                    }).catch(function (err) {
                        reject({ code: 400, body: { error: "promise all fails" } });
                    });
                }).catch(function (err) {
                    reject({ code: 400, body: { error: "loadAsync error" } });
                });
            }
        });
    }
    removeDataset(id) {
        return new Promise((fullfill, reject) => {
            let response;
            fs.unlink(id + ".txt", (err) => {
                if (!err) {
                    for (const part of this.dataSets) {
                        if (part.id === id) {
                            this.dataSets.splice(this.dataSets.indexOf(part), 1);
                        }
                    }
                    response = { code: 204, body: { result: "deleted the dataset" } };
                    fullfill(response);
                }
                else {
                    response = { code: 404, body: { error: "unsuccessful" } };
                    reject(response);
                }
            });
        });
    }
    roomreturn(fullname, address, roomHTML, lat, lon) {
        const roomhref = this.getstring(roomHTML, '<a href="', '" title="Room Details">');
        const roomnumber = this.getstring(roomHTML, 'title="Room Details">', "</a>");
        let roomseats = this.getstring(roomHTML, "room-capacity\" >", "</td>");
        roomseats = Number(roomseats);
        let roomfurniture = this.getstring(roomHTML, 'room-furniture" >', "</td>");
        roomfurniture = roomfurniture.replace("&amp;", "&");
        const roomtype = this.getstring(roomHTML, 'room-type" >', "</td>");
        const shortname = this.getlaststring(roomhref, "/", "-");
        const name = shortname + "_" + roomnumber;
        const roomobject = {
            rooms_fullname: fullname,
            rooms_shortname: shortname,
            rooms_number: roomnumber,
            rooms_name: name,
            rooms_address: address,
            rooms_lat: lat,
            rooms_lon: lon,
            rooms_seats: roomseats,
            rooms_type: roomtype,
            rooms_furniture: roomfurniture,
            rooms_href: roomhref,
        };
        return (roomobject);
    }
    getstring(str, beginstr, endstr) {
        const beginindex = str.indexOf(beginstr) + beginstr.length;
        const ending = str.indexOf(endstr, beginindex);
        let substringresult = str.substring(beginindex, ending);
        substringresult = substringresult.replace(/(\r\n|\n|\r)/gm, "");
        return (substringresult.trim());
    }
    getlaststring(str, beginstr, endstr) {
        const beginindex = str.lastIndexOf(beginstr) + beginstr.length;
        const ending = str.indexOf(endstr, beginindex);
        const substringresult = str.substring(beginindex, ending);
        return substringresult;
    }
    bodytag(temp, search) {
        const that = this;
        if (temp.hasOwnProperty("tagName") && temp.tagName === "tbody") {
            return temp;
        }
        if (temp.childNodes) {
            search = search.concat(temp.childNodes);
        }
        const nexttemp = search.shift();
        return that.bodytag(nexttemp, search);
    }
    buildingnametbody(tbodyelement) {
        const that = this;
        for (let i = 1; i < tbodyelement.childNodes.length; i += 2) {
            const name = tbodyelement.childNodes[i].childNodes[3].childNodes[0].value.replace(/\s/g, "");
            that.buildingname.push(name.replace(/\r?\n|\r/g, ""));
        }
    }
    findlatlon(address) {
        const encodedaddress = address.replace(/ /g, "%20");
        const addressurl = "http://skaha.cs.ubc.ca:11316/api/v1/team20/" + encodedaddress;
        return new Promise(function (fulfill, reject) {
            const http = require("http");
            let georesponse;
            http.get(addressurl, (res) => {
                let body = "";
                res.on("data", (data) => {
                    body += data;
                });
                res.on("end", () => {
                    const parsedData = JSON.parse(body);
                    const keys = Object.keys(parsedData);
                    if (keys[0] === "error") {
                        georesponse = { error: "404" };
                        reject(georesponse);
                    }
                    else {
                        const lat = parsedData[keys[0]];
                        const lon = parsedData[keys[1]];
                        georesponse = { lat, lon };
                        fulfill(georesponse);
                    }
                });
            });
        });
    }
    htmlparse(html) {
        const that = this;
        const buildingnames = this.getstring(html, "<span class=\"field-content\">", "</span>");
        const buildingaddress = this.getstring(html, "<div class=\"building-field\"><div class=\"field-content\">", "</div></div>");
        return new Promise(function (fulfill, reject) {
            let latlon;
            const buildinglatlon = that.findlatlon(buildingaddress);
            buildinglatlon.then(function (resu) {
                latlon = resu;
                const lat = latlon.lat;
                const lon = latlon.lon;
                const roomlists = [];
                let roomsection = that.getstring(html, "<tbody>", "</tbody>");
                while (roomsection.includes("<tr class=")) {
                    const include = roomsection.indexOf("</tr>") + "</tr>".length;
                    const allinforoom = that.getstring(roomsection, "<tr class=", "</tr>");
                    const room = that.roomreturn(buildingnames, buildingaddress, allinforoom, lat, lon);
                    roomsection = roomsection.substring(include);
                    roomlists.push(room);
                }
                fulfill(roomlists);
            }).catch(function (err) {
                reject(err);
            });
        });
    }
    parseInsight(result) {
        let year;
        for (const each of result) {
            const jsonObj = JSON.parse(each);
            const jsonArray = jsonObj.result;
            if (jsonArray !== undefined && jsonArray.length !== 0) {
                for (const item of jsonArray) {
                    if (item["Section"] !== undefined || item["Section"] !== "overall") {
                        year = 1900;
                    }
                    else {
                        year = Number(item["Year"]);
                    }
                    const myCourse = {
                        courses_dept: item["Subject"],
                        courses_id: item["Course"],
                        courses_avg: item["Avg"],
                        courses_instructor: item["Professor"],
                        courses_title: item["Title"],
                        courses_pass: item["Pass"],
                        courses_fail: item["Fail"],
                        courses_audit: item["Audit"],
                        courses_uuid: (item["id"]).toString(),
                        courses_year: year,
                    };
                    this.courselist.push(myCourse);
                }
            }
        }
    }
    performQuery(query) {
        return new Promise((resolve, reject) => {
            const aquery = new Query_1.Query(query);
            if (!aquery.validquery()) {
                reject({ code: 400, body: { error: "unsuccessful, incorrect query format" } });
            }
            try {
                const id = aquery.queryid();
                const dataFromDisk = JSON.parse(fs.readFileSync(id + ".txt", "utf8"));
                const org = aquery.getOriginal();
                const res = this.checkAgainstQuery(org, dataFromDisk);
                resolve({ code: 200, body: { result: res } });
            }
            catch (e) {
                reject({ code: 400, body: { error: e } });
            }
        });
    }
    checkAgainstQuery(validQuery, data) {
        this.queryResults = [];
        const dataSet = data;
        const subQuery = validQuery["WHERE"];
        const subQuery2 = validQuery["OPTIONS"];
        const rawResults = this.evaluateQuery(subQuery, false, dataSet);
        if (validQuery.hasOwnProperty("TRANSFORMATIONS")) {
            const subQuery3 = validQuery["TRANSFORMATIONS"];
            const afterTransform = this.evaluateTransformation(subQuery3, rawResults);
            return this.evaluateOptions(subQuery2, afterTransform);
        }
        else {
            return this.evaluateOptions(subQuery2, rawResults);
        }
    }
    evaluateQuery(query, inNot, data) {
        const dataSet = data;
        const keys = Object.keys(query);
        const filter = keys[0];
        if (keys.length !== 1) {
            throw new Error("Invalid query");
        }
        if (filter === "GT") {
            const gtKey = Object.keys(query["GT"])[0];
            for (const course of data) {
                if (inNot) {
                    if (course[gtKey] <= query["GT"][gtKey]) {
                        this.queryResults.push(course);
                    }
                }
                else if (course[gtKey] > query["GT"][gtKey]) {
                    this.queryResults.push(course);
                }
            }
        }
        else if (filter === "LT") {
            const ltKey = Object.keys(query["LT"])[0];
            for (const course of data) {
                if (inNot) {
                    if (course[ltKey] >= query["LT"][ltKey]) {
                        this.queryResults.push(course);
                    }
                }
                else if (course[ltKey] < query["LT"][ltKey]) {
                    this.queryResults.push(course);
                }
            }
        }
        else if (filter === "EQ") {
            const eqKey = Object.keys(query["EQ"])[0];
            for (const course of data) {
                if (inNot) {
                    if (course[eqKey] !== query["EQ"][eqKey]) {
                        this.queryResults.push(course);
                    }
                }
                else if (course[eqKey] === query["EQ"][eqKey]) {
                    this.queryResults.push(course);
                }
            }
        }
        else if (filter === "IS") {
            const isKey = Object.keys(query["IS"])[0];
            const queryStr = query["IS"][isKey];
            const subStr = "*";
            const ind = queryStr.indexOf(subStr);
            const ind2 = queryStr.indexOf(subStr, 1);
            if (ind !== -1) {
                if (ind === 0 && ind2 >= 0) {
                    for (const course of data) {
                        if (inNot) {
                            if (!course[isKey].includes(queryStr.substring(1, queryStr.length - 1))) {
                                this.queryResults.push(course);
                            }
                        }
                        else if (course[isKey].includes(queryStr.substring(1, queryStr.length - 1))) {
                            this.queryResults.push(course);
                        }
                    }
                }
                else if (ind === 0) {
                    for (const course of data) {
                        if (inNot) {
                            if (!course[isKey].endsWith(queryStr.substring(1))) {
                                this.queryResults.push(course);
                            }
                        }
                        else if (course[isKey].endsWith(queryStr.substring(1))) {
                            this.queryResults.push(course);
                        }
                    }
                }
                else if (ind === (queryStr.length - 1)) {
                    for (const course of data) {
                        if (inNot) {
                            if (!course[isKey].startsWith(queryStr.substring(0, queryStr.length - 1))) {
                                this.queryResults.push(course);
                            }
                        }
                        else if (course[isKey].startsWith(queryStr.substring(0, queryStr.length - 1))) {
                            this.queryResults.push(course);
                        }
                    }
                }
            }
            else {
                for (const course of data) {
                    if (inNot) {
                        if (course[isKey] !== queryStr) {
                            this.queryResults.push(course);
                        }
                    }
                    else if (course[isKey] === queryStr) {
                        this.queryResults.push(course);
                    }
                }
            }
        }
        else if (filter === "AND") {
            const result = [];
            const subFilters = query["AND"];
            if (inNot) {
                for (const f of subFilters) {
                    result.push(this.evaluateQuery(f, inNot, data));
                    this.queryResults = [];
                }
                this.union(result);
            }
            else {
                for (const f of subFilters) {
                    result.push(this.evaluateQuery(f, inNot, data));
                    this.queryResults = [];
                }
                this.intersection(result);
            }
        }
        else if (filter === "OR") {
            const result = [];
            const subFilters = query["OR"];
            if (inNot) {
                for (const f of subFilters) {
                    result.push(this.evaluateQuery(f, inNot, data));
                    this.queryResults = [];
                }
                this.intersection(result);
            }
            else {
                for (const f of subFilters) {
                    result.push(this.evaluateQuery(f, inNot, data));
                    this.queryResults = [];
                }
                this.union(result);
            }
        }
        else {
            inNot = true;
            const subFilters = query["NOT"];
            if (Object.keys(subFilters).length !== 1) {
                throw new Error("Invalid query");
            }
            this.evaluateQuery(query["NOT"], inNot, data);
        }
        return this.queryResults;
    }
    intersection(arr) {
        for (const i of arr[0]) {
            let inAll = true;
            for (let j = 1; j < arr.length; j++) {
                if (arr[j].includes(i)) {
                    continue;
                }
                else {
                    inAll = false;
                    break;
                }
            }
            if (inAll) {
                this.queryResults.push(i);
            }
        }
    }
    union(arr) {
        for (const subArr of arr) {
            for (const obj of subArr) {
                this.queryResults.push(obj);
            }
        }
        this.removeDuplicates(this.queryResults);
    }
    removeDuplicates(arr) {
        const res = [];
        const map = new Map();
        for (const i of arr) {
            map.set(JSON.stringify(i), i);
        }
        for (const [key, value] of map) {
            res.push(value);
        }
        return res;
    }
    evaluateTransformation(query, rawResults) {
        const resultsToPrintOnTable = [];
        const groupArr = query["GROUP"];
        const app = query["APPLY"];
        const searchCriteria = this.buildSearchCriteria(rawResults, groupArr);
        const groups = this.buildGroups(rawResults, searchCriteria);
        for (const g of groups) {
            const grp = this.removeDuplicates(g);
            const resultToPushOnTable = {};
            for (const key of groupArr) {
                resultToPushOnTable[key] = g[0][key];
            }
            for (const op of app) {
                const applyString = Object.keys(op)[0];
                const obj = op[applyString];
                const token = Object.keys(obj)[0];
                const dataSetKey = obj[token];
                const resultOfMath = this.performApplication(token, dataSetKey, grp);
                resultToPushOnTable[applyString] = resultOfMath;
            }
            resultsToPrintOnTable.push(resultToPushOnTable);
        }
        return resultsToPrintOnTable;
    }
    buildSearchCriteria(raw, groupArr) {
        if (raw.length === 0 || raw === null) {
            return [];
        }
        const searchCriteria = [];
        for (const row of raw) {
            const obj = {};
            for (const key of groupArr) {
                obj[key] = row[key];
            }
            const strObj = JSON.stringify(obj);
            if (!searchCriteria.includes(strObj)) {
                searchCriteria.push(strObj);
            }
        }
        return this.unStringify(searchCriteria);
    }
    unStringify(searchCriteria) {
        const arr = [];
        for (const x of searchCriteria) {
            arr.push(JSON.parse(x));
        }
        return arr;
    }
    buildGroups(raw, searchCriteria) {
        if (searchCriteria.length === 0 || searchCriteria === null) {
            return [];
        }
        const groups = [];
        for (const obj of searchCriteria) {
            const subGroup = [];
            const keys = Object.keys(obj);
            for (const row of raw) {
                let flag = true;
                for (const key of keys) {
                    if (row[key] === obj[key]) {
                    }
                    else {
                        flag = false;
                        break;
                    }
                }
                if (flag) {
                    subGroup.push(row);
                }
            }
            if (subGroup.length !== 0) {
                groups.push(subGroup);
            }
        }
        return groups;
    }
    performApplication(token, key, group) {
        let math;
        math = new TMath_1.default(token, key, group);
        return math.calculation();
    }
    sortHelper(sortby, arr) {
        if (typeof sortby === "string") {
            const key = sortby;
            arr.sort((i1, i2) => {
                if (i1[key] > i2[key]) {
                    return 1;
                }
                if (i1[key] < i2[key]) {
                    return -1;
                }
                return 0;
            });
        }
        else {
            const dir = Object.keys(sortby)[0];
            const direction = sortby[dir];
            const arrKeys = Object.keys(sortby)[1];
            const keyArr = sortby[arrKeys];
            arr.sort((i1, i2) => {
                for (const key of keyArr) {
                    if (direction === "DOWN") {
                        if (i1[key] > i2[key]) {
                            return -1;
                        }
                        if (i1[key] < i2[key]) {
                            return 1;
                        }
                    }
                    else {
                        if (i1[key] < i2[key]) {
                            return 1;
                        }
                        if (i1[key] > i2[key]) {
                            return -1;
                        }
                    }
                }
                return 0;
            });
        }
        return arr;
    }
    evaluateOptions(query, queriedSet) {
        const queryResults = queriedSet;
        let finalResults = [];
        const keys = Object.keys(query);
        if (keys.indexOf("COLUMNS") < 0) {
            return new Error("No columns");
        }
        for (const key of keys) {
            if (key === "COLUMNS") {
                const columnsArray = query["COLUMNS"];
                for (const item of queryResults) {
                    const obj = {};
                    for (const property of columnsArray) {
                        obj[property] = item[property];
                    }
                    finalResults.push(obj);
                }
            }
            else if (key === "ORDER" && query["ORDER"]) {
                if (typeof query["ORDER"] !== "object") {
                    const prop = query["ORDER"];
                    finalResults = this.sortHelper(prop, finalResults);
                }
                else {
                    const orderKeys = query["ORDER"];
                    finalResults = this.sortHelper(orderKeys, finalResults);
                }
            }
        }
        return finalResults;
    }
    listDatasets() {
        const that = this;
        return new Promise((reject, resolve) => {
            const res = that.dataSets;
            resolve({ code: 200, body: { result: res } });
        });
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map