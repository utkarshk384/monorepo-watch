#! /usr/bin/env node

import { getPackagesSync } from "@manypkg/get-packages";

import Watcher from "./core/watcher";
import Resolver from "./helpers/resolver";
import { EventAction } from "./types";
import { argv, setDefaultPrefix } from "./args";

const { root, packages } = getPackagesSync(argv.root);
const regex = new RegExp(`${argv.prefix}/[\w]$`, "i");

let packageJSON;
packages.map((pkg) => {
  if (pkg.dir === argv.root) packageJSON = pkg.packageJson;
  return;
});

if (packageJSON === undefined)
  throw new Error(`Could not find package.json in ${argv.root}`);

setDefaultPrefix(packages);
const resolve = Resolver({
  root: argv.root,
  packageJSON,
  regex,
  extensions: argv.extensions,
});

/* 
  Actions
*/

const actions: EventAction = {
  add: () => {},
  addDir: () => {},
  unlink: () => {},
  unlinkDir: () => {},
  change: () => {},
};

/* 
  Watch Files
*/
const watchFiles = [argv.root, ...resolve.ExtractDependencies()];

Watcher({ root: root.dir, watchFiles, options: {}, actions });
