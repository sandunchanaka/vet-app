declare module 'nodemailer' {
  interface TransportOptions {
    [key: string]: unknown;
  }

  interface MailOptions {
    [key: string]: unknown;
  }

  interface Transporter {
    sendMail(mailOptions: MailOptions): Promise<unknown>;
  }

  export function createTransport(options: TransportOptions): Transporter;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}
