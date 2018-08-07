/**
 * @author Girijashankar Mishra
 * @version 1.0.0
 * @since 27-July-2018
 */
var express = require('express');
var router = express.Router();
var Q = require('q');
var config = require('./config.json');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {
    native_parser: true
});
db.bind('account');

var StellarSdk = require('stellar-sdk');
var request = require('request');
var server = new StellarSdk.Server(config.stellarServer);

var stellarNetwork = config.stellarNetwork;

if (stellarNetwork === "test") {
    StellarSdk.Network.useTestNetwork();
} else if (stellarNetwork === "public") {
    StellarSdk.Network.usePublicNetwork();
}

router.post('/lend', lend);
router.post('/exchange', exchange);
router.get('/exAssetToFiat',exAssetToFiat);
router.get('/streamPayments',streamPayments);

//export this router to use in our server.js
module.exports = router;

/**
 * @author Girijashankar Mishra
 * @description Lender lends money in the form of asset to borrower.
 * @param {*} req 
 * @param {*} res 
 */
function lend(req, res) {
    var lenderId = req.body.lenderId;
    var borrowerId = req.body.borrowerId;
    var amount = req.body.amount;
    var memo = req.body.remarks;
    var assetName = req.body.assetName;
    var lenderSeed = req.body.lenderSeed;
    // var borrowerSeed = req.body.borrowerSeed;

    var transaction;

    var sourceKeys = StellarSdk.Keypair.fromSecret(lenderSeed);

    // the transaction fee when the transaction fails.
    server.loadAccount(borrowerId) // If the account is not found, surface a nicer error message for logging.
        .catch(StellarSdk.NotFoundError, function (error) {
            //   throw new Error('The destination account does not exist!');
            res.send('The destination account does not exist!')
        }) // If there was no error, load up-to-date information on your account.
        .then(function () {
            return server.loadAccount(lenderId);
        }).then(function (sourceAccount) {
            var balances = JSON.parse(JSON.stringify(sourceAccount)).balances;
            // console.log('SourceAccount balances === ' + JSON.stringify(balances));
            var issuerId = "";

            for (var i = 0; i < balances.length; i++) {
                var asset_code = balances[i].asset_code;
                if (assetName === asset_code) {
                    issuerId = balances[i].asset_issuer;
                }
            }
            // Start building the transaction.
            transaction = new StellarSdk.TransactionBuilder(sourceAccount)
                .addOperation(StellarSdk.Operation.payment({
                    destination: borrowerId,
                    // Because Stellar allows transaction in many currencies, you must
                    // specify the asset type. The special "native" asset represents Lumens.
                    // asset: StellarSdk.Asset.native(),
                    asset: new StellarSdk.Asset(assetName, issuerId),
                    amount: amount
                }))
                // A memo allows you to add your own metadata to a transaction. It's
                // optional and does not affect how Stellar treats the transaction.
                .addMemo(StellarSdk.Memo.text(memo))
                .build();
            // Sign the transaction to prove you are actually the person sending it.
            transaction.sign(sourceKeys);
            // And finally, send it off to Stellar!
            return server.submitTransaction(transaction);
        }).then(function (result) {
            // console.log('Success! Results:', result);

            res.setHeader('Content-Type', 'application/json');
            res.send(result);
        })
        .catch(function (error) {
            // console.error('Something went wrong!', error);
            res.setHeader('Content-Type', 'application/json');
            res.send(error);
        });
}

/**
 * @author Girijashankar Mishra
 * @description Borrower exchanges asset to fiat(currency) from credit node.
 * @param {*} req 
 * @param {*} res 
 */
function exchange(req, res) {
    var creditNodeId = config.issuerAccount;
    var borrowerId = req.body.borrowerId;
    var amount = req.body.amount;
    var memo = req.body.remarks;
    var assetName = req.body.assetName;
    var borrowerSeed = req.body.borrowerSeed;

    var transaction;

    var sourceKeys = StellarSdk.Keypair.fromSecret(borrowerSeed);

    // the transaction fee when the transaction fails.
    server.loadAccount(creditNodeId) // If the account is not found, surface a nicer error message for logging.
        .catch(StellarSdk.NotFoundError, function (error) {
            //   throw new Error('The destination account does not exist!');
            res.send('The destination account does not exist!')
        }) // If there was no error, load up-to-date information on your account.
        .then(function () {
            return server.loadAccount(borrowerId);
        }).then(function (sourceAccount) {
            var balances = JSON.parse(JSON.stringify(sourceAccount)).balances;
            // console.log('SourceAccount balances === ' + JSON.stringify(balances));
            var issuerId = "";

            for (var i = 0; i < balances.length; i++) {
                var asset_code = balances[i].asset_code;
                if (assetName === asset_code) {
                    issuerId = balances[i].asset_issuer;
                }
            }
            // Start building the transaction.
            transaction = new StellarSdk.TransactionBuilder(sourceAccount)
                .addOperation(StellarSdk.Operation.payment({
                    destination: creditNodeId,
                    // Because Stellar allows transaction in many currencies, you must
                    // specify the asset type. The special "native" asset represents Lumens.
                    // asset: StellarSdk.Asset.native(),
                    asset: new StellarSdk.Asset(assetName, issuerId),
                    amount: amount
                }))
                // A memo allows you to add your own metadata to a transaction. It's
                // optional and does not affect how Stellar treats the transaction.
                .addMemo(StellarSdk.Memo.text(memo))
                .build();
            // Sign the transaction to prove you are actually the person sending it.
            transaction.sign(sourceKeys);
            // And finally, send it off to Stellar!
            return server.submitTransaction(transaction);
        }).then(function (result) {
            // console.log('Success! Results:', result);

            res.setHeader('Content-Type', 'application/json');
            res.send(result);
            // exAssetToFiat(req,res);
        })
        .catch(function (error) {
            // console.error('Something went wrong!', error);
            res.setHeader('Content-Type', 'application/json');
            res.send(error);
        });
}

/**
 * @author:Akshay Misal
 * @description:This function will convert asset into the fiat, by using PayPal function
 */
function exAssetToFiat(req,res) {
    var data = {
        amount:req.body.amount,
        assetType: 'USD'
    }
    res.render('assetToFiat.ejs',{data:data});
}

  /**
 * @author:Akshay Misal
 * @description:streamPayments
 */
function streamPayments(req,res) {
    res.sendFile('views/stream_payments.html',{root:__dirname});
}