"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const ddb = require("@aws-cdk/aws-dynamodb");
const es = require("@aws-cdk/aws-elasticsearch");
const iam = require("@aws-cdk/aws-iam");
const lambda = require("@aws-cdk/aws-lambda");
const s3 = require("@aws-cdk/aws-s3");
const sns = require("@aws-cdk/aws-sns");
const snsSubscriptions = require("@aws-cdk/aws-sns-subscriptions");
const sqs = require("@aws-cdk/aws-sqs");
const apigateway = require("@aws-cdk/aws-apigateway");
const aws_lambda_event_sources_1 = require("@aws-cdk/aws-lambda-event-sources");
const aws_cognito_1 = require("@aws-cdk/aws-cognito");
const aws_cloudfront_1 = require("@aws-cdk/aws-cloudfront");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const uuid = require("short-uuid");
class CdkTextractStack extends cdk.Stack {
    /**
     *
     * @param {cdk.Construct} scope
     * @param {string} id
     * @param {cdk.StackProps=} props
     */
    constructor(scope, id, props) {
        super(scope, id);
        this.resourceName = (name) => `${id}-${name}-${this.uuid}`.toLowerCase();
        this.uuid = uuid.generate();
        const corsRule = {
            allowedOrigins: ["*"],
            allowedMethods: [
                s3.HttpMethods.HEAD,
                s3.HttpMethods.GET,
                s3.HttpMethods.PUT,
                s3.HttpMethods.POST,
                s3.HttpMethods.DELETE
            ],
            maxAge: 3000,
            exposedHeaders: ["ETag"],
            allowedHeaders: ["*"]
        };
        // S3 buckets
        const documentsS3Bucket = new s3.Bucket(this, this.resourceName("DocumentsS3Bucket"), {
            bucketName: this.resourceName("document-s3-bucket"),
            versioned: false,
            cors: [corsRule]
        });
        const samplesS3Bucket = new s3.Bucket(this, this.resourceName("SamplesS3Bucket"), {
            bucketName: this.resourceName("sample-s3-bucket"),
            versioned: false,
            cors: [corsRule]
        });
        // ### Client ###
        const clientAppS3Bucket = new s3.Bucket(this, this.resourceName("ClientAppS3Bucket"), {
            websiteIndexDocument: "index.html",
            cors: [corsRule]
        });
        // eslint-disable-next-line no-unused-vars
        const oai = new aws_cloudfront_1.CfnCloudFrontOriginAccessIdentity(this, "cdk-textract-oai", {
            cloudFrontOriginAccessIdentityConfig: {
                comment: "Origin Access Identity for Textract web stack bucket cloudfront distribution"
            }
        });
        const distribution = new aws_cloudfront_1.CloudFrontWebDistribution(this, "cdk-textract-cfront", {
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: clientAppS3Bucket,
                        originAccessIdentityId: oai.ref
                    },
                    behaviors: [{ isDefaultBehavior: true }]
                }
            ],
            priceClass: aws_cloudfront_1.PriceClass.PRICE_CLASS_100,
            httpVersion: aws_cloudfront_1.HttpVersion.HTTP2,
            enableIpV6: true,
            defaultRootObject: "index.html"
        });
        const cloudfrontPolicyStatement = new iam.PolicyStatement({
            actions: ["s3:GetBucket*", "s3:GetObject*", "s3:List*"],
            resources: [
                clientAppS3Bucket.bucketArn,
                `${clientAppS3Bucket.bucketArn}/*`
            ],
            principals: [new aws_iam_1.CanonicalUserPrincipal(oai.attrS3CanonicalUserId)]
        });
        const cloudfrontSamplesBucketPolicyStatement = new iam.PolicyStatement({
            actions: ["s3:*"],
            resources: [samplesS3Bucket.bucketArn, `${samplesS3Bucket.bucketArn}/*`],
            principals: [new aws_iam_1.CanonicalUserPrincipal(oai.attrS3CanonicalUserId)]
        });
        const cloudfrontDocumentsBucketPolicyStatement = new iam.PolicyStatement({
            actions: ["s3:*"],
            resources: [
                documentsS3Bucket.bucketArn,
                `${documentsS3Bucket.bucketArn}/*`
            ],
            principals: [new aws_iam_1.CanonicalUserPrincipal(oai.attrS3CanonicalUserId)]
        });
        clientAppS3Bucket.addToResourcePolicy(cloudfrontPolicyStatement);
        samplesS3Bucket.addToResourcePolicy(cloudfrontSamplesBucketPolicyStatement);
        documentsS3Bucket.addToResourcePolicy(cloudfrontDocumentsBucketPolicyStatement);
        // Elasticsearch
        const elasticSearch = new es.CfnDomain(this, this.resourceName("ElasticSearchCluster"), {
            elasticsearchVersion: "6.5",
            elasticsearchClusterConfig: {
                instanceType: "t2.medium.elasticsearch"
            },
            ebsOptions: {
                ebsEnabled: true,
                volumeSize: 20,
                volumeType: "gp2"
            }
        });
        // SNS Topic
        const jobCompletionTopic = new sns.Topic(this, this.resourceName("JobCompletion"), {
            displayName: "Job completion topic"
        });
        // Textract service IAM role
        const textractServiceRole = new iam.Role(this, this.resourceName("TextractServiceRole"), {
            assumedBy: new iam.ServicePrincipal("textract.amazonaws.com")
        });
        textractServiceRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [jobCompletionTopic.topicArn],
            actions: ["sns:Publish"]
        }));
        // DynamoDB tables
        const outputTable = new ddb.Table(this, this.resourceName("OutputTable"), {
            partitionKey: { name: "documentId", type: ddb.AttributeType.STRING },
            sortKey: { name: "outputType", type: ddb.AttributeType.STRING }
        });
        const documentsTable = new ddb.Table(this, this.resourceName("DocumentsTable"), {
            partitionKey: { name: "documentId", type: ddb.AttributeType.STRING },
            stream: ddb.StreamViewType.NEW_IMAGE
        });
        // SQS queues
        const syncJobsQueue = new sqs.Queue(this, this.resourceName("SyncJobs"), {
            visibilityTimeout: cdk.Duration.seconds(30),
            retentionPeriod: cdk.Duration.seconds(1209600)
        });
        const asyncJobsQueue = new sqs.Queue(this, this.resourceName("AsyncJobs"), {
            visibilityTimeout: cdk.Duration.seconds(30),
            retentionPeriod: cdk.Duration.seconds(1209600)
        });
        const jobErrorHandlerQueue = new sqs.Queue(this, this.resourceName("jobErrorHandler"), {
            visibilityTimeout: cdk.Duration.seconds(30),
            retentionPeriod: cdk.Duration.seconds(1209600)
        });
        const jobResultsQueue = new sqs.Queue(this, this.resourceName("JobResults"), {
            visibilityTimeout: cdk.Duration.seconds(900),
            retentionPeriod: cdk.Duration.seconds(1209600)
        });
        // trigger
        jobCompletionTopic.addSubscription(new snsSubscriptions.SqsSubscription(jobResultsQueue));
        // ####### Cognito User Authentication #######
        const textractUserPool = new aws_cognito_1.CfnUserPool(this, "textract-user-pool", {
            userPoolName: "textract-user-pool",
            autoVerifiedAttributes: [aws_cognito_1.UserPoolAttribute.EMAIL],
            aliasAttributes: [aws_cognito_1.UserPoolAttribute.EMAIL],
            mfaConfiguration: "OFF",
            adminCreateUserConfig: {
                allowAdminCreateUserOnly: true,
                inviteMessageTemplate: {
                    emailSubject: "Your Textract Solution login",
                    emailMessage: `<p>You are invited to join the Textract Solution page. Your credentials are:</p> \
                <p> \
                Username: <strong>{username}</strong><br /> \
                Password: <strong>{####}</strong> \
                </p> \
                <p> \
                Please sign in with the user name and your temporary password provided above at: <br /> \
                https://${distribution.domainName} \
                </p>`
                }
            }
        });
        // Depends upon all other parts of the stack having been created.
        const textractUserPoolUser = new aws_cognito_1.CfnUserPoolUser(this, "textract-user-pool-user", {
            desiredDeliveryMediums: ["EMAIL"],
            forceAliasCreation: false,
            userPoolId: textractUserPool.ref,
            userAttributes: [
                {
                    name: "email",
                    value: props.email
                }
            ],
            username: props.email.replace(/@/, ".")
        });
        const textractUserPoolClient = new aws_cognito_1.CfnUserPoolClient(this, "textract-user-pool-client", {
            clientName: "textract_app",
            userPoolId: textractUserPool.ref
        });
        const textractIdentityPool = new aws_cognito_1.CfnIdentityPool(this, "textract-identity-pool", {
            identityPoolName: "textractUserIdentityPool",
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [
                {
                    clientId: textractUserPoolClient.ref,
                    providerName: textractUserPool.attrProviderName,
                    serverSideTokenCheck: false
                }
            ]
        });
        const textractCognitoAuthenticatedRole = new iam.Role(this, "textract-cognito-authenticated-role", {
            assumedBy: new iam.FederatedPrincipal("cognito-identity.amazonaws.com", {
                StringEquals: {
                    "cognito-identity.amazonaws.com:aud": textractIdentityPool.ref
                },
                "ForAnyValue:StringLike": {
                    "cognito-identity.amazonaws.com:amr": "authenticated"
                }
            }, "sts:AssumeRoleWithWebIdentity"),
            path: "/"
        });
        const cognitoPolicy = new iam.Policy(this, "textract-cognito-policy", {
            statements: [
                new iam.PolicyStatement({
                    actions: ["cognito-identity:GetId"],
                    // TODO: Change to just identity pool
                    resources: ["*"],
                    effect: iam.Effect.ALLOW
                }),
                new iam.PolicyStatement({
                    actions: ["s3:PutObject", "s3:GetObject"],
                    resources: [
                        samplesS3Bucket.bucketArn,
                        `${samplesS3Bucket.bucketArn}/*`
                    ],
                    effect: iam.Effect.ALLOW
                }),
                new iam.PolicyStatement({
                    actions: ["s3:*"],
                    resources: [
                        documentsS3Bucket.bucketArn,
                        `${documentsS3Bucket.bucketArn}/*`
                    ],
                    effect: iam.Effect.ALLOW
                })
            ]
        });
        const cognitoPolicyResource = cognitoPolicy.node.findChild("Resource");
        cognitoPolicyResource.cfnOptions.metadata = {
            cfn_nag: {
                rules_to_suppress: [
                    {
                        id: "W11",
                        reason: "The resources in the policy are created/managed by this solution."
                    }
                ]
            }
        };
        cognitoPolicy.attachToRole(textractCognitoAuthenticatedRole);
        const textractIdentityPoolRoleAttachment = new aws_cognito_1.CfnIdentityPoolRoleAttachment(this, "textract-identity-role-pool-attachment", {
            identityPoolId: textractIdentityPool.ref,
            roles: {
                authenticated: textractCognitoAuthenticatedRole.roleArn
            }
        });
        /* ### Lambda ### */
        // If CICD deploy is used, the two largest lambdas draw their code from an S3 bucket.
        const cicdBotoLoc = lambda.Code.fromBucket(s3.Bucket.fromBucketName(this, "solutionBucketBoto", "SOURCE_BUCKET"), "document-understanding-solution/CODE_VERSION/boto3-layer.zip");
        const cicdPDFLoc = lambda.Code.fromBucket(s3.Bucket.fromBucketName(this, "solutionBucketPDF", "SOURCE_BUCKET"), "document-understanding-solution/CODE_VERSION/searchable-pdf-1.0.jar");
        // If a local yarn deploy is used, the two lambdas draw their code from a local directory.
        const yarnBotoLoc = lambda.Code.fromAsset("lambda/boto3");
        const yarnPDFLoc = lambda.Code.fromAsset("lambda/pdfgenerator");
        const helperLayer = new lambda.LayerVersion(this, this.resourceName("HelperLayer"), {
            code: lambda.Code.fromAsset("lambda/helper"),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_7],
            license: "Apache-2.0"
        });
        const textractorLayer = new lambda.LayerVersion(this, this.resourceName("Textractor"), {
            code: lambda.Code.fromAsset("lambda/textractor"),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_7],
            license: "Apache-2.0"
        });
        const boto3Layer = new lambda.LayerVersion(this, this.resourceName("Boto3"), {
            code: props.isCICDDeploy ? cicdBotoLoc : yarnBotoLoc,
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_7],
            license: "Apache-2.0"
        });
        const elasticSearchLayer = new lambda.LayerVersion(this, this.resourceName("ElasticSearchLayer"), {
            code: lambda.Code.fromAsset("lambda/elasticsearch/es.zip"),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_7],
            license: "Apache-2.0"
        });
        // Lambdas
        const documentProcessor = new lambda.Function(this, this.resourceName("TaskProcessor"), {
            runtime: lambda.Runtime.PYTHON_3_7,
            code: lambda.Code.fromAsset("lambda/documentprocessor"),
            handler: "lambda_function.lambda_handler",
            timeout: cdk.Duration.seconds(300),
            environment: {
                SYNC_QUEUE_URL: syncJobsQueue.queueUrl,
                ASYNC_QUEUE_URL: asyncJobsQueue.queueUrl,
                ERROR_HANDLER_QUEUE_URL: jobErrorHandlerQueue.queueUrl
            }
        });
        documentProcessor.addLayers(helperLayer);
        //Trigger
        documentProcessor.addEventSource(new aws_lambda_event_sources_1.DynamoEventSource(documentsTable, {
            startingPosition: lambda.StartingPosition.TRIM_HORIZON,
            batchSize: 1
        }));
        //Permissions
        documentsTable.grantReadWriteData(documentProcessor);
        syncJobsQueue.grantSendMessages(documentProcessor);
        asyncJobsQueue.grantSendMessages(documentProcessor);
        jobErrorHandlerQueue.grantSendMessages(documentProcessor);
        //------------------------------------------------------------
        const jobErrorHandler = new lambda.Function(this, this.resourceName("JobErrorHandlerLambda"), {
            runtime: lambda.Runtime.PYTHON_3_7,
            code: lambda.Code.fromAsset("lambda/joberrorhandler"),
            handler: "lambda_function.lambda_handler",
            timeout: cdk.Duration.seconds(30),
            environment: {
                DOCUMENTS_TABLE: documentsTable.tableName
            }
        });
        jobErrorHandler.addLayers(helperLayer);
        //Trigger
        jobErrorHandler.addEventSource(new aws_lambda_event_sources_1.SqsEventSource(jobErrorHandlerQueue, {
            batchSize: 1
        }));
        //Permissions
        documentsTable.grantReadWriteData(jobErrorHandler);
        //------------------------------------------------------------
        // PDF Generator
        const pdfGenerator = new lambda.Function(this, this.resourceName("PdfGenerator"), {
            runtime: lambda.Runtime.JAVA_8,
            code: props.isCICDDeploy ? cicdPDFLoc : yarnPDFLoc,
            handler: "DemoLambdaV2::handleRequest",
            memorySize: 3000,
            timeout: cdk.Duration.seconds(900)
        });
        documentsS3Bucket.grantReadWrite(pdfGenerator);
        samplesS3Bucket.grantReadWrite(pdfGenerator);
        //------------------------------------------------------------
        // Sync Jobs Processor (Process jobs using sync APIs)
        const syncProcessor = new lambda.Function(this, this.resourceName("SyncProcessor"), {
            runtime: lambda.Runtime.PYTHON_3_7,
            code: lambda.Code.asset("lambda/syncprocessor"),
            handler: "lambda_function.lambda_handler",
            reservedConcurrentExecutions: 1,
            timeout: cdk.Duration.seconds(25),
            environment: {
                OUTPUT_BUCKET: documentsS3Bucket.bucketName,
                OUTPUT_TABLE: outputTable.tableName,
                DOCUMENTS_TABLE: documentsTable.tableName,
                ES_DOMAIN: elasticSearch.attrDomainEndpoint,
                PDF_LAMBDA: pdfGenerator.functionName
            }
        });
        //Layer
        syncProcessor.addLayers(helperLayer);
        syncProcessor.addLayers(textractorLayer);
        syncProcessor.addLayers(boto3Layer);
        syncProcessor.addLayers(elasticSearchLayer);
        //Trigger
        syncProcessor.addEventSource(new aws_lambda_event_sources_1.SqsEventSource(syncJobsQueue, {
            batchSize: 1
        }));
        //Permissions
        documentsS3Bucket.grantReadWrite(syncProcessor);
        samplesS3Bucket.grantReadWrite(syncProcessor);
        outputTable.grantReadWriteData(syncProcessor);
        documentsTable.grantReadWriteData(syncProcessor);
        syncProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["textract:*"],
            resources: ["*"]
        }));
        syncProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["comprehend:*"],
            resources: ["*"]
        }));
        syncProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["comprehendmedical:*"],
            resources: ["*"]
        }));
        syncProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["es:*"],
            resources: [`${elasticSearch.attrArn}/*`]
        }));
        //------------------------------------------------------------
        // Async Job Processor (Start jobs using Async APIs)
        const asyncProcessor = new lambda.Function(this, this.resourceName("ASyncProcessor"), {
            runtime: lambda.Runtime.PYTHON_3_7,
            code: lambda.Code.asset("lambda/asyncprocessor"),
            handler: "lambda_function.lambda_handler",
            reservedConcurrentExecutions: 1,
            timeout: cdk.Duration.seconds(15),
            environment: {
                ASYNC_QUEUE_URL: asyncJobsQueue.queueUrl,
                SNS_TOPIC_ARN: jobCompletionTopic.topicArn,
                SNS_ROLE_ARN: textractServiceRole.roleArn
            }
        });
        //Layer
        asyncProcessor.addLayers(helperLayer);
        asyncProcessor.addLayers(boto3Layer);
        //Triggers
        // Run async job processor every minute
        //const rule = new events.EventRule(this, resourceName('Rule'), {
        //  scheduleExpression: 'rate(1 minute)',
        //})
        //rule.addTarget(asyncProcessor)
        // Run when a job is successfully complete
        //asyncProcessor.addEventSource(new SnsEventSource(jobCompletionTopic))
        asyncProcessor.addEventSource(new aws_lambda_event_sources_1.SqsEventSource(asyncJobsQueue, {
            batchSize: 1
        }));
        // Permissions
        documentsS3Bucket.grantRead(asyncProcessor);
        samplesS3Bucket.grantRead(asyncProcessor);
        asyncJobsQueue.grantConsumeMessages(asyncProcessor);
        asyncProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["iam:PassRole"],
            resources: [textractServiceRole.roleArn]
        }));
        asyncProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["textract:*"],
            resources: ["*"]
        }));
        //------------------------------------------------------------
        // Async Jobs Results Processor
        const jobResultProcessor = new lambda.Function(this, this.resourceName("JobResultProcessor"), {
            runtime: lambda.Runtime.PYTHON_3_7,
            code: lambda.Code.asset("lambda/jobresultprocessor"),
            handler: "lambda_function.lambda_handler",
            memorySize: 2000,
            reservedConcurrentExecutions: 50,
            timeout: cdk.Duration.seconds(900),
            environment: {
                OUTPUT_BUCKET: documentsS3Bucket.bucketName,
                OUTPUT_TABLE: outputTable.tableName,
                DOCUMENTS_TABLE: documentsTable.tableName,
                ES_DOMAIN: elasticSearch.attrDomainEndpoint,
                PDF_LAMBDA: pdfGenerator.functionName
            }
        });
        // Layer
        jobResultProcessor.addLayers(helperLayer);
        jobResultProcessor.addLayers(textractorLayer);
        jobResultProcessor.addLayers(boto3Layer);
        jobResultProcessor.addLayers(elasticSearchLayer);
        // Triggers
        jobResultProcessor.addEventSource(new aws_lambda_event_sources_1.SqsEventSource(jobResultsQueue, {
            batchSize: 1
        }));
        // Permissions
        outputTable.grantReadWriteData(jobResultProcessor);
        documentsTable.grantReadWriteData(jobResultProcessor);
        documentsS3Bucket.grantReadWrite(jobResultProcessor);
        samplesS3Bucket.grantReadWrite(jobResultProcessor);
        jobResultProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["textract:*"],
            resources: ["*"]
        }));
        jobResultProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["es:*"],
            resources: [`${elasticSearch.attrArn}/*`]
        }));
        jobResultProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["comprehend:*"],
            resources: ["*"]
        }));
        jobResultProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["comprehendmedical:*"],
            resources: ["*"]
        }));
        //------------------------------------------------------------
        pdfGenerator.grantInvoke(syncProcessor);
        pdfGenerator.grantInvoke(jobResultProcessor);
        //------------------------------------------------------------
        // API Processor
        const apiProcessor = new lambda.Function(this, this.resourceName("ApiProcessor"), {
            runtime: lambda.Runtime.PYTHON_3_7,
            code: lambda.Code.asset("lambda/apiprocessor"),
            handler: "lambda_function.lambda_handler",
            reservedConcurrentExecutions: 50,
            timeout: cdk.Duration.seconds(60),
            environment: {
                CONTENT_BUCKET: documentsS3Bucket.bucketName,
                SAMPLE_BUCKET: samplesS3Bucket.bucketName,
                OUTPUT_TABLE: outputTable.tableName,
                DOCUMENTS_TABLE: documentsTable.tableName,
                ES_DOMAIN: elasticSearch.attrDomainEndpoint
            }
        });
        // Layer
        apiProcessor.addLayers(elasticSearchLayer);
        apiProcessor.addLayers(helperLayer);
        // Permissions
        documentsTable.grantReadWriteData(apiProcessor);
        documentsTable.grant(apiProcessor, "dynamodb:DescribeTable");
        outputTable.grantReadWriteData(apiProcessor);
        documentsS3Bucket.grantRead(apiProcessor);
        samplesS3Bucket.grantRead(apiProcessor);
        apiProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["es:*"],
            resources: [`${elasticSearch.attrArn}/*`]
        }));
        apiProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["comprehend:*"],
            resources: ["*"]
        }));
        const api = new apigateway.LambdaRestApi(this, this.resourceName("TextractAPI"), {
            handler: apiProcessor,
            proxy: false
        });
        const authorizer = new apigateway.CfnAuthorizer(this, "Authorizer", {
            identitySource: "method.request.header.Authorization",
            name: "Authorization",
            type: "COGNITO_USER_POOLS",
            providerArns: [textractUserPool.attrArn],
            restApiId: api.restApiId
        });
        function addCorsOptionsAndMethods(apiResource, methods) {
            const options = apiResource.addMethod("OPTIONS", new apigateway.MockIntegration({
                integrationResponses: [
                    {
                        statusCode: "200",
                        responseParameters: {
                            "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                            "method.response.header.Access-Control-Allow-Origin": "'*'",
                            "method.response.header.Access-Control-Allow-Credentials": "'false'",
                            "method.response.header.Access-Control-Allow-Methods": "'OPTIONS,GET,PUT,POST,DELETE'"
                        }
                    }
                ],
                passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
                requestTemplates: {
                    "application/json": '{"statusCode": 200}'
                }
            }), {
                methodResponses: [
                    {
                        statusCode: "200",
                        // responseModels: {
                        //   'application/json': 'Empty',
                        // },
                        responseParameters: {
                            "method.response.header.Access-Control-Allow-Headers": true,
                            "method.response.header.Access-Control-Allow-Methods": true,
                            "method.response.header.Access-Control-Allow-Credentials": true,
                            "method.response.header.Access-Control-Allow-Origin": true
                        }
                    }
                ]
            });
            methods.forEach(method => {
                apiResource.addMethod(method, undefined, {
                    authorizationType: apigateway.AuthorizationType.COGNITO,
                    authorizer: {
                        authorizerId: `${authorizer.ref}`
                    }
                });
            });
        }
        addCorsOptionsAndMethods(api.root, []);
        const searchResource = api.root.addResource("search");
        addCorsOptionsAndMethods(searchResource, ["GET"]);
        const documentsResource = api.root.addResource("documents");
        addCorsOptionsAndMethods(documentsResource, ["GET"]);
        const documentResource = api.root.addResource("document");
        addCorsOptionsAndMethods(documentResource, ["GET", "POST", "DELETE"]);
        const redactResource = api.root.addResource("redact");
        addCorsOptionsAndMethods(redactResource, ["GET", "POST"]);
        cognitoPolicy.addStatements(new iam.PolicyStatement({
            actions: ["execute-api:Invoke"],
            resources: [api.arnForExecuteApi()],
            effect: iam.Effect.ALLOW
        }));
    }
}
exports.CdkTextractStack = CdkTextractStack;
