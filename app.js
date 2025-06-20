// Include the cluster module
var cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {

    let os = require('os')

    var STARTING_PORT = 3020;
    var NUMBER_OF_WORKERS = os.cpus().length;   // 16

    // resultsSellingOrders, resultsBuyingOrders
    // process.on('message', function(msg) {
    //     console.log('main process received message')
    //     // we only want to intercept messages that have a chat property
    //     if (msg.resultsSellingOrders && msg.resultsBuyingOrders) {
    //         process.send({ resultsSellingOrders: msg.resultsSellingOrders, resultsBuyingOrders: msg.resultsBuyingOrders});
    //     }
    // });

    for (var i = 0; i < NUMBER_OF_WORKERS; i++) {

        // Passing each worker its port number as an environment variable.
        let worker = cluster.fork({ port: STARTING_PORT + i });

        // worker.on('message', function (msg) {
        //       console.log('HAHAHAHAHAH', i)
        //
        //     if (msg.resultsSellingOrders && msg.resultsBuyingOrders) {
        //         console.log('HAHAHAHAHAH RECEIVED FROM WORKER', i)
        //         Object.keys(cluster.workers).forEach(function (id) {
        //             cluster.workers[id].send({resultsSellingOrders: msg.resultsSellingOrders, resultsBuyingOrders: msg.resultsBuyingOrders});
        //         });
        //     }
        //
        //    // worker.send({msg: 'JBHBHVFDJVNDJFBNFD'})
        //
        //     })
    }

    cluster.on('exit', function(worker, code, signal) {
        // Create a new worker, log, or do whatever else you want.
        console.log('cluster exit with code:', code)
    });



// Code to run if we're in a worker process
} else {
    // process.on('message', function(msg) {
    //     // we only want to intercept messages that have a chat property
    //     if (msg.resultsSellingOrders && msg.resultsBuyingOrders) {
    //         console.log('received msg.resultsSellingOrders msg.resultsBuyingOrders');
    //     } else {
    //         console.log('received something else', msg)
    //     }
    // });



    var http = require('http');
    var bodyParser = require('body-parser');
    var cookieParser = require('cookie-parser');
   // var client = require('redis').createClient();
    var pool = require('./models/DBConnectionModel').returnPoolConnection();
    var helmet = require('helmet');
    var fs = require('fs');
    let axios = require('axios');
    let Binance = require('binance-api-node');
    let Big = require('big.js')
    Big.RM = 0;
   // let redis = require('redis');
  //  let CONSTANTS = require('./Constants');
    let binanceModel = require('./models/BinanceModel');
    let storyModel = require('./models/StoryModel');

    Number.prototype.trimNum = function (places, rounding) {
        rounding = rounding || "round";
        var num = parseFloat(this), multiplier = Math.pow(10, places);
        return (Number(Math[rounding](num * multiplier) / multiplier));
    }





    var express = require('express'),
        app = module.exports.app = express();
    app.use(bodyParser.json());       // to support JSON-encoded bodies
    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
        extended: true
    }));
    app.use(helmet.noCache());

    var server = http.createServer(app);
// socket API
    var io = require('socket.io').listen(server);  //pass a http.Server instance
    var basicAPI = require('./api')(io);


    server.listen(process.env.port, function () {
        console.log('Example app here! 111z '+process.env.port+' 1');
    });
    // let ordersObj = {
    //     resultsSellingOrders: [],
    //     resultsBuyingOrders: []
    // }
    //
    //
    // process.on('message', function (msg) {
    //     if (msg.resultsSellingOrders && msg.resultsBuyingOrders) {
    //         ordersObj.resultsSellingOrders = msg.resultsSellingOrders;
    //         ordersObj.resultsBuyingOrders = msg.resultsBuyingOrders;
    //         console.log('lalalalalLALALALALAL received & assigned', process.env.port)
    //     }
    // })

    // var authAPI = require('./api/AuthApi')(io);
    // //var balanceAPI = require('./api/BalanceApi')(io, ordersObj);
    // var balanceAPI = require('./api/BalanceApi')(io);

