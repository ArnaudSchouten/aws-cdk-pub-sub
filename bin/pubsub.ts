#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PubSubStack } from '../lib/pubsub-stack';

const app = new cdk.App();

new PubSubStack(app, 'PubSubStack', {
  publisher1Active: true,
  publisher2Active: false,
  publisher3Active: true,
  description: 'Publish an subscribe stack',
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT
  },
  stackName: 'PubSubStack',
  tags: { 'owner': 'arnaud', 'creator': 'arnaud' },
  synthesizer: new cdk.DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  })
});