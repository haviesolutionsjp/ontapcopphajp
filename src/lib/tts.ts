// Web Speech API TTS (ja-JP). Free, runs in browser.
let jaVoice: SpeechSynthesisVoice | null = null;

// Ưu tiên các giọng Nhật chất lượng cao có sẵn trên các hệ điều hành phổ biến
const PREFERRED_VOICE_HINTS = [
  "Google 日本語",
  "Google Japanese",
  "Microsoft Nanami",
  "Microsoft Ayumi",
  "Microsoft Haruka",
  "Microsoft Ichiro",
  "Microsoft Sayaka",
  "Kyoko",
  "Otoya",
  "O-ren",
  "Hattori",
];

function scoreVoice(v: SpeechSynthesisVoice): number {
  let s = 0;
  if (v.lang === "ja-JP") s += 10;
  else if (v.lang.toLowerCase().startsWith("ja")) s += 5;
  else return -1;
  const name = v.name || "";
  const idx = PREFERRED_VOICE_HINTS.findIndex((h) =>
    name.toLowerCase().includes(h.toLowerCase()),
  );
  if (idx >= 0) s += 100 - idx;
  // Local/native voices thường mượt hơn remote
  // @ts-ignore - localService có trên hầu hết trình duyệt
  if (v.localService) s += 20;
  // Tránh các giọng "compact" / "eloquence" chất lượng thấp
  if (/compact|eloquence|novelty/i.test(name)) s -= 30;
  return s;
}

function pickJaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  if (jaVoice) return jaVoice;
  const voices = window.speechSynthesis.getVoices();
  const ja = voices
    .map((v) => ({ v, s: scoreVoice(v) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s);
  jaVoice = ja[0]?.v ?? null;
  return jaVoice;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    jaVoice = null;
    pickJaVoice();
  };
  // Trigger load
  window.speechSynthesis.getVoices();
}

// Thêm khoảng nghỉ tự nhiên ở dấu câu để đọc đỡ "máy móc"
function addNaturalPauses(text: string): string {
  return text
    .replace(/、/g, "、 ")
    .replace(/。/g, "。 ")
    .replace(/？/g, "？ ")
    .replace(/！/g, "！ ")
    .replace(/\s+/g, " ")
    .trim();
}

export function speakJa(text: string, rate = 0.8) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(addNaturalPauses(text));
  u.lang = "ja-JP";
  // Tốc độ chậm vừa phải, pitch hơi thấp cho tự nhiên hơn
  u.rate = Math.max(0.5, Math.min(1.2, rate));
  u.pitch = 1.0;
  u.volume = 1.0;
  const v = pickJaVoice();
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

export function stopSpeak() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
