import { create } from 'zustand';

// Tracks whether the latest edits are written to localStorage.
export const useSaveStatus = create(() => ({ status: 'saved', savedAt: null }));

export const setSaveStatus = (status) =>
  useSaveStatus.setState(
    status === 'saved' ? { status, savedAt: Date.now() } : { status },
  );
