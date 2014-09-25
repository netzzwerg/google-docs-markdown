var fs = require('fs');
var css = require('css');
var htmlparser = require('htmlparser2');
var unzip = require('node-zip');

var GD2M = {

  'parseStyles' : function parseStyles(cssString) {
    var cssObject = css.parse(cssString,{});
    var classMap = {
      'code'   : '',
      'bold'   : '',
      'italic' : ''
    }
    for (var i = 0; i < cssObject.stylesheet.rules.length; i++) {
      var declarations = cssObject.stylesheet.rules[i].declarations;
      for (var j = 0; j < declarations.length; j++) {
        // code block
        if(declarations[j].property === 'font-family' && declarations[j].value === '"Courier New"') {
          classMap.code = cssObject.stylesheet.rules[i].selectors[0].substring(1);
        }
        // bold font
        if(declarations[j].property === 'font-weight' && declarations[j].value === 'bold' && declarations.length === 1) {
          classMap.bold = cssObject.stylesheet.rules[i].selectors[0].substring(1);
        }
        // italic font
        if(declarations[j].property === 'font-style' && declarations[j].value === 'italic' && declarations.length === 1) {
          classMap.italic = cssObject.stylesheet.rules[i].selectors[0].substring(1);
        }
      }
    }
    return classMap;
  },

  'parseMarkup' : function parseMarkup(htmlData, classMap, cb) {
    var nodelist = [];
    var codeTagOpen = false;
    var italicTagOpen = false;
    var boldTagOpen = false;
    var codeClassName = '';
    var italicClassName = '';
    var boldClassName = '';
    var parser = new htmlparser.Parser({
        onopentag: function(name, attributes) {

          if(attributes.class === classMap.code) {
            nodelist.push('<' + 'pre' + '>');
            codeTagOpen = true;
          } else if(attributes.class === classMap.italic) {
            nodelist.push('<' + 'i' + '>');
            italicTagOpen = true;
          } else if(attributes.class === classMap.bold) {
            nodelist.push('<' + 'b' + '>');
            boldTagOpen = true;
          }

          if(name === 'body') {
            nodelist = [];
          } else if (name === 'a' && attributes.href) {
            nodelist.push('<' + name + ' href="' + attributes.href +'">');
          } else if (name === 'img' && attributes.src) {
            nodelist.push('<' + name + ' src="' + attributes.src +'"/>');
          } else {
            nodelist.push('<' + name + '>');
          }

        },
        ontext: function(text) {
          nodelist.push(text);
        },
        onclosetag: function(name) {

          if(name === 'body') {
            var cleanedNodeList = GD2M._cleanNodeList(nodelist.join(''));
            cb(cleanedNodeList);
            return;
          }

          if(codeTagOpen) {
            name = 'pre';
            codeTagOpen = false;
          } else if(italicTagOpen) {
            name = 'i';
            italicTagOpen = false;
          } else if(boldTagOpen) {
            name = 'b';
            boldTagOpen = false;
          } 

          if(name !== 'img') {
            nodelist.push('</' + name + '>');
          }

        }
    });
    parser.write(htmlData);
    parser.end();
  },

  'unzipFiles' : function unzipFiles(path) {

    fs.mkdir('./output/images', function(err) {
      if (err) throw err;
    });

    fs.readFile(path, {encoding: 'binary'}, function(err, data){
      if (err) throw err;
      var zip = new require('node-zip')(data, {base64: false, checkCRC32: true});
      for (var file in zip.files) {
        if(!zip.files[file].options.dir) {
          fs.writeFile('./output/' + zip.files[file].name, zip.files[file].data, function (err) { 
            if (err) throw err;
          });
        }
      }
    });

  },

  '_cleanNodeList' : function cleanNodeList(nl) {

    // clean up pre tag and multi line code blocks 
    nl = nl.replace(/<p><pre>/gi, '<pre>');
    nl = nl.replace(/<\/pre><\/p>/gi, '</pre>');
    nl = nl.replace(/<\/pre><pre>/gi, '\n');
    nl = nl.replace(/<\/pre>+\s+<pre>/gi, '\n');

    // clean up inline code
    nl = nl.replace(/<\/span><pre>/gi, '</span><code>');
    nl = nl.replace(/<\/pre><span>/gi, '</code><span>');

    // remove all span tags
    nl = nl.replace(/<span>/gi, '');
    nl = nl.replace(/<\/span>/gi, '');

    // clean empty a tags
    nl = nl.replace(/<a href="#"><\/a>/gi, '');

    return nl;
  }
}

module.exports = GD2M;