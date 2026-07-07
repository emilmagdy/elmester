const nodemailer = require("nodemailer");

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
    host :'smtp.gmail.com',
    port : 465,
    secure: true,
    auth :{
        user : process.env.EMAIL_USER,
        pass : process.env.EMAIL_PASS
    }
});

const sendVerificationEmail = async (toEmail, verificationToken) => {
    const verificationUrl = `http://localhost:3000/verification-email?token=${verificationToken}`;

    const mailOptions = {
        from : `"منصة المستر " <${process.env.EMAIL_USER }>`,
        to : toEmail ,
        subject : 'تفعيل حسابك على منصة المستر 🚀',
        html : `
        <div style="direction: rtl; text-align: right; font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2>أهلاً بك في منصة المستر! 👋</h2>
                <p>اضغط على الزرار اللي تحت ده عشان تفعل حسابك:</p>
                <a href="${verificationUrl}" style="background-color: #3182ce; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">تفعيل الحساب</a>
            </div>
            `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log('mail sent successfuly');
    } catch (err) {
        console.error("Error", err);
        throw new Error("خطا فى ارسال ايميل التفعيل")

    };
};

module.exports = {sendVerificationEmail};

