import { ResourcesConfig } from "aws-amplify";

const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || "",
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || "",
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_URL,
          scopes: ["email", "openid", "profile"],
          redirectSignIn: [`${window.location.origin}/`],
          redirectSignOut: [`${window.location.origin}/`],
          responseType: "code",
          providers: ["Google"],
        },
        email: true,
        username: false,
      },
    },
  },
};
export default amplifyConfig;
