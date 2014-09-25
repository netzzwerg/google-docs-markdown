var fs = require('fs');
var htmlparser = require('htmlparser2');
var pandoc = require('pdc');

var nodelist = [];
var codeTagOpen = false;
var codeClassName = 'c5';
var parser = new htmlparser.Parser({
    onopentag: function(name, attributes) {
      if(attributes.class === codeClassName){
        nodelist.push('<' + 'pre' + '>');
        codeTagOpen = true;
      } else {
        nodelist.push('<' + name + '>');
      }
      if(name === 'body') {
        nodelist = [];
      } else if (name === 'a' && attributes.href){
        nodelist.push('<' + name + ' href="' + attributes.href +'">');
      } else if (name === 'img' && attributes.src){
        nodelist.push('<' + name + ' src="' + attributes.src +'">');
      }
    },
    ontext: function(text){
      nodelist.push(text);
    },
    onclosetag: function(name) {
      if(name === 'body') {
        var cleanedNodeList = cleanNodeList(nodelist.join(''));
        createMarkdownFile(cleanedNodeList);
      }
      if(codeTagOpen){
        nodelist.push('</' + 'pre' + '>');
        codeTagOpen = false;
      } else {
        nodelist.push('</' + name + '>');
      }
    }
});

fs.readFile('MarkdownTest.html', {encoding: 'utf-8'}, function(err,data){
  if (err) throw err;
  parseStyleSheet(data);
  parser.write(data);
  parser.end();
});

function cleanNodeList(nl) {

  // clean up pre tag and multi line code blocks 
  nl = nl.replace(/<p><pre>/gi, "<pre>");
  nl = nl.replace(/<\/pre><\/p>/gi, "</pre>");
  nl = nl.replace(/<\/pre><pre>/gi, "\n");
  nl = nl.replace(/<\/pre>+\s+<pre>/gi, "\n");

  // clean up inline code
  nl = nl.replace(/<\/span><pre>/gi, "</span><code>");
  nl = nl.replace(/<\/pre><span>/gi, "</code><span>");

  // remove all span tags
  nl = nl.replace(/<span>/gi, "");
  nl = nl.replace(/<\/span>/gi, "");
  
  return nl;
}

function parseStyleSheet(text) {
  var index = text.indexOf('font-family:"Courier New"');
  var slicedText = text.slice(index - 100, index);
  var selectorEnd = slicedText.lastIndexOf('{');
  var selectorStart = slicedText.lastIndexOf('.');
  //codeClassName = slicedText.slice(selectorStart+1, selectorEnd);
}

function createMarkdownFile(html) {
  pandoc(html, 'html', 'markdown_github', ['--atx-headers'], function(err, result) {
    if (err) throw err;
    fs.writeFile('MarkdownTest.md', result, function (err) { if (err) throw err; });
  });
}