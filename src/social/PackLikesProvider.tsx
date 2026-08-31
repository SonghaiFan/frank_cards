import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthProvider";
import { getSupabaseClient, isSupabaseConfigured } from "../data/supabase/client";

interface PackLikeState {
  count: number;
  liked: boolean;
}

interface PackLikesContextValue {
  getLikeState: (packId: string) => PackLikeState;
  isWorking: (packId: string) => boolean;
  toggleLike: (packId: string) => Promise<void>;
}

interface PackLikesProviderProps {
  children: ReactNode;
  onRequireAuth: () => void;
  packIds: string[];
}

const EMPTY_LIKE_STATE: PackLikeState = { count: 0, liked: false };
const PackLikesContext = createContext<PackLikesContextValue | null>(null);

export function PackLikesProvider({ children, onRequireAuth, packIds }: PackLikesProviderProps) {
  const { status, user } = useAuth();
  const [summary, setSummary] = useState<Record<string, PackLikeState>>({});
  const [workingIds, setWorkingIds] = useState<Set<string>>(() => new Set());
  const packIdsKey = packIds.join("|");
  const stablePackIds = useMemo(() => Array.from(new Set(packIds)), [packIdsKey]);

  useEffect(() => {
    if (!isSupabaseConfigured() || stablePackIds.length === 0) {
      setSummary({});
      return;
    }

    let cancelled = false;
    getSupabaseClient()
      .then((client) => client.rpc("get_pack_like_summary", { requested_pack_ids: stablePackIds }))
      .then(({ data, error }) => {
        if (error) throw error;
        if (cancelled) return;
        const nextSummary: Record<string, PackLikeState> = {};
        for (const item of data ?? []) {
          nextSummary[item.pack_id] = {
            count: Number(item.like_count),
            liked: item.liked_by_user,
          };
        }
        setSummary(nextSummary);
      })
      .catch(() => {
        if (!cancelled) setSummary({});
      });

    return () => {
      cancelled = true;
    };
  }, [stablePackIds, status, user?.id]);

  const getLikeState = useCallback((packId: string): PackLikeState => (
    summary[packId] ?? EMPTY_LIKE_STATE
  ), [summary]);

  const isWorking = useCallback((packId: string): boolean => workingIds.has(packId), [workingIds]);

  const toggleLike = useCallback(async (packId: string) => {
    if (status !== "authenticated" || !user) {
      onRequireAuth();
      return;
    }
    if (workingIds.has(packId)) return;

    const previous = summary[packId] ?? EMPTY_LIKE_STATE;
    const optimistic = {
      count: Math.max(0, previous.count + (previous.liked ? -1 : 1)),
      liked: !previous.liked,
    };

    setWorkingIds((current) => new Set(current).add(packId));
    setSummary((current) => ({ ...current, [packId]: optimistic }));

    try {
      const client = await getSupabaseClient();
      const result = previous.liked
        ? await client.from("pack_likes").delete().eq("user_id", user.id).eq("pack_id", packId)
        : await client.from("pack_likes").insert({ user_id: user.id, pack_id: packId });
      if (result.error) throw result.error;
    } catch (likeError) {
      setSummary((current) => ({ ...current, [packId]: previous }));
      throw likeError;
    } finally {
      setWorkingIds((current) => {
        const next = new Set(current);
        next.delete(packId);
        return next;
      });
    }
  }, [onRequireAuth, status, summary, user, workingIds]);

  const value = useMemo<PackLikesContextValue>(() => ({
    getLikeState,
    isWorking,
    toggleLike,
  }), [getLikeState, isWorking, toggleLike]);

  return <PackLikesContext.Provider value={value}>{children}</PackLikesContext.Provider>;
}

export function usePackLikes(): PackLikesContextValue {
  const context = useContext(PackLikesContext);
  if (!context) throw new Error("usePackLikes must be used within PackLikesProvider.");
  return context;
}
