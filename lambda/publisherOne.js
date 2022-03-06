//npm install aws-sdk
const aws = require("aws-sdk");
const {DateTime} = require('luxon');

exports.handler = function (event, context) {
/*
  javascript v3
  gooit een fout 
import { SNSClient } from "@aws-sdk/client-sns";
//npm install @aws-sdk/client-sns
SNSClient.publish({
            Message: eventText,
            Subject: "Test SNS From Lambda",
            TopicArn: process.env.SNS_ARN,
            MessageAttributes: {
                "EventType": {
                    DataType: "String",
                    StringValue: "test"
                }
            }
        });

*/
    // alter payload testje
    event.arnaud = "krijgt email";
    event.dateCreated = DateTime.now().setZone('Europe/Amsterdam').toISO({includeOffset: false});

    let eventText = JSON.stringify(event);
    console.log("Received event:", eventText);

    // client handle for sns 
    const sns = new aws.SNS();

    // publish
    sns.publish({
        Message: eventText,
        Subject: "Test SNS From Lambda",
        TopicArn: process.env.TOPIC_ARN,
        MessageAttributes: {
            "EventType": {
                DataType: "String",
                StringValue: "SendEmail"
            }
        }
    }, context.done);
};