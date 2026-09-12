"use client";

import styles from "./FirstExploreGuide.module.css";

interface FirstExploreGuideProps {
  step: number;
  onStepChange: (step: number) => void;
  onDismiss: () => void;
  onFindPlace: () => void;
  onReadHistory: () => void;
  onExploreTimeline: () => void;
}

const STEPS = [
  { title: "先转一转地球", description: "拖动地球，靠近你感兴趣的文明。也可以直接搜索地点。", action: "去找一个地点" },
  { title: "选择一个文明坐标", description: "点击地球上的金色光点；聚合坐标可以继续放大，也可以搜索地点名称。", action: "搜索地点" },
  { title: "看看这里发生过什么", description: "地点档案里的「纪年」记录了历史事件。选一条，读读它的故事。", action: "查看纪年" },
  { title: "让时间向前或向后", description: "拖动底部时间轴，观察世界如何变化。键盘也可以用方向键调整年份。", action: "去拨动时间轴" },
] as const;

/** A single non-modal hint: the globe, toolbar, and timeline remain operable. */
export default function FirstExploreGuide({
  step,
  onStepChange,
  onDismiss,
  onFindPlace,
  onReadHistory,
  onExploreTimeline,
}: FirstExploreGuideProps) {
  const currentStep = Math.min(STEPS.length - 1, Math.max(0, step));
  const content = STEPS[currentStep];
  const actions = [() => onStepChange(1), onFindPlace, onReadHistory, onExploreTimeline];

  return (
    <aside className={styles.guide} aria-label="第一次探索提示">
      <header className={styles.header}>
        <span>第一次探索 · {currentStep + 1} / {STEPS.length}</span>
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="关闭探索提示，不再自动显示">跳过</button>
      </header>
      <div aria-live="polite" aria-atomic="true">
        <h2 className={styles.title}>{content.title}</h2>
        <p className={styles.description}>{content.description}</p>
      </div>
      <footer className={styles.footer}>
        <span className={styles.progress} aria-hidden="true">
          {STEPS.map((item, index) => <i key={item.title} className={index <= currentStep ? styles.visited : undefined} />)}
        </span>
        <button type="button" className={styles.action} onClick={actions[currentStep]}>{content.action}<span aria-hidden="true"> →</span></button>
      </footer>
    </aside>
  );
}
