"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Query {
    constructor(fileparse) {
        this.dataid = null;
        this.fileparse = fileparse;
        this.numberkeys = ["courses_pass", "courses_fail", "courses_avg", "courses_audit", "courses_year"];
        this.stringkeys = ["courses_dept", "courses_id", "courses_instructor", "courses_title", "courses_uuid"];
        this.roomKeys1 = ["rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name", "rooms_address"];
        this.roomKeys2 = ["rooms_type", "rooms_furniture", "rooms_href"];
        this.roomNumKeys = ["rooms_seats", "rooms_lat", "rooms_lon"];
    }
    queryid() {
        return this.dataid;
    }
    getOriginal() {
        return this.fileparse;
    }
    validquery() {
        const firstkey = Object.keys(this.fileparse);
        if (firstkey.length === 2 || 3 && firstkey[0] === "WHERE" && firstkey[1] === "OPTIONS") {
            if (firstkey.length === 2) {
                return (this.validfilter(this.fileparse["WHERE"]) && this.validoption(this.fileparse["OPTIONS"]));
            }
            else {
                return (this.validfilter(this.fileparse["WHERE"])
                    && this.validoption(this.fileparse["OPTIONS"])
                    && this.validtransform(this.fileparse["TRANSFORMATIONS"]));
            }
        }
        return false;
    }
    validtransform(filter) {
        const keys = Object.keys(filter);
        if (keys.length === 2 && keys[0] === "GROUP" && keys[1] === "APPLY") {
            const groupArray = filter["GROUP"];
            const applyArray = filter["APPLY"];
            if (groupArray.length < 1 || !(Array.isArray(groupArray))) {
                return false;
            }
            return this.checkapply(applyArray);
        }
        return false;
    }
    checkapply(arr) {
        const storage = [];
        for (const app of arr) {
            const appKey = Object.keys(app)[0];
            const appToken = app[appKey];
            const token = Object.keys(appToken)[0];
            if (!storage.includes(appKey)) {
                storage.push(appKey);
            }
            else {
                return false;
            }
            if (typeof app !== "object" || appKey.includes("_")) {
                return false;
            }
            if ((token !== "AVG") && (token !== "MIN") && (token !== "MAX") && (token !== "COUNT")
                && (token !== "SUM")) {
                return false;
            }
        }
        return true;
    }
    validfilter(filter) {
        const filterkey = Object.keys(filter);
        if (filterkey.length !== 1) {
            return false;
        }
        else {
            const key = filterkey[0];
            const arrayfilter = filter[key];
            switch (key) {
                case "OR":
                case "AND":
                    if (!Array.isArray(arrayfilter) || arrayfilter.length < 1) {
                        return false;
                    }
                    for (const f of arrayfilter) {
                        if (!this.validfilter(f)) {
                            return false;
                        }
                    }
                    return true;
                case "LT":
                case "GT":
                case "EQ":
                    if (Array.isArray(arrayfilter) || typeof arrayfilter !== "object") {
                        return false;
                    }
                    const mcomp = Object.keys(arrayfilter);
                    if (mcomp.length !== 1) {
                        return false;
                    }
                    else {
                        if (["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year",
                            "rooms_lat", "rooms_lon", "rooms_seats"].indexOf(mcomp[0]) !== -1) {
                            const tdataid = mcomp[0].substring(0, mcomp[0].indexOf("_"));
                            if (this.dataid === null) {
                                this.dataid = tdataid;
                            }
                            else if (this.dataid !== tdataid) {
                                return false;
                            }
                            return (typeof arrayfilter[mcomp[0]] === "number");
                        }
                        else {
                            return false;
                        }
                    }
                case "IS":
                    if (Array.isArray(arrayfilter) || typeof arrayfilter !== "object") {
                        return false;
                    }
                    const s = Object.keys(arrayfilter);
                    if (s.length !== 1) {
                        return false;
                    }
                    else {
                        if (["courses_dept", "courses_id", "courses_instructor", "courses_title",
                            "courses_uuid", "rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name",
                            "rooms_address", "rooms_type", "rooms_furniture", "rooms_href"].indexOf(s[0]) !== -1) {
                            const isdataid = s[0].substring(0, s[0].indexOf("_"));
                            if (this.dataid === null) {
                                this.dataid = isdataid;
                            }
                            else if (this.dataid !== isdataid) {
                                return false;
                            }
                            return (typeof arrayfilter[s[0]] === "string");
                        }
                        else {
                            return false;
                        }
                    }
                case "NOT":
                    if (Array.isArray(arrayfilter) || typeof arrayfilter !== "object") {
                        return false;
                    }
                    const n = Object.keys(arrayfilter);
                    if (n.length !== 1) {
                        return false;
                    }
                    return this.validfilter(arrayfilter);
                default:
                    return false;
            }
        }
    }
    validoption(options) {
        const validoptions = ["COLUMNS", "ORDER"];
        const thekey = [];
        if (Object.keys(options).length >= 1) {
            for (const key of Object.keys(options)) {
                if (validoptions.includes(key)) {
                    thekey.push(key);
                }
                else {
                    return false;
                }
            }
        }
        else if (Object.keys(options).length === 1) {
            for (const key in options) {
                if (key === "COLUMNS") {
                    thekey.push(key);
                }
                else {
                    return false;
                }
            }
        }
        else {
            return false;
        }
        return true;
    }
}
exports.Query = Query;
//# sourceMappingURL=Query.js.map