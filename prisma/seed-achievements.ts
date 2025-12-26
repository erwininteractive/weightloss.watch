import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Default achievements to seed
 */
const achievements = [
    // Weight Loss Milestones
    {
        name: 'First Weigh-In',
        description: 'Logged your first weight entry',
        iconUrl: '⚖️',
        points: 10,
    },
    {
        name: '5 lbs Lost',
        description: 'Lost 5 pounds from your starting weight',
        iconUrl: '🎯',
        points: 50,
    },
    {
        name: '10 lbs Lost',
        description: 'Lost 10 pounds from your starting weight',
        iconUrl: '🏆',
        points: 100,
    },
    {
        name: '25 lbs Lost',
        description: 'Lost 25 pounds from your starting weight',
        iconUrl: '⭐',
        points: 250,
    },
    {
        name: '50 lbs Lost',
        description: 'Lost 50 pounds from your starting weight',
        iconUrl: '🌟',
        points: 500,
    },
    {
        name: '100 lbs Lost',
        description: 'Lost 100 pounds from your starting weight',
        iconUrl: '💎',
        points: 1000,
    },
    {
        name: 'Goal Reached',
        description: 'Reached your goal weight',
        iconUrl: '🎉',
        points: 500,
    },

    // Consistency Streaks
    {
        name: 'Week Warrior',
        description: 'Logged weight 7 days in a row',
        iconUrl: '🔥',
        points: 100,
    },
    {
        name: 'Monthly Consistent',
        description: 'Logged weight at least once per week for 4 weeks',
        iconUrl: '📅',
        points: 200,
    },
    {
        name: '100 Day Streak',
        description: 'Logged weight 100 days in a row',
        iconUrl: '💯',
        points: 500,
    },
    {
        name: 'Year of Progress',
        description: 'Logged weight for 365 days',
        iconUrl: '🗓️',
        points: 1000,
    },

    // Engagement
    {
        name: 'Team Player',
        description: 'Joined your first team',
        iconUrl: '👥',
        points: 50,
    },
    {
        name: 'Social Butterfly',
        description: 'Created your first post',
        iconUrl: '🦋',
        points: 25,
    },
    {
        name: 'Challenger',
        description: 'Joined your first challenge',
        iconUrl: '🏅',
        points: 50,
    },
    {
        name: 'Motivator',
        description: 'Received 10 likes on your posts',
        iconUrl: '❤️',
        points: 100,
    },
    {
        name: 'Helpful',
        description: 'Made 25 comments to support others',
        iconUrl: '💬',
        points: 150,
    },
    {
        name: 'Popular Post',
        description: 'Had a post receive 50 likes',
        iconUrl: '🔥',
        points: 200,
    },

    // Body Composition
    {
        name: 'Body Fat Champion',
        description: 'Reduced body fat percentage by 5%',
        iconUrl: '💪',
        points: 300,
    },
    {
        name: 'Muscle Builder',
        description: 'Increased muscle mass by 10 lbs',
        iconUrl: '🏋️',
        points: 300,
    },
    {
        name: 'Hydration Hero',
        description: 'Maintained 60%+ water percentage for 30 days',
        iconUrl: '💧',
        points: 200,
    },

    // Special Achievements
    {
        name: 'Early Adopter',
        description: 'One of the first 100 users',
        iconUrl: '🚀',
        points: 500,
    },
    {
        name: 'Supporter',
        description: 'Made a donation to support the platform',
        iconUrl: '💝',
        points: 250,
    },
    {
        name: 'Monthly Supporter',
        description: 'Active monthly donation subscription',
        iconUrl: '🌈',
        points: 500,
    },
    {
        name: 'Progress Photo Pro',
        description: 'Uploaded 10 progress photos',
        iconUrl: '📸',
        points: 100,
    },
    {
        name: 'Complete Profile',
        description: 'Filled out all profile information',
        iconUrl: '✅',
        points: 50,
    },
    {
        name: 'Challenge Champion',
        description: 'Won your first challenge',
        iconUrl: '🥇',
        points: 300,
    },
    {
        name: 'Comeback Kid',
        description: 'Logged weight after 30+ day gap',
        iconUrl: '🔄',
        points: 100,
    },
    {
        name: 'Perfect Week',
        description: 'Lost weight 7 days in a row',
        iconUrl: '📉',
        points: 200,
    },
    {
        name: 'Maintenance Master',
        description: 'Maintained goal weight for 90 days',
        iconUrl: '🎯',
        points: 400,
    },
];

async function seedAchievements() {
    console.log('🏆 Seeding achievements...');

    let created = 0;
    let skipped = 0;

    for (const achievement of achievements) {
        const existing = await prisma.achievement.findUnique({
            where: { name: achievement.name },
        });

        if (existing) {
            console.log(`⏭️  Skipped: ${achievement.name} (already exists)`);
            skipped++;
        } else {
            await prisma.achievement.create({
                data: achievement,
            });
            console.log(`✅ Created: ${achievement.name}`);
            created++;
        }
    }

    console.log(`\n✨ Done! Created ${created} achievements, skipped ${skipped}`);
}

async function main() {
    try {
        await seedAchievements();
    } catch (error) {
        console.error('Error seeding achievements:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
