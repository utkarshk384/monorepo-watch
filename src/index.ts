#! /usr/bin/env node
import { getPackagesSync } from "@manypkg/get-packages"

import Resolver from "./core/resolver"
import Watcher, { WatcherBase } from "./core/watcher"
import { Config, argv, MergeNormalizeConfig } from "./helpers"

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
	throw new Error(`Could not find package.json in ${config.packageRoot}`) // Throw error if not found

const resolve = Resolver({
	packageJSON,
	regex,
	packages,
	include: config.include,
})

/* 
  Watch Files
*/
const include = resolve.ExtractDependencies()

const watcher: WatcherBase = Watcher({
	root: root.dir,
	include,
	packages,
	config,
})

export default watcher
