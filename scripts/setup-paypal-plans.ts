/**
 * Script to create PayPal subscription plans for development/sandbox
 * Run this after setting up your PayPal Sandbox credentials
 *
 * Usage: npx ts-node scripts/setup-paypal-plans.ts
 */

import dotenv from 'dotenv';
import { paypalConfig } from '../src/config/paypal';

dotenv.config();

interface PayPalProduct {
    id: string;
    name: string;
}

interface PayPalPlan {
    id: string;
    name: string;
}

async function getAccessToken(): Promise<string> {
    const auth = Buffer.from(
        `${paypalConfig.clientId}:${paypalConfig.clientSecret}`
    ).toString('base64');

    const response = await fetch(`${paypalConfig.apiUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
}

async function createProduct(accessToken: string): Promise<PayPalProduct> {
    console.log('\n📦 Creating PayPal product...');

    const response = await fetch(`${paypalConfig.apiUrl}/v1/catalogs/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            name: 'WeighTogether Support',
            description: 'Support WeighTogether development and hosting',
            type: 'SERVICE',
            category: 'SOFTWARE',
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create product: ${error}`);
    }

    const product = await response.json();
    console.log(`✅ Product created: ${product.id}`);
    return product;
}

async function createPlan(
    accessToken: string,
    productId: string,
    type: 'monthly' | 'yearly',
    amount: number
): Promise<PayPalPlan> {
    const planName = type === 'monthly'
        ? 'Monthly Support'
        : 'Yearly Support';

    const interval = type === 'monthly' ? 'MONTH' : 'YEAR';

    console.log(`\n📝 Creating ${type} subscription plan ($${amount})...`);

    const response = await fetch(`${paypalConfig.apiUrl}/v1/billing/plans`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=representation',
        },
        body: JSON.stringify({
            product_id: productId,
            name: planName,
            description: `${type === 'monthly' ? 'Monthly' : 'Yearly'} recurring donation to support WeighTogether`,
            status: 'ACTIVE',
            billing_cycles: [
                {
                    frequency: {
                        interval_unit: interval,
                        interval_count: 1,
                    },
                    tenure_type: 'REGULAR',
                    sequence: 1,
                    total_cycles: 0, // Infinite
                    pricing_scheme: {
                        fixed_price: {
                            value: amount.toString(),
                            currency_code: 'USD',
                        },
                    },
                },
            ],
            payment_preferences: {
                auto_bill_outstanding: true,
                setup_fee_failure_action: 'CONTINUE',
                payment_failure_threshold: 3,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create ${type} plan: ${error}`);
    }

    const plan = await response.json();
    console.log(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} plan created: ${plan.id}`);
    return plan;
}

async function main() {
    console.log('🚀 PayPal Subscription Plans Setup');
    console.log('=====================================\n');

    // Validation
    if (!paypalConfig.clientId || !paypalConfig.clientSecret) {
        console.error('❌ Error: PayPal credentials not configured');
        console.error('\nPlease set the following environment variables:');
        console.error('  PAYPAL_CLIENT_ID');
        console.error('  PAYPAL_CLIENT_SECRET');
        console.error('\nGet these from: https://developer.paypal.com/');
        console.error('See docs/PAYPAL_DEVELOPMENT_SETUP.md for detailed instructions');
        process.exit(1);
    }

    const mode = paypalConfig.apiUrl.includes('sandbox') ? 'SANDBOX' : 'LIVE';
    console.log(`📍 Mode: ${mode}`);
    console.log(`🌐 API URL: ${paypalConfig.apiUrl}`);

    if (mode === 'LIVE') {
        console.warn('\n⚠️  WARNING: You are using LIVE PayPal credentials!');
        console.warn('This will create real subscription plans in your live account.');
        console.warn('To use sandbox, set PAYPAL_USE_LIVE=false in your .env file\n');

        // Give them a chance to cancel
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    try {
        // Step 1: Get access token
        console.log('\n🔑 Getting PayPal access token...');
        const accessToken = await getAccessToken();
        console.log('✅ Access token obtained');

        // Step 2: Create product
        const product = await createProduct(accessToken);

        // Step 3: Create monthly plan ($10/month)
        const monthlyPlan = await createPlan(accessToken, product.id, 'monthly', 10);

        // Step 4: Create yearly plan ($100/year)
        const yearlyPlan = await createPlan(accessToken, product.id, 'yearly', 100);

        // Success summary
        console.log('\n✨ Setup Complete!');
        console.log('=====================================\n');
        console.log('Add these to your .env file:\n');
        console.log(`PAYPAL_MONTHLY_PLAN_ID=${monthlyPlan.id}`);
        console.log(`PAYPAL_YEARLY_PLAN_ID=${yearlyPlan.id}`);
        console.log('\n💡 Tip: You can customize the amounts by editing this script');
        console.log('📚 See docs/PAYPAL_DEVELOPMENT_SETUP.md for more information\n');

    } catch (error) {
        console.error('\n❌ Setup failed:', error);
        if (error instanceof Error) {
            console.error(error.message);
        }
        process.exit(1);
    }
}

main();
