/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
import {InsightResponse} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;
    private static instance: InsightFacade = new InsightFacade();

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Log.info("Server::start() - start");

                that.rest = restify.createServer({
                    name: "insightUBC",
                });

                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });

                // TA Code
                that.rest.use(restify.bodyParser({
                    mapParams: true,
                    mapFiles: true,
                }));
                //

                // that.rest.get("/dataset", function (req: restify.Request, res:
                // restify.Response, next: restify.Next) {
                //     res.send(200);
                //     return next();
                // });

                // Serves static files for the UI.
                that.rest.get("/public/.*", restify.serveStatic({
                    directory: __dirname,
                }));

                // This is an example endpoint that you can invoke by accessing this URL in your browser:
                // http://localhost:4321/echo/hello
                that.rest.get("/echo/:msg", Server.echo);
                // state of dataset, put dataset of kind with id
                // local host - rest server
                // NOTE: your endpoints should go here
                // that.rest.put("/dataset/:id", Server.put);

                that.rest.get("/datasets", function (req: restify.Request, res: restify.Response,
                                                     next: restify.Next) {
                    Server.instance.listDatasets().then(function (result: any) {
                        res.json(result.code, result.body);
                    }).catch(function (err: any) {
                        res.json(err.code, err.body);
                    });
                    return next();
                });

                // that.rest.get("/dataset", Server.getDatasets);

                that.rest.put("/dataset/:id/:kind", function (req: restify.Request, res: restify.Response,
                                                              next: restify.Next) {
                    // let data = req.params.body;, pass into insightfacade
                    let data = new Buffer(req.params.body).toString("base64");
                    Server.instance.addDataset(req.params.id, data, req.params.kind).then(function (result: any) {
                        res.json(result.code, result.body);
                    }).catch(function (err: any) {
                        res.json(err.code, err.body);
                    });
                    return next();
                });
                // that.rest.put("/dataset/:id/:kind", function (req: restify.Request, res: restify.Response,
                //                                               next: restify.Next) {
                //     const add = new InsightFacade();
                //     let data = new Buffer(req.params.body).toString("base64");
                //     add.addDataset(req.params.id, data, req.params.kind).then(function (result: any) {
                //         res.json(result.code, result.body);
                //     }).catch(function (err: any) {
                //         res.json(err.code, err.body);
                //     });
                //     return next();
                // });
                // incoming req JSON wrapped in HTTP, server forwards to endppoint, calls method and processes
                // and return response

                that.rest.del("/dataset/:id", function (req: restify.Request, res: restify.Response,
                                                        next: restify.Next) {
                    Server.instance.removeDataset(req.params.id).then(function (result: any) {
                        res.json(result.code, result.body);
                    }).catch(function (err: any) {
                        res.json(err.code, err.body);
                    });
                    return next();
                });
                that.rest.post("/query", function (req: restify.Request, res: restify.Response,
                                                   next: restify.Next) {
                    Server.instance.performQuery(req.body).then(function (result: any) {
                        // res.status(result.code);
                        // res.json(result.body);
                        res.json(result.code, result.body);
                    }).catch(function (err: any) {
                        res.json(err.code, err.body);
                    });
                    return next();
                });

                // that.rest.del("/dataset/:id", Server.delete);
                // that.rest.del("/dataset/:id", function (req: restify.Request, res: restify.Response,
                //                                         next: restify.Next) {
                //     const dell = new InsightFacade();
                //     dell.removeDataset(req.params.id).then(function (result: any) {
                //         res.json(result.code, result.body);
                //     }).catch(function (err: any) {
                //         res.json(err.code, err.body);
                //     });
                //     return next();
                // });
                // // that.rest.post("/query", Server.post);
                // that.rest.post("/query", function (req: restify.Request, res: restify.Response,
                //                                    next: restify.Next) {
                //     const quer = new InsightFacade();
                //     quer.performQuery(req.body).then(function (result: any) {
                //         // TA Code
                //         res.status(result.code);
                //         res.json(result.body);
                //         // res.json(result.code, result.body);
                //         // TA Code
                //     }).catch(function (err: any) {
                //         res.json(err.code, err.body);
                //     });
                //     return next();
                // });

                // This must be the last endpoint!
                that.rest.get("/.*", Server.getStatic);

                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });

                that.rest.on("error", function (err: string) {
                    // catches errors in restify start; unusual syntax due to internal
                    // node not using normal exceptions here
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });

            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }

    // private static getDatasets(req: restify.Request, res: restify.Response, next: restify.Next) {
    //     Server.instance.listDatasets().then((response) => {
    //         res.json(response.code, {});
    //         return next();
    //     }).catch((err) => {
    //         res.json(err.code, {});
    //         return next();
    //     });
    // }
    // The next two methods handle the echo service.
    // These are almost certainly not the best place to put these, but are here for your reference.
    // By updating the Server.echo function pointer above, these methods can be easily moved.
    private static echo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const result = Server.performEcho(req.params.msg);
            Log.info("Server::echo(..) - responding " + result.code);
            res.json(result.code, result.body);
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err.message});
        }
        return next();
    }

    private static performEcho(msg: string): InsightResponse {
        if (typeof msg !== "undefined" && msg !== null) {
            return {code: 200, body: {result: msg + "..." + msg}};
        } else {
            return {code: 400, body: {error: "Message not provided"}};
        }
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

}
