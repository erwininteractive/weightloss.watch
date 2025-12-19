import nodemailer, { Transporter } from "nodemailer";
import crypto from "crypto";

export class EmailService {
	private transporter: Transporter;

	constructor() {
		// Configure nodemailer with SMTP settings
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || "localhost",
			port: parseInt(process.env.SMTP_PORT || "587"),
			secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
			requireTLS: process.env.SMTP_SECURE !== "true", // Require STARTTLS for port 587
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
			tls: {
				// Do not fail on invalid certs in development
				rejectUnauthorized: process.env.NODE_ENV === "production",
			},
		});
	}

	/**
	 * Generate a secure email verification token
	 */
	generateVerificationToken(): string {
		return crypto.randomBytes(32).toString("hex");
	}

	/**
	 * Send email verification message
	 */
	async sendVerificationEmail(
		email: string,
		username: string,
		token: string
	): Promise<void> {
		const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

		const mailOptions = {
			from: process.env.SMTP_FROM || "noreply@example.com",
			to: email,
			subject: "Verify your email address",
			html: this.getVerificationEmailTemplate(username, verificationUrl),
			text: `Hello ${username},\n\nPlease verify your email address by clicking the following link:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.`,
		};

		await this.transporter.sendMail(mailOptions);
	}

	/**
	 * Send password reset email
	 */
	async sendPasswordResetEmail(
		email: string,
		username: string,
		token: string
	): Promise<void> {
		const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

		const mailOptions = {
			from: process.env.SMTP_FROM || "noreply@example.com",
			to: email,
			subject: "Reset your password",
			html: this.getPasswordResetEmailTemplate(username, resetUrl),
			text: `Hello ${username},\n\nYou requested to reset your password. Click the following link to reset it:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email.`,
		};

		await this.transporter.sendMail(mailOptions);
	}

	/**
	 * Get HTML template for verification email
	 */
	private getVerificationEmailTemplate(
		username: string,
		verificationUrl: string
	): string {
		return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
	<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
		<tr>
			<td style="padding: 20px 0;">
				<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					<!-- Header -->
					<tr>
						<td style="padding: 40px 30px; text-align: center; background-color: #4f46e5; border-radius: 8px 8px 0 0;">
							<h1 style="margin: 0; color: #ffffff; font-size: 28px;">Weight Loss Tracker</h1>
						</td>
					</tr>

					<!-- Content -->
					<tr>
						<td style="padding: 40px 30px;">
							<h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Verify Your Email Address</h2>
							<p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
								Hello ${username},
							</p>
							<p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
								Thank you for signing up! Please verify your email address to complete your registration and start tracking your weight loss journey.
							</p>
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
								<tr>
									<td style="padding: 20px 0; text-align: center;">
										<a href="${verificationUrl}" style="display: inline-block; padding: 14px 40px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Verify Email Address</a>
									</td>
								</tr>
							</table>
							<p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
								Or copy and paste this link into your browser:<br>
								<a href="${verificationUrl}" style="color: #4f46e5; word-break: break-all;">${verificationUrl}</a>
							</p>
							<p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
								This link will expire in 24 hours.
							</p>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
							<p style="margin: 0; color: #999999; font-size: 14px;">
								If you did not create an account, please ignore this email.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
		`;
	}

	/**
	 * Get HTML template for password reset email
	 */
	private getPasswordResetEmailTemplate(
		username: string,
		resetUrl: string
	): string {
		return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
	<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
		<tr>
			<td style="padding: 20px 0;">
				<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					<!-- Header -->
					<tr>
						<td style="padding: 40px 30px; text-align: center; background-color: #4f46e5; border-radius: 8px 8px 0 0;">
							<h1 style="margin: 0; color: #ffffff; font-size: 28px;">Weight Loss Tracker</h1>
						</td>
					</tr>

					<!-- Content -->
					<tr>
						<td style="padding: 40px 30px;">
							<h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Reset Your Password</h2>
							<p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
								Hello ${username},
							</p>
							<p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
								We received a request to reset your password. Click the button below to choose a new password.
							</p>
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
								<tr>
									<td style="padding: 20px 0; text-align: center;">
										<a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Reset Password</a>
									</td>
								</tr>
							</table>
							<p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
								Or copy and paste this link into your browser:<br>
								<a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a>
							</p>
							<p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
								This link will expire in 1 hour.
							</p>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
							<p style="margin: 0; color: #999999; font-size: 14px;">
								If you did not request a password reset, please ignore this email and your password will remain unchanged.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
		`;
	}

	/**
	 * Verify SMTP connection
	 */
	async verifyConnection(): Promise<boolean> {
		try {
			await this.transporter.verify();
			return true;
		} catch (error) {
			console.error("SMTP connection error:", error);
			return false;
		}
	}
}

export const emailService = new EmailService();
