/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    let dataId = "";
    let notCase = false;
    let courseKeys = ["pass", "fail", "avg", "audit", "dept", "id", "instructor", "title", "uuid", "year"];
    let roomKeys = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href", "seats", "lat", "lon"];
    let emptyFlag = false;
    // dataset type check Rooms or Courses
    let activeTab = document.getElementsByClassName("tab-panel active")[0];
    // set dataId to append to keys
    if (activeTab.id === "tab-rooms") {
        dataId = "rooms_";
    } else {
        dataId = "courses_";
    }
    let obj = buildWhere();
    if (!emptyFlag) {
        query["WHERE"] = obj;
    } else {
        query["WHERE"] = {};
    }

    function buildWhere() {
        let mainFilter = {};
        let arrayOfLogicalConnectors = activeTab.getElementsByClassName("control-group condition-type")[0].children;
        for (const cond of arrayOfLogicalConnectors) {
            if (cond.children[0].checked) {
                if (cond.children[0].value === "all") {
                    let arr = buildConditions();
                    if (arr.length > 1) {
                        mainFilter["AND"] = arr;
                        return mainFilter;
                    } else if (arr.length === 1) {
                        return arr[0];
                    } else {
                        emptyFlag = true;
                    }
                } else if (cond.children[0].value === "any") {
                    let arr = buildConditions();
                    if (arr.length > 1) {
                        mainFilter["OR"] = arr;
                        return mainFilter;
                    } else if (arr.length === 0) {
                        return arr[0];
                    } else {
                        emptyFlag = true;
                    }
                } else {
                    notCase = true;
                    let arr = buildConditions();
                    if (arr.length !== 0) {
                        mainFilter["NOT"] = arr;
                        return mainFilter;
                    } else {
                        emptyFlag = true;
                    }
                }
            }
        }
    }

    function buildConditions() {
        let arrayOfConditions = activeTab.getElementsByClassName("conditions-container")[0].children;
        let condsArr = [];
        if (arrayOfConditions.length !== 0) {
            for (const cond of arrayOfConditions) {
                let obj = {};
                let isNot = checkNot(cond.getElementsByClassName("control not")[0]);
                let field = getField(cond.getElementsByClassName("control fields")[0]);
                let option = getOperator(cond.getElementsByClassName("control operators")[0]);
                let literal = getInputValue(cond.getElementsByClassName("control term")[0]);
                obj = buildObject(isNot, field, option, literal);
                condsArr.push(obj);
            }
        }

        if (!notCase) {
            return condsArr;
        }
        else {
            if (condsArr.length === 1) {
                return condsArr[0];
            } else {
                let or = {};
                or["OR"] = condsArr;
                return or;
            }
        }
    }

    function buildObject(isNot, field, option, literal) { //
        let keyObj = {};
        let val = literal;
        if (option === "IS" && typeof literal === "number") {
            val = literal.toString();
        }
        if (courseKeys.includes(field) || roomKeys.includes(field)) {
            let key = dataId.concat(field);
            keyObj[key] = val;
        } else {
            let key = field;
            keyObj[key] = val;
        }
        let op = {};
        op[option] = keyObj;
        if (isNot) {
            let not = {};
            not["NOT"] = op;
            return not;
        } else {
            return op;
        }
    }

    function checkNot(not) {
        return not.querySelector("input").checked;
    }

    function getField(fields) {
        let field;
        let options = fields.querySelector("select").children;
        for (const opt of options) {
            if (opt.selected) {
                field = opt.value;
            }
        }
        return field;
    }

    function getOperator(op) {
        let options = op.querySelector("select").children;
        let option;
        for (const opt of options) {
            if (opt.selected) {
                option = opt.value;
            }
        }
        return option;
    }

    function getInputValue(controlTerm) {
        let val = controlTerm.querySelector("input").value;
        if (!isNaN(val)) {
            return Number(val);
        }
        {
            return val;
        }
    }

    // COLUMNS *****************
    let columnFields = activeTab.getElementsByClassName("form-group columns")[0]
        .getElementsByClassName("control-group")[0].children;
    let columnsArr = [];
    for (const field of columnFields) {
        let it = field.children[0];
        if (it.checked) {
            if (courseKeys.includes(it.value) || roomKeys.includes(it.value)) {
                columnsArr.push(dataId.concat(it.value));
            } else {
                columnsArr.push(it.value);
            }
        }
    }
    let optionsObj = {};
    optionsObj["COLUMNS"] = columnsArr;

    // ORDER ******************
    let orderArr = [];
    let order = activeTab.getElementsByClassName("form-group order")[0]
        .getElementsByClassName("control-group")[0].children;

    let directionDown = order[1].children[0].checked;

    let orderElements = order[0].querySelector("select");
    for (const e of orderElements) {
        if (e.selected) {
            if (courseKeys.includes(e.value) || roomKeys.includes(e.value)) {
                orderArr.push(dataId.concat(e.value));
            } else {
                orderArr.push(e.value);
            }
        }
    }

    if (orderArr.length !== 0) {
        let order = {};
        if (directionDown) {
            order["dir"] = "DOWN";
        } else {
            order["dir"] = "UP";
        }
        order["keys"] = orderArr;
        optionsObj["ORDER"] = order;
    }

    if (columnsArr.length !== 0 || orderArr.length !== 0) {
        query["OPTIONS"] = optionsObj;
    }
    /*******************************************************************/
    // TRANSFORMATION //
    let transObj = {};
    let flag = false;
    let flagForAppArr = false;
    let groupArr;
    let transArr = activeTab.getElementsByClassName("transformations-container")[0].children;
    let groupFormArr = activeTab.getElementsByClassName("form-group groups")[0].children[1].children;

    // buildTransObj
    groupArr = buildGroupHelper();
    transObj["GROUP"] = groupArr;
    transObj["APPLY"] = buildApplyHelper();
    if (flag || flagForAppArr) {
        query["TRANSFORMATIONS"] = transObj;
    }

    function buildGroupHelper() {
        let arr = [];
        for (const group of groupFormArr) {
            if (group.children[0].checked) {
                arr.push(dataId.concat(group.children[0].value));
            }
        }
        if (arr.length !== 0) {
            flag = true;
        }
        return arr;
    }

    function buildApplyHelper() {
        let appArr = [];
        if (transArr.length !== 0) {
            for (const app of transArr) {
                let obj = {};
                let applyKey = getApplyKey(app.getElementsByClassName("control term")[0]);
                let mathOp = getMathOp(app.getElementsByClassName("control operators")[0]);
                let key = getKey(app.getElementsByClassName("control fields")[0]);
                obj = buildObjHelper(applyKey, mathOp, key);
                appArr.push(obj);

            }
        }
        if (appArr.length !== 0) {
            flagForAppArr = true;
        }
        return appArr;
    }

    function buildObjHelper(applyKey, mathOp, key) {
        let obj = {};
        let appObj = {};
        obj[mathOp] = key;
        appObj[applyKey] = obj;
        return appObj;
    }

    function getApplyKey(term) {
        let val = term.querySelector("input").value;
        return val;
    }

    function getMathOp(op) {
        let options = op.querySelector("select").children;
        let mathOp;
        for (const op of options) {
            if (op.selected) {
                mathOp = op.value;
            }
        }
        return mathOp;
    }

    function getKey(fields) {
        let keys = fields.querySelector("select").children;
        let key;
        for (const k of keys) {
            if (k.selected) {
                key = k.value;
            }
        }
        return dataId.concat(key);
    }

    return query;
};
