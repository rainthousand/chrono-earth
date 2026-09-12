"use client";

import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useModalFocus(
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  active = true,
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return;
    const modal = containerRef.current;
    if (!modal) return;
    const previousFocus = document.activeElement as HTMLElement | null;

    const focusable = () =>
      Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.getClientRects().length > 0,
      );

    const focusFrame = window.requestAnimationFrame(() => {
      const activeElement = document.activeElement;
      if (!activeElement || !modal.contains(activeElement)) {
        const preferredFocus = modal.querySelector<HTMLElement>(
          "[data-modal-autofocus]",
        );
        (preferredFocus ?? focusable()[0] ?? modal).focus();
      }
    });

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        modal.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    modal.addEventListener("keydown", handleKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      modal.removeEventListener("keydown", handleKey);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [active, containerRef]);
}
