import OpenAI from 'openai'
import { spawn } from 'node:child_process'
import { writeFile, readFile, unlink, readdir, rm, mkdir } from 'node:fs/promises'
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

// Compress WebM to mono MP3 @ 32 kbps — 1 hr ≈ 14 MB. Used for storage and to
// keep Whisper uploads under its 25 MB (26214400 byte) limit.
export async function compressToMp3(input: Buffer): Promise<Buffer> {
  const base = join(tmpdir(), randomUUID())
  const inPath = `${base}.webm`
  const outPath = `${base}.mp3`
  try {
    await writeFile(inPath, input)
    await runFfmpeg(inPath, outPath, ['-ar', '16000', '-ac', '1', '-b:a', '32k'])
    return await readFile(outPath)
  } finally {
    await Promise.allSettled([unlink(inPath), unlink(outPath)])
  }
}

async function whisper(mp3: Buffer, name: string): Promise<string> {
  const file = new File([new Uint8Array(mp3)], name, { type: 'audio/mpeg' })
  const r = await openai.audio.transcriptions.create({ file, model: 'whisper-1', language: 'th' })
  return r.text
}

// Split a (mono 32kbps) MP3 into ~20-min chunks so any-length recording stays under
// Whisper's 25 MB limit. 20 min @ 32kbps ≈ 4.8 MB. ffmpeg segments on keyframes; copy
// codec keeps it fast and lossless. Returns chunks in playback order.
async function splitMp3(mp3: Buffer, seconds = 1200): Promise<Buffer[]> {
  const dir = join(tmpdir(), randomUUID())
  const inPath = `${dir}.mp3`
  await mkdir(dir, { recursive: true })
  await writeFile(inPath, mp3)
  try {
    await runFfmpeg(inPath, join(dir, 'p%04d.mp3'),
      ['-f', 'segment', '-segment_time', String(seconds), '-c', 'copy'])
    const names = (await readdir(dir)).filter(n => n.endsWith('.mp3')).sort()
    return await Promise.all(names.map(n => readFile(join(dir, n))))
  } finally {
    await Promise.allSettled([unlink(inPath), rm(dir, { recursive: true, force: true })])
  }
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string, alreadyMp3 = false): Promise<string> {
  const mp3 = alreadyMp3 ? audioBuffer : await compressToMp3(audioBuffer)
  const base = filename.replace(/\.\w+$/, '')

  if (mp3.byteLength <= 26214400) return whisper(mp3, `${base}.mp3`)

  // Too big for one upload — split and transcribe each chunk sequentially, then join.
  const chunks = await splitMp3(mp3)
  const parts: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    parts.push(await whisper(chunks[i], `${base}.${i}.mp3`))
  }
  return parts.join(' ')
}
