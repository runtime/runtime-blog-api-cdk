
// const aws = new aws()
// aws.config.update({
//     region: "us-east-1"
// });

const dynamodb = new aws.DynamoDB.DocumentClient();
const dynamodbTableName = "runtimeBlogCaseStudies";
const itemsPath = "/items";
const itemPath = "/items/{id}";
const helloapi = "/hello/";



exports.handler = async function (event) {
    console.log('request event: ',  event);
    let response;
    //true allows && without references
    switch (true) {
        case event.httpMethod === 'GET' && event.path === itemsPath:
            response = await getItems();
            break;
        case event.httpMethod === 'GET' && event.path === itemPath:
            response = await getItem(event.pathParameters.id);
            break;
        case event.httpMethod === 'GET' && event.path === helloapi:
            response = await hello(event.pathParameters.id);
            break;
        default:
            response = buildResponse(404, '404 Not Found');

    }
    return response;
};

function getItems() {
    const params = {
        TableName: dynamodbTableName
    };
    return dynamodb.scan(params).promise().then(response => {
        return response.Items;
    }, error => {
        console.error(error);
    });
}

async function getItem(id) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'itemId': {itemId}
        }
    }
    return await dynamodb.get(params).promise().then(response => {
        return buildResponse(200, response.Item);
    },
        (error) => {
            console.error('error: ', error);
    });
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

