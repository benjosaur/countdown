import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Database } from "./database";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cognito from "aws-cdk-lib/aws-cognito";

interface InfraStackProps extends cdk.StackProps {
  googleClientId: string;
  googleClientSecret: string;
}

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    const s3CorsRule: s3.CorsRule = {
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
      allowedOrigins: ["*"],
      allowedHeaders: ["*"],
      maxAge: 300,
    };

    //frontend
    const s3Bucket = new s3.Bucket(this, "S3Bucket", {
      bucketName: `countdown-frontend-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      accessControl: s3.BucketAccessControl.PRIVATE,
      cors: [s3CorsRule],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const oai = new cloudfront.OriginAccessIdentity(this, "OAI");
    s3Bucket.grantRead(oai);

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "Distribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: s3Bucket,
              originAccessIdentity: oai,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
                allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD,
              },
            ],
          },
        ],
        errorConfigurations: [
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: "/index.html",
          },
          {
            errorCode: 403,
            responseCode: 200,
            responsePagePath: "/index.html",
          },
        ],
        // Redirect HTTP to HTTPS
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      }
    );

    //user pool
    const userPool = new cognito.UserPool(this, "CountdownUserPool", {
      userPoolName: "countdown-user-pool",
      selfSignUpEnabled: true,
      signInCaseSensitive: false,
      userInvitation: {
        emailSubject: "Your Countdown account has been created",
        emailBody:
          "Hello {username}, Your Countdown account has been created. Your temporary password is: {####}. Please log in and change your password.",
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cognitoDomain = userPool.addDomain("CountdownCognitoDomain", {
      cognitoDomain: {
        domainPrefix: "countdown-auth",
      },
    });

    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
      this,
      "GoogleProvider",
      {
        userPool,
        clientId: props.googleClientId,
        clientSecret: props.googleClientSecret,
        scopes: ["email", "profile", "openid"],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
          familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
        },
      }
    );

    const userPoolClient = new cognito.UserPoolClient(
      this,
      "CountdownUserPoolClient",
      {
        userPool,
        userPoolClientName: "countdown-user-pool-client",
        authFlows: {
          userSrp: true,
          userPassword: true,
          custom: false,
        },
        generateSecret: false,
        preventUserExistenceErrors: true,
        supportedIdentityProviders: [
          cognito.UserPoolClientIdentityProvider.COGNITO,
          cognito.UserPoolClientIdentityProvider.GOOGLE,
        ],
        oAuth: {
          callbackUrls: [
            `https://${distribution.distributionDomainName}`,
            `https://${distribution.distributionDomainName}/dashboard`,
          ],
          logoutUrls: [`https://${distribution.distributionDomainName}/`],
          flows: {
            authorizationCodeGrant: true,
          },
          scopes: [
            cognito.OAuthScope.EMAIL,
            cognito.OAuthScope.OPENID,
            cognito.OAuthScope.PROFILE,
            cognito.OAuthScope.COGNITO_ADMIN,
          ],
        },
      }
    );

    userPoolClient.node.addDependency(googleProvider);

    //databases
    const prodDatabase = new Database(this, "CountdownTable", {
      tableName: "Countdown",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    //backend
    const trpcLambda = new lambda.Function(this, "TrpcApiFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../server/dist"),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        FRONTEND_URL: `https://${distribution.distributionDomainName}`,
      },
    });

    prodDatabase.table.grantReadWriteData(trpcLambda);

    const api = new apigateway.RestApi(this, "TrpcApi", {
      restApiName: "TRPC API",
      description: "API for TRPC backend",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(trpcLambda);

    const trpcResource = api.root.addResource("trpc");

    trpcResource.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    //FE deployment
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [
        s3deploy.Source.asset("../client/dist"),
        s3deploy.Source.data(
          "config.json",
          JSON.stringify({
            apiUrl: api.url,
          })
        ),
      ],
      destinationBucket: s3Bucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });

    new cdk.CfnOutput(this, "CognitoCloudFrontURL", {
      value: cognitoDomain.cloudFrontEndpoint,
      description: "Endpoint for Hosted Cognito UI",
    });

    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: distribution.distributionDomainName,
      description: "CloudFront Distribution URL",
    });
  }
}
