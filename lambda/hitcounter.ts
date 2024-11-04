
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

exports.handler = async function (event: any) {
    // initialize DynamoDB client
    const dynamodb = new DynamoDBClient({});
    // initialize Lambda client
    const lambda = new LambdaClient({});

    try {
        // update dynamoDB entry for 'path' with hits++
        await dynamodb.send(new UpdateItemCommand({
            TableName: process.env.HITS_TABLE_NAME,
            Key: { path: { S: event.path } },
            UpdateExpression: 'ADD hits :incr',
            ExpressionAttributeValues: { ':incr': { N: '1' } }
        }));
    } catch (error) {
        console.error("Error updating DynamoDB", error);
        throw error;
    }

    let Payload;
    try {
        const command = new InvokeCommand({
            FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
            Payload: JSON.stringify(event),
        });
        ({ Payload } = await lambda.send(command));
    } catch (error) {
        console.error("Error invoking Lambda function", error);
        throw error;
    }

    // Check if Payload exists before parsing
    if (Payload) {
        // Convert the base64 Payload to a Buffer
        const payloadBuffer = Buffer.from(Payload, "base64");

        // Convert the Buffer to a string
        const payloadString = payloadBuffer.toString();

        // Parse the string into a JSON object
        const payloadJson = JSON.parse(payloadString);

        return payloadJson;
    } else {
        console.error("No payload received from Lambda function");
        throw new Error("No payload received from Lambda function");
    }
}