import OpenAI from 'openai'
import { spawn } from 'node:child_process'
import { writeFile, readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import ffmpeg from '@ffmpeg-installer/ffmpeg'

// Typhoon ASR is OpenAI-compatible — Thai-optimized speech-to-text from SCB 10X.
// https://docs.opentyphoon.ai/en/asr/
const typhoon = new OpenAI({
  apiKey: process.env.TYPHOON_API_KEY,
  baseURL: 'https://api.opentyphoon.ai/v1',
})

// Browsers can only record WebM/Opus, which Typhoon's decoder rejects. Re-encode to
// 16 kHz mono WAV (ideal ASR input, first in Typhoon's supported list) with bundled ffmpeg.
async function toWav(input: Buffer): Promise<Buffer> {
  const base = join(tmpdir(), randomUUID())
  const inPath = `${base}.webm`
  const outPath = `${base}.wav`
  try {
    await writeFile(inPath, input)
    await new Promise<void>((resolve, reject) => {
      const ff = spawn(ffmpeg.path, ['-y', '-i', inPath, '-ar', '16000', '-ac', '1', outPath])
      let stderr = ''
      ff.stderr.on('data', d => { stderr += d })
      ff.on('error', reject)
      ff.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-400)}`)))
    })
    return await readFile(outPath)
  } finally {
    await Promise.allSettled([unlink(inPath), unlink(outPath)])
  }
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const wav = await toWav(audioBuffer)
  const file = new File([new Uint8Array(wav)], filename.replace(/\.\w+$/, '') + '.wav', { type: 'audio/wav' })
  const transcription = await typhoon.audio.transcriptions.create({
    file,
    model: 'typhoon-asr-realtime',
  })
  return transcription.text
}
