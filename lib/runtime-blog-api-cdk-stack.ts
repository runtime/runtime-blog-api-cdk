import * as cdk from 'aws-cdk-lib';
import { IResource, LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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
      removalPolicy: RemovalPolicy.DESTROY, // change for production to preserve db
    });


    const nodejsFunctionProps: NodejsFunctionProps = {
        bundling: {
          externalModules: [
            'aws-sdk',
          ],
        },
        depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
          environment: {
          PRIMARY_KEY: 'itemId',
          TABLE_NAME:runtimeBlogDB.tableName,
    },
    runtime: Runtime.NODEJS_20_X,

  }
    // create a lambda function that access the dynamodb table above and has permissions to read, write, update and delete
      // old

    // const lambdaRuntimeBlogAPIFunction = new lambda.Function(this, 'rtbLambdaFunc', {
    //   runtime: lambda.Runtime.NODEJS_20_X,
    //   code: lambda.Code.fromAsset('functions'),
    //   handler: 'function.handler',
    //   // role: iam.Role.fromRoleArn(this, 'lambda-apigateway-policy', 'arn:aws:iam::926079816406:policy/lambda-apigateway-policy'),
    //   environment: {
    //     DDB_TABLE_NAME: runtimeBlogDB.tableName
    //   }
    // });


    // new
    const lambdaRTBFunction = new NodejsFunction(this, 'lambdaRuntimeBlogAPIFunction', {
        entry: join(__dirname, 'functions', 'lambdaHandler.ts'),
      ...nodejsFunctionProps,
    };


    // const lambdaRuntimeBlogAPIFunction.role?.addManagedPolicy(
    //     //iam.ManagedPolicy.fromAwsManagedPolicyName('lambda-apigateway-policy')
    // )
  // attach read write policy
    //runtimeBlogDB.grantReadWriteData(lambdaRuntimeBlogAPIFunction)
    runtimeBlogDB.grantReadWriteData(lambdaRTBFunction);

    // integrate lambda functions with the api gateway resource
    const lambdaFunctionIntegration = new api.LambdaIntegration(lambdaRTBFunction);

    // const helloLambda = new lambda.Function(this, 'helloLambda', {
    //   runtime: lambda.Runtime.NODEJS_20_X,
    //   code: lambda.Code.fromAsset('functions'),
    //   handler: 'hello.handler',
    // }

    // create an api gateway that uses the lambda handler above as a method to GET and GET by itemId
    const runtimeBlogAPI = new api.RestApi(this, 'rtbAPI', {
      restApiName: 'Items Service'
      // if you want to manage binary types, uncomment the following
      // binaryMediaTypes; ["*/*"],
    });

    //routes
    const items = api.root.addResource('items');
    items.addMethod('GET', lambdaFunctionIntegration);
    addCorsOptions(items);

    const singleItem = items.addResource('{itemId}');
    singleItem.addMethod('GET', lambdaFunctionIntegration);
    addCorsOptions(singleItem);



    // const item = items.addResource('{itemId}
    // runtimeBlogAPI.root
    //     .resourceForPath('items')
    //     .addMethod('GET', new api.LambdaIntegration(lambdaRuntimeBlogAPIFunction));
    //
    // runtimeBlogAPI.root
    //     .resourceForPath('items/{itemId}')
    //     .addMethod('GET', new api.LambdaIntegration(lambdaRuntimeBlogAPIFunction));
    //
    // runtimeBlogAPI.root
    //     .resourceForPath('hello')
    //     .addMethod('POST', new api.LambdaIntegration(lambdaRuntimeBlogAPIFunction));
    export function addCorsOptions(apiResource: IResource) {
      apiResource.addMethod('OPTIONS', new MockIntegration({
        // In case you want to use binary media types, uncomment the following line
        // contentHandling: ContentHandling.CONVERT_TO_TEXT,
        integrationResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Credentials': "'false'",
            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
          },
        }],
        // In case you want to use binary media types, comment out the following line
        passthroughBehavior: PassthroughBehavior.NEVER,
        requestTemplates: {
          "application/json": "{\"statusCode\": 200}"
        },
      }), {
        methodResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        }]
      })
    }
    new cdk.CfnOutput(this, 'HTTP API Url', {
      value: runtimeBlogAPI.url ?? 'Something went wrong with the deploy'
    });


  }
}



