var nodemailer = require('nodemailer'),
    config = require('./mailconfig.js'),
    smtpTransport = nodemailer.createTransport('smtps://'+config.mail.from.auth.user+':'+config.mail.from.auth.pass+'@smtp.'+config.mail.from.service+'.com');

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

sendMail('测试发邮件', '<p>Hello world!</p>');