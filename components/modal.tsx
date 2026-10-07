"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

type ModalProps = {
  children: ReactNode;
  /** Focused after the dialog opens. Defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  labelledBy: string;
  onClose: () => void;
  /** Focused when the dialog closes. Defaults to whatever had focus when it opened. */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

// Native <dialog> opened with showModal(): the browser traps focus, closes on Escape
// and renders it in the top layer. Mount it only while open. The full-screen dialog
// box is transparent; clicking it outside the panel closes it, like the old overlay.
// The backdrop uses literal values because older browsers do not pass :root
// variables to ::backdrop.
export function Modal({ children, initialFocusRef, labelledBy, onClose, returnFocusRef }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressStartedOnBackdrop = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const returnFocusTarget = returnFocusRef?.current ?? (document.activeElement as HTMLElement | null);
    const handleClose = () => onCloseRef.current();

    dialog.addEventListener("close", handleClose);
    if (!dialog.open) dialog.showModal();
    initialFocusRef?.current?.focus();

    return () => {
      dialog.removeEventListener("close", handleClose);
      if (dialog.open) dialog.close();
      if (returnFocusTarget?.isConnected) returnFocusTarget.focus();
    };
  }, [initialFocusRef, returnFocusRef]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-center justify-center overflow-y-auto border-0 bg-transparent p-0 px-4 text-[var(--foreground)] open:flex backdrop:bg-[rgba(0,0,0,0.4)] backdrop:backdrop-blur-[8px]"
      onMouseDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        // Only a press that starts and ends outside the panel closes, so dragging a
        // text selection out of an input doesn't dismiss the dialog.
        if (pressStartedOnBackdrop.current && e.target === e.currentTarget) {
          onCloseRef.current();
        }
        pressStartedOnBackdrop.current = false;
      }}
    >
      {children}
    </dialog>
  );
}
