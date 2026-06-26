// MediaRecorder WebM blobs ship without a duration header, so audio.duration is Infinity
// and the seek bar runs backwards. Force the browser to compute it: seek far, then reset.
export function primeWebmDuration(audio: HTMLAudioElement) {
  if (audio.duration !== Infinity) return
  audio.currentTime = 1e101
  const reset = () => { audio.removeEventListener('timeupdate', reset); audio.currentTime = 0 }
  audio.addEventListener('timeupdate', reset)
}
