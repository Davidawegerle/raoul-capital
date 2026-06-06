const n = require('nodemailer');
const t = n.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'davidwegerle@gmail.com',
    pass: 'mvlqqawhaxetzbsh'
  }
});
t.sendMail({
  from: 'davidwegerle@gmail.com',
  to: 'david@cccis.space',
  subject: 'Raoul Capital Test',
  html: '<h2>Test email working!</h2>'
}).then(r => console.log('SENT!', r.messageId))
  .catch(e => console.log('FAILED:', e.message));