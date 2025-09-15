import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Super Admin user
  const superAdminPassword = process.env.SEED_SUPERADMIN_PASSWORD
  if (!superAdminPassword) {
    throw new Error('Missing SEED_SUPERADMIN_PASSWORD. Set it in your environment before seeding.')
  }
  const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, 12)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@digitalmenusaas.com' },
    update: {},
    create: {
      email: 'admin@digitalmenusaas.com',
      name: 'System Administrator',
      passwordHash: superAdminPasswordHash,
      role: 'SUPER_ADMIN'
    }
  })
  console.log('✅ Super admin user created')

  // Create demo tenant (Monochrome Bistro)
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'monochrome-bistro' },
    update: {},
    create: {
      slug: 'monochrome-bistro',
      name: 'Monochrome Bistro',
      plan: 'PREMIUM',
      status: 'ACTIVE',
      monthlyRevenue: 99,
      settings: {
        allowMenuEdits: true,
        maxCategories: 20,
        maxItems: 100,
        aiResponsesPerDay: 500,
        customBranding: true
      }
    }
  })
  console.log('✅ Demo tenant created')

  // Create restaurant owner user
  const ownerPassword = process.env.SEED_OWNER_PASSWORD
  if (!ownerPassword) {
    throw new Error('Missing SEED_OWNER_PASSWORD. Set it in your environment before seeding.')
  }
  const ownerPasswordHash = await bcrypt.hash(ownerPassword, 12)
  const restaurantOwner = await prisma.user.upsert({
    where: { email: 'owner@bellavista.com' },
    update: {},
    create: {
      email: 'owner@bellavista.com',
      name: 'Maria Rossi',
      passwordHash: ownerPasswordHash,
      role: 'RESTAURANT_OWNER',
      tenantId: tenant.id
    }
  })
  console.log('✅ Restaurant owner user created')

  // Create menu
  const menu = await prisma.menu.upsert({
    where: { id: 'monochrome-bistro-menu' },
    update: {},
    create: {
      id: 'monochrome-bistro-menu',
      tenantId: tenant.id,
      name: 'Main Menu',
      description: 'Fresh, seasonal ingredients crafted with care'
    }
  })

  // Categories and items data
  const categoriesData = [
    {
      name: 'Appetizers',
      items: [
        { name: 'Truffle Arancini', description: 'Crispy risotto balls with black truffle and parmesan', price: 16.00, calories: 320, tags: ['vegetarian', 'truffle'] },
        { name: 'Burrata Caprese', description: 'Fresh burrata with heirloom tomatoes and basil oil', price: 18.00, calories: 280, tags: ['vegetarian', 'fresh', 'tomatoes'] }
      ]
    },
    {
      name: 'Salads',
      items: [
        { name: 'Caesar Salad', description: 'Crisp romaine, house-made croutons, aged parmesan', price: 14.00, calories: 220, tags: ['vegetarian', 'classic'] },
        { name: 'Quinoa Power Bowl', description: 'Quinoa, kale, avocado, chickpeas with tahini dressing', price: 16.00, calories: 340, tags: ['vegan', 'healthy', 'quinoa'] }
      ]
    },
    {
      name: 'Pasta',
      items: [
        { name: 'Cacio e Pepe', description: 'Fresh pasta with pecorino romano and black pepper', price: 22.00, calories: 580, tags: ['vegetarian', 'classic', 'pasta'] },
        { name: 'Seafood Linguine', description: 'Fresh clams, mussels, and shrimp in white wine sauce', price: 28.00, calories: 620, tags: ['seafood', 'wine', 'pasta'] }
      ]
    },
    {
      name: 'Main Courses',
      items: [
        { name: 'Grilled Branzino', description: 'Mediterranean sea bass with lemon and herbs', price: 32.00, calories: 380, tags: ['fish', 'grilled', 'mediterranean'] },
        { name: 'Dry-Aged Ribeye', description: '16oz prime ribeye with roasted vegetables', price: 48.00, calories: 720, tags: ['beef', 'premium', 'grilled'] }
      ]
    },
    {
      name: 'Pizza',
      items: [
        { name: 'Margherita', description: 'San Marzano tomatoes, fresh mozzarella, basil', price: 18.00, calories: 520, tags: ['vegetarian', 'classic', 'pizza'] },
        { name: 'Prosciutto e Funghi', description: 'Prosciutto di Parma, wild mushrooms, arugula', price: 24.00, calories: 580, tags: ['pork', 'mushrooms', 'pizza'] }
      ]
    },
    {
      name: 'Desserts',
      items: [
        { name: 'Tiramisu', description: 'Classic Italian dessert with espresso and mascarpone', price: 12.00, calories: 420, tags: ['dessert', 'coffee', 'italian'] },
        { name: 'Gelato Selection', description: 'Three scoops of artisanal gelato', price: 10.00, calories: 280, tags: ['dessert', 'gelato', 'cold'] }
      ]
    },
    {
      name: 'Beverages',
      items: [
        { name: 'Craft Cocktails', description: 'Seasonal cocktails made with premium spirits', price: 14.00, tags: ['alcohol', 'cocktail'] },
        { name: 'Italian Wine Selection', description: 'Curated wines from Italian vineyards', price: 12.00, tags: ['wine', 'italian', 'alcohol'] }
      ]
    }
  ]

  // Create categories and items
  for (const categoryData of categoriesData) {
    const category = await prisma.menuCategory.create({
      data: {
        menuId: menu.id,
        name: categoryData.name,
        displayOrder: categoriesData.indexOf(categoryData)
      }
    })

    for (const itemData of categoryData.items) {
      const item = await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          name: itemData.name,
          description: itemData.description,
          price: itemData.price,
          calories: itemData.calories,
          available: true
        }
      })

      // Create tags
      for (const tagName of itemData.tags) {
        await prisma.menuItemTag.create({
          data: {
            itemId: item.id,
            tag: tagName
          }
        })
      }
    }
  }

  console.log('✅ Menu data seeded')
  console.log('🎉 Database seed completed!')
  
  console.log('\n📝 Demo Login Accounts:')
  console.log('  Super Admin email: admin@digitalmenusaas.com')
  console.log('  Owner email:       owner@bellavista.com')
  console.log('  Passwords are set via SEED_SUPERADMIN_PASSWORD and SEED_OWNER_PASSWORD env vars (or safe defaults).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })