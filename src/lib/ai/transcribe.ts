import OpenAI from 'openai'
import { spawn } from 'node:child_process'
import { writeFile, readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import ffmpeg from '@ffmpeg-installer/ffmpeg'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function runFfmpeg(inPath: string, outPath: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const ff = spawn(ffmpeg.path, ['-y', '-i', inPath, ...args, outPath])
    let stderr = ''
    ff.stderr.on('data', d => { stderr += d })
    ff.on('error', reject)
    ff.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-400)}`)))
  })
}

// Convert WebM to 16 kHz mono WAV for Whisper ASR.
async function toWav(input: Buffer): Promise<Buffer> {
  const base = join(tmpdir(), randomUUID())
  const inPath = `${base}.webm`
  const outPath = `${base}.wav`
  try {
    await writeFile(inPath, input)
    await runFfmpeg(inPath, outPath, ['-ar', '16000', '-ac', '1'])
    return await readFile(outPath)
  } finally {
    await Promise.allSettled([unlink(inPath), unlink(outPath)])
  }
}

// Compress WebM to mono MP3 @ 32 kbps for storage — 1 hr ≈ 14 MB, well under the 25 MB Whisper limit.
export async function compressToMp3(input: Buffer): Promise<Buffer> {
  const base = join(tmpdir(), randomUUID())
  const inPath = `${base}.webm`
  const outPath = `${base}.mp3`
  try {
    await writeFile(inPath, input)
    await runFfmpeg(inPath, outPath, ['-ac', '1', '-b:a', '32k'])
    return await readFile(outPath)
  } finally {
    await Promise.allSettled([unlink(inPath), unlink(outPath)])
  }
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const wav = await toWav(audioBuffer)
  const file = new File([new Uint8Array(wav)], filename.replace(/\.\w+$/, '') + '.wav', { type: 'audio/wav' })
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'th',
  })
  return transcription.text
}
