var cli = require("commander");
var request = require("request");
var cheerio = require("cheerio");
var config = require('./mailconfig.js');
var nodemailer = require('nodemailer');
var smtpTransport = nodemailer.createTransport('smtps://'+config.mail.from.auth.user+':'+config.mail.from.auth.pass+'@smtp.'+config.mail.from.service+'.com');

var urlTmp = "https://lantouzi.com/bianxianjihua/index?page=%d&size=14&tag=2";
var arr = [1,2,3,4,5,6];
var REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:13.0) Gecko/20100101 Firefox/13.0',
};

// 完整的命令如： node mail.js -d 50 -p 9
cli.allowUnknownOption()
   .version( require("./package.json").version )
   .option("-d, --day [value]", "max date") //选取最大日期长度
   .option("-p, --profit [value]", "min profit") // 收益率
   .parse( process.argv );

var minProfit = typeof cli.profit !== undefined && parseFloat(cli.profit) ? parseFloat(cli.profit) : 8.00;
var maxDays = typeof cli.day !== undefined && parseInt(cli.day, 10) ? parseInt(cli.day, 10) : 100;

var pros = arr.map(function (el){
    var url = urlTmp.replace(/%d/, el);

    return new Promise(function (resolve, reject){
        request({
            url : url,
            header: REQUEST_HEADERS
        },  function(err, httpResponse, body) {
            if (err){
                reject(err);
            } 

            resolve(body);
        });
    }); 
});


function sendMail(subject, html) {
    var mailOptions = {
        from: [config.mail.from.name, config.mail.from.auth.user].join(' '),
        to: config.mail.to.join(','),
        subject: subject,
        html: html
    };

    smtpTransport.sendMail(mailOptions, function(error, response){
        if (error) {
            console.log(error);
        } else {
            console.log('Message sent: ' + response.response);
        }
        smtpTransport.close();
    });
};


Promise.all(pros).then(function(data){
    data = data.reduce(function (prev, current){
        var $ = cheerio.load(current, { decodeEntities: false });

        var lists = $(".project-list li").filter(function (){
            var profit = $(this).find(".info-one em").html().replace('%', '');//利润
            var days = $(this).find(".info-two em").html();//时间
            var leave = $(this).find(".info-three em").text();//可投金额

            var padZero = function (n){
                return n < 10 ? "0" + n : n;
            }; 

            var expire = new Date(+(new Date()) + days * 864e5);
            var expireDate = [expire.getFullYear(), padZero(expire.getMonth()+1), padZero(expire.getDate())].join("-"); 
            $(this).attr("data-expire-date", expireDate);

            return parseFloat(profit) >= minProfit && parseInt(days, 10) <= maxDays && parseFloat(leave) > 0.00; 
        });

        lists = lists.map(function (){
            return [$(this).find(".info-one em").html(),  $(this).find(".info-two em").html() + "天",  "剩余"+$(this).find(".info-three em").text(), "到期:"+$(this).attr("data-expire-date") ,$(this).find(".info-four a").attr("href")].join('\t');  
        }).toArray();

        return prev.concat(lists);
    }, []);

    if (data.length >0) {
        sendMail('懒投资高变现项目收集', data.join("\n"));
    }
    console.log(data.join("\n"));
});