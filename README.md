# AWS IaC CDK Serverless api 
## Serverless api in typescript for a cms to serve use cases

Setting up a blog with a Serverless API built using AWS Infrastructure as Code, AWS JS SDK and AWS CDK

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Prereqs
-aws-cli

-aws-cdk 

-nvm [ensure correct version of node]

`Nvm install 20.11.0`

`Nvm use 20.11.0`

`nvm install-latest-npm`

-npm [installs npx since 5.0]


## CLone and Code
-clone repository 

-cd into repository 

-run `npm install` 

if necessary, install them individually from `package.json` 

`"@aws-cdk/aws-apigateway": "^1.204.0",`

`"@aws-cdk/aws-dynamodb": "^1.204.0",`

`"@aws-cdk/aws-lambda": "^1.204.0",`

in the terminal, like so
`npm i @aws-cdk/aws-apigateway`



## Using an IDE
Be sure to install the plugins for aws and aws-cli as well as sam and aws-cdk-lib

whether you are using terminal and CLI or an IDK with the AWS SDK
run locally and/or deploy to aws


## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests

* `cdk bootstap` allows you to authenticate if you don't already have a .aws/credentials
* `cdk deploy`  deploy this stack to your default AWS account/region
* `cdk diff`    compare deployed stack with current state
* `cdk synth`   emits the synthesized CloudFormation template


## USE


####  prod stage
current deploy is from branch: add-post-items


