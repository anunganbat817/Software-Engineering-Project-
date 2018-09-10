"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
class TMath {
    constructor(token, key, group) {
        this.token = token;
        this.group = group;
        this.key = key;
    }
    calculation() {
        let result = 0;
        switch (this.token) {
            case "MAX":
                result = this.findMax(this.key, this.group);
                break;
            case "MIN":
                result = this.findMin(this.key, this.group);
                break;
            case "AVG":
                result = this.findAvg(this.key, this.group);
                break;
            case "COUNT":
                result = this.count(this.key, this.group);
                break;
            case "SUM":
                result = this.sum(this.key, this.group);
        }
        return result;
    }
    findMax(key, group) {
        let max = group[0][key];
        for (const obj of group) {
            if (obj[key] > max) {
                max = obj[key];
            }
        }
        return max;
    }
    findMin(key, group) {
        let min = group[0][key];
        for (const obj of group) {
            if (obj[key] < min) {
                min = obj[key];
            }
        }
        return min;
    }
    findAvg(key, group) {
        let acc = new decimal_js_1.default(0);
        for (const obj of group) {
            acc = acc.plus(new decimal_js_1.default(obj[key]));
        }
        const res = (acc.toNumber() / group.length);
        return Number(res.toFixed(2));
    }
    count(key, group) {
        let counter = 0;
        for (const obj of group) {
            if (obj[key]) {
                counter++;
            }
        }
        return counter;
    }
    sum(key, group) {
        let acc = 0;
        for (const obj of group) {
            acc += obj[key];
        }
        return acc;
    }
}
exports.default = TMath;
//# sourceMappingURL=TMath.js.map