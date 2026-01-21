// Audio service for completion sounds
class AudioService {
  constructor() {
    this.audioContext = null;
    this.volume = 0.5;
    this.enabled = true;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Generate a soft pop/click sound
  playCompletionSound() {
    if (!this.enabled) return;

    try {
      this.init();
      const ctx = this.audioContext;

      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Create oscillator for the "pop" sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Soft pop sound - starts at higher frequency and quickly drops
      oscillator.frequency.setValueAtTime(600, now);
      oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.08);
      oscillator.type = 'sine';

      // Quick fade in and out for the "pop" effect
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      oscillator.start(now);
      oscillator.stop(now + 0.15);

      // Add a subtle second tone for richness
      const oscillator2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(ctx.destination);

      oscillator2.frequency.setValueAtTime(800, now);
      oscillator2.frequency.exponentialRampToValueAtTime(400, now + 0.06);
      oscillator2.type = 'sine';

      gainNode2.gain.setValueAtTime(0, now);
      gainNode2.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.01);
      gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      oscillator2.start(now);
      oscillator2.stop(now + 0.1);

    } catch (e) {
      console.warn('Could not play completion sound:', e);
    }
  }
}

const audioService = new AudioService();
export default audioService;
