import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { fetchAuthSession } from "aws-amplify/auth";
import toast from "react-hot-toast";
import type { AppRouter } from "shared";
// import toast from "react-hot-toast";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
    mutations: {
      onSuccess: () => {
        toast.success("Records updated");
      },
      onError: (error) => {
        toast.error(
          `Error: ${
            error instanceof Error ? error.message : "Something went wrong"
          }`
        );
      },
    },
  },
});

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url:
        import.meta.env.MODE == "production"
          ? import.meta.env.VITE_API_URL!
          : "http://localhost:3001/trpc",
      headers: async () => {
        try {
          const session = await fetchAuthSession();
          const accessToken = session.tokens?.accessToken?.toString();
          return {
            authorization: accessToken ? `Bearer ${accessToken}` : "",
          };
        } catch (error) {
          return {};
        }
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
