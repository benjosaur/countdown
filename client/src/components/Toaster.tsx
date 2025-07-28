import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
        },
        success: {
          duration: 3000,
          style: {
            background: "var(--background)",
            border: "1px solid var(--success)",
          },
        },
        error: {
          duration: 5000,
          style: {
            background: "var(--background)",
            border: "1px solid var(--destructive)",
          },
        },
      }}
    />
  );
}
