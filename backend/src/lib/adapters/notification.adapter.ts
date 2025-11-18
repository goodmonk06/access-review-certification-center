import { NotificationChannel } from '@prisma/client';

export interface NotificationMessage {
  recipient: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface INotificationAdapter {
  send(message: NotificationMessage): Promise<void>;
  sendBatch(messages: NotificationMessage[]): Promise<void>;
}

/**
 * Console logger implementation (for development)
 */
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async send(message: NotificationMessage): Promise<void> {
    console.log('[NOTIFICATION]', {
      channel: message.channel,
      to: message.recipient,
      subject: message.subject,
      body: message.body.substring(0, 100) + '...',
    });
  }

  async sendBatch(messages: NotificationMessage[]): Promise<void> {
    for (const message of messages) {
      await this.send(message);
    }
  }
}

/**
 * Email adapter (stub - integrate with SendGrid, SES, etc.)
 */
export class EmailNotificationAdapter implements INotificationAdapter {
  async send(message: NotificationMessage): Promise<void> {
    // TODO: Integrate with email service
    console.log('[EMAIL]', message.recipient, message.subject);
  }

  async sendBatch(messages: NotificationMessage[]): Promise<void> {
    // TODO: Batch send for better performance
    for (const message of messages) {
      await this.send(message);
    }
  }
}

/**
 * Slack adapter (stub)
 */
export class SlackNotificationAdapter implements INotificationAdapter {
  async send(message: NotificationMessage): Promise<void> {
    // TODO: Integrate with Slack API
    console.log('[SLACK]', message.recipient, message.subject);
  }

  async sendBatch(messages: NotificationMessage[]): Promise<void> {
    for (const message of messages) {
      await this.send(message);
    }
  }
}
