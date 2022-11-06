#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PubSubStack } from '../lib/pubsub-stack';

const app = new cdk.App();

// helper function
function getEnvCodeAndValidate(): string {
  const envcode = app.node.tryGetContext('env') || 'dev';
  const envArray: Array<string> = ['dev', 'tst', 'acc', 'prd'];
  if (!envArray.includes(envcode)) {
    throw new Error(`invalid env value ${envcode}`)
  }
  return envcode;
}

new PubSubStack(app, 'PubSubStack', {
  description: 'Publish and subscribe stack',
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT
  },
  stackName: 'PubSubStack',
  tags: {
    'owner': 'arnaud',
    'appcode': 'pubsub',
    'envcode': getEnvCodeAndValidate()
  },
  synthesizer: new cdk.DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  })
});