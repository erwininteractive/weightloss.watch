import { emailService } from './src/services/email.service';

async function testEmail() {
    console.log('Testing SMTP connection...');

    try {
        const isConnected = await emailService.verifyConnection();

        if (isConnected) {
            console.log('✓ SMTP connection successful!');

            // Try sending a test email
            console.log('\nSending test email...');
            await emailService.sendVerificationEmail(
                'andrewerwin73@gmail.com',
                'Test User',
                'test-token-12345'
            );
            console.log('✓ Test email sent successfully!');
        } else {
            console.log('✗ SMTP connection failed. Check your credentials and settings.');
        }
    } catch (error) {
        console.error('✗ Error:', error);
    }

    process.exit(0);
}

testEmail();
