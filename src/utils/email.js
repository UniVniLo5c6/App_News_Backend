const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER, // gmail của bạn
    pass: process.env.MAIL_PASS  // app password (không phải mật khẩu gmail)
  }
});

exports.sendMail = async ({ to, subject, text, html }) => {
  return transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    text,
    html
  });
};
