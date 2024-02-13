import { Capture, Template } from "aws-cdk-lib/assertions";
import * as cdk from 'aws-cdk-lib';
import { HitCounter } from "../lib/hitcounter";
import exp = require("constants");

test('DynamoDB table created', () => {
    const stack = new cdk.Stack();

    new HitCounter(stack, 'MyTestConstruct', {
        downstream: new cdk.aws_lambda.Function(stack, 'TestFunction', {
            runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
            handler: 'hello.handler',
            code: cdk.aws_lambda.Code.fromAsset('lambda'),
        }),
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::DynamoDB::Table", 1);
});

test('Lambda has environment variables', () => {
    const stack = new cdk.Stack();

    new HitCounter(stack, 'MyTestConstruct', {
        downstream: new cdk.aws_lambda.Function(stack, 'TestFunction', {
            runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
            handler: 'hello.handler',
            code: cdk.aws_lambda.Code.fromAsset('lambda'),
        }),
    });

    const template = Template.fromStack(stack);
    // Capture the environment variables of the Lambda function
    const envCapture = new Capture();

    // Check if there is the Lambda function and pass the capture object for holding the environment variables
    template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: envCapture,
    });

    expect(envCapture.asObject()).toEqual(
        {
            Variables: {
                DOWNSTREAM_FUNCTION_NAME: {
                    Ref: "TestFunction22AD90FC"
                },
                HITS_TABLE_NAME: {
                    Ref: "MyTestConstructHits24A357F0"
                }
            }
        }
    );
})

test('DynamoDB has encryption', () => {
    const stack = new cdk.Stack();

    new HitCounter(stack, 'MyTestConstruct', {
        downstream: new cdk.aws_lambda.Function(stack, 'TestFunction', {
            runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
            handler: 'hello.handler',
            code: cdk.aws_lambda.Code.fromAsset('lambda'),
        }),
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
            SSEEnabled: true
        }
    });
});


test('DynamoDB table read capacity can be configured', () => {
    const stack = new cdk.Stack();

    expect(() => {
        new HitCounter(stack, 'MyTestConstruct', {
            downstream:  new cdk.aws_lambda.Function(stack, 'TestFunction', {
              runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
              handler: 'hello.handler',
              code: cdk.aws_lambda.Code.fromAsset('lambda')
            }),
            readCapacity: 3
          });
    }).toThrow(/readCapacity must be greater than 5 and less than 20/);
});