import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';

export function nodeDependencyResolver(root, dependencies) {
  const require = createRequire(path.join(root, 'package.json'));
  const entries = new Map(dependencies.map(id => [id.replaceAll('/', '_').replaceAll('.', '_'), id]));
  return {
    name: 'capm-node-dependency-resolver',
    setup(build) {
      build.onResolve({filter: /.*/}, args => {
        const specifier = args.kind === 'entry-point' ? entries.get(args.path) ?? args.path : args.path;
        const from = args.importer ? createRequire(args.importer) : require;
        const resolved = path.isAbsolute(specifier) ? specifier : from.resolve(specifier);
        return {path: resolved, namespace: 'capm-dependency'};
      });
      build.onLoad({filter: /.*/, namespace: 'capm-dependency'}, async args => ({
        contents: await readFile(args.path, 'utf8'),
        loader: args.path.endsWith('.json') ? 'json' : 'js',
        resolveDir: path.dirname(args.path)
      }));
    }
  };
}
