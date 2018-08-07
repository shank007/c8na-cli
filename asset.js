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
var stripe = require("stripe")("sk_test_TzR08jzSL2CZhBMvRqe0q4h5");

var dbType = config.dbType;
var dbIp = config.dbIp;
var dbPort = config.dbPort;
var dbUser = config.dbUser;
var dbPass = config.dbPass;
var dbName = config.dbName;
var connectionString = "";
var db;
var StellarSdk = require('stellar-sdk');
var server;
var promise = require('bluebird');

var options = {
  // Initialization Options
  promiseLib: promise
};
var pgp = require('pg-promise')(options);
var mysql = require('mysql');
var connection;

if (dbType === "postgres") {
  connectionString = dbType + "://" + dbUser + ":" + dbPass + "@" + dbIp + ":" + dbPort + "/" + dbName + "?sslmode=disable";
  db = pgp(connectionString);
  // server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
  server = new StellarSdk.Server(config.stellarServer);

} else if (dbType === "mysql") {
  connection = mysql.createConnection({
    host: dbIp,
    port: dbPort,
    user: dbUser,
    password: dbPass,
    database: dbName
  });
  server = new StellarSdk.Server(config.stellarServer);
  connection.connect(function (err) {
    if (!err) {
      // console.log(dbType + " Database is connected ... \n\n");
    } else {
      // console.log("Error connecting database ... \n\n");
    }
  });
}

var stellarNetwork = config.stellarNetwork;

if (stellarNetwork === "test") {
  StellarSdk.Network.useTestNetwork();
} else if (stellarNetwork === "public") {
  StellarSdk.Network.usePublicNetwork();
}

var request = require('request');

router.post('/changeTrust', changeTrust);
router.post('/issueAsset', issueAsset);
router.get('/exFiatToAsset', exFiatToAsset);
router.get('/exFiatToAssetStripe', exFiatToAssetStripe);
router.post('/createPayment', createPayment);
router.get('/wallet', goToWallet);

//export this router to use in our server.js
module.exports = router;

/**
 * @author:Akshay Misal
 * @link: POST /asset/changeTrust
 * @description: This funcation will create the trust-line between users.
 * @param {firstName} req 
 * @param {lastName} req 
 * @param {accountId} req 
 * @param {accountNo} req 
 * @param {accountIfsc} req 
 * @param {assetName} req 
 * @param {secret} req 
 * @param {JSON} res
 */
function changeTrust(req, res, next) {
  var deferred = Q.defer();

  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var accountId = req.body.accountId;
  var accountNo = req.body.accountNo;
  var accountIfsc = req.body.accountIfsc;
  var assetName = req.body.assetName;
  var issrAccountId = config.issuerAccount;
  var accountSeed = req.body.secret;
  var body = {};
  body.id = accountId;
  body.first_name = firstName;
  body.last_name = lastName;
  body.name = firstName;
  body.domain = config.domainName;
  body.friendly_id = firstName + "_" + lastName;
  body.bank_account = accountNo;
  body.bank_ifsc = accountIfsc;
  var keyPairs = StellarSdk.Keypair.fromSecret(accountSeed);
  var friendlyId = firstName + "_" + lastName;
  // First, the receiving account must trust the asset
  server.loadAccount(keyPairs.publicKey())
    .then(function (receiver) {

      var transaction = new StellarSdk.TransactionBuilder(receiver)
        // The `changeTrust` operation creates (or alters) a trustline
        // The `limit` parameter below is optional
        .addOperation(StellarSdk.Operation.changeTrust({
          asset: new StellarSdk.Asset(assetName, issrAccountId),
          // limit: amountIssued
        }))
        .build();

      transaction.sign(keyPairs);
      server.submitTransaction(transaction);
      if (dbType === "postgres") {
        db.none('insert into accounts(id, first_name, last_name, name, domain, friendly_id, bank_account, bank_ifsc)' +
          'values(${id}, ${first_name}, ${last_name}, ${name}, ${domain}, ${friendly_id}, ${bank_account}, ${bank_ifsc})',
          body)
          .then(function () {
            res.status(200)
              .json({
                status: 'success',
                message: 'Trustline created successfully.'
              });
          })
          .catch(function (err) {
            return next(err);
          });
      } else if (dbType === "mysql") {
        var sql = "INSERT INTO internal_accounts (account_id, first_name, last_name, name, domain, friendly_id, account_no, account_ifsc) VALUES " +
          "('" + accountId + "', '" + firstName + "', '" + lastName + "', '" + firstName + "', '" + config.domainName + "'" +
          ", '" + friendlyId + "', '" + accountNo + "', '" + accountIfsc + "')";
        connection.query(sql, function (err, result) {
          if (err) throw err;
          // console.log("1 record inserted");
          res.status(200)
            .json({
              status: 'success',
              message: 'Trustline created successfully.'
            });
        });
      }

    })
    .catch(function (error) {
      console.error('Error!', error);
    });

}


