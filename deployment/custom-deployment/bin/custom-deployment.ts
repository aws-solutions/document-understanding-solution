#!/usr/bin/env node
import 'source-map-support/register'
import cdk = require('@aws-cdk/core')
// import { CustomDeploymentStack } from '../lib/custom-deployment-stack';
import { CdkTextractStack } from '../lib/cdk-textract-stack'

const app = new cdk.App()
// new CustomDeploymentStack(app, 'CustomDeploymentStack');
new CdkTextractStack(app, 'CustomDeploymentStack')
