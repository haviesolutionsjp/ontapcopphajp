import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const gmailUser = process.env.GMAIL_USER || "haviesolutions.jp@gmail.com";
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    const displayName = name || email.split("@")[0] || "Thực tập sinh";

    // If GMAIL_APP_PASSWORD is set, send actual email via Gmail SMTP
    if (gmailAppPassword) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Chào mừng bạn đến với Ôn Thi Cốp Pha Nhật Bản</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">🏗️ ÔN THI CỐP PHA NHẬT BẢN</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #c7d2fe;">型枠施工 · Chuyển Giai Đoạn 1</p>
            </div>
            
            <div style="padding: 32px 24px;">
              <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Xin chào ${displayName}! 👋</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #334155;">
                Chúc mừng bạn đã đăng ký thành công tài khoản trên hệ thống <strong>Ôn Thi Cốp Pha Nhật Bản</strong>. Chúng tôi rất vui được đồng hành cùng bạn trong kỳ thi chuyển giai đoạn 1 (型枠施工)!
              </p>
              
              <div style="background-color: #f1f5f9; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1e1b4b;">🌟 Những tính năng bạn có thể sử dụng ngay:</h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #475569;">
                  <li><strong>Luyện thi trắc nghiệm ○/×:</strong> Bộ đề thi chuẩn 6 đề thi giai đoạn 1 với đồng hồ đếm ngược.</li>
                  <li><strong>Học từ vựng chuyên ngành:</strong> Danh mục từ vựng Cốp pha có phát âm audio TTS tiếng Nhật chuẩn giọng đọc.</li>
                  <li><strong>Theo dõi tiến độ:</strong> Lưu lại kết quả bài thi và lịch sử ôn tập tự động.</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="https://ontapcopphajp.vercel.app" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.25);">Bắt Đầu Ôn Thi Ngay 🚀</a>
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 32px;">
                Email này được gửi tự động từ <strong>${gmailUser}</strong>.<br>
                Nếu bạn cần hỗ trợ, vui lòng phản hồi trực tiếp email này.<br>
                Chúc bạn ôn tập thật tốt và đạt kết quả cao trong kỳ thi! 🎉
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: `"Ôn Thi Cốp Pha Nhật Bản" <${gmailUser}>`,
        to: email,
        subject: "🎉 Chào mừng bạn đến với Ôn Thi Cốp Pha Nhật Bản (型枠施工)",
        html: htmlContent,
      });

      return NextResponse.json({ success: true, message: "Welcome email sent successfully" });
    } else {
      console.log(`[SIMULATION] GMAIL_APP_PASSWORD not set. Welcome email for ${email} from ${gmailUser} simulated.`);
      return NextResponse.json({
        success: true,
        simulated: true,
        message: "Welcome email simulated (GMAIL_APP_PASSWORD not configured in environment variables)",
      });
    }
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return NextResponse.json({ error: error?.message || "Failed to send welcome email" }, { status: 500 });
  }
}
