"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

const plugin = { name: 'MergeIntoFile' };

const webpackMajorVersion = Number(require('webpack/package.json').version.split('.')[0]);

const readFile = promisify(fs.readFile);
const listFiles = promisify(glob);

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var fs = require('fs');

var glob = require('glob');

var _require = require('es6-promisify'),
    promisify = _require.promisify;

var revHash = require('rev-hash');

var readFile = promisify(fs.readFile);
var listFiles = promisify(glob);

var joinContent = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(promises, separator) {
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt("return", promises.reduce( /*#__PURE__*/function () {
              var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(acc, curr) {
                return _regenerator["default"].wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.t2 = "";
                        _context.next = 3;
                        return acc;

                      case 3:
                        _context.t3 = _context.sent;
                        _context.t1 = _context.t2.concat.call(_context.t2, _context.t3);
                        _context.next = 7;
                        return acc;

                      case 7:
                        if (!_context.sent.length) {
                          _context.next = 11;
                          break;
                        }

                        _context.t4 = separator;
                        _context.next = 12;
                        break;

                      case 11:
                        _context.t4 = '';

                      case 12:
                        _context.t5 = _context.t4;
                        _context.t0 = _context.t1.concat.call(_context.t1, _context.t5);
                        _context.next = 16;
                        return curr;

                      case 16:
                        _context.t6 = _context.sent;
                        return _context.abrupt("return", _context.t0.concat.call(_context.t0, _context.t6));

                      case 18:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee);
              }));

              return function (_x3, _x4) {
                return _ref2.apply(this, arguments);
              };
            }(), ''));

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function joinContent(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var MergeIntoFile = /*#__PURE__*/function () {
  function MergeIntoFile(options, onComplete) {
    (0, _classCallCheck2["default"])(this, MergeIntoFile);
    this.options = options;
    this.onComplete = onComplete;
  }

  apply(compiler) {
    if (compiler.hooks) {
      if (webpackMajorVersion < 5) {
        compiler.hooks.emit.tapAsync(plugin, this.run.bind(this));
      } else {
        compiler.hooks.compilation.tap(plugin, this.run.bind(this));
        compiler.hooks.failed.tap(plugin, error => {
          throw new Error(error);
        });
      }
    } else {
      compiler.plugin('emit', this.run.bind(this));
    }
  }, {
    key: "run",
    value: function run(compilation, callback) {
      var _this = this;

      var _this$options = this.options,
          files = _this$options.files,
          transform = _this$options.transform,
          encoding = _this$options.encoding,
          chunks = _this$options.chunks,
          hash = _this$options.hash,
          transformFileName = _this$options.transformFileName;

      if (chunks && compilation.chunks && compilation.chunks.filter(function (chunk) {
        return chunks.indexOf(chunk.name) >= 0 && chunk.rendered;
      }).length === 0) {
        callback();
        return;
      }

  run(compilation, callback) {
    var _this = this;

    const {
      files,
      transform,
      encoding,
      chunks,
      hash,
      transformFileName
    } = this.options;
    if (chunks && compilation.chunks && compilation.chunks.filter(chunk => chunks.indexOf(chunk.name) >= 0 && chunk.rendered).length === 0) {
      if (typeof callback === 'function') {
        callback();
      }
      return;
    }
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
        fileTransform.dest = code => ({ // eslint-disable-line no-param-reassign
          [destFileName]: transform && transform[destFileName] ? transform[destFileName](code) : code
        });
      } else {
        filesCanonical = files;
      }

      filesCanonical.forEach(function (fileTransform) {
        if (typeof fileTransform.dest === 'string') {
          var destFileName = fileTransform.dest;

          fileTransform.dest = function (code) {
            return (0, _defineProperty2["default"])({}, destFileName, transform && transform[destFileName] ? transform[destFileName](code) : code);
          };
        }
      });
      var finalPromises = filesCanonical.map( /*#__PURE__*/function () {
        var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(fileTransform) {
          var _this$options$separat, separator, listOfLists, flattenedList, filesContentPromises, content, resultsFiles;

          return _regenerator["default"].wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _this$options$separat = _this.options.separator, separator = _this$options$separat === void 0 ? '\n' : _this$options$separat;
                  _context4.next = 3;
                  return Promise.all(fileTransform.src.map(function (path) {
                    return listFiles(path, null);
                  }));

            if (typeof compilation.addChunk === 'function') {
              const chunk = compilation.addChunk(fileId);
              chunk.id = fileId;
              chunk.ids = [chunk.id];
              chunk.files.push(newFileNameHashed);
            }
          }
          generatedFiles[newFileName] = newFileNameHashed;
          if (compilation.hooks) {
            const { sources, Compilation } = require('webpack');
            compilation.hooks.processAssets.tap({
              name: plugin.name,
              stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            }, function () {
              compilation.emitAsset(newFileNameHashed, new sources.RawSource(resultsFiles[newFileName]));
            });
          } else {
            compilation.assets[newFileNameHashed] = { // eslint-disable-line no-param-reassign
              source() {
                return resultsFiles[newFileName];
              },
              size() {
                return resultsFiles[newFileName].length;
              }
            };
          }
        });
      });
    }
  }], [{
    key: "getHashOfRelatedFile",
    value: function getHashOfRelatedFile(assets, fileName) {
      var hashPart = null;
      Object.keys(assets).forEach(function (existingFileName) {
        var match = existingFileName.match(/-([0-9a-f]+)(\.min)?(\.\w+)(\.map)?$/);
        var fileHashPart = match && match.length && match[1];

        if (fileHashPart) {
          var canonicalFileName = existingFileName.replace("-".concat(fileHashPart), '').replace(/\.map$/, '');

    Promise.all(finalPromises).then(() => {
      if (this.onComplete) {
        this.onComplete(generatedFiles);
      }
      if (typeof callback === 'function') {
        callback();
      }
    }).catch(error => {
      if (typeof callback === 'function') {
        callback(error);
      } else {
        throw new Error(error);
      }
    });
  }
}

module.exports = MergeIntoFile;
