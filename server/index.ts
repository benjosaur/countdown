import { awsLambdaRequestHandler } from "@trpc/server/adapters/aws-lambda";
import { prodAppRouter } from "./trpc/prod/router";
import { createLambdaContext } from "./trpc/prod/context";
import dotenv from "dotenv";
import type { User } from "shared";

export const TEST_USER: User = {
  sub: process.env.DEV_SUB!,
  email: process.env.DEV_EMAIL!,
  firstName: process.env.DEV_FIRST_NAME!,
  lastName: process.env.DEV_LAST_NAME!,
};

dotenv.config();

export const handler = awsLambdaRequestHandler({
  router: prodAppRouter,
  createContext: createLambdaContext,
  responseMeta() {
    return {
      headers: {
        "Access-Control-Allow-Origin": process.env.FRONTEND_URL,
        "Access-Control-Allow-Methods": "GET,POST",
        "Access-Control-Allow-Headers": "authorization",
      },
    };
  },
});

// ESBUILD_DEPLOY_STOP

import cors from "cors";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { localAppRouter } from "./trpc/local/router";
import { createExpressContext } from "./trpc/local/context";

const app = express();
const port = process.env.PORT || 3001;

app.use(
  cors({
    origin: [process.env.CLIENT_URL || "http://localhost:5173", "*"],
    credentials: true,
  })
);

app.use(express.json());

app.use(
  "/trpc",
  createExpressMiddleware({
    router: localAppRouter,
    createContext: createExpressContext,
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

if (!(process.env.NODE_ENV == "production")) {
  startServer();
}
// */
