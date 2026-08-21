export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export abstract class EmailService {
  abstract sendEmail(input: SendEmailInput): Promise<void>;
}
