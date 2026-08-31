"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** Lets any console page use TanStack Query (the mock CrmProvider doesn't
 * wire one up) without pulling every screen onto it at once. */
export function ConsoleQueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
