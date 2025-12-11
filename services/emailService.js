const nodemailer = require('nodemailer');

// Email service configuration
class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendAssignmentNotification(userEmail, userName, taskName, managerName) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `🔔 Thông báo giao việc: ${taskName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; background-color: #003D82; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0;">🔔 Thông báo giao việc</h1>
                    </div>
                    
                    <div style="padding: 20px; background-color: #f9f9f9;">
                        <h2 style="color: #003D82;">Xin chào ${userName}!</h2>
                        
                        <p style="font-size: 16px; line-height: 1.6;">
                            Bạn có một công việc mới được giao bởi <strong>${managerName}</strong>:
                        </p>
                        
                        <div style="background-color: white; padding: 15px; border-left: 4px solid #003D82; margin: 20px 0;">
                            <h3 style="margin: 0; color: #003D82;">📋 ${taskName}</h3>
                        </div>
                        
                        <p style="font-size: 16px; line-height: 1.6;">
                            Vui lòng đăng nhập vào hệ thống để xem chi tiết và thực hiện hành động:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${'https://taskhadflow.nibies.space'}" 
                               style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                ✅ Chấp nhận công việc
                            </a>
                            <span style="margin: 0 10px;">hoặc</span>
                            <a href="${'https://taskhadflow.nibies.space'}" 
                               style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                ❌ Từ chối công việc
                            </a>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        
                        <p style="font-size: 14px; color: #666; text-align: center;">
                            Email này được gửi tự động từ Hệ thống Quản lý Công việc.<br>
                            Vui lòng không trả lời email này.
                        </p>
                    </div>
                </div>
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Assignment email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending assignment email:', error);
            throw error;
        }
    }

    async sendAssignmentUpdateNotification(userEmail, userName, taskName, status, reason = null) {
        const statusMessages = {
            accepted: {
                subject: '✅ Công việc đã được chấp nhận',
                title: '✅ Công việc đã được chấp nhận',
                message: 'đã chấp nhận công việc',
                color: '#28a745'
            },
            declined: {
                subject: '❌ Công việc đã bị từ chối',
                title: '❌ Công việc đã bị từ chối',
                message: 'đã từ chối công việc',
                color: '#dc3545'
            }
        };

        const statusInfo = statusMessages[status];
        if (!statusInfo) return;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `${statusInfo.subject}: ${taskName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; background-color: ${statusInfo.color}; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0;">${statusInfo.title}</h1>
                    </div>
                    
                    <div style="padding: 20px; background-color: #f9f9f9;">
                        <h2 style="color: ${statusInfo.color};">Xin chào ${userName}!</h2>
                        
                        <p style="font-size: 16px; line-height: 1.6;">
                            Nhân viên ${statusInfo.message}:
                        </p>
                        
                        <div style="background-color: white; padding: 15px; border-left: 4px solid ${statusInfo.color}; margin: 20px 0;">
                            <h3 style="margin: 0; color: ${statusInfo.color};">📋 ${taskName}</h3>
                        </div>
                        
                        ${reason ? `
                        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                            <h4 style="margin: 0 0 10px 0; color: #856404;">💬 Lý do từ chối:</h4>
                            <p style="margin: 0; color: #856404;">${reason}</p>
                        </div>
                        ` : ''}
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        
                        <p style="font-size: 14px; color: #666; text-align: center;">
                            Email này được gửi tự động từ Hệ thống Quản lý Công việc.<br>
                            Vui lòng không trả lời email này.
                        </p>
                    </div>
                </div>
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Assignment update email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending assignment update email:', error);
            throw error;
        }
    }

    // Test email function
    async sendTestEmail(toEmail) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: '🧪 Test Email - Hệ thống Quản lý Công việc',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; background-color: #003D82; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0;">🧪 Test Email</h1>
                    </div>
                    
                    <div style="padding: 20px; background-color: #f9f9f9;">
                        <h2 style="color: #003D82;">Email Service hoạt động tốt!</h2>
                        <p style="font-size: 16px; line-height: 1.6;">
                            Đây là email test từ Hệ thống Quản lý Công việc. Nếu bạn nhận được email này, 
                            có nghĩa là email service đã được cấu hình thành công.
                        </p>
                        <div style="background-color: white; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
                            <p style="margin: 0; color: #28a745; font-weight: bold;">✅ Email service hoạt động bình thường</p>
                        </div>
                    </div>
                </div>
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Test email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending test email:', error);
            throw error;
        }
    }

    // Generic notification sender used for ad-hoc notifications (e.g., request to join)
    async sendGenericNotification(userEmail, userName, subjectText, messageText) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: subjectText,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; background-color: #003D82; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0;">${subjectText}</h1>
                    </div>
                    <div style="padding: 20px; background-color: #f9f9f9;">
                        <h2 style="color: #003D82;">Xin chào ${userName}!</h2>
                        <p style="font-size: 16px; line-height: 1.6;">${messageText}</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        <p style="font-size: 14px; color: #666; text-align: center;">Email này được gửi tự động từ Hệ thống Quản lý Công việc.</p>
                    </div>
                </div>
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Generic notification email sent:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending generic notification email:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();