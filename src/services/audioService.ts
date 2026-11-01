import { AUDIO_SPRITES } from '../data/sprites';

class AudioService {
  private ctx: AudioContext | null = null;
  private maleBuffer: AudioBuffer | null = null;
  private femaleBuffer: AudioBuffer | null = null;
  private currentVoice: 'female' | 'male' = 'female';
  private voiceSpeed: number = 1.0;
  private isMuted: boolean = false;
  private isSoundFxMuted: boolean = false;
  private spriteMap = new Map<string, { startSec: number; durationSec: number }>();
  private isLoading = false;

  // Active audio source node tracking to prevent overlapping speech
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGainNode: GainNode | null = null;

  constructor() {
    this.buildSpriteMap();
  }

  private buildSpriteMap() {
    for (const item of AUDIO_SPRITES) {
      const info = {
        startSec: item.startMs / 1000,
        durationSec: item.durationMs / 1000,
      };
      this.spriteMap.set(item.kana, info);
      for (const r of item.romaji) {
        this.spriteMap.set(r.toLowerCase(), info);
      }
    }
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setVoice(voice: 'female' | 'male') {
    this.currentVoice = voice;
  }

  public setVoiceSpeed(speed: number) {
    this.voiceSpeed = Math.max(0.5, Math.min(2.0, speed));
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAllAudio();
    }
  }

  public setSoundFxMuted(muted: boolean) {
    this.isSoundFxMuted = muted;
  }

  /**
   * Immediately stops any currently playing kana voice, sprite, or speech synthesis
   */
  public stopAllAudio(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // ignore
      }
      this.currentSource = null;
    }
    if (this.currentGainNode) {
      try {
        this.currentGainNode.disconnect();
      } catch {
        // ignore
      }
      this.currentGainNode = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  public async preloadAudio(): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const ctx = this.initContext();

      const audioEl = document.createElement('audio');
      const canOpus =
        audioEl.canPlayType('audio/ogg; codecs="opus"') || audioEl.canPlayType('audio/opus');
      const ext = canOpus ? 'opus' : 'm4a';

      const [fData, mData] = await Promise.all([
        fetch(`/voices/kana_f.${ext}`).then((r) => r.arrayBuffer()).catch(() => null),
        fetch(`/voices/kana_m.${ext}`).then((r) => r.arrayBuffer()).catch(() => null),
      ]);

      if (fData) {
        ctx.decodeAudioData(fData, (buf) => {
          this.femaleBuffer = buf;
        });
      }
      if (mData) {
        ctx.decodeAudioData(mData, (buf) => {
          this.maleBuffer = buf;
        });
      }
    } catch (e) {
      console.warn('Audio preloading failed, will fallback to SpeechSynthesis:', e);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Plays native audio sprite for a kana character or romaji syllable,
   * guaranteeing no overlapping with previously playing voice audio.
   */
  public playKana(characterOrRomaji: string): void {
    if (this.isMuted) return;

    // Stop previous voice playback before starting new one
    this.stopAllAudio();

    const ctx = this.initContext();
    const cleanKey = characterOrRomaji.trim();
    const sprite = this.spriteMap.get(cleanKey) || this.spriteMap.get(cleanKey.toLowerCase());
    const activeBuffer = this.currentVoice === 'male' ? this.maleBuffer : this.femaleBuffer;

    if (sprite && activeBuffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = activeBuffer;
        source.playbackRate.value = this.voiceSpeed;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(1.0, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.onended = () => {
          if (this.currentSource === source) {
            this.currentSource = null;
            this.currentGainNode = null;
          }
        };

        this.currentSource = source;
        this.currentGainNode = gainNode;

        source.start(0, sprite.startSec, sprite.durationSec);
        return;
      } catch (err) {
        console.warn('Web Audio sprite playback error, falling back to speech synthesis:', err);
      }
    }

    // Fallback: Web Speech API with Japanese voice
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanKey);
        utterance.lang = 'ja-JP';
        utterance.rate = this.voiceSpeed;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
      }
    }
  }

  // Synthesized Sound Effects for gamification
  public playCorrectSound(): void {
    if (this.isSoundFxMuted || this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // ignore
    }
  }

  public playWrongSound(): void {
    if (this.isSoundFxMuted || this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.18);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore
    }
  }

  public playCompleteSound(): void {
    if (this.isSoundFxMuted || this.isMuted) return;
    try {
      const ctx = this.initContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      });
    } catch {
      // ignore
    }
  }
}

export const audioService = new AudioService();
