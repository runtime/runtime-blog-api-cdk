import * as cdk from 'aws-cdk-lib';
import { IResource, LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as api from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path'

export class RuntimeBlogApiCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //create a dynamo db table with a table definition for aws lambda access
    // noted items id is the name of the table so this should have been runtime blog
    const runtimeBlogDB = new dynamodb.Table(this, 'items', {
      partitionKey: {
        name: 'itemId',
        type: dynamodb.AttributeType.STRING
      },
      tableName: 'rtb-case-studies',
      removalPolicy: RemovalPolicy.RETAIN, // change for production to preserve db
    });

    const nodejsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk',
        ],
      },
      depsLockFilePath: join(__dirname, '../package-lock.json'),
      environment: {
        PRIMARY_KEY: 'itemId',
        TABLE_NAME: runtimeBlogDB.tableName,
      },
      runtime: Runtime.NODEJS_16_X,
    }
    // create a lambda function that access the dynamodb table above and has permissions to read, write, update and delete
    const lambdaRTBFunction = new NodejsFunction(this, 'handler', {
      entry: join(__dirname, '../functions', 'lambdaHandler.js'),
      ...nodejsFunctionProps,
    });

    // attach read write policy
    // one handler
    runtimeBlogDB.grantReadWriteData(lambdaRTBFunction);

    // add more lambdas to decouple tasks
    // runtimeBlogDB.grantReadWriteData(getOneLambda);
    // runtimeBlogDB.grantReadWriteData(createOneLambda);
    // runtimeBlogDB.grantReadWriteData(updateOneLambda);
    // runtimeBlogDB.grantReadWriteData(deleteOneLambda);

    // integrate lambda functions with the api gateway resource
    const lambdaFunctionIntegration = new api.LambdaIntegration(lambdaRTBFunction);

    // create an api gateway that uses the lambda handler above as a method to GET and GET by itemId
    const runtimeBlogAPI = new api.RestApi(this, 'rtbAPI', {
      restApiName: 'rtb-items-service',
      description: 'AWS CDK IaC for API Gateway, DynamoDB with Lambda Proxy integration',
      deployOptions: {
        stageName: 'prod',
      },
      // if you want to manage binary types, uncomment the following
      // binaryMediaTypes; ["*/*"],
    });

    //attach the integration(s) to the api
    const rootMethod = runtimeBlogAPI.root.addMethod(
        'ANY',
        lambdaFunctionIntegration
    );
   // root.addMethod('ANY', lambdaFunctionIntegration);
    addCorsOptions(runtimeBlogAPI.root);

    const items = runtimeBlogAPI.root.addResource('items');
    items.addMethod('ANY', lambdaFunctionIntegration);
    addCorsOptions(items);

    // const singleItem = items.addResource('{proxy+}')
    // singleItem.addMethod('GET', lambdaFunctionIntegration);
    // addCorsOptions(singleItem);

    const proxy = items.addProxy({
      anyMethod: true,
      defaultMethodOptions: {
        authorizationType: api.AuthorizationType.NONE,
        requestParameters: {
          'method.request.path.proxy': true
        }
      }
    });
    proxy.addMethod('GET', lambdaFunctionIntegration);
    addCorsOptions(proxy);

    // const helloApi = root.addResource('hello');
    // helloApi.addMethod('POST', lambdaFunctionIntegration);
    // addCorsOptions(helloApi);

    new cdk.CfnOutput(this, 'HTTP API Url', {
      value: runtimeBlogAPI.url ?? 'Something went wrong with the deploy'
    });

  }
}


export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod('OPTIONS', new MockIntegration({
    // In case you want to use binary media types, uncomment the following line
    // contentHandling: ContentHandling.CONVERT_TO_TEXT,
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
      // In case you want to use binary media types, comment out the following line
      passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
      requestTemplates: {
        "application/json": "{\"statusCode\": 200}"
      },

  }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        },
    }]
  })
}