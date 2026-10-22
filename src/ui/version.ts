// ui/version.ts — the app version for debug reports, read from package.json so it cannot drift
import { version } from '../../package.json'
export const APP_VERSION: string = version
