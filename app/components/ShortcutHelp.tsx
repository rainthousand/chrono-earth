"use client";

import { useRef } from "react";

import { useModalFocus } from "../hooks/useModalFocus";

export default function ShortcutHelp({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  useModalFocus(dialogRef, onClose);
  const shortcuts = [["⌘ / Ctrl + K", "打开探索中心"], ["G", "回到全球视野"], ["V", "原声档案馆"], ["J", "诗性历史旅程"], ["O", "文明观测台"], ["F", "切换专注模式"], ["?", "显示或关闭快捷键"]];
  return <section ref={dialogRef} tabIndex={-1} className="shortcut-help" role="dialog" aria-modal="true" aria-labelledby="shortcut-title" onKeyDown={(event) => { if (event.key === "?") { event.stopPropagation(); onClose(); } }}><button type="button" className="shortcut-help__backdrop" onClick={onClose} aria-label="关闭快捷键帮助" /><div><header><span>KEYBOARD ATLAS</span><h2 id="shortcut-title">快捷键</h2><button type="button" onClick={onClose} aria-label="关闭快捷键帮助">×</button></header>{shortcuts.map(([key, label]) => <p key={key}><kbd>{key}</kbd><span>{label}</span></p>)}<small>在输入框中输入时，单字母快捷键不会触发。</small></div></section>;
}
