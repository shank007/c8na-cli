/**
 * @author Girijashankar Mishra
 * @version 1.0.0
 * @since 31-July-2018
 */
var express = require('express');
var router = express.Router();
var Q = require('q');
var config = require('./config.json');
var mongo = require('mongoskin');

var StellarSdk = require('stellar-sdk');
var request = require('request');
var server = new StellarSdk.Server(config.stellarServer);

var stellarNetwork = config.stellarNetwork;

if (stellarNetwork === "test") {
    StellarSdk.Network.useTestNetwork();
} else if (stellarNetwork === "public") {
    StellarSdk.Network.usePublicNetwork();
}

router.post('/manageOffer', manageOffer);
router.get('/getOffer', getOffer);
router.get('/streamOffers',streamOffers);

//export this router to use in our server.js
module.exports = router;

/**
 * @author Girijashankar Mishra
 * @description Any account holder in stellar can create an offer using this for native or any asset 
 *              which they have holded.
 * @param {*} req 
 * @param {*} res 
 */
function manageOffer(req, res) {
    var accountId = req.body.accountId;
    var accountSeed = req.body.accountSeed;
    var sellingAsset = req.body.sellingAsset;
    var sellingAssetIssuer = req.body.sellingAssetIssuer;
    var buyingAsset = req.body.buyingAsset;
    var buyingAssetIssuer = req.body.buyingAssetIssuer;
    var amountToSell = req.body.amountToSell;
    var assetPricePerUnit = req.body.assetPricePerUnit;
    var offerId = req.body.offerId; //If 0, will create a new offer. Existing offer id numbers can be found using the Offers for Account endpoint.

    var transaction;

    var sourceKeys = StellarSdk.Keypair.fromSecret(accountSeed);

    // the transaction fee when the transaction fails.
    server.loadAccount(accountId) // If the account is not found, surface a nicer error message for logging.
        .catch(StellarSdk.NotFoundError, function (error) {
            //   throw new Error('The destination account does not exist!');
            res.send('The account does not exist!')
        }) // If there was no error, load up-to-date information on your account.
        .then(function (sourceAccount) {
            var assetSelling;
            if (sellingAsset === "native") {
                assetSelling = StellarSdk.Asset.native();
            } else {
                assetSelling = new StellarSdk.Asset(sellingAsset, sellingAssetIssuer);
            }
            var assetBuying;
            if (buyingAsset === "native") {
                assetBuying = StellarSdk.Asset.native();
            } else {
                assetBuying = new StellarSdk.Asset(buyingAsset, buyingAssetIssuer);
            }
            // Start building the transaction.
            transaction = new StellarSdk.TransactionBuilder(sourceAccount)
                .addOperation(StellarSdk.Operation.manageOffer({
                    selling: assetSelling,
                    buying: buyingAsset,
                    amount: amountToSell,
                    price: assetPricePerUnit,
                    offerId: offerId
                }))
                // A memo allows you to add your own metadata to a transaction. It's
                // optional and does not affect how Stellar treats the transaction.
                .addMemo(StellarSdk.Memo.text('Offer has been created'))
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
 * @description Get Offers managed for a particular account.
 * @param {*} req 
 * @param {*} res 
 */
function getOffer(req, res) {
    var accountId = req.query.accountId;
    
    var url = config.stellarServer+'/accounts/'+accountId+'/offers';

    request.get({
        // url: 'http://35.154.156.45:8000/friendbot',
        url: url,
        json: true
    }, function (error, response, body) {
        if (error || response.statusCode !== 200) {
            console.error('ERROR!', error || body);
        } else {
            res.send(body._embedded.records);
        }
    });
}

  /**
 * @author:Akshay Misal
 * @description:streamOffers
 */
function streamOffers(req,res) {
    res.sendFile('views/stream_offers.html',{root:__dirname});
  }