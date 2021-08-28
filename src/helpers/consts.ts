import { tmpdir } from "os"

import type { ArgsOptions, envModes, IConfig } from "src/types"

export const FILENAME = "tempsizes.json"
export const ROOT = tmpdir()
export const LOCK_NAME = "Lock"

export const defaultConfig: (argv: ArgsOptions) => IConfig = (argv: ArgsOptions) =>
	({
		packageRoot: process.cwd(),
		options: {},
		runScripts: [],
		prefix: "",
		include: argv.include,
		noChildProcessLogs: false,
	} as IConfig)

export const MODE: envModes = (process.env.MODE as envModes) || "info"

if (!["info", "debug"].includes(MODE)) {
	throw new Error(`Invalid MODE: ${MODE}`)
}
