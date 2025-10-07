// Seed theme and a first-pass Italian menu for benes-draft (3001) and benes (3000)
// Usage:
//   node scripts/seed_benes.mjs

const theme = {
  primary: '#111827', // deep slate for readability
  accent: '#14532d',  // deep Italian green
  radius: '12px'
}

const menu = {
  categories: [
    {
      id: 'c-antipasti',
      name: 'Antipasti',
      items: [
        {
          id: 'i-bruschetta',
          name: 'Bruschetta Classica',
          description: 'Grilled bread, marinated tomatoes, basil, extra virgin olive oil',
          price: 9.5,
          tags: ['vegetarian'],
          imageUrl: 'https://images.unsplash.com/photo-1546549039-83eb3a7a1eb3?q=80&w=1200&auto=format&fit=crop'
        },
        {
          id: 'i-calamari',
          name: 'Calamari Fritti',
          description: 'Lightly fried squid, lemon, herb aioli',
          price: 13.0,
          tags: ['seafood'],
          imageUrl: 'https://images.unsplash.com/photo-1625944525533-58a1f11516f7?q=80&w=1200&auto=format&fit=crop'
        },
        {
          id: 'i-caprese',
          name: 'Insalata Caprese',
          description: 'Heirloom tomatoes, fresh mozzarella, basil, aged balsamic',
          price: 12.0,
          tags: ['vegetarian','gluten-free'],
          imageUrl: 'https://images.unsplash.com/photo-1604908554007-2755d9f2661a?q=80&w=1200&auto=format&fit=crop'
        }
      ]
    },
    {
      id: 'c-paste',
      name: 'Paste',
      items: [
        {
          id: 'i-spaghetti-carbonara',
          name: 'Spaghetti alla Carbonara',
          description: 'Guanciale, egg, pecorino romano, black pepper',
          price: 18.0,
          tags: ['pork'],
          imageUrl: 'https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop'
        },
        {
          id: 'i-linguine-vongole',
          name: 'Linguine alle Vongole',
          description: 'Clams, garlic, white wine, parsley',
          price: 21.0,
          tags: ['seafood'],
          imageUrl: 'https://images.unsplash.com/photo-1461009209120-103c05a82f6c?q=80&w=1200&auto=format&fit=crop'
        },
        {
          id: 'i-gnocchi-sorrentina',
          name: 'Gnocchi alla Sorrentina',
          description: 'Potato gnocchi baked with tomato, basil, mozzarella',
          price: 19.0,
          tags: ['vegetarian'],
          imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200&auto=format&fit=crop'
        }
      ]
    },
    {
      id: 'c-secondi',
      name: 'Secondi',
      items: [
        {
          id: 'i-pollo-piccata',
          name: 'Pollo al Limone (Piccata)',
          description: 'Chicken cutlet, lemon-caper butter, seasonal vegetables',
          price: 24.0,
          tags: [],
          imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop'
        },
        {
          id: 'i-branzino',
          name: 'Branzino alla Griglia',
          description: 'Grilled Mediterranean sea bass, herbs, olive oil, lemon',
          price: 29.0,
          tags: ['seafood','gluten-free'],
          imageUrl: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop'
        }
      ]
    },
    {
      id: 'c-dolci',
      name: 'Dolci',
      items: [
        {
          id: 'i-tiramisu',
          name: 'Tiramisù',
          description: 'Espresso-soaked ladyfingers, mascarpone crema, cocoa',
          price: 9.0,
          tags: ['vegetarian'],
          imageUrl: 'https://images.unsplash.com/photo-1519682577862-22b62b24e493?q=80&w=1200&auto=format&fit=crop'
        }
      ]
    }
  ]
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  const text = await res.text()
  let parsed
  try { parsed = JSON.parse(text) } catch { parsed = { raw: text } }
  return { status: res.status, body: parsed }
}

async function getJson(url) {
  const res = await fetch(url)
  const text = await res.text()
  let parsed
  try { parsed = JSON.parse(text) } catch { parsed = { raw: text } }
  return { status: res.status, body: parsed }
}

async function run() {
  // Draft on 3001
  console.log('Setting theme (3001 benes-draft) ...')
  console.log(await postJson('http://localhost:3001/api/theme?tenant=benes-draft', theme))
  console.log('Importing menu (3001 benes-draft) ...')
  console.log(await postJson('http://localhost:3001/api/tenant/import', { tenant: 'benes-draft', menu }))
  console.log('Verify menu (3001 benes-draft) ...')
  console.log(await getJson('http://localhost:3001/api/menu?tenant=benes-draft'))

  // Live on 3000
  console.log('Setting theme (3000 benes) ...')
  console.log(await postJson('http://localhost:3000/api/theme?tenant=benes', theme))
  console.log('Importing menu (3000 benes) ...')
  console.log(await postJson('http://localhost:3000/api/tenant/import', { tenant: 'benes', menu }))
  console.log('Verify menu (3000 benes) ...')
  console.log(await getJson('http://localhost:3000/api/menu?tenant=benes'))
}

run().catch(e => {
  console.error('Seed error:', e)
  process.exit(1)
})


