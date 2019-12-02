import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import CustomDeployment = require('../lib/custom-deployment-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CustomDeployment.CustomDeploymentStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});