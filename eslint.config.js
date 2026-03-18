import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url);
const config = await jiti.import("./eslint.config.ts");
export default config.default;
