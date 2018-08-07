/**
* In this example, we'll create a transaction that funds a new account from the
* root account, adds a trustline from the root account to that new account for
* USD, and then that new account sends a payment of USD to the root account. While
* these operations would probably be seperate transactions normally, this shows the power of
* multiple operations in a transaction.
*/
var StellarLib = require('stellar-sdk');
var server = new StellarLib.Server('https://horizon-testnet.stellar.org');
// var StellarSdk = require('stellar-sdk');

// first, create our source account from seed and load its details
var source = StellarLib.Keypair.fromSecret("SD6Q77TB3UMPPVJR43PG4EZFSSBLCKEB4OW3YIHDTYTFXMH4UIN7NSM5");
// load the account's current details from the server
server.loadAccount(source.publicKey())
    .then(function () {
        // create the server connection object
        // var server = new StellarLib.Server({port: 3000});
        // our usdGateway account
        var usdGateway = StellarLib.Keypair.fromSecret("SBMKYUYNGGZ45FRUOOGWGQUVJF7WKLLP2W55GHJII5MBP7YEP5TAVKCK");
        // the USD curreny we'll be sending
        var usdCurrency = new StellarLib.Asset("USD", usdGateway.publicKey());
        // build the transaction
        var transaction = new StellarLib.TransactionBuilder(source)
            // this operation funds the USD Gateway account
            .addOperation(StellarLib.Operation.payment({
                destination: usdGateway.publicKey(),
                // Because Stellar allows transaction in many currencies, you must
                // specify the asset type. The special "native" asset represents Lumens.
                asset: usdCurrency,
                amount: "20000000"
            }))
            // .payment(usdGateway, StellarLib.Asset.native(), 20000000)
            // this operation sets a trustline from the source account to the usdGateway account for "USD"
            .addOperation(StellarLib.Operation.changeTrust
            // .changeTrust(usdCurrency)
            // this operation sends 10 USD to the source account from the usdGateway
            .payment(source, usdCurrency, 10, {source: usdGateway})
            .build();
        return transaction;
    })
    .then(function (transaction) {
        // this transaction already includes the source account's signature, now
        // we need to add the usdGateway account's signature
        var signature = transaction.sign(usdGateway);
        transaction.addSignature(signature);
        // submit the transaction to the server
        return server.submitTransaction(transaction);
    })
    .then(function (transactionResult) {
        // console.log(transactionResult);
    })
    .catch(function (err) {
        console.error(err);
    });