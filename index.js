const fs = require('fs');
const glob = require('glob');
const { promisify } = require('es6-promisify');
const revHash = require('rev-hash');
const { SourceMapGenerator } = require('source-map');
const path = require('path');

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
      const plugin = { name: 'MergeIntoFile' };
      compiler.hooks.emit.tapAsync(plugin, this.run.bind(this));
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
    const { files, transform, encoding, hash, sourceMap } = this.options;
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
      const listOfLists = await Promise.all(fileTransform.src.map(path => listFiles(path, null)));
      const flattenedList = Array.prototype.concat.apply([], listOfLists);
      const filesContentPromises = flattenedList.map(path => ({ path, content: readFile(path, 'utf-8') }));
      const content = sourceMapEnabled ? await joinContentWithMap(filesContentPromises, '\n', sourceMapRoot, sourceMapInlineSources) : await joinContent(filesContentPromises, '\n');
      const resultsFiles = await fileTransform.dest(content.code, content.map);
      Object.keys(resultsFiles).forEach((newFileName) => {
        let newFileNameHashed = newFileName;
        if (hash) {
          const hashPart = MergeIntoFile.getHashOfRelatedFile(compilation.assets, newFileName)
            || revHash(resultsFiles[newFileName]);
          newFileNameHashed = newFileName.replace(/(\.min)?\.\w+(\.map)?$/, suffix => `-${hashPart}${suffix}`);

          const fileId = newFileName.replace(/\.map$/, '').replace(/\.\w+$/, '');
          const chunk = compilation.addChunk(fileId);
          chunk.id = fileId;
          chunk.ids = [chunk.id];
          chunk.files.push(newFileNameHashed);
        }
        generatedFiles[newFileName] = newFileNameHashed;
        compilation.assets[newFileNameHashed] = {   // eslint-disable-line no-param-reassign
          source() {
            return resultsFiles[newFileName];
          },
          size() {
            return resultsFiles[newFileName].length;
          },
        };
      });
    });

    Promise.all(finalPromises)
      .then(() => {
        if (this.onComplete) {
          this.onComplete(generatedFiles);
        }
        callback();
      })
      .catch(error => callback(error));
  }
}

module.exports = MergeIntoFile;
