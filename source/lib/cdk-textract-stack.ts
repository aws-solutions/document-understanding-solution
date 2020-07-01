import cdk = require("@aws-cdk/core");
import ddb = require("@aws-cdk/aws-dynamodb");
import es = require("@aws-cdk/aws-elasticsearch");
import iam = require("@aws-cdk/aws-iam");
import lambda = require("@aws-cdk/aws-lambda");
import kms = require("@aws-cdk/aws-kms");
import s3 = require("@aws-cdk/aws-s3");
import sns = require("@aws-cdk/aws-sns");
import snsSubscriptions = require("@aws-cdk/aws-sns-subscriptions");
import sqs = require("@aws-cdk/aws-sqs");
import apigateway = require("@aws-cdk/aws-apigateway");
import {
  DynamoEventSource,
  SqsEventSource,
} from "@aws-cdk/aws-lambda-event-sources";
import {
  CfnUserPoolUser,
  CfnUserPoolClient,
  CfnUserPool,
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
} from "@aws-cdk/aws-cognito";
import {
  CloudFrontWebDistribution,
  PriceClass,
  HttpVersion,
  OriginAccessIdentity,
} from "@aws-cdk/aws-cloudfront";
import { CanonicalUserPrincipal } from "@aws-cdk/aws-iam";
import uuid = require("short-uuid");
import { BucketEncryption, BlockPublicAccess } from "@aws-cdk/aws-s3";
import { QueueEncryption } from "@aws-cdk/aws-sqs";
import { LogGroup } from "@aws-cdk/aws-logs";

const API_CONCURRENT_REQUESTS = 20; //approximate number of 1-2 page documents to be processed parallelly

export interface TextractStackProps {
  email: string;
  isCICDDeploy: boolean;
  description: string;
}

export class CdkTextractStack extends cdk.Stack {
  uuid: string;
  resourceName: (name: any) => string;
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(
    scope: cdk.Construct | undefined,
    id: string | undefined,
    props: TextractStackProps
  ) {
    super(scope, id , props);

    this.resourceName = (name: any) =>
      `${id}-${name}-${this.uuid}`.toLowerCase();
  
    this.uuid = uuid.generate();

    const corsRule = {
      allowedOrigins: ["*"],
      allowedMethods: [
        s3.HttpMethods.HEAD,
        s3.HttpMethods.GET,
        s3.HttpMethods.PUT,
        s3.HttpMethods.POST,
        s3.HttpMethods.DELETE,
      ],
      maxAge: 3000,
      exposedHeaders: ["ETag"],
      allowedHeaders: ["*"],
    };

    //validate that we have atleast 10 concurrent request for the API
    if (API_CONCURRENT_REQUESTS < 10) {
      throw Error(
        "Concurrency limit for Lambdas is too low. Please increase the value of API_CONCURRENT_REQUESTS"
      );
    }

    // S3 buckets
    const logsS3Bucket = new s3.Bucket(
      this,
      this.resourceName("LogsS3Bucket"),
      {
        bucketName: this.resourceName("logs-s3-bucket"),
        accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
        versioned: false,
        encryption: BucketEncryption.S3_MANAGED,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      }
    );

    const documentsS3Bucket = new s3.Bucket(
      this,
      this.resourceName("DocumentsS3Bucket"),
      {
        bucketName: this.resourceName("document-s3-bucket"),
        versioned: false,
        cors: [corsRule],
        encryption: BucketEncryption.S3_MANAGED,
        serverAccessLogsBucket: logsS3Bucket,
        serverAccessLogsPrefix: "document-s3-bucket",
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      }
    );

    const samplesS3Bucket = new s3.Bucket(
      this,
      this.resourceName("SamplesS3Bucket"),
      {
        bucketName: this.resourceName("sample-s3-bucket"),
        versioned: false,
        cors: [corsRule],
        encryption: BucketEncryption.S3_MANAGED,
        serverAccessLogsBucket: logsS3Bucket,
        serverAccessLogsPrefix: "sample-s3-bucket",
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      }
    );

    // ### Client ###

    const clientAppS3Bucket = new s3.Bucket(
      this,
      this.resourceName("ClientAppS3Bucket"),
      {
        websiteIndexDocument: "index.html",
        cors: [corsRule],
        encryption: BucketEncryption.S3_MANAGED,
        serverAccessLogsBucket: logsS3Bucket,
        serverAccessLogsPrefix: "clientapps3bucket",
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      }
    );

    // eslint-disable-next-line no-unused-vars
    const oai = new OriginAccessIdentity(this, "cdk-textract-oai", {
      comment:
        "Origin Access Identity for Textract web stack bucket cloudfront distribution",
    });

    const distribution = new CloudFrontWebDistribution(
      this,
      "cdk-textract-cfront",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: clientAppS3Bucket,
              originAccessIdentity: oai,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
        priceClass: PriceClass.PRICE_CLASS_100,
        httpVersion: HttpVersion.HTTP2,
        enableIpV6: true,
        defaultRootObject: "index.html",
        loggingConfig: {
          bucket: logsS3Bucket,
          prefix: "cloudfrontDistributionLogs",
          includeCookies: true,
        },
      }
    );

