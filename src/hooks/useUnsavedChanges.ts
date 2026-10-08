import { useEffect, useId } from 'react';
import { confirmAction } from '@/components/admin/ConfirmDialog';

// Pages with unsaved edits register here, so the admin sidebar can ask
// before navigating away and the browser warns before closing the tab.
const dirtyPages = new Set<string>();

const onBeforeUnload = (e: BeforeUnloadEvent) => {
  if (dirtyPages.size === 0) return;
  e.preventDefault();
  e.returnValue = ''; // required by Chrome to show the prompt
};

/** Marks the calling page as having unsaved changes while `dirty` is true. */
export function useUnsavedChanges(dirty: boolean) {
  const id = useId();
  useEffect(() => {
    if (!dirty) return;
    dirtyPages.add(id);
    if (dirtyPages.size === 1) window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      dirtyPages.delete(id);
      if (dirtyPages.size === 0) window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [dirty, id]);
}

/** Resolves true when it's fine to leave: nothing unsaved, or the user agreed to discard. */
export async function confirmLeave(): Promise<boolean> {
  if (dirtyPages.size === 0) return true;
  return confirmAction('You have unsaved changes on this page. Leave without saving?', {
    title: 'Unsaved changes',
    confirmLabel: 'Leave without saving',
    danger: true,
  });
}
