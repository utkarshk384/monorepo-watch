import { tmpdir } from "os"

import type { ArgsOptions, envModes, IConfig } from "src/types"

export const FILENAME = "tempsizes.json"
export const TMP_DIR = tmpdir()
export const LOCK_NAME = "Lock"

export const defaultConfig: (argv: ArgsOptions) => IConfig = (argv: ArgsOptions) =>
	({
		packageRoot: process.cwd(),
		options: {},
		runScripts: [],
		prefix: "",
		resolveDevDependencies: true,
		resolvePeerDependencies: true,
		include: argv.include,
		noChildProcessLogs: false,
		autoShowOptions: false,
	} as IConfig)

export const MODE: envModes = (process.env.MODE as envModes) || "info"

if (!["info", "debug"].includes(MODE)) throw new Error(`Invalid MODE: ${MODE}`)

export const ANSI_REGEX =
	// eslint-disable-next-line no-control-regex
	/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g

export const YARN_ERROR_MSGS = [
	"error Command failed with exit code 2.",
	"error Command failed with exit code 1.",
	"info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.",
]

export const STACK_REGEX = {
	rollup: /\/?([A-z0-9-_+]+\/)*([A-z0-9]+\.[A-Za-z]+(\([0-9]+,[0-9]+\)))/gi,
}
