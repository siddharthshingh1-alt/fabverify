"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChatMessage, Conversation, OrderCard } from "../types";
import { PILL_CLASSES } from "../types";

type PreviewPhoto = {
  url: string;
  caption: string;
  markProduction: boolean;
};

const TIER_LABELS = {
  gold: "Gold Verified ✓",
  silver: "Silver Verified ✓",
  bronze: "Bronze Verified ✓",
} as const;

export default function ChatWindow({
  conversation,
  onBack,
  canMarkProductionUpdate,
  orders,
  ordersBasePath,
  profileBasePath,
  newOrderPath,
}: {
  conversation: Conversation;
  onBack: () => void;
  canMarkProductionUpdate: boolean;
  orders: OrderCard[];
  ordersBasePath: string;
  profileBasePath: string;
  newOrderPath: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(conversation.messages);
  const [inputText, setInputText] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<PreviewPhoto | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const contactOrders = orders.filter((o) => o.conversationId === conversation.id);
  const profileHref = `${profileBasePath}/${conversation.id}`;

  const takePhotoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimeRef = useRef(0);
  const playingAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      playingAudioRef.current?.pause();
    };
  }, []);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, kind: "sent", text: trimmed, time: "Just now", read: false },
    ]);
    setInputText("");
  };

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setSheetOpen(false);
    if (!file) return;
    setPreviewPhoto({ url: URL.createObjectURL(file), caption: "", markProduction: true });
  };

  const handleDocumentChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setSheetOpen(false);
    if (!file) return;
    setMessages((prev) => [
      ...prev,
      { id: `local-doc-${Date.now()}`, kind: "sent", text: `📄 ${file.name}`, time: "Just now", read: false },
    ]);
  };

  const handleSendPhoto = () => {
    if (!previewPhoto) return;
    const verified = canMarkProductionUpdate && previewPhoto.markProduction;
    setMessages((prev) => [
      ...prev,
      {
        id: `local-photo-${Date.now()}`,
        kind: "sent",
        time: "Just now",
        read: false,
        photo: {
          caption: previewPhoto.caption.trim() || undefined,
          verified,
          geoNote: verified ? "Geo-verified · production update" : undefined,
          dataUrl: previewPhoto.url,
        },
      },
    ]);
    setPreviewPhoto(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setMessages((prev) => [
            ...prev,
            {
              id: `local-voice-${Date.now()}`,
              kind: "sent",
              time: "Just now",
              read: false,
              voice: { audioUrl: url, duration: recordingTimeRef.current },
            },
          ]);
        }

        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        audioChunksRef.current = [];
        recordingTimeRef.current = 0;
        setRecordingTime(0);
      };

      // Collect data every 100ms so a chunk is always available even if the
      // final flush on stop() races with (or is dropped before) onstop.
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      recordingTimeRef.current = 0;
      setRecordingTime(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
      }, 1000);
    } catch {
      alert("Please allow microphone access to send voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    audioChunksRef.current = [];
  };

  const togglePlayVoice = (id: string, url: string) => {
    if (playingId === id) {
      playingAudioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    playingAudioRef.current?.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    playingAudioRef.current = audio;
    audio.play();
    setPlayingId(id);
  };

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-border-dark bg-card px-3">
        <button type="button" aria-label="Back" onClick={onBack} className="text-2xl text-text-secondary">
          ←
        </button>
        <button
          type="button"
          onClick={() => setShowProfile(true)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {conversation.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-text-primary">{conversation.name}</p>
            {conversation.orderLabel && (
              <p className="truncate text-[11px] text-text-secondary">{conversation.orderLabel}</p>
            )}
          </div>
        </button>
      </div>

      <div className="hide-scrollbar flex-1 overflow-y-auto px-4 py-3">
        <div className="mx-auto mb-3 w-fit rounded-full bg-card px-3 py-1 text-[11px] text-text-secondary">
          Today
        </div>

        {messages.map((message) => {
          if (message.kind === "system") {
            return (
              <p key={message.id} className="mb-3 text-center text-[11px] italic text-text-secondary">
                {message.text}
              </p>
            );
          }

          const isSent = message.kind === "sent";

          if (message.photo) {
            return (
              <div
                key={message.id}
                className={`mb-2.5 flex flex-col ${isSent ? "items-end" : "items-start"}`}
              >
                {message.photo.verified && (
                  <span className="mb-1 text-[10px] font-semibold text-primary">✓ Verified</span>
                )}
                {message.photo.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={message.photo.dataUrl}
                    alt={message.photo.caption ?? "Shared photo"}
                    className={`max-w-[200px] rounded-lg object-cover ${message.photo.verified ? "border border-primary" : ""}`}
                  />
                ) : (
                  <div
                    className={`flex h-[150px] w-[200px] items-center justify-center rounded-lg bg-card text-3xl ${message.photo.verified ? "border border-primary" : ""}`}
                  >
                    📷
                  </div>
                )}
                {message.photo.caption && (
                  <p className="mt-1 max-w-[200px] text-xs text-text-secondary">{message.photo.caption}</p>
                )}
                {message.photo.verified && message.photo.geoNote && (
                  <p className="text-[10px] font-semibold text-green-400">✓ {message.photo.geoNote}</p>
                )}
                <span className="mt-1 text-[10px] text-text-secondary">{message.time}</span>
              </div>
            );
          }

          if (message.voice) {
            const isPlaying = playingId === message.id;
            return (
              <div
                key={message.id}
                className={`mb-2.5 flex flex-col ${isSent ? "items-end" : "items-start"}`}
              >
                <div
                  className={`flex w-[220px] max-w-[75%] items-center gap-2.5 px-3 py-2 ${
                    isSent
                      ? "rounded-bl-xl rounded-br-xl rounded-tl-xl rounded-tr-[4px] bg-[#1a3a5c]"
                      : "rounded-bl-xl rounded-br-xl rounded-tl-[4px] rounded-tr-xl bg-card"
                  }`}
                >
                  <button
                    type="button"
                    aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
                    onClick={() => togglePlayVoice(message.id, message.voice!.audioUrl)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-navy"
                  >
                    {isPlaying ? "⏸" : "▶"}
                  </button>
                  <div className="h-0.5 flex-1 rounded-full bg-primary/50" />
                  <span className="shrink-0 text-[11px] text-text-secondary">
                    {Math.floor(message.voice.duration / 60)}:
                    {String(message.voice.duration % 60).padStart(2, "0")}
                  </span>
                </div>
                <span className="mt-1 text-[10px] text-text-secondary">
                  {message.time}
                  {isSent && message.read ? " ✓✓" : ""}
                </span>
              </div>
            );
          }

          return (
            <div key={message.id} className={`mb-2.5 flex flex-col ${isSent ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[75%] px-3 py-2 text-sm text-text-primary ${
                  isSent
                    ? "rounded-bl-xl rounded-br-xl rounded-tl-xl rounded-tr-[4px] bg-[#1a3a5c]"
                    : "rounded-bl-xl rounded-br-xl rounded-tl-[4px] rounded-tr-xl bg-card"
                }`}
              >
                {message.text}
              </div>
              <span className="mt-1 text-[10px] text-text-secondary">
                {message.time}
                {isSent && message.read ? " ✓✓" : ""}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex h-[56px] shrink-0 items-center gap-2 border-t border-border-dark bg-card px-3">
        {isRecording ? (
          <div className="flex flex-1 items-center gap-3">
            <span className="pulse-dot h-2 w-2 shrink-0 rounded-full bg-[#e34948]" />
            <span className="shrink-0 text-sm font-semibold text-[#e34948]">
              Recording {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
            </span>
            <span className="flex-1 text-xs text-text-secondary">Release to send</span>
            <button
              type="button"
              aria-label="Cancel recording"
              onClick={cancelRecording}
              className="shrink-0 text-xl text-text-secondary"
            >
              ✕
            </button>
            <button
              type="button"
              aria-label="Stop and send recording"
              onMouseUp={stopRecording}
              onTouchEnd={stopRecording}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e34948] text-base text-white"
            >
              🎤
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              aria-label="Attach photo"
              onClick={() => setSheetOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-dark bg-background text-base"
            >
              📷
            </button>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Message..."
              className="h-10 flex-1 rounded-[20px] border border-border-dark bg-background px-3.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
            />
            {inputText.trim() ? (
              <button
                type="button"
                aria-label="Send message"
                onClick={handleSend}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base text-navy"
              >
                ➤
              </button>
            ) : (
              <button
                type="button"
                aria-label="Hold to record a voice message"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-dark bg-background text-base text-text-secondary"
              >
                🎤
              </button>
            )}
          </>
        )}
      </div>

      {/* capture="environment" is a hint the mobile OS/browser may still
          override with its own picker (notably inconsistent on iOS Safari);
          this is the correct, and only, way to request the camera from a
          web page. */}
      <input
        ref={takePhotoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChosen}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChosen}
      />
      <input ref={documentInputRef} type="file" className="hidden" onChange={handleDocumentChosen} />

      {sheetOpen && (
        <div
          className="absolute inset-0 z-30 flex flex-col justify-end bg-black/50"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="rounded-t-2xl bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => takePhotoInputRef.current?.click()}
              className="mb-2 flex h-[52px] w-full items-center gap-3 rounded-[10px] border border-border-dark bg-background px-4"
            >
              <span className="text-xl">📷</span>
              <span className="text-[15px] text-text-primary">Take Photo</span>
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="mb-2 flex h-[52px] w-full items-center gap-3 rounded-[10px] border border-border-dark bg-background px-4"
            >
              <span className="text-xl">🖼</span>
              <span className="text-[15px] text-text-primary">Choose from Gallery</span>
            </button>
            <button
              type="button"
              onClick={() => documentInputRef.current?.click()}
              className="mb-2 flex h-[52px] w-full items-center gap-3 rounded-[10px] border border-border-dark bg-background px-4"
            >
              <span className="text-xl">📄</span>
              <span className="text-[15px] text-text-primary">Send Document</span>
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-1 w-full text-center text-sm text-text-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {previewPhoto && (
        <div className="absolute inset-0 z-[9999] flex flex-col bg-background">
          <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border-dark bg-card px-4">
            <button
              type="button"
              aria-label="Cancel photo"
              onClick={() => setPreviewPhoto(null)}
              className="text-2xl text-text-secondary"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={handleSendPhoto}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy"
            >
              Send Photo
            </button>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewPhoto.url}
            alt="Preview"
            className="min-h-0 w-full flex-1 object-contain"
          />

          <div className="shrink-0 bg-card p-4">
            <input
              value={previewPhoto.caption}
              onChange={(e) => setPreviewPhoto((p) => (p ? { ...p, caption: e.target.value } : p))}
              placeholder="Add a caption..."
              className="h-10 w-full rounded-lg border border-border-dark bg-background px-3.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
            />

            {canMarkProductionUpdate && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-text-primary">📍 Mark as production update</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={previewPhoto.markProduction}
                  aria-label="Mark as production update"
                  onClick={() =>
                    setPreviewPhoto((p) => (p ? { ...p, markProduction: !p.markProduction } : p))
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    previewPhoto.markProduction ? "bg-primary" : "bg-border-dark"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      previewPhoto.markProduction ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleSendPhoto}
              className="mt-3 h-11 w-full rounded-lg bg-primary text-sm font-bold text-navy"
            >
              Send →
            </button>
          </div>
        </div>
      )}

      {showProfile && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/50"
            onClick={() => setShowProfile(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[9999] mx-auto max-h-[85vh] w-full max-w-[480px] overflow-y-auto rounded-t-[20px] border-t border-border-dark bg-card pb-8">
            <div className="relative">
              <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border-dark" />
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowProfile(false)}
                className="absolute right-4 top-3 text-xl text-text-secondary"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 px-4 pt-3">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                {conversation.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-base font-bold text-text-primary">{conversation.name}</p>
                  {conversation.verificationTier && (
                    <span className="shrink-0 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {TIER_LABELS[conversation.verificationTier]}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-text-secondary">
                  {conversation.city && <span>{conversation.city}</span>}
                  {conversation.fabscore !== undefined && (
                    <span className="font-semibold text-primary">⭐ {conversation.fabscore}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    router.push(profileHref);
                  }}
                  className="mt-1 text-xs font-semibold text-primary"
                >
                  View Full Profile →
                </button>
              </div>
            </div>

            <div className="my-4 h-px bg-border-dark" />

            <p className="mb-2 px-4 text-sm font-bold text-text-primary">Orders with {conversation.name}</p>

            {contactOrders.length === 0 ? (
              <p className="px-4 py-4 text-center text-[13px] italic text-text-secondary">
                No active orders with {conversation.name}
              </p>
            ) : (
              contactOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    router.push(`${ordersBasePath}/${order.id}`);
                  }}
                  className="mx-4 mb-2 block w-[calc(100%-32px)] rounded-lg border border-border-dark bg-background p-3.5 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-text-primary">{order.style}</p>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${PILL_CLASSES[order.statusPill.color]}`}
                    >
                      {order.statusPill.label}
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border-dark">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(0, order.progress))}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-primary">
                      {order.stageLabel} · {order.progress}%
                    </span>
                    <span className="text-[11px] text-text-secondary">{order.dueLabel}</span>
                  </div>
                </button>
              ))
            )}

            <div className="mt-4 flex gap-2 px-4">
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="h-9 flex-1 rounded-full border border-primary text-xs font-semibold text-primary"
              >
                💬 Chat
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  router.push(newOrderPath);
                }}
                className="h-9 flex-1 rounded-full bg-primary text-xs font-semibold text-navy"
              >
                📦 New Order →
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  router.push(profileHref);
                }}
                className="h-9 flex-1 rounded-full border border-border-dark text-xs font-semibold text-text-secondary"
              >
                ⭐ View Profile
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
