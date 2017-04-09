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

MergeIntoFile.prototype.apply = function(compiler) {
  var options = this.options;
  compiler.plugin('emit', function(compilation, callback) {
    var count=0;
    var file2createCnt=0;
    for (var filename in options) {
        var files = options[filename];
        file2createCnt++;
          (function(filenaname2create){
            mergeFiles(files, (err, content)=>{
                if(err) return callback(err);
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
  });
};

module.exports = MergeIntoFile;


