import fs = require("fs");
// import par = require("parse5");
// import * as parse5 from "../../node_modules/parse5/lib/index";
import {isUndefined} from "util";
import Log from "../Util";
import {IGeoResponse, IInsightFacade, InsightDataset, InsightDatasetKind, InsightResponse} from "./IInsightFacade";
import {Query} from "./Query";
import TMath from "./TMath";
/**
 * This is the main programmatic entry point for the project.
 */

export default class InsightFacade implements IInsightFacade {
    public courselist: any[] = [];
    private dataSets: InsightDataset[] = [];
    private buildingname: string[] = [];
    private queryResults: any = [];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<InsightResponse> {
        return new Promise((fulfill, reject) => {
            if (kind === InsightDatasetKind.Courses) {
                const that = this;
                const jszip = require("jszip");
                const arraycoursespromise: Array<Promise<any>> = [];
                let response: InsightResponse;
                if (content == null || id == null || isUndefined(content) || isUndefined(id)) {
                    reject({code: 400, body: {error: "empty"}});
                    // throw new Error();
                }
                jszip.loadAsync(content, {base64: true}).then((zip: any) => {
                    const objectkeys = Object.keys(zip.files);
                    if (objectkeys.length === 0) {
                        response = {code: 400, body: {error: "unsuccessful"}};
                        reject(response);
                    }
                    for (const name of objectkeys) {
                        const fileobj = zip.files[name];
                        if (!fileobj.dir) {
                            arraycoursespromise.push(fileobj.async("string").catch((err: any) => {
                                reject(response);
                            }));
                        }
                    }
                    Promise.all(arraycoursespromise).then((result) => {
                            this.parseInsight(result);
                            if (this.courselist.length >= 1) {
                                const parsedJson: string = JSON.stringify(this.courselist);
                                fs.writeFileSync(id + ".txt", parsedJson);
                                const numRows = this.courselist.length;
                                const foo = {id, kind, numRows};
                                this.dataSets.push(foo);
                                fulfill({code: 204, body: {result: "successfully added DataSet"}});
                                global.console.log("what happened here");
                            }
                    }).catch(function (err: any) {
                        reject({code: 400, body: {error: "my text"}});
                    });
                }).catch(function (err: any) {
                    reject({code: 400, body: {error: "my text"}});
                });
            } else if (kind === InsightDatasetKind.Rooms) {
                const that = this;
                const jszip = require("jszip");
                const arraycoursespromise: Array<Promise<any>> = [];
                const parsedlist: any[] = [];
                const par = require("parse5");
                let response: InsightResponse;
                if (content == null || id == null || isUndefined(content) || isUndefined(id)) {
                    reject({code: 400, body: {error: "empty"}});
                    throw new Error();
                }
                jszip.loadAsync(content, {base64: true}).then((zip: any) => {
                    const objectkeys = Object.keys(zip.files);
                    if (objectkeys.length === 0) {
                        response = {code: 400, body: {error: "unsuccessful"}};
                        reject(response);
                    }

                    for (const name of objectkeys) {
                        const fileobj = zip.files[name];
                        if (!fileobj.dir || fileobj["name"] === "index.htm") {
                                arraycoursespromise.push(fileobj.async("string").catch((err: any) => {
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
                                // returns the position of the first occurrence of a specified value in a string
                                if (that.buildingname.indexOf(shortname) > -1) {
                                    const parsedRoom = this.htmlparse(results);
                                    parsedlist.push(parsedRoom);
                                }
                            } catch (e) {
                                global.console.log("invalid data file");
                            }
                        }
                        Promise.all(parsedlist).then(function (res) {
                            if (res.length === 0) {
                                response = {code: 400, body: {error: "empty"}};
                                reject(response);
                            } else {
                                const parsedJson: string = JSON.stringify(res);
                                that.courselist.push({id, content: res});
                                if (fs.existsSync(id + ".txt")) {
                                    response = {code: 400, body: {error: "error if it already exists"}};
                                } else {
                                    response = {code: 204, body: {result: "write it to disk "}};
                                }
                                fs.writeFileSync(id + ".txt", parsedJson);
                                response = {code: 204, body: {result: "successfully parsed"}};
                                fulfill(response);
                            }
                        }).catch(function (err: any) {
                            reject({code: 400, body: {error: "fail"}});
                        });
                    }).catch(function (err: any) {
                        reject({code: 400, body: {error: "promise all fails"}});
                    });
                }).catch(function (err: any) {
                    reject({code: 400, body: {error: "loadAsync error"}});
                });
            }
        });
    }

    // public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<InsightResponse> {
    //     const that = this;
    //     const jszip = require("jszip");
    //     return new Promise((fulfill, reject) => {
    //         const arraycoursespromise: Array<Promise<string>> = [];
    //         let response: InsightResponse;
    //         jszip.loadAsync(content, {base64: true}).then((zip: any) => {
    //             const objectkeys = Object.keys(zip.files);
    //             if (objectkeys.length === 0) {
    //                 response = {code: 400, body: {error: "unsuccessful"}};
    //                 reject(response);
    //             }
    //
    //             // if it is room
    //             // jszip.file('index.htm').async(t).then(function (html) {
    //             //  parse html
    //             // get list of paths of builds
    //             // for each path {
    //             //  jszip.file(path).then()
    //             // }
    //             // })
    //
    //             for (const name of objectkeys) {
    //                 const fileobj = zip.files[name];
    //                 if (!fileobj.dir) {
    //                     arraycoursespromise.push(fileobj.async("string").catch((err: any) => {
    //                         reject(response);
    //                     }));
    //                 }
    //             }
    //
    //             // objectkeys.forEach((obj, i) => {
    //             //     // if (i === 10 || (i > 12 && i % 2 === 1 && i < 164) || i === 167) {
    //             //     // get the name of the file , to make sure that the name of the file is not directory
    //             //     // file name is courses?
    //             //     const filename = objectkeys[i];
    //             //     const file = zip.files[filename];
    //             //     if (!file["dir"]) {
    //             //         arraycoursespromise.push(file.async("string").catch((err: any) => {
    //             //             reject(err);
    //             //         })); }
    //             //     // }
    //             // });
    //             Promise.all(arraycoursespromise).then((result) => {
    //                 // let lists: any[];
    //                 // lists = [];
    //                 // if (kind === InsightDatasetKind.Courses) {
    //                     this.parseInsight(result);
    //                     if (this.courselist.length >= 1) {
    //                         const parsedJson: string = JSON.stringify(this.courselist);
    //                         fs.writeFileSync(id + ".txt", parsedJson);
    //                         const numRows = this.courselist.length;
    //                         const foo = {id, kind, numRows};
    //                         this.dataSets.push(foo);
    //                         fulfill({code: 204, body: {result: "successfully added DataSet"}});
    //                     } else {
    //                         reject({code: 400, body: {error: "Invalid data from promise.all"}});
    //                     }
    //                 let lists: any[];
    //                 lists = [];
    //                 if (kind === InsightDatasetKind.Courses) {
    //                     for (const res of result) {
    //                         try {
    //                             const jsonObj = JSON.parse(res);
    //                             this.parseInsight(res);
    //                         } catch (err) { //
    //                         }
    //                     }
    //                     if (this.courselist.length >= 1) {
    //                                 const parsedJson: string = JSON.stringify(this.courselist);
    //                                 fs.writeFileSync(id + ".txt", parsedJson);
    //                                 const numRows = this.courselist.length;
    //                                 const foo = {id, kind, numRows};
    //                                 this.dataSets.push(foo);
    //                                 fulfill({code: 204, body: {result: "successfully added DataSet"}});
    //                             } else {
    //                                 reject({code: 400, body: {error: "Invalid data from promise.all"}});
    //                             }
    //                 } else if (kind === InsightDatasetKind.Rooms) {
    //                     const parsedlist = [];
    //                     const par = require("parse5");
    //                     const parsedIndex = par.parse(result[result.length - 1]);
    //                     const tbody = that.bodytag(parsedIndex.childNodes[6], []);
    //                     that.buildingnametbody(tbody);
    //                     for (const results of result) {
    //                         try {
    //                             const shortname = that.getstring(results, '<link rel="canonical" href="', '" />');
    //                             // returns the position of the first occurrence of a specified value in a string
    //                             if (that.buildingname.indexOf(shortname) > -1) {
    //                                 const parsedRoom = this.htmlparse(results);
    //                                 parsedlist.push(parsedRoom);
    //                             }
    //                         } catch (e) {
    //                             global.console.log("invalid data file"); }
    //                     }
    //                     Promise.all(parsedlist).then(function (res) {
    //                         if (res.length === 0) {
    //                             response = {code: 400, body: {error: "empty"}};
    //                             reject(response);
    //                         } else {
    //                             const parsedJson: string = JSON.stringify(res);
    //                             that.courselist.push({id, content: res});
    //                             let code: number;
    //                             if (fs.existsSync(id + ".txt")) {
    //                                 code = 400;
    //                             } else {
    //                                 code = 204; }
    //                             fs.writeFileSync(id + ".txt", parsedJson);
    //                             response = {code, body: {result: "successfully parsed"}};
    //                             fulfill(response);
    //                         }
    //                     }).catch(function (err) {
    //                         global.console.log(err);
    //                     });
    //                 } else {
    //                     response = {code: 400, body: {error: "wrong kind"}};
    //                     reject(response);
    //                 }
    //             }).catch((err) => {
    //                 response = {code: 400, body: {error: "promise all fails"}};
    //                 reject(response);
    //             });
    //         }).catch((res: any) => {
    //             response = {code: 400, body: {error: "loadAsync error"}};
    //             reject(response);
    //         });
    //     });
    // }

    public removeDataset(id: string): Promise<InsightResponse> {
        return new Promise((fullfill, reject) => {
            let response: InsightResponse;
            fs.unlink(id + ".txt", (err: any) => {
                if (!err) {
                    for (const part of this.courselist) {
                        if (part.id === id) {
                            // add new elements and remove old elements
                            this.courselist.splice(this.courselist.indexOf(part), 1);
                        }
                    }
                    response = {code: 204, body: {result: "deleted the dataset"}};
                    fullfill(response);
                } else {
                    response = {code: 404, body: {error: "unsuccessful"}};
                    reject(response);
                }
            });
        });
    }

    // return a Room Object (fullname, shortname, number, name, address, lat, lon, seats, type, furniture, href)
    public roomreturn(fullname: string, address: string, roomHTML: any, lat: number, lon: number): any {
        const roomhref = this.getstring(roomHTML, '<a href="', '" title="Room Details">');
        const roomnumber = this.getstring(roomHTML, 'title="Room Details">', "</a>");
        let roomseats = this.getstring(roomHTML, "room-capacity\" >", "</td>");
        roomseats = Number(roomseats);
        let roomfurniture = this.getstring(roomHTML, 'room-furniture" >', "</td>");
        roomfurniture = roomfurniture.replace("&amp;", "&");
        const roomtype = this.getstring(roomHTML, 'room-type" >', "</td>");
        // last '/' and last '_' gets shortname
        const shortname = this.getlaststring(roomhref, "/", "-");
        // construct a room object
        const name = shortname + "_" + roomnumber;
        // const roomobject = new Room(fullname, shortname, name, roomnumber,
        //     address, lat, lon, roomseats, roomtype, roomfurniture, roomhref);
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

    // helper method to parse the info between tags for a room (href, number, seats, furniture, type)
    public getstring(str: string, beginstr: string, endstr: string): any {
        // begin searching <link rel = "canonical" href="", starting search from beginstr
        const beginindex = str.indexOf(beginstr) + beginstr.length;
        // endstr ""/>"
        const ending = str.indexOf(endstr, beginindex);
        // extracts characters from beginindex up to but not including ending
        let substringresult = str.substring(beginindex, ending);
        substringresult = substringresult.replace(/(\r\n|\n|\r)/gm, "");
        // removes whitespace from both sides of a string
        return (substringresult.trim());
    }

    public getlaststring(str: string, beginstr: string, endstr: string): any {
        // returns the position of the last occurrence of a specified value in a string
        const beginindex = str.lastIndexOf(beginstr) + beginstr.length;
        const ending = str.indexOf(endstr, beginindex);
        const substringresult = str.substring(beginindex, ending);
        return substringresult;
    }

    // finding tbody
    public bodytag(temp: any, search: any): any {
        const that = this;
        //  Determines whether an object has a property with the specified name.
        // error might be here
        if (temp.hasOwnProperty("tagName") && temp.tagName === "tbody") {
            return temp;
        }
        if (temp.childNodes) {
            search = search.concat(temp.childNodes);
        }
        // removing the first element from search and returns that element
        const nexttemp = search.shift();
        return that.bodytag(nexttemp, search);
    }

    public buildingnametbody(tbodyelement: any) {
        const that = this;
        for (let i = 1; i < tbodyelement.childNodes.length; i += 2) {
            // the value we want is always in the second column of the table, which corresponds to index 3
            const name = tbodyelement.childNodes[i].childNodes[3].childNodes[0].value.replace(/\s/g, "");
            that.buildingname.push(name.replace(/\r?\n|\r/g, ""));
        }
    }

    public findlatlon(address: string): Promise<IGeoResponse> {
        // searches a / / g string for a specified value, replace to %20
        const encodedaddress = address.replace(/ /g, "%20");
        const addressurl = "http://skaha.cs.ubc.ca:11316/api/v1/team20/" + encodedaddress;

        return new Promise(function (fulfill, reject) {
            const http = require("http");
            let georesponse: IGeoResponse;
            http.get(addressurl, (res: any) => {
                // lat, lon in body
                let body = "";
                res.on("data", (data: any) => {
                    body += data;
                });
                res.on("end", () => {
                    const parsedData = JSON.parse(body);
                    const keys = Object.keys(parsedData);
                    if (keys[0] === "error") {
                        georesponse = {error: "404"};
                        reject(georesponse);
                    } else {
                        const lat: number = (parsedData as any)[keys[0]];
                        const lon: number = (parsedData as any)[keys[1]];
                        georesponse = {lat, lon};
                        fulfill(georesponse);
                    }
                });
            });
        });
    }

    public htmlparse(html: any): Promise<any[]> {
        const that = this;
        //  gets building names
        const buildingnames = this.getstring(html, "<span class=\"field-content\">", "</span>");

        // after getting building names, it gets address
        const buildingaddress = this.getstring(html, "<div class=\"building-field\"><div class=\"field-content\">"
            , "</div></div>");
        return new Promise(function (fulfill, reject) {
            let latlon: IGeoResponse;
            const buildinglatlon = that.findlatlon(buildingaddress);
            buildinglatlon.then(function (resu: any) {
                latlon = resu;
                const lat = latlon.lat;
                const lon = latlon.lon;

                const roomlists = [];
                // room info,  // '<tbody>' gets room information and '</tbody>' ends the room information
                let roomsection = that.getstring(html, "<tbody>", "</tbody>");
                // '<tr class=' and '</tr>' gets all useful info of one room
                while (roomsection.includes("<tr class=")) {
                    const include = roomsection.indexOf("</tr>") + "</tr>".length;
                    const allinforoom = that.getstring(roomsection, "<tr class=", "</tr>");
                    const room = that.roomreturn(buildingnames, buildingaddress, allinforoom, lat, lon);
                    roomsection = roomsection.substring(include);
                    roomlists.push(room);
                }
                fulfill(roomlists);
            }).catch(function (err: any) {
                //
                reject(err);
            });
        });
    }

    // public nameconvention () {
    //     const myRoom = {
    //         rooms_fullname: "roomsFullname",
    //         rooms_shortname: "roomsShortname",
    //         rooms_name: "roomsName",
    //         rooms_number: "roomsNumber",
    //         rooms_address: "roomsAddress",
    //         rooms_lat: "roomsLat",
    //         rooms_lon: "roomsLon",
    //         rooms_seats: "roomsSeats",
    //         rooms_type: "roomsType",
    //         rooms_furniture: "roomsFurniture",
    //         rooms_href: "roomsHref",
    //     };
    // }
    // public checkvalidity(obj: any): any {
    //     if (obj.length !== 0) {
    //         this.parseInsight(obj);
    //     }
    // }

    public parseInsight(result: any) {
        for (const each of result) {
            const jsonObj = JSON.parse(each);
            const jsonArray = jsonObj.result;
            if (jsonArray !== undefined && jsonArray.length !== 0) {
                for (const item of jsonArray) {
                    if (item["Section"] !== undefined || item["Section"] !== "overall") {
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
                            courses_year: item["Year"],
                        };
                        this.courselist.push(myCourse);
                    }
                }
            }
        }
    }

    public performQuery(query: any): Promise<InsightResponse> {
        return new Promise<InsightResponse>((resolve, reject) => {
            const aquery = new Query(query);
            if (!aquery.validquery()) {
                return reject({code: 400, body: {error: "unsuccessful, incorrect query format"}});
            }
            try {
                const id = aquery.queryid();
                const dataFromDisk = JSON.parse(fs.readFileSync(id + ".txt", "utf8"));
                const org = aquery.getOriginal();
                const res = this.checkAgainstQuery(org, dataFromDisk);
                resolve({code: 200, body: {result: res}});
            } catch (e) {
                reject({code: 400, body: {error: e}});
            }
        });
    }

    public checkAgainstQuery(validQuery: any, data: any): any[] {
        // empty queryResults for next query
        this.queryResults = [];
        // dataSet to perfom query on
        const dataSet = data;
        const subQuery: any = validQuery["WHERE"];
        const subQuery2: any = validQuery["OPTIONS"];
        const rawResults = this.evaluateQuery(subQuery, false, dataSet);

        if (validQuery.hasOwnProperty("TRANSFORMATIONS")) {
            const subQuery3: any = validQuery["TRANSFORMATIONS"];
            const afterTransform = this.evaluateTransformation(subQuery3, rawResults);
            return this.evaluateOptions(subQuery2, afterTransform);
        } else {
            return this.evaluateOptions(subQuery2, rawResults);
        }
    }

    public evaluateQuery(query: any, inNot: boolean, data: any): any[] {
        // dataSet
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
                } else if (course[gtKey] > query["GT"][gtKey]) {
                    this.queryResults.push(course);
                }
            }
        } else if (filter === "LT") {
            const ltKey = Object.keys(query["LT"])[0];
            for (const course of data) {
                if (inNot) {
                    if (course[ltKey] >= query["LT"][ltKey]) {
                        this.queryResults.push(course);
                    }
                } else if (course[ltKey] < query["LT"][ltKey]) {
                    this.queryResults.push(course);
                }
            }
        } else if (filter === "EQ") {
            const eqKey = Object.keys(query["EQ"])[0];
            for (const course of data) {
                if (inNot) {
                    if (course[eqKey] !== query["EQ"][eqKey]) {
                        this.queryResults.push(course);
                    }
                } else if (course[eqKey] === query["EQ"][eqKey]) {
                    this.queryResults.push(course);
                }
            }
        } else if (filter === "IS") {
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
                        } else if (course[isKey].includes(queryStr.substring(1, queryStr.length - 1))) {
                            this.queryResults.push(course);
                        }
                    }
                } else if (ind === 0) {
                    for (const course of data) {
                        if (inNot) {
                            if (!course[isKey].endsWith(queryStr.substring(1))) {
                                this.queryResults.push(course);
                            }
                        } else if (course[isKey].endsWith(queryStr.substring(1))) {
                            this.queryResults.push(course);
                        }
                    }
                } else if (ind === (queryStr.length - 1)) {
                    for (const course of data) {
                        if (inNot) {
                            if (!course[isKey].startsWith(queryStr.substring(0, queryStr.length - 1))) {
                                this.queryResults.push(course);
                            }
                        } else if (course[isKey].startsWith(queryStr.substring(0, queryStr.length - 1))) {
                            this.queryResults.push(course);
                        }
                    }
                }
            } else {
                for (const course of data) {
                    if (inNot) {
                        if (course[isKey] !== queryStr) {
                            this.queryResults.push(course);
                        }
                    } else if (course[isKey] === queryStr) {
                        this.queryResults.push(course);
                    }
                }
            }
        } else if (filter === "AND") {
            const result: any[] = [];
            const subFilters: any[] = query["AND"];
            if (inNot) {
                for (const f of subFilters) {
                    result.push(this.evaluateQuery(f, inNot, data));
                    this.queryResults = [];
                }
                this.union(result);
            } else {
                for (const f of subFilters) {
                    result.push(this.evaluateQuery(f, inNot, data));
                    this.queryResults = [];
                }
                this.intersection(result);
            }
        } else if (filter === "OR") {
            const result: any[] = [];
            const subFilters = query["OR"];
            if (inNot) {
                for (const f of subFilters) {
                    result.push(this.evaluateQuery(f, inNot, data));
                    this.queryResults = [];
                }
                this.intersection(result);
            } else {
                for (const f of subFilters) {
                    result.push(this.evaluateQuery(f, inNot, data));
                    this.queryResults = [];
                }
                this.union(result);
            }
        } else { // NOT CASE
            inNot = true;
            const subFilters = query["NOT"];
            if (Object.keys(subFilters).length !== 1) {
                throw new Error("Invalid query");
            }
            this.evaluateQuery(query["NOT"], inNot, data);
        }

        return this.queryResults;

    }

    public intersection(arr: any[]): void {
        for (const i of arr[0]) {
            let inAll = true;
            for (let j = 1; j < arr.length; j++) {
                if (arr[j].includes(i)) {
                    continue;
                } else {
                    inAll = false;
                    break;
                }
            }
            if (inAll) {
                this.queryResults.push(i);
            }
        }
    }

    public union(arr: any[]): void {
        for (const subArr of arr) {
            for (const obj of subArr) {
                this.queryResults.push(obj);
            }
        }
        this.removeDuplicates(this.queryResults);
    }

    public removeDuplicates(arr: any[]): any[] {
        const res: any = [];
        const map = new Map();
        for (const i of arr) {
            map.set(JSON.stringify(i), i);
        }
        for (const [key, value] of map) {
            res.push(value);
        }
        return res;
    }

    public evaluateTransformation(query: any, rawResults: any): any[] {
        const resultsToPrintOnTable = [];
        const groupArr = query["GROUP"];
        const app = query["APPLY"];
        // make search criteria
        const searchCriteria = this.buildSearchCriteria(rawResults, groupArr);
        // build groups and pass each to each perform Application
        const groups = this.buildGroups(rawResults, searchCriteria);

        for (const g of groups) {
            // remove duplicates from group
            const grp = this.removeDuplicates(g);
            // One row of results object
            const resultToPushOnTable: any = {};
            // add group properties to resultToPushOnTable
            for (const key of groupArr) {
                resultToPushOnTable[key] = g[0][key];
            }
            // go through each operation in APPLY and add to resultToPushOnTable
            for (const op of app) {
                // get the applyString
                const applyString = Object.keys(op)[0];
                // get value of applyString
                const obj = op[applyString];
                // get token e.g. MAX, MIN, ...
                const token = Object.keys(obj)[0];
                // get token's key value
                const dataSetKey = obj[token];
                // perform a calculation according to token and key, pass the rawResults
                const resultOfMath = this.performApplication(token, dataSetKey, grp);
                // make a key value-pair from the apply and store in Object resultToPushOnTable
                resultToPushOnTable[applyString] = resultOfMath;
            }
            resultsToPrintOnTable.push(resultToPushOnTable);
        }
        return resultsToPrintOnTable;
    }

    public buildSearchCriteria(raw: any, groupArr: any): any[] {
        if (raw.length === 0 || raw === null) {
            return [];
        }
        const searchCriteria: any[] = [];
        for (const row of raw) {
            const obj: any = {};
            for (const key of groupArr) {
                obj[key] = row[key];
            }
            // stringify object because objects are referenced and every time
            // a new object is made it gets a new reference address.
            const strObj = JSON.stringify(obj);
            if (!searchCriteria.includes(strObj)) {
                searchCriteria.push(strObj);
            }
        }
        return this.unStringify(searchCriteria);
    }

    public unStringify(searchCriteria: any) {
        const arr: any[] = [];
        for (const x of searchCriteria) {
            arr.push(JSON.parse(x));
        }
        return arr;
    }

    public buildGroups(raw: any, searchCriteria: any) {
        if (searchCriteria.length === 0 || searchCriteria === null) {
            return [];
        }
        const groups: any = [];
        for (const obj of searchCriteria) {
            const subGroup: any = [];
            const keys = Object.keys(obj);
            for (const row of raw) {
                let flag = true;
                for (const key of keys) {
                    if (row[key] === obj[key]) {
                        // continue;
                    } else {
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

    public performApplication(token: any, key: any, group: any[]): number {
        let math: TMath;
        math = new TMath(token, key, group);
        return math.calculation();
    }

    public sortHelper(sortby: any, arr: any): any[] {
        if (typeof sortby === "string") {
            const key = sortby;
            arr.sort((i1: any, i2: any) => {
                if (i1[key] > i2[key]) {
                    return 1;
                }
                if (i1[key] < i2[key]) {
                    return -1;
                }
                return 0;
            });
        } else {
            const dir = Object.keys(sortby)[0];
            const direction = sortby[dir];
            const arrKeys = Object.keys(sortby)[1];
            const keyArr = sortby[arrKeys];
            arr.sort((i1: any, i2: any) => {
                for (const key of keyArr) {
                    if (direction === "DOWN") {
                        if (i1[key] > i2[key]) {
                            return -1;
                        }
                        if (i1[key] < i2[key]) {
                            return 1;
                        }
                    } else {
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

    public evaluateOptions(query: any, queriedSet: any): any {
        const queryResults: any[] = queriedSet;
        let finalResults: any = [];
        const keys: any[] = Object.keys(query);
        if (keys.indexOf("COLUMNS") < 0) {
            return new Error("No columns");
        }
        for (const key of keys) {
            if (key === "COLUMNS") {
                const columnsArray: any[] = query["COLUMNS"];
                // Log.trace("inside Options");
                for (const item of queryResults) {
                    const obj: any = {};
                    for (const property of columnsArray) {
                        obj[property] = item[property];
                    }
                    finalResults.push(obj);
                }
            } else if (key === "ORDER" && query["ORDER"]) {
                if (typeof query["ORDER"] !== "object") {
                    const prop = query["ORDER"];
                    finalResults = this.sortHelper(prop, finalResults);
                } else {
                    const orderKeys = query["ORDER"];
                    finalResults = this.sortHelper(orderKeys, finalResults);
                }

            }
        }
        return finalResults;
    }

    public listDatasets(): Promise<InsightResponse> {
        const that = this;
        return new Promise((reject, resolve) => {
            const res: InsightDataset[] = that.dataSets;
            resolve({code: 200, body: {result: res}});
        });
    }
}
