import {
  esm_exports,
  init_esm as init_esm2
} from "./chunk-GF5IBPAD.mjs";
import {
  __commonJS,
  __name,
  __toCommonJS,
  init_esm
} from "./chunk-CQYOVGBP.mjs";

// ../../../.cache/pnpm/dlx/886e157b61cdcb21f1e5048f3649e59a7fcfc579327ce6a4d853a479cb024479/19f112a855e-568f/node_modules/.pnpm/@opentelemetry+resources@2.0.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/resources/build/src/detectors/platform/node/machine-id/getMachineId-unsupported.js
var require_getMachineId_unsupported = __commonJS({
  "../../../.cache/pnpm/dlx/886e157b61cdcb21f1e5048f3649e59a7fcfc579327ce6a4d853a479cb024479/19f112a855e-568f/node_modules/.pnpm/@opentelemetry+resources@2.0.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/resources/build/src/detectors/platform/node/machine-id/getMachineId-unsupported.js"(exports) {
    init_esm();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getMachineId = void 0;
    var api_1 = (init_esm2(), __toCommonJS(esm_exports));
    async function getMachineId() {
      api_1.diag.debug("could not read machine-id: unsupported platform");
      return void 0;
    }
    __name(getMachineId, "getMachineId");
    exports.getMachineId = getMachineId;
  }
});
export default require_getMachineId_unsupported();
//# sourceMappingURL=getMachineId-unsupported-DLJK6VSU.mjs.map
