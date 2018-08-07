var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var http = require('http');
var config = require('./config.json');
var swaggerUi = require('swagger-ui-express');

var expressJwt = require('express-jwt');
var cookieParser = require('cookie-parser');
var helmet = require('helmet');
var cors = require('cors');

app.use(cors());
app.use(helmet());
app.use(cookieParser());

app.use(session({ secret: config.secret, resave: false, saveUninitialized: true, maxAge: '60000' }));

// use JWT auth to secure the api
// app.use('', expressJwt({ secret: config.secret }).unless({ path: ['/auth/','/account/create','/asset/exFiatToAsset','/asset/exFiatToAssetStripe','/asset/createPayment','/asset/wallet','/payment/streamPayments'] }));

var server = http.createServer(app);

var mongo = require('mongodb').MongoClient;

app.get('/', function (req, res) {
    res.send('LendLedger');
})

//Path of swagger.json file in your app directory
var swaggerDocument = require('./swagger.json');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.use('/auth',require('./auth.js'));
app.use('/account', require('./account'));
app.use('/payment', require('./payment'));
app.use('/asset', require('./asset'));
app.use('/offer', require('./offer'));

//Expose your swagger documentation through your express framework
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); 

var StellarSdk = require('stellar-sdk')
var stellarServer = new StellarSdk.Server(config.stellarServer);

// Get a message any time a payment occurs. Cursor is set to "now" to be notified
// of payments happening starting from when this script runs (as opposed to from
// the beginning of time).
var es = stellarServer.payments()
    .cursor('now')
    .stream({
        onmessage: function (message) {
            // console.log(message);
        }
    })

var server = app.listen(3000, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Server listening on http://%s:%s", host, port)
})

module.exports = server