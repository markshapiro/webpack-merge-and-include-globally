const fs = require('fs');
const glob = require('glob');
const { promisify } = require('es6-promisify');
const revHash = require('rev-hash');
const { SourceMapGenerator } = require('source-map');
const path = require('path');
const { sources, Compilation } = require('webpack');

const plugin = { name: 'MergeIntoFile' };

const readFile = promisify(fs.readFile);
const listFiles = promisify(glob);

const getLineNumber = function (str, start, stop) {
  const i1 = (start === undefined || start < 0) ? 0 : start;
  const i2 = (stop === undefined || stop >= str.length) ? str.length - 1 : stop;
  let ret = 1;
  for (let i = i1; i <= i2; i++) if (str.charAt(i) === '\n') ret++;
  return ret;
};

const joinContentWithMap = async (promises, separator, sourceRoot, inlineSources) => promises.reduce(async (acc, curr) => {
  const lines = getLineNumber(await curr.content);
  const relativePath = sourceRoot ? path.relative(sourceRoot, curr.path) : curr.path;

  if (inlineSources) {
    (await acc).map.setSourceContent(relativePath, await curr.content);
  }

  for (let offset = 0; offset < lines; offset++) {
    (await acc).map.addMapping({
      source: relativePath,
      original: { line: 1 + offset, column: 0 },
      generated: { line: (await acc).lines + offset, column: 0 },
    });
  }

  return {
    code: `${(await acc).code}${(await acc).code.length ? separator : ''}${await curr.content}`,
    lines: (await acc).lines + lines,
    map: (await acc).map,
  };
}, {
  code: '',
  lines: 1,
  map: new SourceMapGenerator(),
});

const joinContent = async (promises, separator) => promises.reduce(async (acc, curr) => ({
  code: `${(await acc).code}${(await acc).code.length ? separator : ''}${await curr.content}`,
}), {
  code: '',
});

class MergeIntoFile {
  constructor(options, onComplete) {
    this.options = options;
    this.onComplete = onComplete;
  }

  apply(compiler) {
    if (compiler.hooks) {
      let emitHookSet = false;
      compiler.hooks.thisCompilation.tap(
        plugin.name,
        (compilation) => {
          if (compilation.hooks.processAssets) {
            compilation.hooks.processAssets.tapAsync(
              {
                name: plugin.name,
                stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
              },
              (_, callback) => this.run(compilation, callback),
            );
          } else if (!emitHookSet) {
            emitHookSet = true;
            compiler.hooks.emit.tapAsync(plugin.name, this.run.bind(this));
          }
        },
      );
    } else {
      compiler.plugin('emit', this.run.bind(this));
    }
  }

  static getHashOfRelatedFile(assets, fileName) {
    let hashPart = null;
    Object.keys(assets).forEach((existingFileName) => {
      const match = existingFileName.match(/-([0-9a-f]+)(\.min)?(\.\w+)(\.map)?$/);
      const fileHashPart = match && match.length && match[1];
      if (fileHashPart) {
        const canonicalFileName = existingFileName.replace(`-${fileHashPart}`, '').replace(/\.map$/, '');
        if (canonicalFileName === fileName.replace(/\.map$/, '')) {
          hashPart = fileHashPart;
        }
      }
    });
    return hashPart;
  }

  run(compilation, callback) {
    const {
      files,
      transform,
      encoding,
      chunks,
      hash,
      transformFileName,
      sourceMap,
    } = this.options;
    if (chunks && compilation.chunks && compilation.chunks
      .filter((chunk) => chunks.indexOf(chunk.name) >= 0 && chunk.rendered).length === 0) {
      if (typeof (callback) === 'function') {
        callback();
      }
      return;
    }
    const generatedFiles = {};
    let filesCanonical = [];
    if (!Array.isArray(files)) {
      Object.keys(files).forEach((newFile) => {
        filesCanonical.push({
          src: files[newFile],
          dest: newFile,
        });
      });
    } else {
      filesCanonical = files;
    }
    filesCanonical.forEach((fileTransform) => {
      if (typeof fileTransform.dest === 'string') {
        const destFileName = fileTransform.dest;
        fileTransform.dest = (code, map) => ({  // eslint-disable-line no-param-reassign
          [destFileName]: (transform && transform[destFileName])
            ? transform[destFileName](code, map)
            : code,
        });
      }
    });
    const sourceMapEnabled = !!sourceMap;
    const sourceMapRoot = sourceMap && sourceMap.sourceRoot;
    const sourceMapInlineSources = sourceMap && sourceMap.inlineSources;
    const finalPromises = filesCanonical.map(async (fileTransform) => {
      const { separator = '\n' } = this.options;
      const listOfLists = await Promise.all(fileTransform.src.map((path) => listFiles(path, null)));
      const flattenedList = Array.prototype.concat.apply([], listOfLists);
      const filesContentPromises = flattenedList.map(path => ({ path, content: readFile(path, encoding || 'utf-8') }));
      const content = sourceMapEnabled ? await joinContentWithMap(filesContentPromises, separator, sourceMapRoot, sourceMapInlineSources) : await joinContent(filesContentPromises, separator);
      const resultsFiles = await fileTransform.dest(content.code, content.map);
      // eslint-disable-next-line no-restricted-syntax
      for (const resultsFile in resultsFiles) {
        if (typeof resultsFiles[resultsFile] === 'object') {
          // eslint-disable-next-line no-await-in-loop
          resultsFiles[resultsFile] = await resultsFiles[resultsFile];
        }
      }
      Object.keys(resultsFiles).forEach((newFileName) => {
        let newFileNameHashed = newFileName;
        const hasTransformFileNameFn = typeof transformFileName === 'function';

        if (hash || hasTransformFileNameFn) {
          const hashPart = MergeIntoFile.getHashOfRelatedFile(compilation.assets, newFileName)
          || revHash(resultsFiles[newFileName]);

          if (hasTransformFileNameFn) {
            const extensionPattern = /\.[^.]*$/g;
            const fileNameBase = newFileName.replace(extensionPattern, '');
            const [extension] = newFileName.match(extensionPattern);

            newFileNameHashed = transformFileName(fileNameBase, extension, hashPart);
          } else {
            newFileNameHashed = newFileName.replace(/(\.min)?\.\w+(\.map)?$/, (suffix) => `-${hashPart}${suffix}`);
          }

          const fileId = newFileName.replace(/\.map$/, '').replace(/\.\w+$/, '');

          if (typeof compilation.addChunk === 'function') {
            const chunk = compilation.addChunk(fileId);
            chunk.id = fileId;
            chunk.ids = [chunk.id];
            chunk.files.push(newFileNameHashed);
          }
        }
        generatedFiles[newFileName] = newFileNameHashed;

        let rawSource;
        if (sources && sources.RawSource) {
          rawSource = new sources.RawSource(resultsFiles[newFileName]);
        } else {
          rawSource = {
            source() {
              return resultsFiles[newFileName];
            },
            size() {
              return resultsFiles[newFileName].length;
            },
          };
        }

        if (compilation.emitAsset) {
          compilation.emitAsset(newFileNameHashed, rawSource);
        } else {
          // eslint-disable-next-line no-param-reassign
          compilation.assets[newFileNameHashed] = rawSource;
        }
      });
    });

    Promise.all(finalPromises)
      .then(() => {
        if (this.onComplete) {
          this.onComplete(generatedFiles);
        }
        if (typeof (callback) === 'function') {
          callback();
        }
      })
      .catch((error) => {
        if (typeof (callback) === 'function') {
          callback(error);
        } else {
          throw new Error(error);
        }
      });
  }
}

module.exports = MergeIntoFile;
