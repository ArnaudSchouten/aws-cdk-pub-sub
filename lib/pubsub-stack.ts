import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { TopicSubscriber } from './TopicSubcriber';

export interface PubSubStackProperties extends StackProps {
  publisher1Active: boolean,
  publisher2Active: boolean,
  publisher3Active: boolean
}

export class PubSubStack extends Stack {

  constructor(scope: Construct, id: string, props?: PubSubStackProperties) {
    super(scope, id, props);

    // 
    const emailParam = new cdk.CfnParameter(this, "email", {
      type: 'String',
      description: "Dit is environment parameter",
      allowedPattern: '[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+'
    });

    // create topic and DLQ
    const ts = new TopicSubscriber(this, "TopicSubscriber", {
      topicName: "MyTopic",
      topicDLQName: "MyTopicDLQ",
    });

    //publisher - 1
    if (props?.publisher1Active) {
      ts.addLambdaPublisher('MyPublishFunctionOne', {
        runtime: Runtime.NODEJS_14_X,
        code: Code.fromAsset('lambda'),
        handler: 'publisherOne.handler',
        functionName: 'MyPublishFunctionOne',
        description: 'publish a msg to the topic and set email attribute',
      });
    }

    // publisher - 2 
    if (props?.publisher2Active) {
      ts.addLambdaPublisher('MyPublishFunctionTwo', {
        runtime: Runtime.NODEJS_14_X,
        code: Code.fromAsset('lambda'),
        handler: 'publisherTwo.handler',
        functionName: 'MyPublishFunctionTwo',
        description: 'publish a msg to the topic and set sqs attribute',
      });
    }

    // publisher - 3
    if (props?.publisher3Active) {
      ts.addLambdaPublisher('MyPublishFunctionError', {
        runtime: Runtime.NODEJS_14_X,
        code: Code.fromAsset('lambda'),
        handler: 'publisherError.handler',
        functionName: 'MyPublishFunctionError',
        description: 'publish a msg to the topic which results in an error',
      });
    }

    // subscriber - 1 - always email
    ts.addEmailSubscriber(emailParam.valueAsString, {
      deadLetterQueue: ts.getDLQ()
    });

    // subscriber - 2 - lambda
    ts.addLambdaSubscriber('MySubscribeFunctionOne', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambda'),
      handler: 'subscriberOne.handler',
      functionName: 'MySubscribeFunctionOne',
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
      functionName: 'MySubscribeFunctionError',
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
    ts.addSqsSubscriber('MySqsQueue', {
      queueName: 'MySqsQueue',
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
  }
}
