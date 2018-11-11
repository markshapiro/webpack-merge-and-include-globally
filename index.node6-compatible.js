'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const fs = require('fs');
const glob = require('glob');
const { promisify } = require('es6-promisify');

const readFile = promisify(fs.readFile);
const listFiles = promisify(glob);

const consequently = (() => {
  var _ref = _asyncToGenerator(function* (promises, separator) {
    return promises.reduce((() => {
      var _ref2 = _asyncToGenerator(function* (acc, curr) {
        return `${yield acc}${(yield acc).length ? separator : ''}${yield curr}`;
      });

      return function (_x3, _x4) {
        return _ref2.apply(this, arguments);
      };
    })(), '');
  });

  return function consequently(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

const parallely = (promises, separator) => Promise.all(promises).then(results => results.join(separator));

class MergeIntoFile {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    if (compiler.hooks) {
      const plugin = { name: 'MergeIntoFile' };
      compiler.hooks.emit.tapAsync(plugin, this.run.bind(this));
    } else {
      compiler.plugin('emit', this.run.bind(this));
    }
  }

  run(compilation, callback) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const { files, transform, ordered, encoding } = _this.options;
      let filesCanonical = [];
      if (!Array.isArray(files)) {
        Object.keys(files).forEach(function (newFile) {
          filesCanonical.push({
            src: files[newFile],
            dest: newFile
          });
        });
      } else {
        filesCanonical = files;
      }
      filesCanonical.forEach(function (fileTrfm) {
        if (typeof fileTrfm.dest === 'string') {
          const destFileName = fileTrfm.dest;
          fileTrfm.dest = function (code) {
            return { // eslint-disable-line no-param-reassign
              [destFileName]: transform && transform[destFileName] ? transform[destFileName](code) : code
            };
          };
        }
      });
      const finalPromises = filesCanonical.map((() => {
        var _ref3 = _asyncToGenerator(function* (fileTrfm) {
          const listOfLists = yield Promise.all(fileTrfm.src.map(function (path) {
            return listFiles(path, null);
          }));
          const flattenedList = Array.prototype.concat.apply([], listOfLists);
          const filesContentPromises = flattenedList.map(function (path) {
            return readFile(path, encoding || 'utf-8');
          });
          const content = yield (ordered ? consequently : parallely)(filesContentPromises, '\n');
          const resultsFiles = yield fileTrfm.dest(content);
          Object.keys(resultsFiles).forEach(function (newFileName) {
            compilation.assets[newFileName] = { // eslint-disable-line no-param-reassign
              source() {
                return resultsFiles[newFileName];
              },
              size() {
                return resultsFiles[newFileName].length;
              }
            };
          });
        });

        return function (_x5) {
          return _ref3.apply(this, arguments);
        };
      })());

      try {
        yield Promise.all(finalPromises);
        callback();
      } catch (error) {
        callback(error);
      }
    })();
  }
}

module.exports = MergeIntoFile;
