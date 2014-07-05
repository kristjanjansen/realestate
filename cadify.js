var fs = require('fs')

var parser = require('csv-parser')
var transform = require('stream-transform');
var writer = require('csv-write-stream')
var request = require('request')
var p4js = require("proj4")
require('proj4js-defs')(p4js)


var transformer = transform(function(row, callback) {
  if (row.cad) {
    getCad(row.cad, function(data) {
      var lest = LestToGeo(data[1].X, data[1].Y)
      row.lat = lest.lat
      row.lng = lest.lng
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
  var url = 'http://geoportaal.maaamet.ee/url/xgis-ky.php?out=json&what=tsentroid&ky=' + cad
  request({url: url, json: true}, function (error, res, body) {
      callback(body)
  })
}

function LestToGeo(x, y) {
  var src = new p4js.Proj(p4js.defs['EPSG:3301'])
  var dst = new p4js.Proj(p4js.defs['EPSG:4326'])
  var geo = p4js.transform(src, dst, [x, y])
  return ({lat: geo.y, lng: geo.x})
}


