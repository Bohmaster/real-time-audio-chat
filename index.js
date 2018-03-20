var path = require('path');
var express = require('express');


var https = require('https');
var fs = require('fs');


var routes = require('./routes');

var app = express();

var ExpressPeerServer = require('peer').ExpressPeerServer;

var port = 8443;

var options = {
    key: fs.readFileSync("connections-si_com.key"),
    cert: fs.readFileSync("connections-si_com.crt"),
    ca: [
        fs.readFileSync('COMODO_RSA_Certification_Authority.crt'),
        fs.readFileSync('AddTrust_External_CA_Root.crt')
    ]

};

var server = https.createServer(options, app).listen(port, function () {
    console.log("Express server listening on port " + port);
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes, ExpressPeerServer(app, {
    debug: true
}));

