"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    // Create test user
    const hashedPassword = await bcryptjs_1.default.hash('admin123456', 12);
    const user = await prisma.user.upsert({
        where: { email: 'admin@financial.com' },
        update: {},
        create: {
            email: 'admin@financial.com',
            username: 'admin',
            password: hashedPassword,
            firstName: '系统',
            lastName: '管理员',
            isVerified: true,
        },
    });
    console.log('✅ Created test user:', user.email);
    // Create default categories for EXPENSE
    const expenseCategories = [
        { name: '餐饮美食', icon: '🍽️', color: '#FF6B6B' },
        { name: '交通出行', icon: '🚗', color: '#4ECDC4' },
        { name: '购物消费', icon: '🛒', color: '#45B7D1' },
        { name: '居家生活', icon: '🏠', color: '#96CEB4' },
        { name: '医疗健康', icon: '🏥', color: '#FFEAA7' },
        { name: '文化娱乐', icon: '🎬', color: '#DDA0DD' },
        { name: '学习教育', icon: '📚', color: '#98D8C8' },
        { name: '投资理财', icon: '💰', color: '#F7DC6F' },
        { name: '人情往来', icon: '🎁', color: '#BB8FCE' },
        { name: '其他支出', icon: '📝', color: '#AED6F1' },
    ];
    const createdExpenseCategories = [];
    for (const category of expenseCategories) {
        const created = await prisma.category.upsert({
            where: {
                userId_name: {
                    userId: user.id,
                    name: category.name
                }
            },
            update: {},
            create: {
                userId: user.id,
                name: category.name,
                type: 'EXPENSE',
                icon: category.icon,
                color: category.color,
            },
        });
        createdExpenseCategories.push(created);
    }
    // Create subcategories for some expense categories
    const subcategories = [
        { parent: '餐饮美食', children: ['早餐', '午餐', '晚餐', '夜宵', '饮品咖啡', '聚餐'] },
        { parent: '交通出行', children: ['公交地铁', '打车出租', '加油', '停车费', '机票', '火车票'] },
        { parent: '购物消费', children: ['服装鞋帽', '数码家电', '日用百货', '美妆护肤', '母婴用品'] },
        { parent: '居家生活', children: ['房租房贷', '水电燃气', '物业费', '装修家具', '家政服务'] },
    ];
    for (const subcategoryGroup of subcategories) {
        const parentCategory = createdExpenseCategories.find(c => c.name === subcategoryGroup.parent);
        if (parentCategory) {
            for (const childName of subcategoryGroup.children) {
                await prisma.category.upsert({
                    where: {
                        userId_name: {
                            userId: user.id,
                            name: childName
                        }
                    },
                    update: {},
                    create: {
                        userId: user.id,
                        name: childName,
                        type: 'EXPENSE',
                        parentId: parentCategory.id,
                        color: parentCategory.color,
                    },
                });
            }
        }
    }
    // Create default categories for INCOME
    const incomeCategories = [
        { name: '工资收入', icon: '💼', color: '#00B894' },
        { name: '奖金补贴', icon: '🎉', color: '#6C5CE7' },
        { name: '投资收益', icon: '📈', color: '#A29BFE' },
        { name: '副业收入', icon: '💻', color: '#FD79A8' },
        { name: '退款返现', icon: '💳', color: '#00CEC9' },
        { name: '礼金收入', icon: '🧧', color: '#E17055' },
        { name: '其他收入', icon: '💎', color: '#81ECEC' },
    ];
    for (const category of incomeCategories) {
        await prisma.category.upsert({
            where: {
                userId_name: {
                    userId: user.id,
                    name: category.name
                }
            },
            update: {},
            create: {
                userId: user.id,
                name: category.name,
                type: 'INCOME',
                icon: category.icon,
                color: category.color,
            },
        });
    }
    console.log('✅ Created default categories');
    // Create sample accounts
    const accounts = [
        {
            name: '工商银行储蓄卡',
            type: 'SAVINGS',
            balance: 15000.00,
            currency: 'CNY',
            bankName: '中国工商银行',
            accountNumber: '**** **** **** 1234',
        },
        {
            name: '支付宝',
            type: 'CASH',
            balance: 2500.50,
            currency: 'CNY',
        },
        {
            name: '微信钱包',
            type: 'CASH',
            balance: 800.00,
            currency: 'CNY',
        },
        {
            name: '招商银行信用卡',
            type: 'CREDIT_CARD',
            balance: -3200.00,
            currency: 'CNY',
            bankName: '招商银行',
            accountNumber: '**** **** **** 5678',
        },
    ];
    const createdAccounts = [];
    for (const account of accounts) {
        const created = await prisma.account.create({
            data: {
                ...account,
                userId: user.id,
            },
        });
        createdAccounts.push(created);
    }
    console.log('✅ Created sample accounts');
    // Create sample transactions
    const expenseCategory = await prisma.category.findFirst({
        where: { userId: user.id, name: '餐饮美食', type: 'EXPENSE' },
    });
    const incomeCategory = await prisma.category.findFirst({
        where: { userId: user.id, name: '工资收入', type: 'INCOME' },
    });
    const savingsAccount = createdAccounts.find(a => a.type === 'SAVINGS');
    const alipayAccount = createdAccounts.find(a => a.name === '支付宝');
    if (expenseCategory && incomeCategory && savingsAccount && alipayAccount) {
        // Sample expense transactions
        await prisma.transaction.create({
            data: {
                userId: user.id,
                fromAccountId: alipayAccount.id,
                categoryId: expenseCategory.id,
                amount: 45.80,
                type: 'EXPENSE',
                description: '午餐 - 兰州拉面',
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                tags: ['餐饮', '午餐'],
            },
        });
        await prisma.transaction.create({
            data: {
                userId: user.id,
                fromAccountId: savingsAccount.id,
                categoryId: expenseCategory.id,
                amount: 120.00,
                type: 'EXPENSE',
                description: '团队聚餐',
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                tags: ['餐饮', '聚餐', '团建'],
            },
        });
        // Sample income transaction
        await prisma.transaction.create({
            data: {
                userId: user.id,
                toAccountId: savingsAccount.id,
                categoryId: incomeCategory.id,
                amount: 8500.00,
                type: 'INCOME',
                description: '2024年1月工资',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                tags: ['工资', '月薪'],
            },
        });
        // Sample transfer transaction
        await prisma.transaction.create({
            data: {
                userId: user.id,
                fromAccountId: savingsAccount.id,
                toAccountId: alipayAccount.id,
                amount: 500.00,
                type: 'TRANSFER',
                description: '转账到支付宝',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                tags: ['转账'],
            },
        });
    }
    console.log('✅ Created sample transactions');
    // Create sample budget
    if (savingsAccount && expenseCategory) {
        await prisma.budget.create({
            data: {
                userId: user.id,
                accountId: savingsAccount.id,
                name: '餐饮月度预算',
                amount: 1500.00,
                spent: 165.80,
                period: 'MONTHLY',
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
                alertThreshold: 0.8,
            },
        });
    }
    console.log('✅ Created sample budget');
    // Create system configuration
    const systemConfigs = [
        {
            key: 'default_currency',
            value: 'CNY',
            description: '系统默认货币',
            category: 'general',
        },
        {
            key: 'date_format',
            value: 'YYYY-MM-DD',
            description: '日期显示格式',
            category: 'display',
        },
        {
            key: 'decimal_places',
            value: '2',
            description: '金额小数位数',
            category: 'display',
        },
        {
            key: 'enable_notifications',
            value: 'true',
            description: '启用系统通知',
            category: 'notification',
        },
    ];
    for (const config of systemConfigs) {
        await prisma.systemConfig.upsert({
            where: { key: config.key },
            update: {},
            create: config,
        });
    }
    console.log('✅ Created system configurations');
    console.log('🎉 Database seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map