// set the view engine to ejs
    app.set('view engine', 'ejs');
    app.use(cookieParser());
    app.use(express.static(__dirname + '/public'));
    app.disable('x-powered-by');    // security

    // app.use(function (req, res, next) {
    //     let envData = {
    //         url: CONSTANTS.socketAddrr,
    //         debugServer: CONSTANTS.debugServer,
    //     };
    //
    //     req.ejsData = {envData};
    //     next();
    // });

    app.get('/', (req, res) => {
        var obj = {};
        res.render('home', obj)
        storyModel.getLastFourComments()
            .then(lastComments => {
                obj.lastComments = lastComments;
                return storyModel.getLastThreeStory()
            })
            .then(lastStories => {
                obj.lastStories = lastStories;
                res.render('home', obj)
            });
    });

    app.get('/stories', (req, res) => {
        var obj = {};
        storyModel.getLastFourComments()
            .then(lastComments => {
                obj.lastComments = lastComments;
                return storyModel.getLastThreeStory()
            })
            .then(lastStories => {
                obj.lastStories = lastStories;
                res.render('stories', obj)
            });
    });

    app.get('/contact', (req, res) => {
        var obj = {};
        storyModel.getLastFourComments()
            .then(lastComments => {
                obj.lastComments = lastComments;
                return storyModel.getLastThreeStory()
            })
            .then(lastStories => {
                obj.lastStories = lastStories;
                res.render('contact', obj)
            });
    });

    app.get('/add-story', (req, res) => {
        var obj = {};
        storyModel.getLastFourComments()
            .then(lastComments => {
                obj.lastComments = lastComments;
                return storyModel.getLastThreeStory()
            })
            .then(lastStories => {
                obj.lastStories = lastStories;
                res.render('addStory', obj)
            });
    });

    app.get('/buy-email', (req, res) => {
        var obj = {};
        storyModel.getLastFourComments()
            .then(lastComments => {
                obj.lastComments = lastComments;
                return storyModel.getLastThreeStory()
            })
            .then(lastStories => {
                obj.lastStories = lastStories;
                res.render('buyEmail', obj)
            });
    });

    app.get('/buy-place-in-the-team', (req, res) => {
        var obj = {};
        storyModel.getLastFourComments()
            .then(lastComments => {
                obj.lastComments = lastComments;
                return storyModel.getLastThreeStory()
            })
            .then(lastStories => {
                obj.lastStories = lastStories;
                res.render('buyPlace', obj)
            });
    });

    app.get('/s/:idStory/:slug', (req, res) => {
        var obj = {storyId: req.params.idStory};
        storyModel.getStoryById(req.params.idStory)
            .then(story => {
                obj.story = story;
                return storyModel.getLastFourComments()
            })
            .then(lastComments => {
                obj.lastComments = lastComments;
                return storyModel.getLastThreeStory()
            })
            .then(lastStories => {
                obj.lastStories = lastStories;
                return storyModel.getComments(obj.story.id);
            })
            .then(comments => {
                obj.comments = comments;
                if (req.params.slug !== obj.story.urlSlug) {
                    res.send('The link is not valid')
                }
                else {
                    res.render('storyPage', obj);
                }
            })
            .catch(err => {
                res.send(err.message);
            });
    });

    if (process.env.port === "3020") {



        // let binance = require('node-binance-api')().options({
        //     APIKEY: 'UrEBjjK6C7KtH5uhaXgtXAT6CsXT7R950WMzZj1iNoWRAbtnaTRO163GwoLHBJXk',
        //     APISECRET: 'bj158add8zDQtZMj3mMrktMRO7dlvjxje5Qvucaz8yu3kOZDbu3S947Ptf2O1tUY',
        //     useServerTime: true // If you get timestamp errors, synchronize to server time at startup
        // });

        // binanceModel.getUsdtAvailableBalance()
        //     .then(balance => {
        //         console.log('balance', balance.toFixed(3))
        //     })
        //     .catch(e => {
        //         console.log(e)
        //     })

        let lastBtcPrice = null;
        let minutesWhenGoDown = 0;
        let minutesWhenGoUp = 0;

        let lastSellPriceBig = null;
        let lasBuyPriceBig = null;
        //let lasBuyPriceBig = Big(7387.89);

        // binanceModel.getActualBtcPriceInUsdt()
        //     .then(btcPrice => {
        //         return binanceModel.sellAllBtc(btcPrice)
        //     })
        //     .then(ok => {
        //         console.log(ok)
        //     })
        //     .catch(e => {
        //        if (e.body) {
        //            console.log(e.body)
        //        } else {
        //            console.log(e)
        //        }
        //
        //     })


        // setInterval(() => {
        //
        //     console.log('start bot executed');
        //
        // binanceModel.getActualBtcPriceInUsdt()
        //     .then(btcPrice => {
        //
        //         // last price was greater, so price go down
        //         if (lastBtcPrice !== null && lastBtcPrice.cmp(btcPrice) === 1) {
        //             console.log('lastBtcPrice !== null && lastBtcPrice.cmp(btcPrice) === 1, inside')
        //             minutesWhenGoDown = minutesWhenGoDown +1;   // add + 1 minute
        //
        //             if (minutesWhenGoUp >= 4) {
        //                 minutesWhenGoUp = 0; // reset
        //                 // sell
        //                 if (lasBuyPriceBig !== null && lasBuyPriceBig.cmp(btcPrice) === -1) {
        //                     console.log('last buy price was lower, so we can buy');
        //                     lastBtcPrice = btcPrice;
        //                     console.log('before return minutesWhenGoUp > 5');
        //                     return binanceModel.sellAllBtc(btcPrice)
        //                 } else if (lasBuyPriceBig === null) {
        //                     lastBtcPrice = btcPrice;
        //                     console.log('before return lasBuyPriceBig === null');
        //                     return binanceModel.sellAllBtc(btcPrice)
        //                 } else {
        //                     console.log('тик наступил, но купили курс щас ниже чем тот по которому мы купили', lasBuyPriceBig.toFixed(8), btcPrice.toFixed(8))
        //                 }
        //
        //             } else {
        //                 minutesWhenGoUp = 0; // reset
        //             }
        //
        //         } else if (lastBtcPrice !== null && lastBtcPrice.cmp(btcPrice) === -1) { // last price was smaller, so price go up
        //             console.log('lastBtcPrice !== null && lastBtcPrice.cmp(btcPrice) === -1, inside')
        //             minutesWhenGoUp = minutesWhenGoUp + 1; // add + 1 minute
        //
        //             if (minutesWhenGoDown >= 4) {
        //                 minutesWhenGoDown = 0;   // reset
        //                 // buy
        //                 if (lastSellPriceBig !== null && lastSellPriceBig.cmp(btcPrice) === 1) {
        //                     console.log('last sell price was bigger, so we can sell');
        //                     lastBtcPrice = btcPrice;
        //                     console.log('before return minutesWhenGoDown > 5');
        //                     return binanceModel.buyForAllBtc(btcPrice)
        //                 } else if (lastSellPriceBig === null) {
        //                     lastBtcPrice = btcPrice;
        //                     console.log('before return lastSellPriceBig === null');
        //                     return binanceModel.buyForAllBtc(btcPrice)
        //                 } else {
        //                     console.log('тик наступил, но курс продажи не метчнулся по критериям предудыщей покупки', lastSellPriceBig.toFixed(8), btcPrice.toFixed(8))
        //                 }
        //             } else {
        //                 minutesWhenGoDown = 0;   // reset
        //             }
        //         }
        //
        //         lastBtcPrice = btcPrice;
        //         return 'nothing to do'
        //     })
        //     .then(response => {
        //         // {forPrice, orderId: response.orderId, type: 'buy'}
        //         if (response.type && response.type === 'buy') {
        //             lasBuyPriceBig = response.forPrice;
        //             lastSellPriceBig = null;
        //             console.log('lasBuyPriceBig = response.forPrice:', response)
        //         } else if (response.type && response.type === 'sell') {
        //             lastSellPriceBig = response.forPrice;
        //             lasBuyPriceBig = null;
        //             console.log('lastSellPriceBig = response.forPrice:', response)
        //         }
        //
        //         console.log('response:' , response)
        //
        //         try {
        //             console.log('слева покупка битка', 'справа продажа битка')
        //             console.log( lastBtcPrice.toFixed(8), minutesWhenGoDown ,minutesWhenGoUp)
        //             if (lastSellPriceBig !== null) {
        //                 console.log('lastSellPriceBig', lastSellPriceBig.toFixed(8))
        //             }
        //
        //             if (lasBuyPriceBig !== null) {
        //                 console.log('lasBuyPriceBig', lasBuyPriceBig.toFixed(8))
        //             }
        //         } catch (e) {
        //             console.log('catch e inside then', e)
        //         }
        //
        //     })
        //     .catch(e => {
        //
        //         if (e.body) {
        //             console.log(e.body)
        //         } else {
        //             console.log(e)
        //         }
        //
        //     })
        // }, 60000);


    }



}
