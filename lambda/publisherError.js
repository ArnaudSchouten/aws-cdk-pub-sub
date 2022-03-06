//npm install aws-sdk
const aws = require("aws-sdk");
const {DateTime} = require('luxon');

exports.handler = function (event, context) {
    // alter payload testje
    event.arnaud = "krijgt wel email en gaat stuk";
    event.dateCreated = DateTime.now().setZone('Europe/Amsterdam').toISO({includeOffset: false});

    let eventText = JSON.stringify(event, null, 2);
    console.log("Received event:", eventText);

    // client handle for sns 
    const sns = new aws.SNS();

    // publish
    sns.publish({
        Message: eventText,
        Subject: "Test the DLQ",
        TopicArn: process.env.TOPIC_ARN,
        MessageAttributes: {
            "EventType": {
                DataType: "String",
                StringValue: "SendToDLQ"
            }
        }
    }, context.done);
};