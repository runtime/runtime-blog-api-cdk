const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
import { v4 as uuidv4 } from 'uuid';

// create a new aws dynamodb document client
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = "rtb-case-studies";
const itemsPath = "/items";
const itemPath = "/items/{proxy+}";
const helloapi = "/hello";

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`
const DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;


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
        case event.httpMethod === 'POST' && event.path === itemsPath:
            console.log('[handler] switch: POST && ', event.path)
            response = await createItem();
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
async function createItem(event) {
    if (!event.body) {
        return { statusCode: 400, body: 'invalid request, you are missing the parameter body' };
    }
    const item = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
    item['itemId'] = uuidv4();
    const params = {
        TableName: dynamodbTableName,
        Item: item
    };

    try {
        await dynamodb.put(params);
        return { statusCode: 201, body: '' };
    } catch (dbError) {
        const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
            RESERVED_RESPONSE : DYNAMODB_EXECUTION_ERROR;
        return { statusCode: 500, body: errorResponse };
    }
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
