"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = require("../src/rest/Server");
const chai_1 = require("chai");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const chai = require("chai");
const Util_1 = require("../src/Util");
const chaiHttp = require("chai-http");
describe("Facade D3", function () {
    let facade = null;
    let server = null;
    const fs = require("fs");
    chai.use(chaiHttp);
    before(function () {
        facade = new InsightFacade_1.default();
        server = new Server_1.default(4321);
        return server.start().then(function (status) {
            if (status) {
                global.console.log("server start");
            }
        }).catch(function (err) {
            global.console.log(err);
            global.console.log("server down");
        });
    });
    after(function () {
        return server.stop().then(function (status) {
            if (status) {
                global.console.log("server stopped");
            }
        }).catch(function (err) {
            global.console.log(err);
        });
    });
    beforeEach(function () {
        Util_1.default.test("Before: " + this.currentTest.title);
    });
    afterEach(function () {
        Util_1.default.test("After: " + this.currentTest.title);
    });
    it("GET 200 courses", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/datasets/courses")
                .attach("body", fs.readFileAsync("./courses.zip"), "courses.zip")
                .then(function (res) {
                global.console.log(res.body);
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                global.console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            global.console.log("error appeared");
        }
    });
    it("GET 200 rooms", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/datasets/rooms")
                .attach("body", fs.readFileAsync("./rooms.zip"), "rooms.zip")
                .then(function (res) {
                global.console.log(res.body);
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                global.console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            global.console.log(err);
        }
    });
    it("PUT 204 courses", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses")
                .attach("body", fs.readFileAsync("./courses.zip"), "courses.zip")
                .then(function (res) {
                global.console.log(res.body);
                chai_1.expect(res.status).to.be.equal(204);
            })
                .catch(function (err) {
                global.console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            global.console.log("error appeared");
        }
    });
    it("PUT 204 rooms", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms")
                .attach("body", fs.readFileAsync("./rooms.zip"), "rooms.zip")
                .then(function (res) {
                global.console.log(res.body);
                chai_1.expect(res.status).to.be.equal(204);
            })
                .catch(function (err) {
                global.console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            global.console.log(err);
        }
    });
    it("GET 200 courses", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/datasets/courses")
                .attach("body", fs.readFileAsync("./courses.zip"), "courses.zip")
                .then(function (res) {
                global.console.log(res.body);
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                global.console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            global.console.log("error appeared");
        }
    });
    it("GET 200 rooms", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/datasets/rooms")
                .attach("body", fs.readFileAsync("./rooms.zip"), "rooms.zip")
                .then(function (res) {
                global.console.log(res.body);
                chai_1.expect(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                global.console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            global.console.log(err);
        }
    });
    it("PUT 400 invalid courses", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses")
                .attach("body", fs.readFileAsync("./invalid.zip"), "invalid.zip")
                .then(function (res) {
                global.console.log(res);
                chai_1.expect.fail();
            })
                .catch(function (err) {
                global.console.log(err.response.body);
                chai_1.expect(err.status).to.be.equal(400);
            });
        }
        catch (err) {
            global.console.log("invalid zip");
        }
    });
    it("PUT 400 invalid rooms", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms")
                .attach("body", fs.readFileAsync("./invalid.zip"), "invalid.zip")
                .then(function (res) {
                global.console.log(res);
                chai_1.expect.fail();
            })
                .catch(function (err) {
                global.console.log(err.response.body);
                chai_1.expect(err.status).to.be.equal(400);
            });
        }
        catch (err) {
            global.console.log("invalid zip");
        }
    });
    it("POST 200", function () {
        return chai.request("http://localhost:4321")
            .post("/query")
            .send({
            WHERE: {
                GT: {
                    courses_avg: 97,
                },
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_avg",
                ],
                ORDER: "courses_avg",
            },
        }).then(function (res) {
            Util_1.default.trace("then: ");
            global.console.log(res.body);
            chai_1.expect(res.status).to.equal(200);
        }).catch(function (err) {
            Util_1.default.trace("catch: ");
            global.console.log(err);
            chai_1.expect.fail();
        });
    });
    it("POST 400", function () {
        return chai.request("http://localhost:4321")
            .post("/query")
            .send({
            WHERE: {
                GT: {},
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_avg",
                ],
                ORDER: "courses_avg",
            },
        }).then(function (res) {
            Util_1.default.trace("then: ");
            global.console.log(res);
            chai_1.expect.fail();
        }).catch(function (err) {
            Util_1.default.trace("catch: ");
            global.console.log(err.body);
            chai_1.expect(err.status).to.equal(400);
        });
    });
    it("DEL 204 rooms", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/rooms")
                .attach("body", fs.readFileAsync("./rooms.zip"), "rooms.zip")
                .then(function (res) {
                global.console.log(res.body);
                chai_1.expect(res.status).to.be.equal(204);
            })
                .catch(function (err) {
                global.console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            global.console.log("error appeared");
        }
    });
    it("PUT 204 rooms", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms")
                .attach("body", fs.readFileAsync("./rooms.zip"), "rooms.zip")
                .then(function (res) {
                global.console.log(res.body);
                chai_1.expect(res.status).to.be.equal(204);
            })
                .catch(function (err) {
                global.console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            global.console.log(err);
        }
    });
    it("DEL 204 courses", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/courses")
                .attach("body", fs.readFileAsync("./courses.zip"), "courses.zip")
                .then(function (res) {
                global.console.log(res.body);
                chai_1.expect(res.status).to.be.equal(204);
            })
                .catch(function (err) {
                global.console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            global.console.log("error appeared");
        }
    });
    it("empty 400 courses", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/empty")
                .attach("body", fs.readFileAsync("./empty.zip"), "empty.zip")
                .then(function (res) {
                global.console.log(res);
                chai_1.expect.fail();
            })
                .catch(function (err) {
                global.console.log(err.response.body);
                chai_1.expect(err.status).to.be.equal(400);
            });
        }
        catch (err) {
            global.console.log("empty zip");
        }
    });
});
//# sourceMappingURL=Server.spec.js.map