import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "../data/supabase/client";

export type AuthStatus = "disabled" | "loading" | "anonymous" | "authenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  error: string | null;
  isWorking: boolean;
  clearError: () => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const readableAuthError = (error: unknown): string => (
  error instanceof Error ? error.message : "Account access is temporarily unavailable."
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(configured ? "loading" : "disabled");
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    if (!configured) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    getSupabaseClient()
      .then(async (client) => {
        if (cancelled) return;

        const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
          if (cancelled) return;
          setSession(nextSession);
          setStatus(nextSession ? "authenticated" : "anonymous");
          setError(null);
        });
        unsubscribe = () => listener.subscription.unsubscribe();

        const { data, error: sessionError } = await client.auth.getSession();
        if (cancelled) return;
        if (sessionError) throw sessionError;

        setSession(data.session);
        setStatus(data.session ? "authenticated" : "anonymous");
      })
      .catch((initializationError) => {
        if (cancelled) return;
        setError(readableAuthError(initializationError));
        setStatus("anonymous");
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [configured]);

  const clearError = useCallback(() => setError(null), []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!configured) {
      setError("Accounts have not been connected yet.");
      return;
    }

    setIsWorking(true);
    setError(null);
    try {
      const client = await getSupabaseClient();
      const { error: signInError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
    } catch (signInError) {
      setError(readableAuthError(signInError));
      throw signInError;
    } finally {
      setIsWorking(false);
    }
  }, [configured]);

  const signUpWithPassword = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!configured) {
      setError("Accounts have not been connected yet.");
      return false;
    }

    setIsWorking(true);
    setError(null);
    try {
      const client = await getSupabaseClient();
      const { data, error: signUpError } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (signUpError) throw signUpError;
      return Boolean(data.session);
    } catch (signUpError) {
      setError(readableAuthError(signUpError));
      throw signUpError;
    } finally {
      setIsWorking(false);
    }
  }, [configured]);

  const signInWithGoogle = useCallback(async () => {
    if (!configured) {
      setError("Accounts have not been connected yet.");
      return;
    }

    setIsWorking(true);
    setError(null);
    try {
      const client = await getSupabaseClient();
      const { error: oauthError } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (oauthError) throw oauthError;
    } catch (oauthError) {
      setError(readableAuthError(oauthError));
      setIsWorking(false);
      throw oauthError;
    }
  }, [configured]);

  const signOut = useCallback(async () => {
    if (!configured) return;

    setIsWorking(true);
    setError(null);
    try {
      const client = await getSupabaseClient();
      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) throw signOutError;
      setSession(null);
      setStatus("anonymous");
    } catch (signOutError) {
      setError(readableAuthError(signOutError));
      throw signOutError;
    } finally {
      setIsWorking(false);
    }
  }, [configured]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user: session?.user ?? null,
    session,
    error,
    isWorking,
    clearError,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    signOut,
  }), [
    clearError,
    error,
    isWorking,
    session,
    signInWithGoogle,
    signInWithPassword,
    signOut,
    signUpWithPassword,
    status,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
