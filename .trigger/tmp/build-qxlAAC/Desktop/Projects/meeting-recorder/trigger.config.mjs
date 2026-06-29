import {
  defineConfig
} from "../../../chunk-RSU2FPP5.mjs";
import "../../../chunk-JREKMI3W.mjs";
import {
  init_esm
} from "../../../chunk-CQYOVGBP.mjs";

// trigger.config.ts
init_esm();
var trigger_config_default = defineConfig({
  project: process.env.TRIGGER_PROJECT_REF,
  dirs: ["./src/trigger"],
  maxDuration: 3600,
  // ponytail: 1hr cap. clip ยาวกว่านี้ → เพิ่มเลข; ไม่มี hard limit ฝั่ง trigger.dev
  // ffmpeg + @ffmpeg-installer ต้องติดไปกับ worker bundle (native binary resolve ตอน runtime)
  build: {}
});
var resolveEnvVars = void 0;
export {
  trigger_config_default as default,
  resolveEnvVars
};
//# sourceMappingURL=trigger.config.mjs.map
