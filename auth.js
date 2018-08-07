/**
 * @author Akshay Misal
 * @version 1.0.0
 * @since 03-Aug-2018
 */
var express = require('express');
var router = express.Router();
var Q = require('q');
var jwt = require('jsonwebtoken');
var config = require('./config.json');
var mongo = require('mongoskin');
var StellarSdk = require('stellar-sdk');
var request = require('request');
var stellarNetwork = config.stellarNetwork;
var db = mongo.db(config.connectionString, {
    native_parser: true
});
db.bind('account');

if (stellarNetwork === "test") {
    StellarSdk.Network.useTestNetwork();
} else if (stellarNetwork === "public") {
    StellarSdk.Network.usePublicNetwork();
}
var server = new StellarSdk.Server(config.stellarServer);

router.get('/',authenticate);

module.exports = router;

/**
 * @author:Akshay Misal
 * @param {lenderSeed} req 
 * @param {token} res 
 * @description:This function will generate the token. For error handling, we made changes in native 
 */
function authenticate(req,res) {
    var accountSeed = req.query.accountSeed;
    console.log(accountSeed);
    var sourceKeys = StellarSdk.Keypair.fromSecret(accountSeed);

    if(sourceKeys.publicKey()){
        var token = jwt.sign({ sub: accountSeed }, config.secret);
        req.session.token = token;
        console.log("add session data = ",req.session);
        res.send({token : token});
    }

}