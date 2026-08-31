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
import type { ProfileRow } from "../data/supabase/database.types";

export type AuthStatus = "disabled" | "loading" | "anonymous" | "authenticated";
export type UserProfile = Pick<ProfileRow, "id" | "display_name" | "avatar_url" | "created_at" | "updated_at">;

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  error: string | null;
  isWorking: boolean;
  isPasswordRecovery: boolean;
  isAdmin: boolean;
  profile: UserProfile | null;
  profileError: string | null;
  isProfileLoading: boolean;
  isProfileWorking: boolean;
  clearError: () => void;
  clearProfileError: () => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<boolean>;
  resendSignupConfirmation: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  finishPasswordRecovery: () => void;
  updateProfile: (displayName: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
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
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileWorking, setIsProfileWorking] = useState(false);

  useEffect(() => {
    if (!configured) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    getSupabaseClient()
      .then(async (client) => {
        if (cancelled) return;

        const { data: listener } = client.auth.onAuthStateChange((event, nextSession) => {
          if (cancelled) return;
          setSession(nextSession);
          setStatus(nextSession ? "authenticated" : "anonymous");
          if (event === "PASSWORD_RECOVERY") setIsPasswordRecovery(true);
          if (event === "SIGNED_OUT") setIsPasswordRecovery(false);
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

  useEffect(() => {
    const userId = session?.user.id;
    if (!configured || !userId) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;
    getSupabaseClient()
      .then((client) => client.rpc("is_current_user_topic_admin"))
      .then(({ data, error: adminError }) => {
        if (adminError) throw adminError;
        if (!cancelled) setIsAdmin(data === true);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });

    return () => {
      cancelled = true;
    };
  }, [configured, session?.user.id]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!configured || !userId) {
      setProfile(null);
      setProfileError(null);
      setIsProfileLoading(false);
      return;
    }

    let cancelled = false;
    setIsProfileLoading(true);
    setProfileError(null);

    getSupabaseClient()
      .then(async (client) => {
        const { data, error: profileLoadError } = await client
          .from("profiles")
          .select("id, display_name, avatar_url, created_at, updated_at")
          .eq("id", userId)
          .maybeSingle();
        if (profileLoadError) throw profileLoadError;

        if (data) return data;

        const { data: createdProfile, error: profileCreateError } = await client
          .from("profiles")
          .insert({ id: userId })
          .select("id, display_name, avatar_url, created_at, updated_at")
          .single();
        if (profileCreateError) throw profileCreateError;
        return createdProfile;
      })
      .then((nextProfile) => {
        if (!cancelled) setProfile(nextProfile);
      })
      .catch((profileLoadError) => {
        if (!cancelled) setProfileError(readableAuthError(profileLoadError));
      })
      .finally(() => {
        if (!cancelled) setIsProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [configured, session?.user.id]);

  const clearError = useCallback(() => setError(null), []);
  const clearProfileError = useCallback(() => setProfileError(null), []);

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

  const resendSignupConfirmation = useCallback(async (email: string) => {
    if (!configured) {
      setError("Accounts have not been connected yet.");
      return;
    }

    setIsWorking(true);
    setError(null);
    try {
      const client = await getSupabaseClient();
      const { error: resendError } = await client.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (resendError) throw resendError;
    } catch (resendError) {
      setError(readableAuthError(resendError));
      throw resendError;
    } finally {
      setIsWorking(false);
    }
  }, [configured]);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!configured) {
      setError("Accounts have not been connected yet.");
      return;
    }

    setIsWorking(true);
    setError(null);
    try {
      const client = await getSupabaseClient();
      const { error: resetError } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
    } catch (resetError) {
      setError(readableAuthError(resetError));
      throw resetError;
    } finally {
      setIsWorking(false);
    }
  }, [configured]);

  const updatePassword = useCallback(async (password: string) => {
    if (!configured) {
      setError("Accounts have not been connected yet.");
      return;
    }

    setIsWorking(true);
    setError(null);
    try {
      const client = await getSupabaseClient();
      const { error: updateError } = await client.auth.updateUser({ password });
      if (updateError) throw updateError;
    } catch (updateError) {
      setError(readableAuthError(updateError));
      throw updateError;
    } finally {
      setIsWorking(false);
    }
  }, [configured]);

  const finishPasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false);
    setError(null);
  }, []);

  const updateProfile = useCallback(async (displayName: string) => {
    const userId = session?.user.id;
    const normalizedName = displayName.trim();
    if (!configured || !userId || !normalizedName) return;

    setIsProfileWorking(true);
    setProfileError(null);
    try {
      const client = await getSupabaseClient();
      const { data, error: profileUpdateError } = await client
        .from("profiles")
        .update({ display_name: normalizedName.slice(0, 80) })
        .eq("id", userId)
        .select("id, display_name, avatar_url, created_at, updated_at")
        .single();
      if (profileUpdateError) throw profileUpdateError;
      setProfile(data);
    } catch (profileUpdateError) {
      setProfileError(readableAuthError(profileUpdateError));
      throw profileUpdateError;
    } finally {
      setIsProfileWorking(false);
    }
  }, [configured, session?.user.id]);

  const uploadAvatar = useCallback(async (file: File) => {
    const userId = session?.user.id;
    if (!configured || !userId) return;
    if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
    if (file.size > 2 * 1024 * 1024) throw new Error("Avatar images must be 2 MB or smaller.");

    setIsProfileWorking(true);
    setProfileError(null);
    try {
      const client = await getSupabaseClient();
      const avatarPath = `${userId}/avatar`;
      const { error: uploadError } = await client.storage
        .from("avatars")
        .upload(avatarPath, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicAvatar } = client.storage.from("avatars").getPublicUrl(avatarPath);
      const avatarUrl = `${publicAvatar.publicUrl}?v=${Date.now()}`;
      const { data, error: profileUpdateError } = await client
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId)
        .select("id, display_name, avatar_url, created_at, updated_at")
        .single();
      if (profileUpdateError) throw profileUpdateError;
      setProfile(data);
    } catch (avatarError) {
      setProfileError(readableAuthError(avatarError));
      throw avatarError;
    } finally {
      setIsProfileWorking(false);
    }
  }, [configured, session?.user.id]);

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
      setIsPasswordRecovery(false);
      setProfile(null);
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
    isPasswordRecovery,
    isAdmin,
    profile,
    profileError,
    isProfileLoading,
    isProfileWorking,
    clearError,
    clearProfileError,
    signInWithPassword,
    signUpWithPassword,
    resendSignupConfirmation,
    requestPasswordReset,
    updatePassword,
    finishPasswordRecovery,
    updateProfile,
    uploadAvatar,
    signOut,
  }), [
    clearError,
    clearProfileError,
    error,
    finishPasswordRecovery,
    isAdmin,
    isProfileLoading,
    isProfileWorking,
    isWorking,
    isPasswordRecovery,
    requestPasswordReset,
    resendSignupConfirmation,
    session,
    profile,
    profileError,
    signInWithPassword,
    signOut,
    signUpWithPassword,
    status,
    updateProfile,
    uploadAvatar,
    updatePassword,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
