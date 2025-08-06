import { RemovalPolicy } from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface DatabaseProps {
  readonly tableName: string;
  readonly removalPolicy?: RemovalPolicy;
}

export class Database extends Construct {
  public readonly table: Table;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    this.table = new Table(this, "CountdownTable", {
      tableName: props.tableName,
      partitionKey: {
        name: "pK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sK",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.removalPolicy ?? RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      deletionProtection: false, // change
    });
  }
}