    const cloudfrontPolicyStatement = new iam.PolicyStatement({
      actions: ["s3:GetObject*", "s3:List*"],
      resources: [
        clientAppS3Bucket.bucketArn,
        `${clientAppS3Bucket.bucketArn}/*`,
      ],
      principals: [
        new CanonicalUserPrincipal(
          oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
    });

    const cloudfrontSamplesBucketPolicyStatement = new iam.PolicyStatement({
      actions: ["s3:GetObject*", "s3:List*"],
      resources: [samplesS3Bucket.bucketArn, `${samplesS3Bucket.bucketArn}/*`],
      principals: [
        new CanonicalUserPrincipal(
          oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
    });

    const cloudfrontDocumentsBucketPolicyStatement = new iam.PolicyStatement({
      actions: ["s3:GetObject*", "s3:List*", "s3:PutObject"],
      resources: [
        documentsS3Bucket.bucketArn,
        `${documentsS3Bucket.bucketArn}/*`,
      ],
      principals: [
        new CanonicalUserPrincipal(
          oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
    });

    clientAppS3Bucket.addToResourcePolicy(cloudfrontPolicyStatement);
    samplesS3Bucket.addToResourcePolicy(cloudfrontSamplesBucketPolicyStatement);
    documentsS3Bucket.addToResourcePolicy(
      cloudfrontDocumentsBucketPolicyStatement
    );

    const esLogGroup = new LogGroup(
      this,
      this.resourceName("ElasticSearchLogGroup"),
      {
        logGroupName: this.resourceName("ElasticSearchLogGroup"),
      }
    );

    // Elasticsearch
    let elasticSearch;

    const esEncryptionKey = new kms.Key(this, "esEncryptionKey", {
      enableKeyRotation: true,
    });

    if (!props.isCICDDeploy) {
      elasticSearch = new es.CfnDomain(
        this,
        this.resourceName("ElasticSearchCluster"),
        {
          elasticsearchVersion: "6.5",
          elasticsearchClusterConfig: {
            instanceType: "m5.large.elasticsearch",
          },
          ebsOptions: {
            ebsEnabled: true,
            volumeSize: 20,
            volumeType: "gp2",
          },
          encryptionAtRestOptions: {
            enabled: true,
            kmsKeyId: esEncryptionKey.keyId,
          },
          nodeToNodeEncryptionOptions: {
            enabled: true,
          },
        }
      );
    } else {
      const serviceLinkedRole = new cdk.CfnResource(
        this,
        this.resourceName("es-service-linked-role"),
        {
          type: "AWS::IAM::ServiceLinkedRole",
          properties: {
            AWSServiceName: "es.amazonaws.com",
            Description: "Role for ES to access resources in my VPC",
          },
        }
      );

      elasticSearch = new es.CfnDomain(
        this,
        this.resourceName("ElasticSearchCluster"),
        {
          elasticsearchVersion: "6.5",
          elasticsearchClusterConfig: {
            instanceType: "m5.large.elasticsearch",
            instanceCount: 2,
            dedicatedMasterEnabled: true,
            zoneAwarenessEnabled: true,
            zoneAwarenessConfig: {
              availabilityZoneCount: 2,
            },
          },
          ebsOptions: {
            ebsEnabled: true,
            volumeSize: 20,
            volumeType: "gp2",
          },
          encryptionAtRestOptions: {
            enabled: true,
            kmsKeyId: esEncryptionKey.keyId,
          },
          nodeToNodeEncryptionOptions: {
            enabled: true,
          },
          logPublishingOptions: {
            INDEX_SLOW_LOGS: {
              cloudWatchLogsLogGroupArn: esLogGroup.logGroupArn,
              enabled: true,
            },
            SEARCH_SLOW_LOGS: {
              cloudWatchLogsLogGroupArn: esLogGroup.logGroupArn,
              enabled: true,
            },
          },
        }
      );

      elasticSearch.node.addDependency(serviceLinkedRole);
    }

    // SNS Topic
    const jobCompletionTopic = new sns.Topic(
      this,
      this.resourceName("JobCompletion"),
      {
        displayName: "Job completion topic",
      }
    );

    // Textract service IAM role
    const textractServiceRole = new iam.Role(
      this,
      this.resourceName("TextractServiceRole"),
      {
        assumedBy: new iam.ServicePrincipal("textract.amazonaws.com"),
      }
    );

    textractServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["sns:Publish"],
        resources: [jobCompletionTopic.topicArn],
      })
    );

    // DynamoDB tables
    const outputTable = new ddb.Table(this, this.resourceName("OutputTable"), {
      partitionKey: { name: "documentId", type: ddb.AttributeType.STRING },
      sortKey: { name: "outputType", type: ddb.AttributeType.STRING },
      serverSideEncryption: true,
    });

    const documentsTable = new ddb.Table(
      this,
      this.resourceName("DocumentsTable"),
      {
        partitionKey: { name: "documentId", type: ddb.AttributeType.STRING },
        stream: ddb.StreamViewType.NEW_IMAGE,
        serverSideEncryption: true,
      }
    );

    // SQS queues
    const syncJobsDLQueue = new sqs.Queue(
      this,
      this.resourceName("SyncJobsDLQ"),
      {
        visibilityTimeout: cdk.Duration.seconds(120),
        retentionPeriod: cdk.Duration.seconds(1209600),
        encryption: QueueEncryption.KMS_MANAGED,
      }
    );

    const syncJobsQueue = new sqs.Queue(this, this.resourceName("SyncJobs"), {
      visibilityTimeout: cdk.Duration.seconds(900),
      retentionPeriod: cdk.Duration.seconds(1209600),
      encryption: QueueEncryption.KMS_MANAGED,
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: syncJobsDLQueue,
      },
    });

    const asyncJobsDLQueue = new sqs.Queue(
      this,
      this.resourceName("AsyncJobsDLQ"),
      {
        visibilityTimeout: cdk.Duration.seconds(120),
        retentionPeriod: cdk.Duration.seconds(1209600),
        encryption: QueueEncryption.KMS_MANAGED,
      }
    );

    const asyncJobsQueue = new sqs.Queue(this, this.resourceName("AsyncJobs"), {
      visibilityTimeout: cdk.Duration.seconds(120),
      retentionPeriod: cdk.Duration.seconds(1209600),
      encryption: QueueEncryption.KMS_MANAGED,
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: asyncJobsDLQueue,
      },
    });

    const jobErrorHandlerDLQueue = new sqs.Queue(
      this,
      this.resourceName("jobErrorHandlerDLQ"),
      {
        visibilityTimeout: cdk.Duration.seconds(60),
        retentionPeriod: cdk.Duration.seconds(1209600),
        encryption: QueueEncryption.KMS_MANAGED,
      }
    );

    const jobErrorHandlerQueue = new sqs.Queue(
      this,
      this.resourceName("jobErrorHandler"),
      {
        visibilityTimeout: cdk.Duration.seconds(60),
        retentionPeriod: cdk.Duration.seconds(1209600),
        encryption: QueueEncryption.KMS_MANAGED,
        deadLetterQueue: {
          maxReceiveCount: 3,
          queue: jobErrorHandlerDLQueue,
        },
      }
    );

    const jobResultsDLQueue = new sqs.Queue(
      this,
      this.resourceName("JobResultsDLQ"),
      {
        visibilityTimeout: cdk.Duration.seconds(900),
        retentionPeriod: cdk.Duration.seconds(1209600),
      }
    );

    const jobResultsQueue = new sqs.Queue(
      this,
      this.resourceName("JobResults"),
      {
        visibilityTimeout: cdk.Duration.seconds(900),
        retentionPeriod: cdk.Duration.seconds(1209600),
        deadLetterQueue: {
          maxReceiveCount: 3,
          queue: jobResultsDLQueue,
        },
      }
    );
    // trigger
    jobCompletionTopic.addSubscription(
      new snsSubscriptions.SqsSubscription(jobResultsQueue)
    );

    // ####### Cognito User Authentication #######

    const textractUserPool = new CfnUserPool(this, "textract-user-pool", {
      userPoolName: "textract-user-pool",
      autoVerifiedAttributes: ["email"],
      aliasAttributes: ["email"],
      mfaConfiguration: "OFF",
      userPoolAddOns: {
        advancedSecurityMode: "ENFORCED",
      },
      policies: {
        passwordPolicy: {
          minimumLength: 8,
          requireLowercase: true,
          requireNumbers: true,
          requireSymbols: true,
          requireUppercase: true,
        },
      },
      adminCreateUserConfig: {
        allowAdminCreateUserOnly: true,
        inviteMessageTemplate: {
          emailSubject: "Your DUS login",
          emailMessage: `<p>You are invited to try the Document Understanding Solution. Your credentials are:</p> \
                <p> \
                Username: <strong>{username}</strong><br /> \
                Password: <strong>{####}</strong> \
                </p> \
                <p>\
                Please wait until the deployent has completed for both DUS and DUSClient stacks before accessing the website \
                </p>\
                <p> \
                Please sign in with the user name and your temporary password provided above at: <br /> \
                https://${distribution.domainName} \
                </p>\
                `,
        },
        unusedAccountValidityDays: 60,
      },
    });

    // Depends upon all other parts of the stack having been created.
    const textractUserPoolUser = new CfnUserPoolUser(
      this,
      "textract-user-pool-user",
      {
        desiredDeliveryMediums: ["EMAIL"],
        forceAliasCreation: false,
        userPoolId: textractUserPool.ref,
        userAttributes: [
          {
            name: "email",
            value: props.email,
          },
        ],
        username: props.email.replace(/@/, "."),
      }
    );

    const textractUserPoolClient = new CfnUserPoolClient(
      this,
      "textract-user-pool-client",
      {
        clientName: "textract_app",
        userPoolId: textractUserPool.ref,
      }
    );

    const textractIdentityPool = new CfnIdentityPool(
      this,
      "textract-identity-pool",
      {
        identityPoolName: "textractUserIdentityPool",
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: textractUserPoolClient.ref,
            providerName: textractUserPool.attrProviderName,
            serverSideTokenCheck: false,
          },
        ],
      }
    );

    const textractCognitoAuthenticatedRole = new iam.Role(
      this,
      "textract-cognito-authenticated-role",
      {
        assumedBy: new iam.FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": textractIdentityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "authenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity"
        ),
        path: "/",
      }
    );
    
    const cognitoPolicy = new iam.Policy(this, "textract-cognito-policy", {
      statements: [
        new iam.PolicyStatement({
          actions: ["cognito-identity:GetId"],
          resources: [
            `arn:aws:cognito-identity:${CdkTextractStack.of(this).region}:${
              CdkTextractStack.of(this).account
            }:identitypool/${textractIdentityPool.ref}`,
          ],
          effect: iam.Effect.ALLOW,
        }),
        new iam.PolicyStatement({
          actions: ["s3:GetObject*", "s3:List*"],
          resources: [
            samplesS3Bucket.bucketArn,
            `${samplesS3Bucket.bucketArn}/*`,
          ],
          effect: iam.Effect.ALLOW,
        }),
        new iam.PolicyStatement({
          actions: ["s3:GetObject*", "s3:List*", "s3:PutObject"],
          resources: [
            documentsS3Bucket.bucketArn,
            `${documentsS3Bucket.bucketArn}/*`,
          ],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    const cognitoPolicyResource = cognitoPolicy.node.findChild(
      "Resource"
    ) as iam.CfnPolicy;
    cognitoPolicyResource.cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W11",
            reason:
              "The resources in the policy are created/managed by this solution.",
          },
        ],
      },
    };

    cognitoPolicy.attachToRole(textractCognitoAuthenticatedRole);

    const textractIdentityPoolRoleAttachment = new CfnIdentityPoolRoleAttachment(
      this,
      "textract-identity-role-pool-attachment",
      {
        identityPoolId: textractIdentityPool.ref,
        roles: {
          authenticated: textractCognitoAuthenticatedRole.roleArn,
        },
      }
    );

    /* ### Lambda ### */

    // If CICD deploy is used, the two largest lambdas draw their code from an S3 bucket.

    const cicdBotoLoc = lambda.Code.fromBucket(
      s3.Bucket.fromBucketName(this, "solutionBucketBoto", "SOURCE_BUCKET"),
      "SOLUTION_NAME/CODE_VERSION/boto3-layer.zip"
    );

    const cicdPDFLoc = lambda.Code.fromBucket(
      s3.Bucket.fromBucketName(this, "solutionBucketPDF", "SOURCE_BUCKET"),
      "SOLUTION_NAME/CODE_VERSION/searchable-pdf-1.0.jar"
    );

    // If a local yarn deploy is used, the two lambdas draw their code from a local directory.

    const yarnBotoLoc = lambda.Code.fromAsset("lambda/boto3");

    const yarnPDFLoc = lambda.Code.fromAsset("lambda/pdfgenerator");

    const helperLayer = new lambda.LayerVersion(
      this,
      this.resourceName("HelperLayer"),
      {
        code: lambda.Code.fromAsset("lambda/helper"),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_8],
        license: "Apache-2.0",
      }
    );

    const textractorLayer = new lambda.LayerVersion(
      this,
      this.resourceName("Textractor"),
      {
        code: lambda.Code.fromAsset("lambda/textractor"),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_8],
        license: "Apache-2.0",
      }
    );

    const boto3Layer = new lambda.LayerVersion(
      this,
      this.resourceName("Boto3"),
      {
        code: props.isCICDDeploy ? cicdBotoLoc : yarnBotoLoc,
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_8],
        license: "Apache-2.0",
      }
    );

    const elasticSearchLayer = new lambda.LayerVersion(
      this,
      this.resourceName("ElasticSearchLayer"),
      {
        code: lambda.Code.fromAsset("lambda/elasticsearch/es.zip"),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_8],
        license: "Apache-2.0",
      }
    );

    // Lambdas
    const documentProcessor = new lambda.Function(
      this,
      this.resourceName("TaskProcessor"),
      {
        runtime: lambda.Runtime.PYTHON_3_8,
        code: lambda.Code.fromAsset("lambda/documentprocessor"),
        handler: "lambda_function.lambda_handler",
        reservedConcurrentExecutions: API_CONCURRENT_REQUESTS,
        timeout: cdk.Duration.seconds(300),
        environment: {
          SYNC_QUEUE_URL: syncJobsQueue.queueUrl,
          ASYNC_QUEUE_URL: asyncJobsQueue.queueUrl,
          ERROR_HANDLER_QUEUE_URL: jobErrorHandlerQueue.queueUrl,
        },
      }
    );
    documentProcessor.addLayers(helperLayer);

    //Trigger
    documentProcessor.addEventSource(
      new DynamoEventSource(documentsTable, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 1,
      })
    );

    //Permissions
    documentsTable.grantReadWriteData(documentProcessor);
    syncJobsQueue.grantSendMessages(documentProcessor);
    asyncJobsQueue.grantSendMessages(documentProcessor);
    jobErrorHandlerQueue.grantSendMessages(documentProcessor);
    //------------------------------------------------------------

    const jobErrorHandler = new lambda.Function(
      this,
      this.resourceName("JobErrorHandlerLambda"),
      {
        runtime: lambda.Runtime.PYTHON_3_8,
        code: lambda.Code.fromAsset("lambda/joberrorhandler"),
        reservedConcurrentExecutions: Math.floor(API_CONCURRENT_REQUESTS / 4),
        handler: "lambda_function.lambda_handler",
        timeout: cdk.Duration.seconds(60),
        environment: {
          DOCUMENTS_TABLE: documentsTable.tableName,
        },
      }
    );
    jobErrorHandler.addLayers(helperLayer);

    //Trigger
    jobErrorHandler.addEventSource(
      new SqsEventSource(jobErrorHandlerQueue, {
        batchSize: 1,
      })
    );

    //Permissions
    documentsTable.grantReadWriteData(jobErrorHandler);

    //------------------------------------------------------------
    // PDF Generator
    const pdfGenerator = new lambda.Function(
      this,
      this.resourceName("PdfGenerator"),
      {
        runtime: lambda.Runtime.JAVA_8,
        code: props.isCICDDeploy ? cicdPDFLoc : yarnPDFLoc,
        reservedConcurrentExecutions: API_CONCURRENT_REQUESTS,
        handler: "DemoLambdaV2::handleRequest",
        memorySize: 3000,
        timeout: cdk.Duration.seconds(900),
      }
    );

    documentsS3Bucket.grantReadWrite(pdfGenerator);
    samplesS3Bucket.grantReadWrite(pdfGenerator);

    //------------------------------------------------------------

    // Sync Jobs Processor (Process jobs using sync APIs)
    const syncProcessor = new lambda.Function(
      this,
      this.resourceName("SyncProcessor"),
      {
        runtime: lambda.Runtime.PYTHON_3_8,
        code: lambda.Code.asset("lambda/syncprocessor"),
        handler: "lambda_function.lambda_handler",
        reservedConcurrentExecutions: Math.floor(API_CONCURRENT_REQUESTS / 2),
        timeout: cdk.Duration.seconds(900),
        environment: {
          OUTPUT_BUCKET: documentsS3Bucket.bucketName,
          OUTPUT_TABLE: outputTable.tableName,
          DOCUMENTS_TABLE: documentsTable.tableName,
          ES_DOMAIN: elasticSearch.attrDomainEndpoint,
          PDF_LAMBDA: pdfGenerator.functionName,
        },
      }
    );

    //Layer
    syncProcessor.addLayers(helperLayer);
    syncProcessor.addLayers(textractorLayer);
    syncProcessor.addLayers(boto3Layer);
    syncProcessor.addLayers(elasticSearchLayer);

    //Trigger
    syncProcessor.addEventSource(
      new SqsEventSource(syncJobsQueue, {
        batchSize: 1,
      })
    );

    //Permissions
    documentsS3Bucket.grantReadWrite(syncProcessor);
    samplesS3Bucket.grantReadWrite(syncProcessor);
    outputTable.grantReadWriteData(syncProcessor);
    documentsTable.grantReadWriteData(syncProcessor);
    esEncryptionKey.grantEncryptDecrypt(syncProcessor);

    syncProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["textract:DetectDocumentText", "textract:AnalyzeDocument"],
        resources: ["*"], // Currently, Textract does not support resource level permissionshttps://docs.aws.amazon.com/IAM/latest/UserGuide/list_amazontextract.html#amazontextract-resources-for-iam-policies
      })
    );

    syncProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "comprehend:BatchDetectEntities",
          "comprehend:DetectEntities",
        ],
        resources: ["*"], //Currently, Comprehend does not support resource level permissions for these APIs. https://docs.aws.amazon.com/IAM/latest/UserGuide/list_amazoncomprehend.html#amazoncomprehend-resources-for-iam-policies
      })
    );

    syncProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "comprehendmedical:InferICD10CM",
          "comprehendmedical:DetectEntitiesV2",
        ],
        resources: ["*"], // Currently, Comprehend Medical does not support resource type permssions. https://docs.aws.amazon.com/IAM/latest/UserGuide/list_comprehendmedical.html#comprehendmedical-resources-for-iam-policies
      })
    );

    syncProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "es:ESHttpHead",
          "es:Get*",
          "es:List*",
          "es:Describe*",
          "es:ESHttpGet",
          "es:ESHttpDelete",
          "es:ESHttpPost",
          "es:ESHttpPut",
        ],
        resources: [`${elasticSearch.attrArn}/*`],
      })
    );

    //------------------------------------------------------------

    // Async Job Processor (Start jobs using Async APIs)
    const asyncProcessor = new lambda.Function(
      this,
      this.resourceName("ASyncProcessor"),
      {
        runtime: lambda.Runtime.PYTHON_3_8,
        code: lambda.Code.asset("lambda/asyncprocessor"),
        handler: "lambda_function.lambda_handler",
        reservedConcurrentExecutions: Math.floor(API_CONCURRENT_REQUESTS / 2),
        timeout: cdk.Duration.seconds(120),
        environment: {
          ASYNC_QUEUE_URL: asyncJobsQueue.queueUrl,
          SNS_TOPIC_ARN: jobCompletionTopic.topicArn,
          SNS_ROLE_ARN: textractServiceRole.roleArn,
        },
      }
    );

    //Layer
    asyncProcessor.addLayers(helperLayer);
    asyncProcessor.addLayers(boto3Layer);

    asyncProcessor.addEventSource(
      new SqsEventSource(asyncJobsQueue, {
        batchSize: 1,
      })
    );

    // Permissions
    documentsS3Bucket.grantRead(asyncProcessor);
    samplesS3Bucket.grantRead(asyncProcessor);
    asyncJobsQueue.grantConsumeMessages(asyncProcessor);
    asyncProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["iam:PassRole"],
        resources: [textractServiceRole.roleArn],
      })
    );
    asyncProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "textract:StartDocumentTextDetection",
          "textract:StartDocumentAnalysis",
        ],
        resources: ["*"], // Currently, Textract does not support resource level permissionshttps://docs.aws.amazon.com/IAM/latest/UserGuide/list_amazontextract.html#amazontextract-resources-for-iam-policies
      })
    );

    //------------------------------------------------------------

    // Async Jobs Results Processor
    const jobResultProcessor = new lambda.Function(
      this,
      this.resourceName("JobResultProcessor"),
      {
        runtime: lambda.Runtime.PYTHON_3_8,
        code: lambda.Code.asset("lambda/jobresultprocessor"),
        handler: "lambda_function.lambda_handler",
        memorySize: 2000,
        reservedConcurrentExecutions: Math.floor(API_CONCURRENT_REQUESTS / 2),
        timeout: cdk.Duration.seconds(900),
        environment: {
          OUTPUT_BUCKET: documentsS3Bucket.bucketName,
          OUTPUT_TABLE: outputTable.tableName,
          DOCUMENTS_TABLE: documentsTable.tableName,
          ES_DOMAIN: elasticSearch.attrDomainEndpoint,
          PDF_LAMBDA: pdfGenerator.functionName,
        },
      }
    );

    // Layer
    jobResultProcessor.addLayers(helperLayer);
    jobResultProcessor.addLayers(textractorLayer);
    jobResultProcessor.addLayers(boto3Layer);
    jobResultProcessor.addLayers(elasticSearchLayer);

    // Triggers
    jobResultProcessor.addEventSource(
      new SqsEventSource(jobResultsQueue, {
        batchSize: 1,
      })
    );

    // Permissions
    outputTable.grantReadWriteData(jobResultProcessor);
    documentsTable.grantReadWriteData(jobResultProcessor);
    documentsS3Bucket.grantReadWrite(jobResultProcessor);
    samplesS3Bucket.grantReadWrite(jobResultProcessor);

    jobResultProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "textract:GetDocumentTextDetection",
          "textract:GetDocumentAnalysis",
        ],
        resources: ["*"], // Currently, Textract does not support resource level permissionshttps://docs.aws.amazon.com/IAM/latest/UserGuide/list_amazontextract.html#amazontextract-resources-for-iam-policies
      })
    );
    jobResultProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "es:ESHttpHead",
          "es:Get*",
          "es:List*",
          "es:Describe*",
          "es:ESHttpGet",
          "es:ESHttpDelete",
          "es:ESHttpPost",
          "es:ESHttpPut",
        ],
        resources: [`${elasticSearch.attrArn}/*`],
      })
    );

    jobResultProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "comprehend:BatchDetectEntities",
          "comprehend:DetectEntities",
        ],
        resources: ["*"], //Currently, Comprehend does not support resource level permissions for these APIs. https://docs.aws.amazon.com/IAM/latest/UserGuide/list_amazoncomprehend.html#amazoncomprehend-resources-for-iam-policies
      })
    );

    jobResultProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "comprehendmedical:InferICD10CM",
          "comprehendmedical:DetectEntitiesV2",
        ],
        resources: ["*"], // Currently, Comprehend Medical does not support resource type permssions. https://docs.aws.amazon.com/IAM/latest/UserGuide/list_comprehendmedical.html#comprehendmedical-resources-for-iam-policies
      })
    );

    esEncryptionKey.grantEncryptDecrypt(jobResultProcessor);
    
    //------------------------------------------------------------

    pdfGenerator.grantInvoke(syncProcessor);
    pdfGenerator.grantInvoke(jobResultProcessor);

    //------------------------------------------------------------

    // API Processor
    const apiProcessor = new lambda.Function(
      this,
      this.resourceName("ApiProcessor"),
      {
        runtime: lambda.Runtime.PYTHON_3_8,
        code: lambda.Code.asset("lambda/apiprocessor"),
        handler: "lambda_function.lambda_handler",
        reservedConcurrentExecutions: API_CONCURRENT_REQUESTS,
        timeout: cdk.Duration.seconds(60),
        environment: {
          CONTENT_BUCKET: documentsS3Bucket.bucketName,
          SAMPLE_BUCKET: samplesS3Bucket.bucketName,
          OUTPUT_TABLE: outputTable.tableName,
          DOCUMENTS_TABLE: documentsTable.tableName,
          ES_DOMAIN: elasticSearch.attrDomainEndpoint,
        },
      }
    );

    // Layer
    apiProcessor.addLayers(elasticSearchLayer);
    apiProcessor.addLayers(helperLayer);

    // Permissions
    documentsTable.grantReadWriteData(apiProcessor);
    documentsTable.grant(apiProcessor, "dynamodb:DescribeTable");
    outputTable.grantReadWriteData(apiProcessor);
    documentsS3Bucket.grantRead(apiProcessor);
    samplesS3Bucket.grantRead(apiProcessor);
    apiProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "es:ESHttpHead",
          "es:Get*",
          "es:List*",
          "es:Describe*",
          "es:ESHttpGet",
          "es:ESHttpDelete",
          "es:ESHttpPost",
          "es:ESHttpPut",
        ],
        resources: [`${elasticSearch.attrArn}/*`],
      })
    );
    esEncryptionKey.grantEncryptDecrypt(apiProcessor);

    // API
    const api = new apigateway.LambdaRestApi(
      this,
      this.resourceName("DUSAPI"),
      {
        handler: apiProcessor,
        proxy: false,
        deployOptions: {
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: false,
        },
      }
    );

    const reqValidator = new apigateway.RequestValidator(
      this,
      this.resourceName("apigwResourceValidator"),
      {
        restApi: api,
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    const authorizer = new apigateway.CfnAuthorizer(this, "Authorizer", {
      identitySource: "method.request.header.Authorization",
      name: "Authorization",
      type: "COGNITO_USER_POOLS",
      providerArns: [textractUserPool.attrArn],
      restApiId: api.restApiId,
    });

    function addCorsOptionsAndMethods(
      apiResource: apigateway.IResource | apigateway.Resource,
      methods: string[] | []
    ) {
      const options = apiResource.addMethod(
        "OPTIONS",
        new apigateway.MockIntegration({
          integrationResponses: [
            {
              statusCode: "200",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Headers":
                  "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                "method.response.header.Access-Control-Allow-Origin": "'*'",
                "method.response.header.Access-Control-Allow-Credentials":
                  "'false'",
                "method.response.header.Access-Control-Allow-Methods":
                  "'OPTIONS,GET,PUT,POST,DELETE'",
              },
            },
          ],
          passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
          requestTemplates: {
            "application/json": '{"statusCode": 200}',
          },
        }),
        {
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
                "method.response.header.Access-Control-Allow-Origin": true,
              },
            },
          ],
          requestValidator: reqValidator,
        }
      );

      methods.forEach((method) => {
        apiResource.addMethod(method, undefined, {
          authorizationType: apigateway.AuthorizationType.COGNITO,
          authorizer: {
            authorizerId: `${authorizer.ref}`,
          },
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

    cognitoPolicy.addStatements(
      new iam.PolicyStatement({
        actions: ["execute-api:Invoke"],
        resources: [api.arnForExecuteApi()],
        effect: iam.Effect.ALLOW,
      })
    );
  }
}
