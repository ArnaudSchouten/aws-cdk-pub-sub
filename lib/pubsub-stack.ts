import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Code, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { TopicSubscriber } from './TopicSubcriber';

function envSpecificName(constructType: string, envcode: string, appcode: string, name: string): string {
  return `${constructType}-nl-m2b-${envcode}-${appcode}-${name?.toLowerCase()}`;
}

export interface PubSubStackProperties extends StackProps {
}

export class PubSubStack extends Stack {

  constructor(scope: Construct, id: string, props?: PubSubStackProperties) {
    super(scope, id, props);

    const envcode = this.tags.tagValues()["envcode"];
    const appcode = this.tags.tagValues()["appcode"];

    // email parameter
    const emailParam = new cdk.CfnParameter(this, "email", {
      type: 'String',
      description: "subscription email subscriber",
      allowedPattern: '[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+'
    });

    // create topic and DLQ
    const ts = new TopicSubscriber(this, "TopicSubscriber", {
      topicName: "MyTopic",
      topicDLQName: "MyTopicDLQ",
    });

    //publisher - 1
    ts.addLambdaPublisher('MyPublishFunctionOne', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambda'),
      handler: 'publisherOne.handler',
      functionName: envSpecificName("lambda", envcode, appcode, "publish-one"),
      description: 'publish a msg to the topic and set email attribute',
    });


    // publisher - 2 
    ts.addLambdaPublisher('MyPublishFunctionTwo', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambda'),
      handler: 'publisherTwo.handler',
      functionName: envSpecificName("lambda", envcode, appcode, "publish-two"),
      description: 'publish a msg to the topic and set sqs attribute'
    });

    // publisher - 3
    ts.addLambdaPublisher('MyPublishFunctionError', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambda'),
      handler: 'publisherError.handler',
      functionName: envSpecificName("lambda", envcode, appcode, "publish-three"),
      description: 'publish a msg to the topic which results in an error',
    });

    // subscriber - 1 - always email
    ts.addEmailSubscriber(emailParam.valueAsString, {
      deadLetterQueue: ts.getDLQ()
    });

    // subscriber - 2 - lambda
    ts.addLambdaSubscriber('MySubscribeFunctionOne', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambda'),
      handler: 'subscriberOne.handler',
      functionName: envSpecificName("lambda", envcode, appcode, "subscribe-one"),
      description: 'subscribe to the topic',
    }, {
      filterPolicy: {
        EventType: sns.SubscriptionFilter.stringFilter({
          allowlist: ["SendToLambda"]
        })
      },
      deadLetterQueue: ts.getDLQ()
    });

    // subscriber - 3 - lambda
    ts.addLambdaSubscriber('MySubscribeFunctionError', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambda'),
      handler: 'subscribeError.handler',
      functionName: envSpecificName("lambda", envcode, appcode, "subscribe-two"),
      description: 'subscribe to the topic',
    }, {
      filterPolicy: {
        EventType: sns.SubscriptionFilter.stringFilter({
          allowlist: ["SendToDLQ"]
        })
      },
      deadLetterQueue: ts.getDLQ()
    });

    // subscribtion - 4 sqs
    const eventSource =
      ts.addSqsSubscriber('MySqsQueue', {
        queueName: envSpecificName("sqs", envcode, appcode, "subscribe-three"),
        removalPolicy: RemovalPolicy.DESTROY,
        retentionPeriod: Duration.days(1),
        deliveryDelay: Duration.seconds(0)
      }, {
        filterPolicy: {
          EventType: sns.SubscriptionFilter.stringFilter({
            allowlist: ["SendToSqs"]
          })
        },
        deadLetterQueue: ts.getDLQ()
      });

    const lambdaSqsProcessor = new Function(this, 'SqsMessageProcessor', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambda'),
      handler: 'sqsMessageProcessor.handler',
      functionName: envSpecificName("lambda", envcode, appcode, "sqs-message-processor")
    });

    lambdaSqsProcessor.addEventSource(eventSource);
  }
}
