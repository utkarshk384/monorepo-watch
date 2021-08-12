import { Package } from "@manypkg/get-packages";
import buildOptions from "minimist-options";
import { ArgsOptions } from "./types";

export const options = buildOptions({
  root: {
    type: "string",
    alias: "r",
    default: process.cwd(),
  },

  prefix: {
    type: "string",
    alias: "p",
    default: "",
  },

  extensions: {
    type: "string-array",
    alias: "e",
    default: [".js", ".jsx", ".ts", ".tsx"],
  },
});

export const argv: ArgsOptions = require("minimist")(
  process.argv.slice(2),
  options
);

export const setDefaultPrefix = (packages: Package[]) => {
  if (argv.prefix === "") {
    const name = packages[0].packageJson.name.split("/");
    if (name.length === 0)
      throw new Error(
        "Couldn't get package name. Please specfiy one manually by using the -p flag"
      );

    argv.prefix = name[0];
    argv.p = name[0];
  }
};
