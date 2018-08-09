/**
 * @author Girijashankar Mishra
 * @version 1.0.0
 * @since 27-July-2018
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var config = require('../config/config.json');
var mongo = require('mongoskin');
const ora = require('ora')

var db = mongo.db(config.connectionString, {
    native_parser: true
});
db.bind('account');

var StellarSdk = require('stellar-sdk');
var request = require('request');

var stellarNetwork = config.stellarNetwork;

if (stellarNetwork === "test") {
    StellarSdk.Network.useTestNetwork();
} else if (stellarNetwork === "public") {
    StellarSdk.Network.usePublicNetwork();
}
var server = new StellarSdk.Server(config.stellarServer);

// router.post('/create', create);
// router.get('/getAccount', getAccountDetails);
// router.get('/auditAccount', getAccountAudit);
exports.create = exports.getAccount = exports.getAccountAudit = undefined;

exports.create = create;
exports.getAccount = getAccountDetails;
exports.getAccountAudit = getAccountAudit;
//export this router to use in our server.js
// module.exports = router;



/**
 * @author Girijashankar Mishra
 * @description Create account on Stellar Network and store it in DB
 * @param {userName,accountName,accountRole} req 
 * @param {JSONObject} res 
 */
function create(req, res) {
    // var deferred = Q.defer();
    const spinner = ora().start()
    try {
        var pair = StellarSdk.Keypair.random();
        const userName = args.username || args.u;
        const role = args.role || args.r;
        const network = args.networkType || args.n;

        var account = {};
        var accountId = pair.publicKey();
        var accountSeed = pair.secret();
        // console.log(accountId);
        account["userName"] = req.body.userName;
        account["accountName"] = req.body.accountName;
        account["accountRole"] = req.body.accountRole;
        account["accountId"] = accountId;
        account["accountSeed"] = accountSeed;
        console.log("account => ", account);

        if (network === "test") {
            request.get({
                // url: 'http://35.154.156.45:8000/friendbot',
                url: config.serverUrl,
                qs: {
                    addr: accountId
                },
                json: true
            }, function (error, response, body) {
                if (error || response.statusCode !== 200) {
                    // console.error('ERROR!', error || body);
                } else {
                    // console.log('SUCCESS! You have a new account :)\n', body);

                    account["remarks"] = "Account has been funded using test network.";
                    db.account.insert(
                        account,
                        function (err, acc) {
                            if (err) deferred.reject(err.name + ': ' + err.message);
                            res.setHeader('Content-Type', 'application/json');
                            // console.log("acc created =",acc);
                            // res.send(acc);
                            spinner.stop();
                            return acc;
                        });
                }
            });
        } else if (network === "public") {
            account["remarks"] = "Please fund your account to activate all services.";
            db.account.insert(
                account,
                function (err, acc) {
                    if (err) deferred.reject(err.name + ': ' + err.message);
                    res.setHeader('Content-Type', 'application/json');
                    // console.log(acc);
                    // res.send(acc);
                    spinner.stop();
                    return acc;
                });
        }
    } catch (err) {
        spinner.stop()

        console.error(err)
    }
}

/**
 * @author Girijashankar Mishra
 * @description Get Account details from Stellar Network based on accountId
 * @param {accountId} req 
 * @param {AccountResponse} res 
 */
function getAccountDetails(req, res) {
    var accountId = req.query.accountId;
    // the JS SDK uses promises for most actions, such as retrieving an account
    server.loadAccount(accountId).then(function (account) {
        res.send(account);
    });

}

/**
 * @author Girijashankar Mishra
 * @description Get all activities performed for an account from Stellar Network based on accountId
 * @param {accountId} req 
 * @param {CollectionPage<EffectRecord>} res 
 */
function getAccountAudit(req, res) {
    var accountId = req.query.accountId;
    server.effects()
        .forAccount(accountId)
        .call()
        .then(function (effectResults) {
            //page 1
            // console.log(effectResults.records)
            res.setHeader('Content-Type', 'application/json');
            res.send(effectResults.records);
        })
        .catch(function (err) {
            // console.log(err);
            res.send(err);
        })
}