var async = require('async')
var request = require('request')
var $ = require('cheerio')
var csvWriter = require('csv-write-stream')
var fs = require('fs')


var url = 'http://www.kv.ee/?act=search.simple&county=11&parish=447&page_size=100&page='
var delay = 30


request(url + '1', function (error, res, body) {
  body = $.load(body)
  var count = body('.main-content-wrap .grid .col-1-3 h1.inner').text().trim().split(' ')[2]
  var pages = Math.ceil(parseInt(count) / 100)
  var urls = []
  for (var i = 1; i < pages + 1; i++) {
    urls.push(url + i)
  }
  async.eachLimit(urls, 1,
    function(url, callback) {
    request(url, function (error, res, body) {
      body = $.load(body)
      body('table.object-list-table tr').slice(5, 10).each(function(i, tr) {
        if (!$(tr).hasClass('hide-on-mobile')) {
          var url = $(tr).children().eq(1).find('a').first().attr('href')
          setTimeout(function() {
            queue.push(url)
          }, delay)
        }
      })
    callback(null)
    })
  })
})


var writer = csvWriter()
writer.pipe(process.stdout)


var queue = async.queue(function (url, callback) {

  request(url, function (error, res, body) {
    body = $.load(body)
    var title = body('.hgroup .title').text()
    var el = title.split('(')[0].split(', ')
    var address = cap(el[el.length - 1].trim().replace('tn ',''))
    var price = body('.object-article-details .object-price strong').text().trim().replace(/\s+/g, '').replace('€','')
    var cad = ''
    var size = ''
    body('.object-data-meta tr th').each(function(i, el) {
      if ($(el).text() == 'Üldpind') {
        size = $(el).parent().find('td').first().text().trim().replace('m²', '').trim()
      }
      if ($(el).text() == 'Katastrinumber') {
        cad = $(el).parent().find('a').first().text()
      }
    })
    writer.write({address: address, price: price, size: size, cad: cad, lat: '', lng: ''})
    setTimeout(callback, delay)    

  })
  
},
1);


queue.drain = function() {
  //writer.end()
}


function getCad(cad, callback) {
  var url = 'http://geoportaal.maaamet.ee/url/xgis-ky.php?out=json&ky=' + cad
  request({url: url, json: true}, function (error, res, body) {
      callback(body)
  })
}

function cap(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
}