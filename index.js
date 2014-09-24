var fs = require('fs');
var htmlparser = require('htmlparser2');
var pandoc = require('pdc');

var nodelist = [];
var codeTagOpen = false;
var getStyleSheet = false;
var codeClassName = '';
var parser = new htmlparser.Parser({
    onopentag: function(name, attributes) {
      if(name !== 'span' ) {
        if(!codeTagOpen) nodelist.push('<' + name + '>');
      } else if(attributes.class === codeClassName){
        if(!codeTagOpen) nodelist.push('<' + 'pre' + '>');
        codeTagOpen = true;
      }
      if(name === 'body') {
        nodelist = [];
      }
      if(name === 'style') {
        getStyleSheet = true;
      }
    },
    ontext: function(text){
      if(codeTagOpen) {
        nodelist.push(text + '');
      } else {
        nodelist.push(text);
      }
      if(getStyleSheet) {
        parseStyleSheet(text);
        getStyleSheet = false;
      }
    },
    onclosetag: function(name) {
      if(name === 'body') {
        createMarkdownFile(nodelist.join(' '));
      }
      if(name !== 'span') {
        if(!codeTagOpen) nodelist.push('</' + name + '>');
      } else if(codeTagOpen){
        nodelist.push('</' + 'pre' + '>');
        codeTagOpen = false;
      }
    }
});

fs.readFile('MarkdownTest.html', {encoding: 'utf-8'}, function(err,data){
  if (err) throw err;
  parser.write(data);
  parser.end();
});

function parseStyleSheet(text) {
  var index = text.indexOf('font-family:"Courier New"');
  var slicedText = text.slice(index - 40, index);
  var selectorEnd = slicedText.lastIndexOf('{');
  var selectorStart = slicedText.lastIndexOf('.');
  codeClassName = slicedText.slice(selectorStart+1, selectorEnd);
}

function createMarkdownFile(html) {
  pandoc(html, 'html', 'markdown_github', ['--atx-headers'], function(err, result) {
    if (err) throw err;
    fs.writeFile('MarkdownTest.md', result, function (err) { if (err) throw err; });
  });
}