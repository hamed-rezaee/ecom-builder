import { create } from 'zustand';

let counter = 0;

export const useToastStore = create((set) => ({
  toasts: [],
  push: (message, opts = {}) => {
    const id = ++counter;
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id, message, type: opts.type ?? 'info', action: opts.action },
      ],
    }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      opts.action ? 6000 : 3500,
    );
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (message, opts) =>
  useToastStore.getState().push(message, opts);
