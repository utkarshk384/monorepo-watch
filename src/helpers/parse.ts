import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { Logger } from "./logger"

import type { Dict, ArgsOptions, InternalConfig } from "../types"
import { getConfigFile } from "./config-utils"

/* Logger */
const logger = Logger.getInstance()

/* Args options */

const options: Dict<yargs.Options> = {
	config: {
		type: "string",
		alias: "c",
		default: "./watcher.config.js",
		normalize: true,
		description: "Path to config file",
		defaultDescription: "./watcher.config.js",
		requiresArg: true,
	},
	include: {
		type: "array",
		alias: "i",
		default: ["src"],
		defaultDescription: "['src']",
		description: "Directories to watch(Globbing supported)",
	},
	run: {
		type: "array",
		alias: "r",
		default: [],
		defaultDescription: "[]",
		description: "Commands to run on an event",
	},
}

export const argv = yargs(hideBin(process.argv))
	.recommendCommands()
	.options(options)
	.help()
	.parseSync() as unknown as ArgsOptions

if (argv.config === "") {
	//Enforces config file to alaways be given
	logger.WithBackground(
		{ message: "Error", br: "before" },
		"A config file must be provided using the -c flag",
		"error"
	)
	process.exit(1)
}
const configPath = argv.config

const Config: InternalConfig = (await getConfigFile(configPath).catch((err) =>
	logger.LogError(err)
)) as InternalConfig

if (!Config) logger.LogError("No config file found")

export { Config }
