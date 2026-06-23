import * as nodemailer from "nodemailer";
import type { GmailConfig, SendResult } from "@seeker/shared-types";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export class EmailSender {
  public static async send(payload: EmailPayload, gmail: GmailConfig): Promise<SendResult> {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmail.email,
        pass: gmail.appPassword
      }
    });
    try {
      await transporter.sendMail({
        from: gmail.email,
        to: payload.to,
        subject: payload.subject,
        html: payload.html
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
