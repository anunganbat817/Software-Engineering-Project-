import {isArray} from "util";

export class Query {
    private fileparse: any;
    private dataid: string;
    private stringkeys: any[];
    private numberkeys: any[];
    private validKeys: any[];
    private roomKeys1: any[];
    private roomKeys2: any[];
    private roomNumKeys: any[];

    constructor(fileparse: any) {
        this.dataid = null;
        this.fileparse = fileparse;
        this.numberkeys = ["courses_pass", "courses_fail", "courses_avg", "courses_audit", "courses_year"];
        this.stringkeys = ["courses_dept", "courses_id", "courses_instructor", "courses_title", "courses_uuid"];
        this.roomKeys1 = ["rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name", "rooms_address"];
        this.roomKeys2 = ["rooms_type", "rooms_furniture", "rooms_href"];
        this.roomNumKeys = ["rooms_seats", "rooms_lat", "rooms_lon"];
    }

    public queryid(): string {
        return this.dataid;
    }

    public getOriginal() {
        return this.fileparse;
    }

    // public validquery(): boolean {
    //     const firstkey = Object.keys(this.fileparse);
    //     if (firstkey.length === 3 && firstkey[0] === "WHERE" && firstkey[1] === "OPTIONS" &&
    //         firstkey[2] === "TRANSFORMATIONS") {
    //         this.hastransformation = true;
    //         if (this.validfilter(this.fileparse["WHERE"]) &&
    // this.validtransform(this.fileparse["TRANSFORMATIONS"])) {
    //         return(this.validoption(this.fileparse["OPTIONS"]));
    //         }
    //     }
    //     if ( firstkey.length === 2 && firstkey[0] === "WHERE" && firstkey[1] === "OPTIONS") {
    //         return (this.validfilter(this.fileparse["WHERE"]) && this.validoption(this.fileparse["OPTIONS"]));
    //     }
    //     return false;
    // }

    public validquery(): boolean {
        const firstkey = Object.keys(this.fileparse);
        if (firstkey.length === 2 || 3 && firstkey[0] === "WHERE" && firstkey[1] === "OPTIONS") {
            if (firstkey.length === 2) {
                return (this.validfilter(this.fileparse["WHERE"]) && this.validoption(this.fileparse["OPTIONS"]));
            } else {
                return (this.validfilter(this.fileparse["WHERE"])
                    && this.validoption(this.fileparse["OPTIONS"])
                    && this.validtransform(this.fileparse["TRANSFORMATIONS"]));
            }
        }
        return false;
    }

    public validtransform(filter: any): boolean {
        const keys = Object.keys(filter);
        if (keys.length === 2 && keys[0] === "GROUP" && keys[1] === "APPLY") {
            // check if length of group/apply is at least 1 and are arrays
            const groupArray = filter["GROUP"];
            const applyArray = filter["APPLY"];
            if (groupArray.length < 1 || !(Array.isArray(groupArray))) {
                return false;
            }
            return this.checkapply(applyArray);
        }
        return false;
    }

    public checkapply(arr: any): boolean {
        const storage: any = [];
        for (const app of arr) {
            // check if any object key has "_"
            // check if any duplicate keys present
            // check apply Tokens
            const appKey = Object.keys(app)[0];
            const appToken = app[appKey];
            const token = Object.keys(appToken)[0];
            if (!storage.includes(appKey)) {
                storage.push(appKey);
            } else {
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

    public validfilter(filter: any): boolean {
        const filterkey = Object.keys(filter);
        if (filterkey.length !== 1) {
            return false;
        } else {
            const key = filterkey[0];
            // array of filters (at least one)
            const arrayfilter = filter[key];
            switch (key) {
                // logic comparison
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
                // mcomparison
                case "LT":
                case "GT":
                case "EQ": // innerFilter should have key and number as key and value
                    if (Array.isArray(arrayfilter) || typeof arrayfilter !== "object") {
                        return false;
                    }
                    const mcomp = Object.keys(arrayfilter);
                    if (mcomp.length !== 1) {
                        return false;
                    } else {
                        if (["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year",
                                "rooms_lat", "rooms_lon", "rooms_seats"].indexOf(mcomp[0]) !== -1) {
                            const tdataid = mcomp[0].substring(0, mcomp[0].indexOf("_"));
                            if (this.dataid === null) {
                                this.dataid = tdataid;
                            } else if (this.dataid !== tdataid) {
                                return false;
                            }
                            return (typeof arrayfilter[mcomp[0]] === "number");
                        } else {
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
                    } else {
                        if (["courses_dept", "courses_id", "courses_instructor", "courses_title",
                                "courses_uuid", "rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name",
                                "rooms_address", "rooms_type", "rooms_furniture", "rooms_href"].indexOf(s[0]) !== -1) {
                            const isdataid = s[0].substring(0, s[0].indexOf("_"));
                            if (this.dataid === null) {
                                this.dataid = isdataid;
                            } else if (this.dataid !== isdataid) {
                                return false;
                            }
                            return (typeof arrayfilter[s[0]] === "string");
                        } else {
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

    public validoption(options: any): boolean {
        const validoptions: string[] = ["COLUMNS", "ORDER"];
        const thekey: string[] = [];
        if (Object.keys(options).length >= 1) {
            for (const key of Object.keys(options)) {
                if (validoptions.includes(key)) {
                    thekey.push(key);
                } else {
                    return false;
                }
            }
        } else if (Object.keys(options).length === 1) {
            for (const key in options) {
                if (key === "COLUMNS") {
                    thekey.push(key);
                } else {
                    return false;
                }
            }
        } else {
            return false;
        }
        return true;
    }
}
