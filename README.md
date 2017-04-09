# MERGE INTO SINGLE FILE PLUGIN FOR WEBPACK

## Usage

Lets say you want to make libraries like `jquery`, `moment` (including 3 languages) and `toastr` available globally, and you're struggling to make them global with webpack or just importing them (in cases they aren't written well) because require() wraps the code into new scope and you want to execute it against a global scope, and you don't want to do this:
``` html
  <script src="/node_modules/jquery/dist/jquery.js"></script>
  <script src="/node_modules/moment/moment.js"></script>
  <script src="/node_modules/moment/locale/cs.js"></script>
  <script src="/node_modules/moment/locale/de.js"></script>
  <script src="/node_modules/moment/locale/cs.js"></script>
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
          "vendor.js":[
            'node_modules/jquery/dist/jquery.js',
            'node_modules/moment/moment.js',
            'node_modules/moment/locale/cs.js',
            'node_modules/moment/locale/de.js',
            'node_modules/moment/locale/nl.js',
            'node_modules/toastr/build/toastr.min.js'
          ],
          "vendor.css":[
            'node_modules/toastr/build/toastr.min.css'
          ]
       }),
    ]

```
this generates 2 files with merged js and css content, include it into your `index.html` to take effect:
``` html
  <script src="/vendor.js"></script>
  <link rel="stylesheet" href="/vendor.css">
```

<b>NOTE: use this only if you're webpack noobie who wants to get things finished fast.
<br/>The correct way for most cases like this is to use `expose-loader` or `webpack.ProvidePlugin`</b>
