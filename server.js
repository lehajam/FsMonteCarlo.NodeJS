var http = require('http');
var r = require('rethinkdb');
var request = require("request");

var connection = null
r.connect({ host: 'localhost', port: 28015 }, function (err, conn) {
    if (err) throw err;
    connection = conn;
})

var port = process.env.port || 1337;

function price_request(url, market_data, call_back) {
    request({
        url: url, // sends requests to F# web app for pricing
        json: true,
        method: "POST",
        body: market_data,
        headers: {
            "content-type": "application/json",
            //"content-length": blob.length
        },
        },
        call_back);
}

function price_call_back(err, price_response, body) {
    if (!err) {
        if ("price" in body[0]) {
            res.write(String(body[0].price) + '\n\n');
        }
        else if ("error" in row.new_val) {
            res.write('Pricing error');
        }
    }
}

//Server acting as a controller between the pricing (View) and the market data (Model)
http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/x-json' });

    //Proposed interface : Client sends trade id and server loads market data from rethinkdb 
    //(so all the dependencies)
    //before subscribing
    //For each market data tick :
    //1 - lookup all markets for market data update
    //2 - Generate updated container
    //3 - Send pricing request
    //4 - Send JSON result back

    //TODO: Pass the undeerlying id (and market data type) for market data to observe as GET parameter
    //TODO: Load market data from db before subcribing
    //TODO: Keep track of market data subscription per id in a flat structure for updates

    var marketData = [
        { "timeStamp": "17/11/2016 8:15:19", "spot": 100.00 },
        { "timeStamp": "17/11/2016 8:15:19", "sigma": 0.1 },
        { "timeStamp": "17/11/2016 8:15:19", "rate": 0.01 }
    ]

    r.table('market_data').changes().run(connection, function (err, cursor) {
        if (err) throw err;
        cursor.each(function (err, row) {
            if (err) throw err;

            if ("spot" in row.new_val) {
                marketData[0].spot = row.new_val.spot
                marketData[0].timeStamp = row.new_val.timeStamp
            }
            else if ("sigma" in row.new_val) {
                marketData[1].sigma = row.new_val.sigma
                marketData[1].timeStamp = row.new_val.timeStamp
            }
            else if ("rate" in row.new_val) {
                marketData[2].rate = row.new_val.rate
                marketData[2].timeStamp = row.new_val.timeStamp
            }

            res.write(JSON.stringify(marketData) + '\n\n');
            price_request('http://localhost:8085/pricing/', marketData, price_call_back);
        });
    });
}).listen(port);
console.log("Listening on port " + String(port))