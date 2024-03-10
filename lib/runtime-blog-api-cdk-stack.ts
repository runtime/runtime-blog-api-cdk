import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class RuntimeBlogApiCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //create a dynamo db table with a table definition for aws lambda access
    // noted items id is the name of the table so this should have been runtime blog
    const runtimeBlogDB = new dynamodb.Table(this, 'runtimeBlogCaseStudies', {
      partitionKey: {name: 'itemId', type: dynamodb.AttributeType.STRING},
    });

    // create a lambda function that access the dynamodb table above and has permissions to read, write, update and delete

    const lambdaRuntimeBlogAPIFunction = new lambda.Function(this, 'lambda_function', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda_function'),
      handler: 'lambda.handler',
      environment: {
        DDB_TABLE_NAME: runtimeBlogDB.tableName
      },
    });

    // create permissions for the lambda function to access the dynamo table
    runtimeBlogDB.grantReadWriteData(lambdaRuntimeBlogAPIFunction);

    // create an api gateway that uses the lambda handler above as a method to GET and GET by itemId
    const runtimeBlogAPIg = new apigw.RestApi(this, 'RuntimeBlogAPI-CDK');

    //routes
    runtimeBlogAPIg.root
        .resourceForPath('items')
        .addMethod('GET', new apigw.LambdaIntegration(lambdaRuntimeBlogAPIFunction));

    runtimeBlogAPIg.root
        .resourceForPath('items/{itemId}')
        .addMethod('GET', new apigw.LambdaIntegration(lambdaRuntimeBlogAPIFunction));

    new cdk.CfnOutput(this, 'HTTP API Url', {
      value: runtimeBlogAPIg.url ?? 'Something went wrong with the deploy'
    });


  }
}



