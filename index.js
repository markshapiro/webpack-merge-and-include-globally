function MergeIntoFile(options) {
  this.options=options;
}

var fs=require('fs');

function mergeFiles(list, callback, ind){
  if(!ind) ind=0;
  if(ind>=list.length) return callback(null, "");
  fs.readFile(list[ind], "utf-8", (err, body)=>{
    if(err) return callback(err);
    mergeFiles(list, (err, otherFilesBody)=>{
      if(err) return callback(err);
      callback(null, body+"\n\n"+otherFilesBody)
    }, ind+1)
  })
}

function run(self) {
  var resultFiles = self.options.files;
  var transform = self.options.transform;
  return function foo(compilation, callback) {
    var count=0;
    var file2createCnt=0;
    for (var filename in resultFiles) {
        var files = resultFiles[filename];
        file2createCnt++;
          (function(filenaname2create){
            mergeFiles(files, (err, content)=>{
                if(err) return callback(err);
                if(transform && typeof transform[filenaname2create] === 'function'){
                  content = transform[filenaname2create](content);
                }
                compilation.assets[filenaname2create] = {
                  source: function() {
                    return content;
                  },
                  size: function() {
                    return content.length;
                  }
                };
                count++;
                if(file2createCnt===count){
                  callback();
                }
            });
         })(filename);
    }
  }
}

MergeIntoFile.prototype.apply = function(compiler) {
  if (compiler.hooks) {
    const plugin = { name: 'MergeIntoFile' };
    compiler.hooks.emit.tapAsync(plugin, run(this));
  } else {
    compiler.plugin('emit', run(this));
  }
};

module.exports = MergeIntoFile;


