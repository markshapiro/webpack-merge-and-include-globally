# MERGE INTO SINGLE FILE PLUGIN FOR WEBPACK

Webpack plugin to merge your source files together into single file, to be included in index.html, and achieving same effect as you would by including them all separately through `<script>` or `<link>`.

### Getting Started

```bash
npm install --save-dev webpack-merge-and-include-globally
```

### Usage

Lets say you want to make libraries like `jquery`, `moment` (including 3 languages) and `toastr` available globally, and you're struggling to make them global with webpack or just importing them (in cases they aren't written well) because require() wraps the code into new scope and you want to execute it against a global scope, and you don't want to do this:
``` html
  <script src="/node_modules/jquery/dist/jquery.js"></script>
  <script src="/node_modules/moment/moment.js"></script>
  <script src="/node_modules/moment/locale/cs.js"></script>
  <script src="/node_modules/moment/locale/de.js"></script>
  <script src="/node_modules/moment/locale/nl.js"></script>
  <script src="/node_modules/toastr/build/toastr.min.js"></script>
  
  <link rel="stylesheet" href="/node_modules/toastr/build/toastr.min.css">
```
because your `node_modules` is not available in production.
<br/>with this plugin you can achieve the desired effect this way:
``` javascript

  const MergeIntoSingleFilePlugin = require('webpack-merge-and-include-globally');
  
  module.exports = {
    ...
    plugins: [
        new MergeIntoSingleFilePlugin({
            files: {
                "vendor.js": [
                    'node_modules/jquery/dist/jquery.js',
                    'node_modules/moment/moment.js',
                    'node_modules/moment/locale/cs.js',
                    'node_modules/moment/locale/de.js',
                    'node_modules/moment/locale/nl.js',
                    'node_modules/toastr/build/toastr.min.js'
                ],
                "vendor.css": [
                    'node_modules/toastr/build/toastr.min.css'
                ]
            }
        }),
    ]

```
this generates 2 files with merged js and css content, include them into your `index.html` to take effect:
``` html
  <script src="./vendor.js"></script>
  <link rel="stylesheet" href="./vendor.css">
```
now `jQuery`, `moment` and `toastr` are available globally throughout your application.

### Options

#### files

Object that maps file names to array of all files that will be merged together and saved under that file name.
<br/>For example to merge `jquery`, `classnames` and `humps` into `vendor.js`, do:
``` javascript
new MergeIntoSingle({
  files:{
    'vendor.js':[
      'node_modules/jquery/dist/jquery.js',
      'node_modules/classnames/index.js',
      'node_modules/humps/humps.js'
    ]
  }
})
```

#### transform

Object that maps resulting file names to tranform methods that will be applied on merged content before saving. Use to minify / uglify the result.
<br/>For example to minify the final merge result of `vendor.js`, do:
``` javascript
new MergeIntoSingle({
  files:{ 'vendor.js':[...] },
  transform:{
    'vendor.js': code => require("uglify-js").minify(code).code
  }
})
```

### Working Example

working example already included in project.
<br/>to test first install `npm i`, then run `npm run start` to see it in action
<br/>and `npm run build` to build prod files with vendor file and `index.html`.

<b>NOTE: use this only if only want to get things finished fast.
<br/>The correct way for most cases like this is to use `expose-loader` or `webpack.ProvidePlugin`</b>