/**
 * @author:Akshay Misal
 * @link: POST /asset/issueAsset
 * @description:This function will issue asset
 * @param {assetName,receiverAccount,issueAsset} req 
 * @param {issuer} res 
 */
function issueAsset(req, res) {
  console.log("final issue asset function => ", req.body);
  var issuerAccount = config.issuerAccount;
  var issuerSecret = config.issuerSecret;
  var assetName = req.body.assetName;
  var receiverAccount = req.body.receiverAccount;
  var issueAsset = req.body.issueAsset;
  var issuingKeys = StellarSdk.Keypair.fromSecret(issuerSecret);
  server.loadAccount(issuingKeys.publicKey())
    .then(function (issuer) {
      var transaction = new StellarSdk.TransactionBuilder(issuer)
        .addOperation(StellarSdk.Operation.payment({
          destination: receiverAccount,
          asset: new StellarSdk.Asset(assetName, issuingKeys.publicKey()),
          amount: issueAsset
        }))
        .build();
      transaction.sign(issuingKeys);
      server.submitTransaction(transaction);
      res.setHeader('Content-Type', 'application/json');
      res.send(issuer);
    });
}

//===============PayPal========================================
/**
 * @author:Akshay Misal
 * @description: This api will call the PayPal (payment gateway) 
 * based on response(success) will call issueAsset
 * @param
 */
function exFiatToAsset(req, res) {
  // console.log("welcome to exchange fiat to asset ", req.params);
  res.sendFile("views/paypalButton.html", { root: __dirname });
}

//================Stripe========================================
/**
 * @author:Akshay Misal
 * @url : GET /asset/exFiatToAssetStripe
 * @description: This api will call the Stripe (payment gateway) 
 * based on response(success) will call issueAsset
 */
function exFiatToAssetStripe(req, res) {
  // console.log("welcome to exchange fiat to asset ", req.params);
  res.sendFile("views/stripe.html", { root: __dirname });
}

/**
 * @author:Akshay Misal
 * @description:This will initiate the payment.
 * @param {amount, stripeEmail, stripeToken} req
 * @param {status,source,currency,amount} res
 */
function createPayment(req, res) {
  console.log("create payment stripe => ", req.body);
  const token = req.body.stripeToken; // Using Express
  let amount = 100;

  stripe.customers.create({
    email: req.body.stripeEmail,
   source: req.body.stripeToken
 })
 .then(customer =>
   stripe.charges.create({
     amount,
     description: "Sample Charge",
        currency: "usd",
        customer: customer.id
   }))
 .then(function (data) {
  console.log("stripe response => ",req.session);
  console.log("req body response => ",req.body);
  res.render('wallet.ejs',{data:req.body});
 });
}
//==========Stripe Ends===================================================

/**
 * @author:Akshay Misal
 * @description: This function will redirect the wallet page
 * @param {accountId} req
 */
function goToWallet(req, res) {
  var set = {
    receiverAccount : "GB7XQSD3GC2GH6YC5HFC5I2JGDJS3X6IN4BOJ5HXRYFQBF2ZSNWDI7XQ"
  }
  res.render("wallet.ejs", {data:set});
}
