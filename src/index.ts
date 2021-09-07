#! /usr/bin/env node
import { getPackagesSync } from "@manypkg/get-packages"

import Resolver from "./core/resolver"
import Watcher from "./core/watcher"
import { Config, argv, MergeNormalizeConfig, Logger } from "./helpers"

import type { Dict } from "./types"

const logger = Logger.getInstance()

const { root, packages } = getPackagesSync(Config.packageRoot || process.cwd())
const config = MergeNormalizeConfig(Config, packages, argv)

/* Regex to match package names inside package.json */
// eslint-disable-next-line no-useless-escape
const regex = new RegExp(`${Config.prefix}\/[\\w-]+$`, "i")

/* 
  Resolve caller package's package.json
*/
let packageJSON
packages.map((pkg) => {
	if (pkg.dir === config.packageRoot) packageJSON = pkg.packageJson
	return
})

if (packageJSON === undefined)
	// process.exit will be called packageJSON is undefined
	logger.LogError(`Could not find package.json in ${config.packageRoot}`)

const resolve = Resolver({
	resolveDevDependencies: config.resolveDevDependencies,
	resolvePeerDependencies: config.resolvePeerDependencies,
	packageJSON: packageJSON as unknown as Dict<string, string>,
	regex,
	packages,
	include: config.include,
})

/* 
Watch Files
*/
const include = resolve.ExtractDependencies()

Watcher({
	root: root.dir,
	include,
	packages,
	config,
})
