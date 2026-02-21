"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue>({
  confirm: () => Promise.resolve(false),
});

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = (result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-2xl shadow-black/40">
            <div className="mb-3 flex items-center gap-2.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${options.destructive ? "bg-red-500/10" : "bg-accent/10"}`}>
                <AlertTriangle className={`h-4 w-4 ${options.destructive ? "text-red-400" : "text-accent"}`} />
              </div>
              <h3 className="text-sm font-semibold">
                {options.title ?? "Confirm"}
              </h3>
            </div>
            <p className="mb-5 text-sm text-muted">{options.message}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleClose(false)}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:bg-card-hover hover:text-foreground"
              >
                {options.cancelLabel ?? "Cancel"}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white transition ${
                  options.destructive
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-accent hover:bg-accent-light"
                }`}
              >
                {options.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
