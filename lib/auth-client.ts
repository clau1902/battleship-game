"use client";

import { createAuthClient } from "better-auth/client";
import { useState, useEffect } from "react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut } = authClient;

// Custom useSession hook
export function useSession() {
  const [session, setSession] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const result = await authClient.getSession();
        setSession(result.data);
      } catch (error) {
        setSession(null);
      } finally {
        setIsPending(false);
      }
    };

    fetchSession();
  }, []);

  return { data: session, isPending };
}
