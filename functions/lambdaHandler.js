const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

// create a new aws dynamodb document client
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = "rtb-case-studies";
const itemsPath = "/items";
const itemPath = "/items/{proxy+}";
const helloapi = "/hello";


exports.handler = async function (event) {
    //console.log('request event: ',  event);
    console.log('[handler] event.httpMethod: ', event.httpMethod);
    console.log('[handler] event.path: ', event.path);
    // extract the id from the proxy instead of event.pathParameters.id
    //console.log('[handler] event.pathParameters.proxy: ', event.pathParameters.proxy);
    console.log('[handler] event.resource: ', event.resource);

    let response;

    switch (true) {

        case event.httpMethod === 'GET' && event.resource === itemsPath:
            console.log('[handler] switch: GET && ', event.path);
            response = await getItems();
            console.log('response ', response);
            break;
        case event.httpMethod === 'GET' && event.resource === itemPath:
            console.log('[handler] switch: GET && ', event.path);
            response = await getItem(event.pathParameters.proxy);
            break;
        case event.httpMethod === 'POST' && event.path === helloapi:
            console.log('[handler] switch: POST && ', event.path)
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
    console.log('[getItems] allItems: ', allItems);
    return allItems;
}

async function getItem(id) {
    const params = {
        TableName: dynamodbTableName,
        Key: {'itemId': id}
    }
    return  dynamodb.get(params).promise().then(response => {
            console.log('[getItem] dynamodb.get(params): ', params.Key, response, response.Item)
            let res = response.Item;
            console.log('res', res)
            return res;
        },
        (error) => {
            console.error('error: ', error);
        });
}

async function hello() {
    console.log('[hello]')
    const response = 'Hello, Runtime Blog API!'
    return response;
}


const buildResponse = (statusCode, body) => {
    console.log('[build response] statusCode, body: ', statusCode, body);
    return {
        statusCode: statusCode,
        headers: {
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Origin': '*',
        },

        body: JSON.stringify(body)
    }

}
