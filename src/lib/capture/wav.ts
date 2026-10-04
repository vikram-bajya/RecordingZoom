function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function mixMono(buffer: AudioBuffer, start: number, length: number): Float32Array {
  const channels = buffer.numberOfChannels;
  const out = new Float32Array(length);
  for (let c = 0; c < channels; c += 1) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i += 1) {
      out[i] = (out[i] ?? 0) + (data[start + i] ?? 0);
    }
  }
  if (channels > 1) {
    for (let i = 0; i < length; i += 1) out[i] = (out[i] ?? 0) / channels;
  }
  return out;
}

function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (toRate >= fromRate) return input;
  const ratio = fromRate / toRate;
  const length = Math.max(1, Math.floor(input.length / ratio));
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let n = 0;
    for (let j = start; j < end; j += 1) {
      sum += input[j] ?? 0;
      n += 1;
    }
    out[i] = n ? sum / n : 0;
  }
  return out;
}

export function encodeWavSlice(
  buffer: AudioBuffer,
  startSec: number,
  endSec: number,
  targetRate = 16_000,
): Blob {
  const start = Math.max(0, Math.floor(startSec * buffer.sampleRate));
  const end = Math.min(buffer.length, Math.floor(endSec * buffer.sampleRate));
  const length = Math.max(0, end - start);
  const mono = mixMono(buffer, start, length);
  const samples = downsample(mono, buffer.sampleRate, targetRate);
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = pcm.length * 2;
  const header = 44;
  const out = new ArrayBuffer(header + bytes);
  const view = new DataView(out);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + bytes, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, bytes, true);
  new Uint8Array(out, header).set(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength));
  return new Blob([out], { type: "audio/wav" });
}

export type AudioSlice = {
  blob: Blob;
  offsetMs: number;
  durationMs: number;
};

const PASSTHROUGH_TYPE =
  /audio\/(wav|x-wav|mpeg|mp3|mp4|aac|flac|ogg|opus|x-m4a|m4a)|video\/mp4/i;
const PASSTHROUGH_EXT = ["wav", "mp3", "mp4", "m4a", "aac", "flac", "ogg", "opus"];

function fileNameOf(file: Blob, fallback: string): string {
  return file instanceof File && file.name ? file.name : fallback;
}

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor();
}

/** xAI STT accepts wav/mp3/mp4/m4a/ogg/opus/flac — not Chrome's default webm. */
export async function prepareAudioForStt(
  file: Blob,
  filename = "session.wav",
): Promise<File> {
  const type = file.type || "";
  const name = fileNameOf(file, filename);
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (PASSTHROUGH_TYPE.test(type) || PASSTHROUGH_EXT.includes(ext)) {
    return file instanceof File ? file : new File([file], name, { type: type || "application/octet-stream" });
  }

  const ctx = audioContext();
  if (!ctx) {
    return file instanceof File ? file : new File([file], name, { type: type || "application/octet-stream" });
  }
  try {
    const raw = await file.arrayBuffer();
    const buffer = await ctx.decodeAudioData(raw.slice(0));
    if (!Number.isFinite(buffer.duration) || buffer.duration <= 0) {
      return file instanceof File ? file : new File([file], name, { type: type || "application/octet-stream" });
    }
    const wav = encodeWavSlice(buffer, 0, buffer.duration);
    const base = name.replace(/\.[^.]+$/, "") || "session";
    return new File([wav], `${base}.wav`, { type: "audio/wav" });
  } catch {
    return file instanceof File ? file : new File([file], name, { type: type || "application/octet-stream" });
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

export async function splitAudioFile(
  file: Blob,
  chunkSec = 90,
): Promise<AudioSlice[] | null> {
  const ctx = audioContext();
  if (!ctx) return null;
  try {
    const raw = await file.arrayBuffer();
    const buffer = await ctx.decodeAudioData(raw.slice(0));
    const duration = buffer.duration;
    if (!Number.isFinite(duration) || duration <= 0) return null;
    const slices: AudioSlice[] = [];
    for (let start = 0; start < duration; start += chunkSec) {
      const end = Math.min(duration, start + chunkSec);
      slices.push({
        blob: encodeWavSlice(buffer, start, end),
        offsetMs: Math.round(start * 1000),
        durationMs: Math.round((end - start) * 1000),
      });
    }
    return slices;
  } catch {
    return null;
  } finally {
    await ctx.close().catch(() => undefined);
  }
}
