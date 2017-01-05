var MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');
var config = require('../steamMarket/config.json');
var url = 'mongodb://localhost:27017/gun_skins';
var nodemailer = require('nodemailer');
var fs = require('fs');
var BPromise = require("bluebird");

MongoClient.connect(url, function(err, db) {
    if(!err) {
    	//console.log('connected');
    	findDocuments(db, sortData).then(db.close());
    }
});

var findDocuments = function(db, callback) {
	return new BPromise(function(resolve){
  // Get the documents collection 
  var collection = db.collection('skin_data');
  // Find some documents 
  collection.find({}).toArray(function(err, docs) {
    resolve(callback(docs));
  });
  })
}

var sortData = function(docs){
return new BPromise(function(resolve){
var result = _.reduce(docs, function (prev, current) {
    var skin = _.find(prev, function (doc) {
        return doc['skin'] === current['skin'];
    });

    // Character does not yet exists in the array, push it
    if (skin === undefined) {
        prev.push(current);
    } else {
        // If skin['pet'] is not an array, create one
        if (!_.isArray(skin['lowest_price'])) {
            skin['lowest_price'] = [skin['lowest_price']];
        }
        if (!_.isArray(skin['date'])) {
            skin['date'] = [skin['date']];
        }

        // Push the current pets to the founded character
        skin['lowest_price'].push(current['lowest_price']);
        skin['date'].push(current['date']);
    }

    return prev;
}, []); // Initialize an empty array for the prev object

//write data to file
fs.writeFile("./attachment.json", JSON.stringify(result), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
}); 

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://@smtp.gmail.com');

// setup e-mail data with unicode symbols
var mailOptions = {
    from: '"Jared" <@gmail.com>', // sender address
    to: 'Jeff, @gmail.com', // @gmail.com', // list of receivers
    subject: 'skin data', // Subject line
    text: 'skin data', // plaintext body
    html: '<b>Hello world ?</b>', // html body
    attachments: [{path: './attachment.json'}]
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    resolve();
});
});
}
