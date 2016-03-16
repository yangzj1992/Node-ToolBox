var async = require("async");
var request = require('superagent');
var cheerio = require('cheerio');

var url = 'qcyoung.com';
async.waterfall([
  function(callback) {
    request
      .get(url + '/archives')
      .end(function(err, res) {
        if(err){
          console.log(err.message);
        }
        var $ = cheerio.load(res.text);
        var urls = [];
        $('#services .title a').each(function(id, elem) {
          urls.push(url + $(elem).attr('href'));
        });
        callback(null, urls);
      });
  },
  function(urls, callback) {
    async.mapLimit(urls, 5, function(urlId, callback) { //并发数是5
      var d = new Date();
      console.log(d.getSeconds() + 's ' + d.getMilliseconds() + 'ms ' + '正在抓取：' + urlId);
      urlId = encodeURI(urlId);
      request
        .get(urlId)
        .on('error',function(err){
          if(err){
            console.log(err.message);
          }
        })
        .end(function(err, res) {
          var $ = cheerio.load(res.text);
          callback(null, $('.summary .post-words').text());
        });
    }, function(err, res) {
      console.log('文章字数:');
      console.log(res);
      callback();
    });
  }], function(err, res) {
    console.log(res);
  }
);