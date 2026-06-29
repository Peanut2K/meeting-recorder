import { defineConfig } from '@trigger.dev/sdk'

// project ref ต้องมาจาก trigger.dev dashboard (ขึ้นต้น proj_...). ตั้งผ่าน env
// เพื่อไม่ hardcode — ดู README/ขั้นตอนตอนท้าย.
export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF!,
  dirs: ['./src/trigger'],
  maxDuration: 3600, // ponytail: 1hr cap. clip ยาวกว่านี้ → เพิ่มเลข; ไม่มี hard limit ฝั่ง trigger.dev
  // ffmpeg + @ffmpeg-installer ต้องติดไปกับ worker bundle (native binary resolve ตอน runtime)
  build: { external: ['@ffmpeg-installer/ffmpeg'] },
})
