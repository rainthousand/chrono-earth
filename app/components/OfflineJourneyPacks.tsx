"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import {
  formatOfflinePackSize,
  OFFLINE_PACK_MESSAGE_TYPES,
  offlineJourneyPacks,
  type OfflineJourneyPack,
} from "../data/offlineJourneyPacks";

type PackPhase = "idle" | "installing" | "removing" | "installed" | "error";

interface PackStatus {
  phase: PackPhase;
  completed: number;
  total: number;
  message?: string;
}

interface WorkerReply {
  type: string;
  packId?: string;
  completed?: number;
  total?: number;
  installedPackIds?: string[];
  message?: string;
}

export interface OfflineJourneyPacksProps {
  className?: string;
  onStartJourney?: (journeyId: string) => void;
}

async function activeServiceWorker(): Promise<ServiceWorker> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("当前浏览器不支持离线旅程");
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.update().catch(() => undefined);

  if (registration.installing) {
    await new Promise<void>((resolve) => {
      const installing = registration.installing;
      const timeout = window.setTimeout(resolve, 10_000);
      installing?.addEventListener(
        "statechange",
        () => {
          if (["installed", "activated", "redundant"].includes(installing.state)) {
            window.clearTimeout(timeout);
            resolve();
          }
        },
        { once: false },
      );
    });
  }

  const worker =
    registration.waiting ?? registration.active ?? navigator.serviceWorker.controller;
  if (!worker) throw new Error("离线服务仍在准备，请稍后重试");
  return worker;
}

async function requestWorker(
  message: Record<string, unknown>,
  onProgress?: (reply: WorkerReply) => void,
): Promise<WorkerReply> {
  const worker = await activeServiceWorker();

  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => {
      channel.port1.close();
      reject(new Error("离线缓存响应超时，请重试"));
    }, 120_000);

    channel.port1.onmessage = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data;
      if (reply.type === OFFLINE_PACK_MESSAGE_TYPES.progress) {
        onProgress?.(reply);
        return;
      }

      window.clearTimeout(timeout);
      channel.port1.close();
      if (reply.type === OFFLINE_PACK_MESSAGE_TYPES.error) {
        reject(new Error(reply.message ?? "离线缓存失败"));
      } else {
        resolve(reply);
      }
    };

    worker.postMessage(message, [channel.port2]);
  });
}

const idleStatus = (): PackStatus => ({ phase: "idle", completed: 0, total: 0 });

export function OfflineJourneyPacks({
  className = "",
  onStartJourney,
}: OfflineJourneyPacksProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [statuses, setStatuses] = useState<Record<string, PackStatus>>({});

  const updateStatus = useCallback((packId: string, status: PackStatus) => {
    setStatuses((current) => ({ ...current, [packId]: status }));
  }, []);

  const refreshInstalled = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      setSupported(false);
      return;
    }

    try {
      const reply = await requestWorker({ type: OFFLINE_PACK_MESSAGE_TYPES.query });
      const installed = new Set(reply.installedPackIds ?? []);
      setStatuses((current) =>
        Object.fromEntries(
          offlineJourneyPacks.map((pack) => [
            pack.id,
            installed.has(pack.id)
              ? { phase: "installed", completed: pack.resources.length, total: pack.resources.length }
              : current[pack.id]?.phase === "error"
                ? current[pack.id]
                : idleStatus(),
          ]),
        ),
      );
      setSupported(true);
    } catch {
      setSupported(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshInstalled(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshInstalled]);

  const installPack = async (pack: OfflineJourneyPack) => {
    updateStatus(pack.id, {
      phase: "installing",
      completed: 0,
      total: pack.resources.length,
    });

    try {
      await requestWorker(
        {
          type: OFFLINE_PACK_MESSAGE_TYPES.install,
          packId: pack.id,
          urls: pack.resources,
        },
        (reply) =>
          updateStatus(pack.id, {
            phase: "installing",
            completed: reply.completed ?? 0,
            total: reply.total ?? pack.resources.length,
          }),
      );
      updateStatus(pack.id, {
        phase: "installed",
        completed: pack.resources.length,
        total: pack.resources.length,
      });
    } catch (error) {
      updateStatus(pack.id, {
        phase: "error",
        completed: 0,
        total: pack.resources.length,
        message: error instanceof Error ? error.message : "下载失败",
      });
    }
  };

  const removePack = async (pack: OfflineJourneyPack) => {
    updateStatus(pack.id, { phase: "removing", completed: 0, total: 0 });
    try {
      await requestWorker({
        type: OFFLINE_PACK_MESSAGE_TYPES.remove,
        packId: pack.id,
      });
      updateStatus(pack.id, idleStatus());
    } catch (error) {
      updateStatus(pack.id, {
        phase: "error",
        completed: 0,
        total: 0,
        message: error instanceof Error ? error.message : "删除失败",
      });
    }
  };

  return (
    <section className={`offline-packs ${className}`.trim()} aria-labelledby="offline-packs-title">
      <header className="offline-packs__header">
        <div>
          <span>OFFLINE EXPEDITIONS</span>
          <h2 id="offline-packs-title">离线历史旅程</h2>
        </div>
        <small>影像与叙事保存在本机，断网后仍可探索</small>
      </header>

      {supported === false ? (
        <p className="offline-packs__notice" role="status">
          离线服务尚未就绪。保持页面打开片刻后重试，在线探索不受影响。
        </p>
      ) : (
        <div className="offline-packs__list" aria-busy={supported === null}>
          {offlineJourneyPacks.map((pack) => {
            const status = statuses[pack.id] ?? idleStatus();
            const isBusy = status.phase === "installing" || status.phase === "removing";
            const progress = status.total ? Math.round((status.completed / status.total) * 100) : 0;

            return (
              <article
                className="offline-pack"
                key={pack.id}
                style={{ "--pack-accent": pack.accent } as CSSProperties}
              >
                <div className="offline-pack__copy">
                  <strong>{pack.title}</strong>
                  <span>{pack.englishTitle}</span>
                  <small>
                    {pack.stopCount} 站 · 约 {formatOfflinePackSize(pack.estimatedBytes)}
                  </small>
                </div>

                {status.phase === "installing" && (
                  <div className="offline-pack__progress" role="status" aria-live="polite">
                    <progress value={status.completed} max={status.total || 1} />
                    <span>{progress}%</span>
                  </div>
                )}

                {status.phase === "error" && (
                  <small className="offline-pack__error" role="alert">{status.message}</small>
                )}

                <div className="offline-pack__actions">
                  {status.phase === "installed" ? (
                    <>
                      {onStartJourney && (
                        <button type="button" onClick={() => onStartJourney(pack.journeyId)}>
                          开始旅程
                        </button>
                      )}
                      <button type="button" onClick={() => void removePack(pack)} disabled={isBusy}>
                        删除离线包
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void installPack(pack)}
                      disabled={isBusy || supported === null}
                    >
                      {status.phase === "removing"
                        ? "正在删除…"
                        : status.phase === "installing"
                          ? "正在下载…"
                          : status.phase === "error"
                            ? "重新下载"
                            : "下载旅程"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default OfflineJourneyPacks;
