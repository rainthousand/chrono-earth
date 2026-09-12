"use client";

interface JourneyTransitionProps {
  journeyTitle: string;
  englishTitle: string;
  chapterIndex: number;
  chapterCount: number;
  yearLabel: string;
  placeName: string;
  chapterTitle: string;
}

export default function JourneyTransition({
  journeyTitle,
  englishTitle,
  chapterIndex,
  chapterCount,
  yearLabel,
  placeName,
  chapterTitle,
}: JourneyTransitionProps) {
  return (
    <div className="journey-transition" aria-hidden="true">
      <div className="journey-transition__line" />
      <p>{englishTitle}</p>
      <span>{String(chapterIndex + 1).padStart(2, "0")} / {String(chapterCount).padStart(2, "0")}</span>
      <strong>{yearLabel}</strong>
      <h2>{placeName}</h2>
      <h3>{chapterTitle}</h3>
      <small>{journeyTitle} · CONTINUE THROUGH TIME</small>
    </div>
  );
}
