'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const fs = require('fs');
const glob = require('glob');
const { promisify } = require('es6-promisify');
const revHash = require('rev-hash');
const { SourceMapGenerator } = require('source-map');
const path = require('path');

const readFile = promisify(fs.readFile);
const listFiles = promisify(glob);

const getLineNumber = function (str, start, stop) {
  const i1 = start === undefined || start < 0 ? 0 : start;
  const i2 = stop === undefined || stop >= str.length ? str.length - 1 : stop;
  let ret = 1;
  for (let i = i1; i <= i2; i++) if (str.charAt(i) === '\n') ret++;
  return ret;
};

const joinContentWithMap = (() => {
  var _ref = _asyncToGenerator(function* (promises, separator, sourceRoot, inlineSources) {
    return promises.reduce((() => {
      var _ref2 = _asyncToGenerator(function* (acc, curr) {
        const lines = getLineNumber((yield curr.content));
        const relativePath = sourceRoot ? path.relative(sourceRoot, curr.path) : curr.path;

        if (inlineSources) {
          (yield acc).map.setSourceContent(relativePath, (yield curr.content));
        }

        for (let offset = 0; offset < lines; offset++) {
          (yield acc).map.addMapping({
            source: relativePath,
            original: { line: 1 + offset, column: 0 },
            generated: { line: (yield acc).lines + offset, column: 0 }
          });
        }

        return {
          code: `${(yield acc).code}${(yield acc).code.length ? separator : ''}${yield curr.content}`,
          lines: (yield acc).lines + lines,
          map: (yield acc).map
        };
      });

      return function (_x5, _x6) {
        return _ref2.apply(this, arguments);
      };
    })(), {
      code: '',
      lines: 1,
      map: new SourceMapGenerator()
    });
  });

  return function joinContentWithMap(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
})();

const joinContent = (() => {
  var _ref3 = _asyncToGenerator(function* (promises, separator) {
    return promises.reduce((() => {
      var _ref4 = _asyncToGenerator(function* (acc, curr) {
        return {
          code: `${(yield acc).code}${(yield acc).code.length ? separator : ''}${yield curr.content}`
        };
      });

      return function (_x9, _x10) {
        return _ref4.apply(this, arguments);
      };
    })(), {
      code: ''
    });
  });

  return function joinContent(_x7, _x8) {
    return _ref3.apply(this, arguments);
  };
})();

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
    Object.keys(assets).forEach(existingFileName => {
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
      Object.keys(files).forEach(newFile => {
        filesCanonical.push({
          src: files[newFile],
          dest: newFile
        });
      });
    } else {
      filesCanonical = files;
    }
    filesCanonical.forEach(fileTransform => {
      if (typeof fileTransform.dest === 'string') {
        const destFileName = fileTransform.dest;
        fileTransform.dest = (code, map) => ({ // eslint-disable-line no-param-reassign
          [destFileName]: transform && transform[destFileName] ? transform[destFileName](code, map) : code
        });
      }
    });
    const sourceMapEnabled = !!sourceMap;
    const sourceMapRoot = sourceMap && sourceMap.sourceRoot;
    const sourceMapInlineSources = sourceMap && sourceMap.inlineSources;
    const finalPromises = filesCanonical.map((() => {
      var _ref5 = _asyncToGenerator(function* (fileTransform) {
        const listOfLists = yield Promise.all(fileTransform.src.map(function (path) {
          return listFiles(path, null);
        }));
        const flattenedList = Array.prototype.concat.apply([], listOfLists);
        const filesContentPromises = flattenedList.map(function (path) {
          return { path, content: readFile(path, 'utf-8') };
        });
        const content = sourceMapEnabled ? yield joinContentWithMap(filesContentPromises, '\n', sourceMapRoot, sourceMapInlineSources) : yield joinContent(filesContentPromises, '\n');
        const resultsFiles = yield fileTransform.dest(content.code, content.map);
        Object.keys(resultsFiles).forEach(function (newFileName) {
          let newFileNameHashed = newFileName;
          if (hash) {
            const hashPart = MergeIntoFile.getHashOfRelatedFile(compilation.assets, newFileName) || revHash(resultsFiles[newFileName]);
            newFileNameHashed = newFileName.replace(/(\.min)?\.\w+(\.map)?$/, function (suffix) {
              return `-${hashPart}${suffix}`;
            });

            const fileId = newFileName.replace(/\.map$/, '').replace(/\.\w+$/, '');
            const chunk = compilation.addChunk(fileId);
            chunk.id = fileId;
            chunk.ids = [chunk.id];
            chunk.files.push(newFileNameHashed);
          }
          generatedFiles[newFileName] = newFileNameHashed;
          compilation.assets[newFileNameHashed] = { // eslint-disable-line no-param-reassign
            source() {
              return resultsFiles[newFileName];
            },
            size() {
              return resultsFiles[newFileName].length;
            }
          };
        });
      });

      return function (_x11) {
        return _ref5.apply(this, arguments);
      };
    })());

    Promise.all(finalPromises).then(() => {
      if (this.onComplete) {
        this.onComplete(generatedFiles);
      }
      callback();
    }).catch(error => callback(error));
  }
}

module.exports = MergeIntoFile;
