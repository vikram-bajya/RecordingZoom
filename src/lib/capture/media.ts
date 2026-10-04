export const MAX_SCREENSHOTS = 20;
export const LIVE_CHUNK_MS = 12_000;

export type CaptureHandle = {
  stream: MediaStream;
  video: HTMLVideoElement;
  kind: "display" | "mic";
  stop: () => Promise<void>;
};

function pickMime(): string | undefined {
  const types = [
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/webm;codecs=opus",
    "audio/webm",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  if (typeof MediaRecorder === "undefined") return undefined;
  return types.find((t) => MediaRecorder.isTypeSupported(t));
}

function audioStreamFrom(stream: MediaStream): MediaStream {
  const tracks = stream.getAudioTracks();
  return new MediaStream(tracks.length ? tracks : stream.getTracks());
}

function recorderFrom(stream: MediaStream): {
  recorder: MediaRecorder | null;
  chunks: Blob[];
} {
  const mime = pickMime();
  const chunks: Blob[] = [];
  try {
    const recorder = mime
      ? new MediaRecorder(audioStreamFrom(stream), {
          mimeType: mime,
          audioBitsPerSecond: 24_000,
        })
      : new MediaRecorder(audioStreamFrom(stream), { audioBitsPerSecond: 24_000 });
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.start(1000);
    return { recorder, chunks };
  } catch {
    return { recorder: null, chunks };
  }
}

function stopRecorder(recorder: MediaRecorder | null): Promise<void> {
  return new Promise((resolve) => {
    if (!recorder || recorder.state === "inactive") {
      resolve();
      return;
    }
    recorder.onstop = () => resolve();
    try {
      recorder.stop();
    } catch {
      resolve();
    }
  });
}

function startChunkedAudio(
  stream: MediaStream,
  options?: { onAudioChunk?: (blob: Blob) => void; chunkMs?: number },
): { stop: () => Promise<void> } {
  const chunkMs = options?.chunkMs ?? LIVE_CHUNK_MS;
  let active = recorderFrom(stream);
  let rotateTimer: number | null = null;
  let rotating = false;

  const flush = async (restart: boolean) => {
    if (rotating) return;
    rotating = true;
    const { recorder, chunks } = active;
    await stopRecorder(recorder);
    if (chunks.length) {
      const blob = new Blob(chunks, { type: recorder?.mimeType || "audio/webm" });
      if (blob.size > 800) options?.onAudioChunk?.(blob);
    }
    if (restart && stream.active) {
      active = recorderFrom(stream);
    } else {
      active = { recorder: null, chunks: [] };
    }
    rotating = false;
  };

  rotateTimer = window.setInterval(() => {
    void flush(true);
  }, chunkMs);

  return {
    stop: async () => {
      if (rotateTimer) window.clearInterval(rotateTimer);
      rotateTimer = null;
      await flush(false);
    },
  };
}

function bindVideo(stream: MediaStream): HTMLVideoElement {
  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  void video.play().catch(() => undefined);
  return video;
}

export async function startDisplayCapture(options?: {
  onAudioChunk?: (blob: Blob) => void;
  chunkMs?: number;
}): Promise<CaptureHandle> {
  const constraints = {
    video: {
      frameRate: 8,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    preferCurrentTab: false,
    selfBrowserSurface: "exclude",
    systemAudio: "include",
    surfaceSwitching: "include",
    monitorTypeSurfaces: "include",
  } as DisplayMediaStreamOptions;

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia(constraints);
  } catch (err) {
    if (err instanceof DOMException && err.name === "NotSupportedError") {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    } else {
      throw err;
    }
  }

  const video = bindVideo(stream);
  const chunks = startChunkedAudio(stream, options);

  return {
    stream,
    video,
    kind: "display",
    stop: async () => {
      await chunks.stop();
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
  };
}

export async function startMicCapture(options?: {
  onAudioChunk?: (blob: Blob) => void;
  chunkMs?: number;
}): Promise<CaptureHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });
  const video = document.createElement("video");
  const chunks = startChunkedAudio(stream, options);
  return {
    stream,
    video,
    kind: "mic",
    stop: async () => {
      await chunks.stop();
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}

export function startLevelMonitor(
  stream: MediaStream,
  onLevel: (value: number) => void,
): () => void {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx || stream.getAudioTracks().length === 0) {
    return () => undefined;
  }
  const ctx = new AudioCtx();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  src.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  let raf = 0;
  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = (data[i]! - 128) / 128;
      sum += v * v;
    }
    onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
    raf = requestAnimationFrame(tick);
  };
  tick();
  return () => {
    cancelAnimationFrame(raf);
    try {
      src.disconnect();
    } catch {
      /* already closed */
    }
    void ctx.close().catch(() => undefined);
  };
}

export function frameToJpeg(
  video: HTMLVideoElement,
  quality = 0.55,
  maxWidth = 960,
): string | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  const scale = Math.min(1, maxWidth / video.videoWidth);
  const w = Math.round(video.videoWidth * scale);
  const h = Math.round(video.videoHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export function sceneScore(
  a: ImageData | null,
  b: ImageData,
): { score: number; next: ImageData } {
  if (!a || a.data.length !== b.data.length) return { score: 1, next: b };
  let diff = 0;
  let n = 0;
  const da = a.data;
  const db = b.data;
  for (let i = 0; i < da.length; i += 64) {
    diff += Math.abs(da[i]! - db[i]!);
    n += 1;
  }
  return { score: n === 0 ? 0 : diff / (n * 255), next: b };
}

export function grabImageData(video: HTMLVideoElement): ImageData | null {
  if (!video.videoWidth) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 90;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, 160, 90);
  return ctx.getImageData(0, 0, 160, 90);
}

export async function framesFromVideoFile(
  file: File,
  count = 4,
): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read that video."));
    });
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (duration <= 0) return [];
    const shots: string[] = [];
    for (let i = 1; i <= count; i += 1) {
      const t = (duration * i) / (count + 1);
      video.currentTime = t;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });
      const jpeg = frameToJpeg(video, 0.55, 960);
      if (jpeg) shots.push(jpeg);
    }
    return shots;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function fileToJpegDataUrl(
  file: File,
  maxWidth = 1100,
  quality = 0.62,
): Promise<string | null> {
  if (file.type.startsWith("video/")) {
    const frames = await framesFromVideoFile(file, 1);
    return frames[0] ?? null;
  }
  if (!file.type.startsWith("image/")) return null;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await img.decode();
    const scale = Math.min(1, maxWidth / Math.max(1, img.width));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
