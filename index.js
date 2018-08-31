const fs = require('fs');
const glob = require('glob');
const rp = require('request-promise-native');
const { promisify } = require('es6-promisify');

const fetchFile = (path, encoding) => {
  if (path.startsWith('http:')) {
    return rp({url: path, gzip: true});
  } else {
    return promisify(fs.readFile)(path, encoding);
  }
};

const readFile = promisify(fs.readFile);
const listFiles = (path, options) => {
  if (path.startsWith('http:')) {
    return path;
  } else {
    return promisify(glob)(path, options);
  }
}

const consequently = async (promises, separator) => {
  let result = '';
  for (const fileContentPromise of promises) {  // eslint-disable-line
    const content = await fileContentPromise;  // eslint-disable-line
    if (result !== '') {
      result += separator;
    }
    result += content;
  }
  return result;
};

const parallely = (promises, separator) => Promise.all(promises)
    .then(results => results.join(separator));

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

  async run(compilation, callback) {
    const { files, transform, ordered, encoding } = this.options;
    const finalPromises = Object.keys(files).map(async (newFile) => {
      const listOfLists = await Promise.all(files[newFile].map(path => listFiles(path, null)));
      const flattenedList = Array.prototype.concat.apply([], listOfLists);
      const filesContentPromises = flattenedList.map(path => fetchFile(path, encoding || 'utf-8'));
      let content = await (ordered ? consequently : parallely)(filesContentPromises, '\n');
      if (transform && transform[newFile]) {
        content = transform[newFile](content);
      }
      compilation.assets[newFile] = {   // eslint-disable-line no-param-reassign
        source() {
          return content;
        },
        size() {
          return content.length;
        },
      };
    });

    try {
      await Promise.all(finalPromises);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

module.exports = MergeIntoFile;
