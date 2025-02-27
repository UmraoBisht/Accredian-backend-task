require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Referral submission endpoint
app.post("/api/referrals", async (req, res) => {
  const { referrerName, referrerEmail, refereeName, refereeEmail, course } =
    req.body;

  // Basic validation
  if (
    !referrerName ||
    !referrerEmail ||
    !refereeName ||
    !refereeEmail ||
    !course
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const referral = await prisma.referral.create({
      data: { referrerName, referrerEmail, refereeName, refereeEmail, course },
    });

    // Send email notification
    await sendReferralEmail(referrerEmail, refereeEmail, course);

    res
      .status(201)
      .json({ message: "Referral submitted successfully", referral });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Email sending function
async function sendReferralEmail(referrerEmail, refereeEmail, course) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, // Use App Password if 2FA is enabled
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: refereeEmail,
    subject: "You’ve Been Referred!",
    text: `Hi! ${referrerEmail} has referred you to check out ${course}. Join now and start learning!`,
  };

  await transporter.sendMail(mailOptions);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
