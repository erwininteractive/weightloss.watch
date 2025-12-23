#!/usr/bin/env ts-node
/**
 * SMTP Diagnostic Tool
 *
 * Run this on production to test SMTP configuration
 * Usage: npx ts-node scripts/test-smtp.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.production" }); // Try production env first
if (!process.env.SMTP_HOST) {
	dotenv.config(); // Fallback to .env
}

import nodemailer from "nodemailer";

async function testSMTP() {
	console.log("=".repeat(60));
	console.log("SMTP Diagnostic Tool");
	console.log("=".repeat(60));
	console.log();

	// Display current configuration (without password)
	console.log("Current SMTP Configuration:");
	console.log("-".repeat(60));
	console.log(`  NODE_ENV:     ${process.env.NODE_ENV || "not set"}`);
	console.log(`  SMTP_HOST:    ${process.env.SMTP_HOST || "not set"}`);
	console.log(`  SMTP_PORT:    ${process.env.SMTP_PORT || "not set"}`);
	console.log(`  SMTP_SECURE:  ${process.env.SMTP_SECURE || "not set"}`);
	console.log(`  SMTP_USER:    ${process.env.SMTP_USER || "not set"}`);
	console.log(
		`  SMTP_PASS:    ${process.env.SMTP_PASS ? "***" + process.env.SMTP_PASS.slice(-4) : "not set"}`,
	);
	console.log(`  SMTP_FROM:    ${process.env.SMTP_FROM || "not set"}`);
	console.log();

	if (!process.env.SMTP_HOST) {
		console.error("❌ ERROR: SMTP_HOST is not configured");
		console.log();
		console.log("Please set SMTP configuration in .env or .env.production");
		process.exit(1);
	}

	// Test 1: Basic connection with current settings
	console.log("Test 1: Testing current configuration...");
	console.log("-".repeat(60));

	try {
		const transporter1 = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: parseInt(process.env.SMTP_PORT || "587"),
			secure: process.env.SMTP_SECURE === "true",
			auth:
				process.env.SMTP_USER && process.env.SMTP_PASS
					? {
							user: process.env.SMTP_USER,
							pass: process.env.SMTP_PASS,
						}
					: undefined,
			connectionTimeout: 10000,
			greetingTimeout: 10000,
			socketTimeout: 30000,
			tls: {
				rejectUnauthorized: false, // For testing only
				minVersion: "TLSv1.2",
			},
			logger: true, // Enable logging
			debug: true, // Enable debug
		});

		await transporter1.verify();
		console.log("Connection successful with current settings!");
		console.log();

		// Try sending a test email
		console.log("Test 2: Sending test email...");
		console.log("-".repeat(60));

		const testEmail = process.argv[2] || "test@example.com";
		console.log(`  Sending to: ${testEmail}`);

		const info = await transporter1.sendMail({
			from: process.env.SMTP_FROM || "noreply@example.com",
			to: testEmail,
			subject: `SMTP Test - ${new Date().toISOString()}`,
			text: "This is a test email from the SMTP diagnostic tool.",
			html: "<p>This is a test email from the SMTP diagnostic tool.</p>",
		});

		console.log("Email sent successfully!");
		console.log(`  Message ID: ${info.messageId}`);
		console.log(`  Response: ${info.response}`);
		console.log();
	} catch (error) {
		console.log("Test failed with current settings");
		if (error instanceof Error) {
			console.log(`  Error: ${error.message}`);
			console.log(`  Name: ${error.name}`);
		}
		console.log();

		// Test 2: Try alternative port 587 with STARTTLS
		if (process.env.SMTP_PORT === "465") {
			console.log("Test 3: Trying port 587 with STARTTLS instead...");
			console.log("-".repeat(60));

			try {
				const transporter2 = nodemailer.createTransport({
					host: process.env.SMTP_HOST,
					port: 587,
					secure: false, // Use STARTTLS
					auth:
						process.env.SMTP_USER && process.env.SMTP_PASS
							? {
									user: process.env.SMTP_USER,
									pass: process.env.SMTP_PASS,
								}
							: undefined,
					connectionTimeout: 10000,
					greetingTimeout: 10000,
					socketTimeout: 30000,
					tls: {
						rejectUnauthorized: false,
						minVersion: "TLSv1.2",
					},
				});

				await transporter2.verify();
				console.log("Port 587 works! Update your .env.production to:");
				console.log('  SMTP_PORT="587"');
				console.log('  SMTP_SECURE="false"');
				console.log();
			} catch (error2) {
				console.log("Port 587 also failed");
				if (error2 instanceof Error) {
					console.log(`  Error: ${error2.message}`);
				}
				console.log();
			}
		}

		// Test 3: Try alternative port 465 with SSL
		if (process.env.SMTP_PORT === "587") {
			console.log("Test 4: Trying port 465 with SSL instead...");
			console.log("-".repeat(60));

			try {
				const transporter3 = nodemailer.createTransport({
					host: process.env.SMTP_HOST,
					port: 465,
					secure: true, // Use SSL
					auth:
						process.env.SMTP_USER && process.env.SMTP_PASS
							? {
									user: process.env.SMTP_USER,
									pass: process.env.SMTP_PASS,
								}
							: undefined,
					connectionTimeout: 10000,
					greetingTimeout: 10000,
					socketTimeout: 30000,
					tls: {
						rejectUnauthorized: false,
						minVersion: "TLSv1.2",
					},
				});

				await transporter3.verify();
				console.log("Port 465 works! Update your .env.production to:");
				console.log('  SMTP_PORT="465"');
				console.log('  SMTP_SECURE="true"');
				console.log();
			} catch (error3) {
				console.log("Port 465 also failed");
				if (error3 instanceof Error) {
					console.log(`  Error: ${error3.message}`);
				}
				console.log();
			}
		}

		console.log("=".repeat(60));
		console.log("Troubleshooting Tips:");
		console.log("-".repeat(60));
		console.log("1. Verify SMTP credentials are correct");
		console.log("2. Check if firewall blocks outbound SMTP ports");
		console.log(
			"3. Try: telnet " +
				process.env.SMTP_HOST +
				" " +
				(process.env.SMTP_PORT || "587"),
		);
		console.log("4. Check production server logs: pm2 logs wlt --err");
		console.log("5. Verify .env.production file exists and is loaded");
		console.log("=".repeat(60));

		process.exit(1);
	}

	console.log("=".repeat(60));
	console.log("All tests passed! SMTP is configured correctly.");
	console.log("=".repeat(60));
	process.exit(0);
}

testSMTP().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
