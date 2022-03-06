const aws = require("aws-sdk");

exports.handler = function (event, context, callback) {

    var message = event.Records[0].Sns.Message;
    console.log('Message received from SNS:', message);
    console.log('Context', context);
    callback(null, "Success");    
};