import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';

export interface HitCounterProps {
    downstream: lambda.IFunction;
    /**
   * The read capacity units for the table
   *
   * Must be greater than 5 and lower than 20
   *
   * @default 5
   */
    readCapacity?: number;
}

export class HitCounter extends Construct {
    public readonly handler: lambda.Function;
    public readonly hitsTable: dynamodb.Table; // this is a property of the HitCounter class, not the handler function. This is because the table needs to be created before the handler function is created. This is a limitation of CDK. We can't create the table and the handler function in the same CDK

    constructor(scope: Construct, id: string, props: HitCounterProps) {
        if (props.readCapacity !== undefined && (props.readCapacity < 5 || props.readCapacity > 20)) {
            throw new Error('readCapacity must be greater than 5 and less than 20');
        }

        super(scope, id);

        // DynamoDB table with path as the partition key
        this.hitsTable = new dynamodb.Table(this, 'Hits', {
            partitionKey: { name: 'path', type: dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.DESTROY, // this is to make sure that the table is destroyed when the stack is destroyed. This is useful for development and testing, but not for production.
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            readCapacity: props.readCapacity ?? 5
        })

        // Lambda function which is bound to the lambda/hitcounter.handler code.
        this.handler = new lambda.Function(this, 'HitCounterHandler', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'hitcounter.handler',
            code: lambda.Code.fromAsset('lambda'), // tells the CDK to look for the code in a local directory named 'lambda' within your project.
            environment: {
                DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
                HITS_TABLE_NAME: this.hitsTable.tableName
            }
        });

        // grant the lambda role read/write permissions to our table
        this.hitsTable.grantReadWriteData(this.handler);

        // grant the lambda role invoke permissions to the downstream function
        props.downstream.grantInvoke(this.handler);
    }
}