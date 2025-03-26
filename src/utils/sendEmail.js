const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { subDays, startOfDay, endOfDay } = require("date-fns");
const ConnectionRequestModel = require("../models/connectionRequest"); // Update the path if needed

// 📨 Email Sender Function
const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Set in your .env file
        pass: process.env.EMAIL_PASS // App Password (not your real password)
      },
      secure : true,
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.response}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
  }
};
module.exports = sendEmail;