/** 
 * @author:Akshay Misal
 * @version:0.2
 * @since:03-Aug-2018
*/
var server = require('./lendledger.js')
var assert = require('assert');
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();

chai.use(chaiHttp);

var accountId = "GBWX7EGTBZC4I42M6IPA7TY3XRRQQ4OH5I3VUBYK7VQAX7GVGWCMJSMU";
var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJTQ1VZNUNVNU1VS0xXVkEyVzRJTkIzVVJMVENZSEQzQ1YyMzVHUE0zRlpBUVdWMk5SU05PNExLVSIsImlhdCI6MTUzMzUyOTQyOX0.FAJtPM1gXkHMDap3-Nbw8PtD-Bt0OknHlH99B6utUOQ";

//===============Account.js=============================================================
/**
 * @author Akshay Misal
 * @link: POST /account/create
 * @description Create account on Stellar Network and store it in DB
 * @param {userName,accountName,accountRole} req 
 * @param {JSONObject} res 
 */
describe('Create account', () => {
  it('it should GET account details', (done) => {

    var data = {
      "userName":"Akshay",
      "accountName":"Akshay MISAL",
      "accountRole":"Borrower"
    }

    chai.request(server)
        .post('/account/create')
        .send(data)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
  });
});


/**
 * @author:Akshay Misal
 * @link:GET /account/getAccount?accountId={}
 * @param {accountId} req 
 * @param {JSONObject} res 
 * @description:Get accound detail by account-id.
 */
describe('Get account detail by acount-id', () => {
  it('it should get account details', (done) => {

    chai.request(server)
        .get('/account/getAccount?accountId='+accountId)
        .set('Authorization', 'Bearer '+token)
        .end((err, res) => {
            res.body.should.have.property('balances');
            res.body.should.have.property('signers');
          done();
        });
  });
});

/**
 * @author:Akshay Misal
 * @link:GET /account/auditAccount?accountId={}
 * @param {accountId} req 
 * @param {JSONObject} res 
 * @description:Get audit detail by account-id.
 */
describe('Get audit details by acount-id', () => {
  it('it should get account audit details', (done) => {

    chai.request(server)
        .get('/account/auditAccount?accountId='+accountId)
        .set('Authorization', 'Bearer '+token)
        .end((err, res) => {
            res.body.should.be.a('array');
          done();
        });
  });
});

//===============Asset.js=============================================================

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
describe('Create the trust-line between users.', () => {
  it('it should create the trust-line.', (done) => {
    
    var data = {
      "firstName":"Suprabha",
      "lastName":"Hajare",
      "accountId":"GBWX7EGTBZC4I42M6IPA7TY3XRRQQ4OH5I3VUBYK7VQAX7GVGWCMJSMU",
      "accountNo":"3254616326566",
      "accountIfsc":"IFSC000215",
      "assetName":"C8NAUSD",
      "secret":"SAL67PRM7QB4SJYVIIUGHLDDB4CGEY74VFCLDV7EWXT6CLLA55KYQY7G"
    }

    chai.request(server)
        .post('/asset/changeTrust')
        .set('Authorization', 'Bearer '+token)
        .send(data)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
  });
});

/**
 * @author:Akshay Misal
 * @link: POST /asset/issueAsset
 * @description:This function will issue asset
 * @param {assetName,receiverAccount,issueAsset} req 
 * @param {issuer} res 
 */
describe('Issue Asset', () => {
  it('it should issue the asset.', (done) => {
    
    var data = {
      "assetName":"C8NAUSD",
      "receiverAccount":"GAV6IGXMLXSNB7QZMAMX7ZVDLWZLZY37HDRZFU4V7JZ3ZR3JKA56EJJQ",
      "issueAsset":"10"
    }

    chai.request(server)
        .post('/asset/issueAsset')
        .set('Authorization', 'Bearer '+token)
        .send(data)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
  });
});


//=====================payment.js=============================================================
/**
 * @author:Akshay Misal
 * @description: This function will lends money in the form of asset to borrower.
 * @link: POST /payment/lend
 * @param {} req
 * @param {} res
 */
describe('Lending process ', () => {
  it('it should issue the asset.', (done) => {
    
    var data = {
      "lenderId":"GAV6IGXMLXSNB7QZMAMX7ZVDLWZLZY37HDRZFU4V7JZ3ZR3JKA56EJJQ",
      "borrowerId":"GBWX7EGTBZC4I42M6IPA7TY3XRRQQ4OH5I3VUBYK7VQAX7GVGWCMJSMU",
      "amount":"10",
      "remarks":"Transfer asset borrower to lender.",
      "assetName":"C8NAUSD",
      "lenderSeed":"SDWEZBXMNOHMRXBJO2WGVXNKFRNLG6HDY6DKZANWIJCBX7YOB7WBYC3W"
    }

    chai.request(server)
        .post('/payment/lend')
        .set('Authorization', 'Bearer '+token)
        .send(data)
        .end((err, res) => {
          console.log("fun lend res => ",res.body);
          res.should.have.status(200);
          done();
        });
  });
});

/**
 * @author:Akshay Misal
 * @description: This function will change the borrower's asset into the fiat(currency) from credit-node
 * @link: POST /payment/exchange
 * @param {borrowerId,amount,remarks,assetName,borrowerSeed} req
 * @param {} res
 */
describe('Exchange asset to fiat', () => {
  it('it should issue the asset.', (done) => {
    
    var data = {
      "borrowerId":"GBWX7EGTBZC4I42M6IPA7TY3XRRQQ4OH5I3VUBYK7VQAX7GVGWCMJSMU",
      "amount":"200",
      "remarks":"exchange asset into the fiat.",
      "assetName":"C8NAUSD",
      "borrowerSeed":"SAL67PRM7QB4SJYVIIUGHLDDB4CGEY74VFCLDV7EWXT6CLLA55KYQY7G"
    }

    chai.request(server)
        .post('/payment/exchange')
        .set('Authorization', 'Bearer '+token)
        .send(data)
        .end((err, res) => {
          console.log(" asset to fiat res => ",res.body);
          res.should.have.status(200);
          done();
        });
  });
});


//=======================offer.js=============================================================
/**
 * @author:Akshay Misal
 * @url: POST /offer/manageOffer
 * @description: This function will create the offer
 * @param {accountId,accountSeed,sellingAsset,sellingAssetIssuer,buyingAsset,buyingAssetIssuer,amountToSell,assetPricePerUnitofferId} req
 * @param {}
 */
describe('Create offer.', () => {
  it('it should create offer.', (done) => {
    
    var data = {
      "accountId":"",
      "accountSeed":"",
      "sellingAsset":"",
      "sellingAssetIssuer":"",
      "buyingAsset":"",
      "buyingAssetIssuer":"",
      "amountToSell":"",
      "assetPricePerUnit":"",
      "offerId":""
    }

    chai.request(server)
        .post('/offer/manageOffer')
        .send(data)
        .set('Authorization', 'Bearer '+token)
        .end((err, res) => {
          console.log("create offer => ",res);
          res.should.have.status(200);
          done();
        });
  });
});

/**
 * @author:Akshay Misal
 * @link:GET /account/getOffer?accountId={}
 * @param {accountId} req 
 * @param {JSONObject} res 
 * @description:Get offer by account-id.
 */
describe('Get offer.', () => {
  it('it should get offer details.', (done) => {
    chai.request(server)
        .get('/offer/getOffer?accountId='+accountId)
        .set('Authorization', 'Bearer '+token)
        .end((err, res) => {
            res.body.should.be.a('array');
          done();
        });
  });
});