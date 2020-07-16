
/**********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const withSass = require('@zeit/next-sass')

// Environment configs
const {
  parsed: {
    APIGateway,
    FileBucketName: bucket,
    IdentityPoolId: identityPoolId,
    region,
    UserPoolClientId: userPoolWebClientId,
    UserPoolId: userPoolId,
    isROMode
  },
} = require('dotenv').config()

// Configs passed to next.js
module.exports = withSass({
  publicRuntimeConfig: {
    APIGateway,
    bucket,
    identityPoolId,
    region,
    userPoolWebClientId,
    userPoolId,
    isROMode
  },
  cssModules: true,
  cssLoaderOptions: {
    importLoaders: 1,
    localIdentName: '[local]-[hash:base64:5]',
  },
})
