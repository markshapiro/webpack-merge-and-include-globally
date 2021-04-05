"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

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

var _require2 = require('source-map'),
    SourceMapGenerator = _require2.SourceMapGenerator;

var path = require('path');

var _require3 = require('webpack'),
    sources = _require3.sources,
    Compilation = _require3.Compilation;

var plugin = {
  name: 'MergeIntoFile'
};
var readFile = promisify(fs.readFile);
var listFiles = promisify(glob);

var getLineNumber = function getLineNumber(str, start, stop) {
  var i1 = start === undefined || start < 0 ? 0 : start;
  var i2 = stop === undefined || stop >= str.length ? str.length - 1 : stop;
  var ret = 1;

  for (var i = i1; i <= i2; i++) {
    if (str.charAt(i) === '\n') ret++;
  }

  return ret;
};

var joinContentWithMap = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(promises, separator, sourceRoot, inlineSources) {
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt("return", promises.reduce( /*#__PURE__*/function () {
              var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(acc, curr) {
                var lines, relativePath, offset;
                return _regenerator["default"].wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.t0 = getLineNumber;
                        _context.next = 3;
                        return curr.content;

                      case 3:
                        _context.t1 = _context.sent;
                        lines = (0, _context.t0)(_context.t1);
                        relativePath = sourceRoot ? path.relative(sourceRoot, curr.path) : curr.path;

                        if (!inlineSources) {
                          _context.next = 15;
                          break;
                        }

                        _context.next = 9;
                        return acc;

                      case 9:
                        _context.t2 = _context.sent.map;
                        _context.t3 = relativePath;
                        _context.next = 13;
                        return curr.content;

                      case 13:
                        _context.t4 = _context.sent;

                        _context.t2.setSourceContent.call(_context.t2, _context.t3, _context.t4);

                      case 15:
                        offset = 0;

                      case 16:
                        if (!(offset < lines)) {
                          _context.next = 33;
                          break;
                        }

                        _context.next = 19;
                        return acc;

                      case 19:
                        _context.t5 = _context.sent.map;
                        _context.t6 = relativePath;
                        _context.t7 = {
                          line: 1 + offset,
                          column: 0
                        };
                        _context.next = 24;
                        return acc;

                      case 24:
                        _context.t8 = _context.sent.lines;
                        _context.t9 = offset;
                        _context.t10 = _context.t8 + _context.t9;
                        _context.t11 = {
                          line: _context.t10,
                          column: 0
                        };
                        _context.t12 = {
                          source: _context.t6,
                          original: _context.t7,
                          generated: _context.t11
                        };

                        _context.t5.addMapping.call(_context.t5, _context.t12);

                      case 30:
                        offset++;
                        _context.next = 16;
                        break;

                      case 33:
                        _context.t15 = "";
                        _context.next = 36;
                        return acc;

                      case 36:
                        _context.t16 = _context.sent.code;
                        _context.t14 = _context.t15.concat.call(_context.t15, _context.t16);
                        _context.next = 40;
                        return acc;

                      case 40:
                        if (!_context.sent.code.length) {
                          _context.next = 44;
                          break;
                        }

                        _context.t17 = separator;
                        _context.next = 45;
                        break;

                      case 44:
                        _context.t17 = '';

                      case 45:
                        _context.t18 = _context.t17;
                        _context.t13 = _context.t14.concat.call(_context.t14, _context.t18);
                        _context.next = 49;
                        return curr.content;

                      case 49:
                        _context.t19 = _context.sent;
                        _context.t20 = _context.t13.concat.call(_context.t13, _context.t19);
                        _context.next = 53;
                        return acc;

                      case 53:
                        _context.t21 = _context.sent.lines;
                        _context.t22 = lines;
                        _context.t23 = _context.t21 + _context.t22;
                        _context.next = 58;
                        return acc;

                      case 58:
                        _context.t24 = _context.sent.map;
                        return _context.abrupt("return", {
                          code: _context.t20,
                          lines: _context.t23,
                          map: _context.t24
                        });

                      case 60:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee);
              }));

              return function (_x5, _x6) {
                return _ref2.apply(this, arguments);
              };
            }(), {
              code: '',
              lines: 1,
              map: new SourceMapGenerator()
            }));

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function joinContentWithMap(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}();

