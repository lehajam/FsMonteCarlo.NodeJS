var http = require('http');

var port = process.env.port || 1337;
var mock_response = [{ contract_id: "SPX CALL DEC17 2000.0", price: 0.1 }]

//Mock server returning a mock response
http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/x-json' });
    res.end(JSON.stringify(mock_response));
}).listen(port, function () {
    console.log("Listening on port " + String(port));
}).listen(port);