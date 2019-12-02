const { Stack } = require('@aws-cdk/cdk')
const {
  AuthFlow,
  CfnIdentityPool,
  CfnUserPoolClient,
  CfnIdentityPoolRoleAttachment,
  SignInType,
  UserPool,
  UserPoolAttribute,
} = require('@aws-cdk/aws-cognito')
const {
  DynamoEventSource,
  SqsEventSource,
  SnsEventSource,
  S3EventSource,
} = require('@aws-cdk/aws-lambda-event-sources')
const apigateway = require('@aws-cdk/aws-apigateway')
const dynamodb = require('@aws-cdk/aws-dynamodb')
const es = require('@aws-cdk/aws-elasticsearch')
const events = require('@aws-cdk/aws-events')
const iam = require('@aws-cdk/aws-iam')
const lambda = require('@aws-cdk/aws-lambda')
const sns = require('@aws-cdk/aws-sns')
const sqs = require('@aws-cdk/aws-sqs')
const s3 = require('@aws-cdk/aws-s3')
// const s3deployment = require('@aws-cdk/aws-s3-deployment')

class TextractDemoStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props)

    const resourceName = name => `${id}${name}`
    const addCorstoBucket = bucket => {
      const cfnBucket = bucket.node.findChild('Resource')
      cfnBucket.addPropertyOverride('CorsConfiguration', {
        CorsRules: [
          {
            AllowedOrigins: ['*'],
            AllowedMethods: ['HEAD', 'GET', 'PUT', 'POST', 'DELETE'],
            MaxAge: '3000',
            ExposedHeaders: ['ETag'],
            AllowedHeaders: ['*'],
          },
        ],
      })
    }
    //**********DocumentsS3Bucket*****************************
    const documentsS3Bucket = new s3.Bucket(this, resourceName('DocumentsS3Bucket'), {
      versioned: false,
    })
    addCorstoBucket(documentsS3Bucket)

    //**********SamplesS3Bucket*****************************
    const sampleS3Bucket = new s3.Bucket(this, resourceName('SamplesS3Bucket'), {
      versioned: false,
    })
    addCorstoBucket(sampleS3Bucket)

    //**********UserPool*****************************
    const userPool = new UserPool(this, resourceName('UserPool'), {
      autoVerifiedAttributes: [UserPoolAttribute.Email],
      poolName: resourceName('UserPool'),
      signInType: SignInType.Email,
    })
    //**********UserPoolClient*****************************
    const userPoolClient = new CfnUserPoolClient(this, resourceName('UserPoolClient'), {
      clientName: resourceName('UserPoolClient'),
      explicitAuthFlows: [AuthFlow.AdminNoSrp],
      generateSecret: false,
      userPoolId: userPool.userPoolId,
    })
    const identityPool = new CfnIdentityPool(this, resourceName('IdentityPool'), {
      identityPoolName: resourceName('IdentityPool'),
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    })
    this.cognitoFederatedPrincipal = new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
      StringEquals: {
        'cognito-identity.amazonaws.com:aud': identityPool.identityPoolId,
      },
    })
    const authenticatedCognitoFederatedPrincipal = new iam.FederatedPrincipal(
      'cognito-identity.amazonaws.com',
      {
        StringEquals: {
          'cognito-identity.amazonaws.com:aud': identityPool.identityPoolId,
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'authenticated',
        },
      },
      'sts:AssumeRoleWithWebIdentity'
    )
    const unauthenticatedCognitoFederatedPrincipal = new iam.FederatedPrincipal(
      'cognito-identity.amazonaws.com',
      {
        StringEquals: {
          'cognito-identity.amazonaws.com:aud': identityPool.identityPoolId,
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'unauthenticated',
        },
      },
      'sts:AssumeRoleWithWebIdentity'
    )
    const authedRole = new iam.Role(this, 'AuthedRole', {
      roleName: resourceName('AuthedRole'),
      assumedBy: authenticatedCognitoFederatedPrincipal,
    })
    const unauthedRole = new iam.Role(this, 'UnauthedRole', {
      roleName: resourceName('UnauthedRole'),
      assumedBy: unauthenticatedCognitoFederatedPrincipal,
    })
    const authedPolicy = new iam.Policy(this, 'AuthedPolicy', {
      policyName: resourceName('AuthedRolePolicy'),
      statements: [
        new iam.PolicyStatement(iam.PolicyStatementEffect.Allow)
          .addAction('cognito-identity:*')
          .addAction('cognito-sync:*')
          .addAction('mobileanalytics:PutEvents')
          .addResource('*'),
        new iam.PolicyStatement(iam.PolicyStatementEffect.Allow)
          .addActions(['s3:*'])
          .addResources([documentsS3Bucket.bucketArn, `${documentsS3Bucket.bucketArn}/*`]),
        new iam.PolicyStatement(iam.PolicyStatementEffect.Allow)
          .addActions(['s3:getObject'])
          .addResource(`${sampleS3Bucket.bucketArn}/*`),
      ],
    })
    const unauthedPolicy = new iam.Policy(this, 'UnauthedPolicy', {
      policyName: resourceName('UnauthedRolePolicy'),
      statements: [
        new iam.PolicyStatement(iam.PolicyStatementEffect.Allow)
          .addAction('cognito-identity:*')
          .addAction('cognito-sync:*')
          .addAction('mobileanalytics:PutEvents')
          .addResource('*'),
      ],
    })
    authedPolicy.attachToRole(authedRole)
    unauthedPolicy.attachToRole(unauthedRole)
    this.identityPoolRoles = new CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoles', {
      identityPoolId: identityPool.identityPoolId,
      roles: {
        authenticated: authedRole.roleArn,
        unauthenticated: unauthedRole.roleArn,
      },
    })

    //**********Elasticsearch******************************
    const elasticSearch = new es.CfnDomain(this, resourceName('ElasticSearchCluster'), {
      elasticsearchVersion: '6.5',
      ebsOptions: {
        ebsEnabled: true,
        volumeSize: 30,
        volumeType: 'gp2',
      },
    })

    //**********SNS Topics******************************
    const jobCompletionTopic = new sns.Topic(this, resourceName('JobCompletion'))

    //**********IAM Roles******************************
    const textractServiceRole = new iam.Role(this, resourceName('TextractServiceRole'), {
      assumedBy: new iam.ServicePrincipal('textract.amazonaws.com'),
    })

    textractServiceRole.addToPolicy(
      new iam.PolicyStatement().addResource(jobCompletionTopic.topicArn).addAction('sns:Publish')
    )

    //**********DynamoDB Table*************************
    //DynamoDB table with links to output in S3
    const outputTable = new dynamodb.Table(this, resourceName('OutputTable'), {
      partitionKey: { name: 'documentId', type: dynamodb.AttributeType.String },
      sortKey: { name: 'outputType', type: dynamodb.AttributeType.String },
    })

    //DynamoDB table with links to output in S3
    const documentsTable = new dynamodb.Table(this, resourceName('DocumentsTable'), {
      partitionKey: { name: 'documentId', type: dynamodb.AttributeType.String },
      streamSpecification: dynamodb.StreamViewType.NewImage,
    })

    //**********SQS Queues*****************************
    //Input Queue for sync jobs
    const syncJobsQueue = new sqs.Queue(this, resourceName('SyncJobs'), {
      visibilityTimeoutSec: 30,
      retentionPeriodSec: 1209600,
    })

    //Input Queue for async jobs
    const asyncJobsQueue = new sqs.Queue(this, resourceName('AsyncJobs'), {
      visibilityTimeoutSec: 30,
      retentionPeriodSec: 1209600,
    })

    //Queue
    const jobResultsQueue = new sqs.Queue(this, resourceName('JobResults'), {
      visibilityTimeoutSec: 900,
      retentionPeriodSec: 1209600,
    })
    //Trigger
    jobCompletionTopic.subscribeQueue(jobResultsQueue)

    //**********Lambda Functions******************************

    // Helper Layer with helper functions
    const helperLayer = new lambda.LayerVersion(this, resourceName('HelperLayer'), {
      code: lambda.Code.asset('lambda/helper'),
      compatibleRuntimes: [lambda.Runtime.Python37],
      license: 'Apache-2.0',
      description: 'Helper layer.',
    })

    // Textractor helper layer
    const textractorLayer = new lambda.LayerVersion(this, resourceName('Textractor'), {
      code: lambda.Code.asset('lambda/textractor'),
      compatibleRuntimes: [lambda.Runtime.Python37],
      license: 'Apache-2.0',
      description: 'Textractor layer.',
    })

    // Boto3 layer
    const boto3Layer = new lambda.LayerVersion(this, resourceName('Boto3'), {
      code: lambda.Code.asset('lambda/boto3/boto3-layer.zip'),
      compatibleRuntimes: [lambda.Runtime.Python37],
      license: 'Apache-2.0',
      description: 'Boto3 layer.',
    })

    // Elastsearch layer
    const elasticSearchLayer = new lambda.LayerVersion(this, resourceName('ElasticSearchLayer'), {
      code: lambda.Code.asset('lambda/elasticsearch/es.zip'),
      compatibleRuntimes: [lambda.Runtime.Python37],
      license: 'Apache-2.0',
      description: 'Elasticsearch layer.',
    })

    //------------------------------------------------------------

    // Document processor (Router to Sync/Async Pipeline)
    const documentProcessor = new lambda.Function(this, resourceName('TaskProcessor'), {
      runtime: lambda.Runtime.Python37,
      code: lambda.Code.asset('lambda/documentprocessor'),
      handler: 'lambda_function.lambda_handler',
      timeout: 300,
      environment: {
        SYNC_QUEUE_URL: syncJobsQueue.queueUrl,
        ASYNC_QUEUE_URL: asyncJobsQueue.queueUrl,
      },
    })
    //Layer
    documentProcessor.addLayer(helperLayer)
    //Trigger
    documentProcessor.addEventSource(
      new DynamoEventSource(documentsTable, {
        startingPosition: lambda.StartingPosition.TrimHorizon,
        batchSize: 1,
      })
    )

    //Permissions
    documentsTable.grantReadWriteData(documentProcessor)
    syncJobsQueue.grantSendMessages(documentProcessor)
    asyncJobsQueue.grantSendMessages(documentProcessor)

    //------------------------------------------------------------
    // PDF Generator
    const pdfGenerator = new lambda.Function(this, 'PdfGenerator', {
      runtime: lambda.Runtime.Java8,
      code: lambda.Code.asset('lambda/pdfgenerator'),
      handler: 'DemoLambdaV2::handleRequest',
      memorySize: 3000,
      timeout: 900,
    })

    documentsS3Bucket.grantReadWrite(pdfGenerator)
    sampleS3Bucket.grantReadWrite(pdfGenerator)

    //------------------------------------------------------------

    // Sync Jobs Processor (Process jobs using sync APIs)
    const syncProcessor = new lambda.Function(this, resourceName('SyncProcessor'), {
      runtime: lambda.Runtime.Python37,
      code: lambda.Code.asset('lambda/syncprocessor'),
      handler: 'lambda_function.lambda_handler',
      reservedConcurrentExecutions: 1,
      timeout: 25,
      environment: {
        OUTPUT_BUCKET: documentsS3Bucket.bucketName,
        OUTPUT_TABLE: outputTable.tableName,
        DOCUMENTS_TABLE: documentsTable.tableName,
        ES_DOMAIN: elasticSearch.domainEndpoint,
        PDF_LAMBDA: pdfGenerator.functionName,
      },
    })

    //Layer
    syncProcessor.addLayer(helperLayer)
    syncProcessor.addLayer(textractorLayer)
    syncProcessor.addLayer(boto3Layer)
    syncProcessor.addLayer(elasticSearchLayer)

    //Trigger
    syncProcessor.addEventSource(
      new SqsEventSource(syncJobsQueue, {
        batchSize: 1,
      })
    )

    //Permissions
    documentsS3Bucket.grantReadWrite(syncProcessor)
    sampleS3Bucket.grantReadWrite(syncProcessor)
    outputTable.grantReadWriteData(syncProcessor)
    documentsTable.grantReadWriteData(syncProcessor)
    syncProcessor.addToRolePolicy(
      new iam.PolicyStatement().addAllResources().addActions('textract:*')
    )
    syncProcessor.addToRolePolicy(
      new iam.PolicyStatement()
        .addResource(`${elasticSearch.domainArn}/*`)
        .addActions('es:ESHttpGet', 'es:ESHttpPost', 'es:ESHttpPut')
    )

    //------------------------------------------------------------

    // Async Job Processor (Start jobs using Async APIs)
    const asyncProcessor = new lambda.Function(this, resourceName('ASyncProcessor'), {
      runtime: lambda.Runtime.Python37,
      code: lambda.Code.asset('lambda/asyncprocessor'),
      handler: 'lambda_function.lambda_handler',
      reservedConcurrentExecutions: 1,
      timeout: 15,
      environment: {
        ASYNC_QUEUE_URL: asyncJobsQueue.queueUrl,
        SNS_TOPIC_ARN: jobCompletionTopic.topicArn,
        SNS_ROLE_ARN: textractServiceRole.roleArn,
      },
    })

    //Layer
    asyncProcessor.addLayer(helperLayer)
    asyncProcessor.addLayer(boto3Layer)

    //Triggers
    // Run async job processor every minute
    //const rule = new events.EventRule(this, resourceName('Rule'), {
    //  scheduleExpression: 'rate(1 minute)',
    //})
    //rule.addTarget(asyncProcessor)

    // Run when a job is successfully complete
    //asyncProcessor.addEventSource(new SnsEventSource(jobCompletionTopic))

    asyncProcessor.addEventSource(
      new SqsEventSource(asyncJobsQueue, {
        batchSize: 1,
      })
    )

    // Permissions
    documentsS3Bucket.grantRead(asyncProcessor)
    sampleS3Bucket.grantRead(asyncProcessor)
    asyncJobsQueue.grantConsumeMessages(asyncProcessor)
    asyncProcessor.addToRolePolicy(
      new iam.PolicyStatement().addResource(textractServiceRole.roleArn).addAction('iam:PassRole')
    )
    asyncProcessor.addToRolePolicy(
      new iam.PolicyStatement().addAllResources().addAction('textract:*')
    )

    //------------------------------------------------------------

    // Async Jobs Results Processor
    const jobResultProcessor = new lambda.Function(this, resourceName('JobResultProcessor'), {
      runtime: lambda.Runtime.Python37,
      code: lambda.Code.asset('lambda/jobresultprocessor'),
      handler: 'lambda_function.lambda_handler',
      memorySize: 2000,
      reservedConcurrentExecutions: 50,
      timeout: 900,
      environment: {
        OUTPUT_BUCKET: documentsS3Bucket.bucketName,
        OUTPUT_TABLE: outputTable.tableName,
        DOCUMENTS_TABLE: documentsTable.tableName,
        ES_DOMAIN: elasticSearch.domainEndpoint,
        PDF_LAMBDA: pdfGenerator.functionName,
      },
    })

    // Layer
    jobResultProcessor.addLayer(helperLayer)
    jobResultProcessor.addLayer(textractorLayer)
    jobResultProcessor.addLayer(boto3Layer)
    jobResultProcessor.addLayer(elasticSearchLayer)

    // Triggers
    jobResultProcessor.addEventSource(
      new SqsEventSource(jobResultsQueue, {
        batchSize: 1,
      })
    )

    // Permissions
    outputTable.grantReadWriteData(jobResultProcessor)
    documentsTable.grantReadWriteData(jobResultProcessor)
    documentsS3Bucket.grantReadWrite(jobResultProcessor)
    sampleS3Bucket.grantReadWrite(jobResultProcessor)
    jobResultProcessor.addToRolePolicy(
      new iam.PolicyStatement().addAllResources().addAction('textract:*')
    )
    jobResultProcessor.addToRolePolicy(
      new iam.PolicyStatement().addResource(`${elasticSearch.domainArn}/*`).addAction('es:*')
    )

    //------------------------------------------------------------

    pdfGenerator.grantInvoke(syncProcessor)
    pdfGenerator.grantInvoke(jobResultProcessor)

    //------------------------------------------------------------

    // API Processor
    const apiProcessor = new lambda.Function(this, resourceName('ApiProcessor'), {
      runtime: lambda.Runtime.Python37,
      code: lambda.Code.asset('lambda/apiprocessor'),
      handler: 'lambda_function.lambda_handler',
      reservedConcurrentExecutions: 50,
      timeout: 60,
      environment: {
        CONTENT_BUCKET: documentsS3Bucket.bucketName,
        SAMPLE_BUCKET: sampleS3Bucket.bucketName,
        OUTPUT_TABLE: outputTable.tableName,
        DOCUMENTS_TABLE: documentsTable.tableName,
        ES_DOMAIN: elasticSearch.domainEndpoint,
      },
    })

    // Layer
    apiProcessor.addLayer(elasticSearchLayer)
    apiProcessor.addLayer(helperLayer)

    // Permissions
    documentsTable.grantReadWriteData(apiProcessor)
    documentsTable.grant(apiProcessor, ['dynamodb:DescribeTable'])
    outputTable.grantReadWriteData(apiProcessor)
    documentsS3Bucket.grantRead(apiProcessor)
    sampleS3Bucket.grantRead(apiProcessor)
    apiProcessor.addToRolePolicy(
      new iam.PolicyStatement().addResource(`${elasticSearch.domainArn}/*`).addAction('es:*')
    )
    apiProcessor.addToRolePolicy(
      new iam.PolicyStatement().addAllResources().addActions('comprehend:*')
    )

    //------------------------------------------------------------
    // API

    function addCorsOptionsAndMethods(apiResource, methods = []) {
      const options = apiResource.addMethod(
        'OPTIONS',
        new apigateway.MockIntegration({
          integrationResponses: [
            {
              statusCode: '200',
              responseParameters: {
                'method.response.header.Access-Control-Allow-Headers':
                  "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Credentials': "'false'",
                'method.response.header.Access-Control-Allow-Methods':
                  "'OPTIONS,GET,PUT,POST,DELETE'",
              },
            },
          ],
          passthroughBehavior: apigateway.PassthroughBehavior.Never,
          requestTemplates: {
            'application/json': '{"statusCode": 200}',
          },
        })
      )
      const methodResource = options.node.findChild('Resource')
      methodResource.propertyOverrides.methodResponses = [
        {
          statusCode: '200',
          responseModels: {
            'application/json': 'Empty',
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ]
      methods.forEach(method => {
        apiResource.addMethod(method)
      })
    }

    const api = new apigateway.LambdaRestApi(this, resourceName('TextractAPI'), {
      handler: apiProcessor,
      proxy: false,
    })
    addCorsOptionsAndMethods(api.root)

    const searchResource = api.root.addResource('search')
    addCorsOptionsAndMethods(searchResource, ['GET'])

    const documentsResource = api.root.addResource('documents')
    addCorsOptionsAndMethods(documentsResource, ['GET'])

    const documentResource = api.root.addResource('document')
    addCorsOptionsAndMethods(documentResource, ['GET', 'POST', 'DELETE'])

    const redactResource = api.root.addResource('redact')
    addCorsOptionsAndMethods(redactResource, ['GET', 'POST'])
  }
}
module.exports = TextractDemoStack
