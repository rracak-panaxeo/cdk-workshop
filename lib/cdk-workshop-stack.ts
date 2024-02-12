import { Stack, StackProps, aws_lambda, aws_apigateway } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HitCounter } from './hitcounter';

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // defines AWS Lambda resource
    const hello = new aws_lambda.Function(this, 'HelloHandler', {
      runtime: aws_lambda.Runtime.NODEJS_16_X, // execution environment
      code: aws_lambda.Code.fromAsset('lambda'), // code loaded from the "lambda" directory
      handler: 'hello.handler' // file is "hello", function is "handler"
    });

    const helloWithCounter = new HitCounter(this, 'HelloHitCounter', { downstream: hello });

    // defines an API Gateway REST API resource backed by our "hello" function.
    const apiGateway = new aws_apigateway.LambdaRestApi(this, 'Endpoint', { handler: helloWithCounter.handler });
  }
}
