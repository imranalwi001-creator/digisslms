import { useCallback, useState } from "react";
import { toast } from "sonner";

type Messages = {
  /** Text shown while the request is in flight. */
  loading: string;
  /** Text shown when the request succeeds. */
  success: string;
  /** Fallback text when the request fails (server message wins if present). */
  error: string;
};

/**
 * Shared feedback layer for admin CRUD actions:
 * shows a loading toast that resolves into success/error, and exposes a
 * per-action pending key so buttons can show spinners and stay disabled.
 */
export function useAdminAction() {
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const run = useCallback(
    async <T,>(key: string, messages: Messages, action: () => Promise<T>): Promise<T | undefined> => {
      setPendingKey(key);
      const toastId = toast.loading(messages.loading);
      try {
        const result = await action();
        toast.success(messages.success, { id: toastId });
        return result;
      } catch (err: any) {
        toast.error(err?.message ? `${messages.error}: ${err.message}` : messages.error, {
          id: toastId,
          duration: 6000,
        });
        return undefined;
      } finally {
        setPendingKey(null);
      }
    },
    [],
  );

  const isPending = useCallback((key?: string) => (key ? pendingKey === key : pendingKey !== null), [pendingKey]);

  return { run, isPending, pendingKey, busy: pendingKey !== null };
}
