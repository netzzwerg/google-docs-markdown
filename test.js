var fs = require('fs');
var pandoc = require('pdc');
var GD2M = require('./src/GD2M');

GD2M.unzipFiles('./test/test.zip');

fs.readFile('test/test.html', {encoding: 'utf-8'}, function(err,htmlData){
  if (err) throw err;

  var cssString = htmlData.slice(
    htmlData.indexOf('<style type="text/css">') + '<style type="text/css">'.length,
    htmlData.indexOf('</style>')
  );

  var classMap = GD2M.parseStyles(cssString);

  GD2M.parseMarkup(htmlData, classMap, function(cleanMarkup) {
    createMarkdownFile(cleanMarkup);
  });

});

function createMarkdownFile(html) {
  pandoc(html, 'html', 'markdown_github', ['--atx-headers'], function(err, result) {
    if (err) throw err;
    fs.writeFile('test/test.md', result, function (err) { 
      if (err) throw err;
    });
  });
}