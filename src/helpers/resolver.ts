import path from "path";

import type { Dict, IBaseResolver, ResolverType } from "../types";

class BaseResolvers implements IBaseResolver {
  private root: string;
  private pkgJSON: Dict<string | Dict<unknown>>;
  private regex: RegExp;
  private extensions: string[];
  private paths: string[];

  constructor(
    root: string,
    packageJSON: Dict,
    regex: RegExp,
    extensions: string[]
  ) {
    this.root = root;
    this.pkgJSON = packageJSON;
    this.regex = regex;
    this.paths = [];
    this.extensions = extensions;
  }

  public ExtractDependencies() {
    this.extensions;
    if (this.pkgJSON.dependencies)
      this.resolveDependencies(this.pkgJSON.dependencies as Dict<unknown>);
    else if (this.pkgJSON.devDependencies)
      this.resolveDependencies(this.pkgJSON.devDependencies as Dict<unknown>);
    else if (this.pkgJSON.peerDependencies)
      this.resolveDependencies(this.pkgJSON.peerDependencies as Dict<unknown>);

    return this.paths;
  }

  private resolveDependencies(dependencies: Dict<unknown>): void {
    for (const key in dependencies) {
      const match = key.match(this.regex);
      let path = "";

      if (match && match.length > 0) path = match[0].split("/")[1];

      this.paths.push(this.resolvePath(path));
    }
  }

  private resolvePath(dependency: string): string {
    return path.join(this.root, "../", dependency);
  }
}

const Resolver: ResolverType = ({ root, packageJSON, regex, extensions }) => {
  return new BaseResolvers(root, packageJSON, regex, extensions);
};

export default Resolver;