var joinContent = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(promises, separator) {
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            return _context4.abrupt("return", promises.reduce( /*#__PURE__*/function () {
              var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(acc, curr) {
                return _regenerator["default"].wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.t2 = "";
                        _context3.next = 3;
                        return acc;

                      case 3:
                        _context3.t3 = _context3.sent.code;
                        _context3.t1 = _context3.t2.concat.call(_context3.t2, _context3.t3);
                        _context3.next = 7;
                        return acc;

                      case 7:
                        if (!_context3.sent.code.length) {
                          _context3.next = 11;
                          break;
                        }

                        _context3.t4 = separator;
                        _context3.next = 12;
                        break;

                      case 11:
                        _context3.t4 = '';

                      case 12:
                        _context3.t5 = _context3.t4;
                        _context3.t0 = _context3.t1.concat.call(_context3.t1, _context3.t5);
                        _context3.next = 16;
                        return curr.content;

                      case 16:
                        _context3.t6 = _context3.sent;
                        _context3.t7 = _context3.t0.concat.call(_context3.t0, _context3.t6);
                        return _context3.abrupt("return", {
                          code: _context3.t7
                        });

                      case 19:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3);
              }));

              return function (_x9, _x10) {
                return _ref4.apply(this, arguments);
              };
            }(), {
              code: ''
            }));

          case 1:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function joinContent(_x7, _x8) {
    return _ref3.apply(this, arguments);
  };
}();

