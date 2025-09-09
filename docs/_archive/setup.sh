#!/bin/bash
echo "🚀 Setting up Digital Menu SaaS locally..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment
if [ ! -f .env.local ]; then
    echo "⚙️ Creating .env.local from template..."
    cp .env.example .env.local
    echo "Please edit .env.local with your database URL and OpenAI API key"
fi

# Setup database
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma db push
npx prisma db seed

echo "✅ Setup complete!"
echo ""
echo "🔑 Demo credentials:"
echo "Super Admin: admin@digitalmenusaas.com / superadmin123"  
echo "Restaurant Owner: owner@bellavista.com / restaurant123"
echo ""
echo "🚀 Start the server with: pnpm dev"
echo "🌐 Then visit: http://localhost:3000"
