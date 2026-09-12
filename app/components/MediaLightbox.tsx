"use client";

import { useRef } from "react";

import { useModalFocus } from "../hooks/useModalFocus";

export interface LightboxMedia {
  imageUrl: string;
  caption: string;
  credit: string;
  year: number | null;
  creator?: string;
  sourceUrl?: string;
  license?: string;
  licenseUrl?: string;
}

interface MediaLightboxProps {
  media: LightboxMedia;
  placeName: string;
  onClose: () => void;
}

function formatMediaYear(year: number | null) {
  if (year === null) return "年代未标注";
  return year < 0 ? `公元前 ${Math.abs(year)} 年` : `公元 ${year} 年`;
}

export default function MediaLightbox({
  media,
  placeName,
  onClose,
}: MediaLightboxProps) {
  const dialogRef = useRef<HTMLElement>(null);
  useModalFocus(dialogRef, onClose);

  return (
    <section
      ref={dialogRef}
      tabIndex={-1}
      className="media-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-lightbox-title"
    >
      <div className="media-lightbox-shutter" aria-hidden="true" />
      <button
        className="media-lightbox-close"
        type="button"
        onClick={onClose}
        aria-label="关闭历史影像"
      >
        <span>关闭</span> ×
      </button>
      <div className="media-lightbox-index" aria-hidden="true">
        ARCHIVE IMAGE · 01
      </div>
      <figure>
        {/* Local archive media is rendered at its full available resolution. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.imageUrl} alt={media.caption} />
        <figcaption>
          <p>{formatMediaYear(media.year)}</p>
          <h2 id="media-lightbox-title">{placeName}</h2>
          <blockquote>{media.caption}</blockquote>
          <div className="media-lightbox-credit">
            <span>
              <small>IMAGE CREDIT</small>
              <b>{media.creator ?? media.credit}</b>
            </span>
            {media.license && (
              <span>
                <small>LICENSE</small>
                {media.licenseUrl ? (
                  <a href={media.licenseUrl} target="_blank" rel="noreferrer">
                    {media.license}
                  </a>
                ) : (
                  <b>{media.license}</b>
                )}
              </span>
            )}
            {media.sourceUrl && (
              <a
                className="media-lightbox-source"
                href={media.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                查看原始档案 ↗
              </a>
            )}
          </div>
        </figcaption>
      </figure>
    </section>
  );
}