var MergeIntoFile = /*#__PURE__*/function () {
  function MergeIntoFile(options, onComplete) {
    (0, _classCallCheck2["default"])(this, MergeIntoFile);
    this.options = options;
    this.onComplete = onComplete;
  }

  (0, _createClass2["default"])(MergeIntoFile, [{
    key: "apply",
    value: function apply(compiler) {
      var _this = this;

      if (compiler.hooks) {
        var emitHookSet = false;
        compiler.hooks.thisCompilation.tap(plugin.name, function (compilation) {
          if (compilation.hooks.processAssets) {
            compilation.hooks.processAssets.tapAsync({
              name: plugin.name,
              stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            }, function (_, callback) {
              return _this.run(compilation, callback);
            });
          } else if (!emitHookSet) {
            emitHookSet = true;
            compiler.hooks.emit.tapAsync(plugin.name, _this.run.bind(_this));
          }
        });
      } else {
        compiler.plugin('emit', this.run.bind(this));
      }
    }
  }, {
    key: "run",
    value: function run(compilation, callback) {
      var _this2 = this;

      var _this$options = this.options,
          files = _this$options.files,
          transform = _this$options.transform,
          encoding = _this$options.encoding,
          chunks = _this$options.chunks,
          hash = _this$options.hash,
          transformFileName = _this$options.transformFileName,
          sourceMap = _this$options.sourceMap;

      if (chunks && compilation.chunks && compilation.chunks.filter(function (chunk) {
        return chunks.indexOf(chunk.name) >= 0 && chunk.rendered;
      }).length === 0) {
        if (typeof callback === 'function') {
          callback();
        }

        return;
      }

      var generatedFiles = {};
      var filesCanonical = [];

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

      filesCanonical.forEach(function (fileTransform) {
        if (typeof fileTransform.dest === 'string') {
          var destFileName = fileTransform.dest;

          fileTransform.dest = function (code, map) {
            return (0, _defineProperty2["default"])({}, destFileName, transform && transform[destFileName] ? transform[destFileName](code, map) : code);
          };
        }
      });
      var sourceMapEnabled = !!sourceMap;
      var sourceMapRoot = sourceMap && sourceMap.sourceRoot;
      var sourceMapInlineSources = sourceMap && sourceMap.inlineSources;
      var finalPromises = filesCanonical.map( /*#__PURE__*/function () {
        var _ref6 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(fileTransform) {
          var _this2$options$separa, separator, listOfLists, flattenedList, filesContentPromises, content, resultsFiles, resultsFile;

          return _regenerator["default"].wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _this2$options$separa = _this2.options.separator, separator = _this2$options$separa === void 0 ? '\n' : _this2$options$separa;
                  _context5.next = 3;
                  return Promise.all(fileTransform.src.map(function (path) {
                    return listFiles(path, null);
                  }));

                case 3:
                  listOfLists = _context5.sent;
                  flattenedList = Array.prototype.concat.apply([], listOfLists);
                  filesContentPromises = flattenedList.map(function (path) {
                    return {
                      path: path,
                      content: readFile(path, encoding || 'utf-8')
                    };
                  });

                  if (!sourceMapEnabled) {
                    _context5.next = 12;
                    break;
                  }

                  _context5.next = 9;
                  return joinContentWithMap(filesContentPromises, separator, sourceMapRoot, sourceMapInlineSources);

                case 9:
                  _context5.t0 = _context5.sent;
                  _context5.next = 15;
                  break;

                case 12:
                  _context5.next = 14;
                  return joinContent(filesContentPromises, separator);

                case 14:
                  _context5.t0 = _context5.sent;

                case 15:
                  content = _context5.t0;
                  _context5.next = 18;
                  return fileTransform.dest(content.code, content.map);

                case 18:
                  resultsFiles = _context5.sent;
                  _context5.t1 = _regenerator["default"].keys(resultsFiles);

                case 20:
                  if ((_context5.t2 = _context5.t1()).done) {
                    _context5.next = 28;
                    break;
                  }

                  resultsFile = _context5.t2.value;

                  if (!((0, _typeof2["default"])(resultsFiles[resultsFile]) === 'object')) {
                    _context5.next = 26;
                    break;
                  }

                  _context5.next = 25;
                  return resultsFiles[resultsFile];

                case 25:
                  resultsFiles[resultsFile] = _context5.sent;

                case 26:
                  _context5.next = 20;
                  break;

                case 28:
                  Object.keys(resultsFiles).forEach(function (newFileName) {
                    var newFileNameHashed = newFileName;
                    var hasTransformFileNameFn = typeof transformFileName === 'function';

                    if (hash || hasTransformFileNameFn) {
                      var hashPart = MergeIntoFile.getHashOfRelatedFile(compilation.assets, newFileName) || revHash(resultsFiles[newFileName]);

                      if (hasTransformFileNameFn) {
                        var extensionPattern = /\.[^.]*$/g;
                        var fileNameBase = newFileName.replace(extensionPattern, '');

                        var _newFileName$match = newFileName.match(extensionPattern),
                            _newFileName$match2 = (0, _slicedToArray2["default"])(_newFileName$match, 1),
                            extension = _newFileName$match2[0];

                        newFileNameHashed = transformFileName(fileNameBase, extension, hashPart);
                      } else {
                        newFileNameHashed = newFileName.replace(/(\.min)?\.\w+(\.map)?$/, function (suffix) {
                          return "-".concat(hashPart).concat(suffix);
                        });
                      }

                      var fileId = newFileName.replace(/\.map$/, '').replace(/\.\w+$/, '');

                      if (typeof compilation.addChunk === 'function') {
                        var chunk = compilation.addChunk(fileId);
                        chunk.id = fileId;
                        chunk.ids = [chunk.id];
                        chunk.files.push(newFileNameHashed);
                      }
                    }

                    generatedFiles[newFileName] = newFileNameHashed;
                    var rawSource;

                    if (sources && sources.RawSource) {
                      rawSource = new sources.RawSource(resultsFiles[newFileName]);
                    } else {
                      rawSource = {
                        source: function source() {
                          return resultsFiles[newFileName];
                        },
                        size: function size() {
                          return resultsFiles[newFileName].length;
                        }
                      };
                    }

                    if (compilation.emitAsset) {
                      compilation.emitAsset(newFileNameHashed, rawSource);
                    } else {
                      // eslint-disable-next-line no-param-reassign
                      compilation.assets[newFileNameHashed] = rawSource;
                    }
                  });

                case 29:
                case "end":
                  return _context5.stop();
              }
            }
          }, _callee5);
        }));

        return function (_x11) {
          return _ref6.apply(this, arguments);
        };
      }());
      Promise.all(finalPromises).then(function () {
        if (_this2.onComplete) {
          _this2.onComplete(generatedFiles);
        }

        if (typeof callback === 'function') {
          callback();
        }
      })["catch"](function (error) {
        if (typeof callback === 'function') {
          callback(error);
        } else {
          throw new Error(error);
        }
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

          if (canonicalFileName === fileName.replace(/\.map$/, '')) {
            hashPart = fileHashPart;
          }
        }
      });
      return hashPart;
    }
  }]);
  return MergeIntoFile;
}();

module.exports = MergeIntoFile;
