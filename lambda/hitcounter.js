
const { DynamoDB, Lambda } = require('aws-sdk');
// TODO: CommonJS module syntax, change to ES6 module syntax

exports.handler = async function (event) {
    console.log("request:", JSON.stringify(event, undefined, 2));

    // initialize DynamoDB client
    const dynamodb = new DynamoDB();
    // initialize Lambda client
    const lambda = new Lambda();

    // update dynamoDB entry for "path" with hits++
    await dynamodb.updateItem({
        TableName: process.env.HITS_TABLE_NAME,
        Key: { path: { S: event.path } },
        UpdateExpression: 'ADD hits :incr',
        ExpressionAttributeValues: { ':incr': { N: '1' } }
    }).promise();

    const resp = await lambda.invoke({
        FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
        Payload: JSON.stringify(event)
    }).promise();

    console.log('downstream response:', JSON.stringify(resp, undefined, 2));
    console.log('resp payload:', resp.Payload);

    // return response back to upstream caller
    return JSON.parse(resp.Payload);
}