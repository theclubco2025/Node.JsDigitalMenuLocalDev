#!/bin/bash
# Digital Menu SaaS - Complete Project Initialization

echo "🚀 Initializing Digital Menu SaaS project..."

# Create directory structure
mkdir -p {app,components,lib,prisma,public/widget,types}
mkdir -p app/{api/{auth/[...nextauth],menu,assistant},admin/{super,restaurant},auth/login,menu}
mkdir -p lib/customization

echo "📦 Installing dependencies..."
pnpm install

echo "🗄️ Setting up database..."
npx prisma generate
npx prisma db push
npx prisma db seed

echo "✅ Project initialized!"
echo ""
echo "🔑 Demo credentials:"
echo "Super Admin: admin@digitalmenusaas.com / superadmin123"
echo "Restaurant Owner: owner@bellavista.com / restaurant123"
echo ""
echo "📂 Key files created:"
echo "• Complete Next.js 14 app with App Router"
echo "• Canvas UI design (black/white/gray)"
echo "• GPT-4o AI assistant with customer memory"
echo "• Multi-tenant architecture"
echo "• Stripe billing integration"
echo "• Admin dashboards"
echo "• Client customization framework"
echo "• Production deployment guides"
echo ""
echo "🚀 Start development: pnpm dev"
echo "🌐 Visit: http://localhost:3000"
