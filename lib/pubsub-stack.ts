import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { TopicSubscriber } from './TopicSubcriber';

export interface PubSubStackProperties extends StackProps {  
}

export class PubSubStack extends Stack {

  constructor(scope: Construct, id: string, props?: PubSubStackProperties) {
    super(scope, id, props);

    // create topic and dql
    const ts = new TopicSubscriber(this, "TopicSubscriber", {
      topicName: "MyTopic",
      topicDLQName: "MyTopicDLQ",
    });

    //publisher - one
    ts.addLambdaPublisher('MyPublishFunctionOne', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambda'),
      handler: 'publishOne.handler',
      functionName: 'MyPublishFunctionOne',
      description: 'publish a msg to the topic and send an email',
    });

    // publisher - two 
    ts.addLambdaPublisher('MyPublishFunctionTwo', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambda'),
      handler: 'publishTwo.handler',
      functionName: 'MyPublishFunctionTwo',
      description: 'publish a msg to the topic and handle this by sqs',
    });

    // publisher - three
    // ts.addLambdaPublisher('MyPublishFunctionError', {
    //   runtime: Runtime.NODEJS_14_X,
    //   code: Code.fromAsset('lambda'),
    //   handler: 'publishError.handler',
    //   functionName: 'MyPublishFunctionError',
    //   description: 'publish a msg to the topic which results in an error',
    // });

    //subscriber - 1 - email
    ts.addEmailSubscriber('arnaud.schouten@gmail.com', {
      deadLetterQueue: ts.getDLQ()
    });

    // subscriber - 2 - lambda
    // ts.addLambdaSubscriber('MySubscribeFunctionOne', {
    //   runtime: Runtime.NODEJS_14_X,
    //   code: Code.fromAsset('lambda'),
    //   handler: 'subscribeOne.handler',
    //   functionName: 'MySubscribeFunctionOne',
    //   description: 'subscribe to the topic',
    // }, {
    //   filterPolicy: {
    //     EventType: sns.SubscriptionFilter.stringFilter({
    //       allowlist: ["SendToLambda"]
    //     })
    //   },
    //   deadLetterQueue: ts.getDLQ()
    // });

    // subscriber - 3 - lambda
    // ts.addLambdaSubscriber('MySubscribeFunctionError', {
    //   runtime: Runtime.NODEJS_14_X,
    //   code: Code.fromAsset('lambda'),
    //   handler: 'subscribeError.handler',
    //   functionName: 'MySubscribeFunctionError',
    //   description: 'subscribe to the topic',
    // }, {
    //   filterPolicy: {
    //     EventType: sns.SubscriptionFilter.stringFilter({
    //       allowlist: ["SendToDLQ"]
    //     })
    //   },
    //   deadLetterQueue: ts.getDLQ()
    // });

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
