import Decimal from "decimal.js";
export default class TMath {
    private token: string;
    private group: any[];
    private key: string;

    constructor(token: string, key: string, group: any[]) {
        this.token = token;
        this.group = group;
        this.key = key;
    }

    public calculation() {
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

    public findMax(key: string, group: any[]): number {
        let max = group[0][key];
        for (const obj of group) {
            if (obj[key] > max) {
                max = obj[key];
            }
        }
        return max;
    }

    public findMin(key: string, group: any[]): number {
        let min = group[0][key];
        for (const obj of group) {
            if (obj[key] < min) {
                min = obj[key];
            }
        }
        return min;
    }

    public findAvg(key: string, group: any[]): any {
        let acc = new Decimal(0);
        for (const obj of group) {
            acc = acc.plus(new Decimal(obj[key]));
        }

        const res = (acc.toNumber() / group.length);
        // const res = parseFloat((acc / group.length).toFixed(2) );
        return Number(res.toFixed(2));
    }

    public count(key: string, group: any[]): number {
        let counter = 0;
        for (const obj of group) {
            if (obj[key]) {
                counter++;
            }
        }
        return counter;
    }

    public sum(key: string, group: any[]): number {
        let acc = 0;
        for (const obj of group) {
            acc += obj[key];
        }
        return acc;
    }
}
