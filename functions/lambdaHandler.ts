const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

// create a new aws dynamodb document client
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = "runtimeBlogCaseStudies";
const itemsPath = "/items";
const itemPath = "/items/{id}";
const helloapi = "/hello";


//create a new dynamodb document client
//const dynamodb = new AWS.DynamoDB.DocumentClient();
//const dynamodbTableName = "runtimeBlogCaseStudies";


exports.handler = async function (event) {
    console.log('request event: ',  event);
    let response;
    console.log('event.httpMethod: ', event.httpMethod);
    console.log('event.path: ', event.path);
    // //true allows && without references
    switch (true) {
        case event.httpMethod === 'GET' && event.path === itemsPath:
            response = await getItems();
            console.log('event.httpMethod response : ', response);
            break;
        case event.httpMethod === 'GET' && event.path === itemPath:
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
    //buildResponse(200, {allItems.Items})
}

async function getItem(id) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'itemId': {id}
        }
    }
    return  dynamodb.get(params).promise().then(response => {
            return buildResponse(200, response.Item);
        },
        (error) => {
            console.error('error: ', error);
        });
}

async function hello() {
    return  buildResponse(200, {message: `Hello`});
}




const buildResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }
}

