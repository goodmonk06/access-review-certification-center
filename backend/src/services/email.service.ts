interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

class EmailService {
  private enabled: boolean;
  private from: string;

  constructor() {
    this.enabled = process.env.EMAIL_ENABLED === 'true';
    this.from = process.env.EMAIL_FROM || 'noreply@accessreview.local';
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.enabled) {
      console.log('[EMAIL STUB] Would send email:');
      console.log(`  From: ${this.from}`);
      console.log(`  To: ${options.to}`);
      console.log(`  Subject: ${options.subject}`);
      console.log(`  Body: ${options.body}`);
      return;
    }

    // In production, integrate with actual email service (SendGrid, SES, etc.)
    console.log(`Sending email to ${options.to}: ${options.subject}`);
  }

  async sendReviewNotification(reviewerEmail: string, campaignName: string, itemCount: number): Promise<void> {
    await this.sendEmail({
      to: reviewerEmail,
      subject: `Access Review Required: ${campaignName}`,
      body: `You have ${itemCount} access grants to review for campaign "${campaignName}". Please log in to the access review portal to complete your review.`,
    });
  }
}

export const emailService = new EmailService();
