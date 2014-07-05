var fs = require('fs')

var parser = require('csv-parser')
var transform = require('stream-transform');
var writer = require('csv-write-stream')
var request = require('request')


var transformer = transform(function(row, callback) {
  if (row.cad) {
    getCad(row.cad, function(data) {
      row.address = data[1].Lähiaadress
      callback(null, row)
    })
  } else {
    callback(null, row)
  }
}, 
{parallel: 1})


process.stdin
  .pipe(parser())
  .pipe(transformer)
  .pipe(writer())
  .pipe(process.stdout)


function getCad(cad, callback) {
  var url = 'http://geoportaal.maaamet.ee/url/xgis-ky.php?out=json&ky=' + cad
  request({url: url, json: true}, function (error, res, body) {
      callback(body)
  })
}