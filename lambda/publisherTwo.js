//npm install aws-sdk
const aws = require("aws-sdk");
const {DateTime} = require('luxon');

exports.handler = function (event, context) {
    // alter payload testje
    event.arnaud = "krijgt altijd email";
    event.dateCreated = DateTime.now().setZone('Europe/Amsterdam').toISO({includeOffset: false});

    // convert payload to string
    let eventText = JSON.stringify(event);
    console.log("payload:", eventText);

    // client handle for sns 
    const sns = new aws.SNS();

    // publish
    sns.publish({
        Message: eventText,
        Subject: "Test 2 SNS From Lambda",
        TopicArn: process.env.TOPIC_ARN,
        MessageAttributes: {
            "EventType": {
                DataType: "String",
                StringValue: "SendToSqs"
            }
        }
    }, context.done);
};