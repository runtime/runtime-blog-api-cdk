const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

// create a new aws dynamodb document client
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = "rtb-case-studies";
const itemsPath = "/items";
const itemPath = "/items/{id}";
const helloapi = "/hello";


exports.handler = async function (event) {
    // console.log('request event: ',  event);
    // console.log('event.httpMethod: ', event.httpMethod);
    // console.log('event.path: ', event.path);
    // console.log('event.resource: ', event.resource);

    let response;

    switch (true) {

        case event.httpMethod === 'GET' && event.path === itemsPath:
            //console.log('switch(items) : ', event.path === itemsPath);
            response = await getItems();
            break;
        case event.httpMethod === 'GET' && event.resource === itemPath:
            //console.log('switch(item): ', event.pathParameters.id);
            response = await getItem(event.pathParameters.id);
            break;
        case event.httpMethod === 'POST' && event.path === helloapi:
            response = await hello();
            break;
        default:
            response = buildResponse(404, '404 Not Found');

    }
    return buildResponse(200, response)
};

async function getItems() {
    const params = {
        TableName: dynamodbTableName
    };
    // create a scan of all documents in the table
    const allItems = await dynamodb.scan(params).promise()
    console.log('allItems: ', allItems);
    return allItems;
}

async function getItem(id) {

    const params = {
        TableName: dynamodbTableName,
        Key: {'itemId': id}
    }
    return  dynamodb.get(params).promise().then(response => {
            //console.log('dynamodb.get(params): ', params.Key)
            let res = response.Item;
            //console.log('res', res)
            return res;
        },
        (error) => {
            console.error('error: ', error);
        });
}

async function hello() {
    let res = {
        message: 'Hello'
    };
    return res.message;
}

const buildResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
            "Access-Control-Allow-Origin": "*",
        },

        body: JSON.stringify(body)
    }
}

