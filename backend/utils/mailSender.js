const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  console.log(email, title, body);

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: "SmartCampus",
      to: email,
      subject: title,
      html: body,
    });

    return info;
  } catch (err) {
    console.error(err);
  }
};

module.exports = mailSender;
