import useSWR from "swr";

import { fetcher } from "@/lib/fetcher";
import { type SafeUser } from "@/lib/auth";

export function useCurrentUser() {
  const { data, isLoading } = useSWR<SafeUser | null>(
    "/api/auth/me",
    fetcher
  );
  return { user: data ?? null, isLoading };
}
