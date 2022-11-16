import { Duration, RemovalPolicy } from "aws-cdk-lib";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { EmailSubscription, EmailSubscriptionProps, LambdaSubscription, LambdaSubscriptionProps, SqsSubscription, SqsSubscriptionProps } from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from "constructs";
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

export interface TopicSubscriberProps {
    topicName: string,
    topicDLQName: string
}

export class TopicSubscriber extends Construct {

    private topic: sns.ITopic;
    private dlq: sqs.IQueue;

    constructor(scope: Construct, id: string, props: TopicSubscriberProps) {
        super(scope, id);
        this.topic = this.createTopic(props.topicName);
        if (props?.topicDLQName !== undefined) {
            this.dlq = this.createDLQforTopic(props.topicDLQName);
        }
    }

    // return the topic created
    getTopic(): sns.ITopic {
        return this.topic;
    }

    // return the dlq
    getDLQ(): sqs.IQueue {
        return this.dlq;
    }

    addLambdaPublisher(functionName: string, props: lambda.FunctionProps): lambda.IFunction {
        // create lambda       
        const functionHandler = new lambda.Function(this, functionName, props);
        // grant publish on topic
        this.topic.grantPublish(functionHandler);
        // add evironment variable to lambda's, the arn of the topic
        functionHandler.addEnvironment('TOPIC_ARN', this.topic.topicArn);
        return functionHandler;
    }

    addEmailSubscriber(email: string, props?: EmailSubscriptionProps): void {
        this.topic.addSubscription(new EmailSubscription(email, props));
    }

    addLambdaSubscriber(functionName: string, functionProps: lambda.FunctionProps, subscribtionProps?: LambdaSubscriptionProps): void {
        // create function
        const functionHandler = new lambda.Function(this, functionName, functionProps);
        // add subscription
        this.topic.addSubscription(new LambdaSubscription(functionHandler, subscribtionProps));
    }


    addSqsSubscriber(queueName: string, queueProps?: sqs.QueueProps, subscriptionProps?: SqsSubscriptionProps): lambda.IEventSource {
        // create queue
        const sqsQueue = new sqs.Queue(this, queueName, queueProps);
        // add subscription
        this.topic.addSubscription(new SqsSubscription(sqsQueue, subscriptionProps));
        return new lambdaEventSources.SqsEventSource(sqsQueue);
    }

    // create topic
    private createTopic(name: string): sns.ITopic {
        return new sns.Topic(this, name, {
            displayName: name,
            //fifo: false,
            topicName: name
        });
    }

    // create dead-letter-queue
    private createDLQforTopic(dlqName: string): sqs.IQueue {
        return new sqs.Queue(this, dlqName, {
            queueName: dlqName,
            //fifo: false,
            receiveMessageWaitTime: Duration.seconds(0),
            removalPolicy: RemovalPolicy.DESTROY,
            retentionPeriod: Duration.days(1)
        });
    }
}

