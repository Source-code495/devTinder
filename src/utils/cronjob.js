const cron = require("node-cron");
const { subDays, startOfDay, endOfDay } = require("date-fns");
const ConnectionRequestModel = require("../models/connectionRequest"); // Adjust import if needed
const sendEmail = require("../utils/sendEmail"); // Ensure you have this function

// Schedule cron job to run at 8 AM daily
cron.schedule("0 8 * * *", async () => {
  console.log("📩 Running scheduled job to notify users with pending requests...");

  try {
    const yesterday = subDays(new Date(), 1);

    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    const pendingRequests = await ConnectionRequestModel.find({
      status: "interested",
      createdAt: {
        $gte: yesterdayStart,
        $lt: yesterdayEnd,
      },
    }).populate("fromUserId toUserId");

    const listOfEmails = [ 
      ...new Set(pendingRequests.map((req) => req.toUserId.emailId)),
    ];

    console.log("📧 Users to notify:", listOfEmails);

    // Send email notifications
    for (const email of listOfEmails) {
      try {
        const subject = "🚀 You have pending friend requests!";
        const message = "You have new friend requests pending. Login to accept or reject them.";

        await sendEmail(email, subject, message);
        console.log(`✅ Email sent successfully to ${email}`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error.message);
      }
    }
  } catch (error) {
    console.error("❌ Error fetching pending requests:", error);
  }
});
