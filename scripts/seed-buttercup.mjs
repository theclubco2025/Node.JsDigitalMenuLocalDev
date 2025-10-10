// Seed Buttercup Pantry draft via deployed Vercel APIs using
// protection bypass token and admin token.
// Usage: node scripts/seed-buttercup.mjs

import https from 'https'

const [,, argDomain, argBypass, argAdmin, argTenant] = process.argv
const domain = argDomain || process.env.VERCEL_DOMAIN || 'digital-menu-74avowbt9-the-club-cos-projects.vercel.app'
const bypassToken = argBypass || process.env.VERCEL_BYPASS_TOKEN || 'a9f3b7c2d6e1f4a8b0c5d9e3f7a2b6c1'
const adminToken = argAdmin || process.env.ADMIN_TOKEN || '22582811'
const tenant = argTenant || process.env.TENANT || 'buttercup-pantry-draft'

function httpGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: domain, port: 443, path, method: 'GET' }, (res) => {
      let body = ''
      res.on('data', (d) => (body += d))
      res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, body }))
    })
    req.on('error', reject)
    req.end()
  })
}

function httpPost(path, payload, cookie) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload)
    const req = https.request(
      {
        hostname: domain,
        port: 443,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'X-Admin-Token': adminToken,
          ...(cookie ? { Cookie: cookie } : {}),
        },
      },
      (res) => {
        let body = ''
        res.on('data', (d) => (body += d))
        res.on('end', () => resolve({ status: res.statusCode || 0, body }))
      }
    )
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

function extractCookie(setCookieHeader) {
  if (!setCookieHeader) return ''
  const arr = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  return arr.map((v) => v.split(';')[0]).join('; ')
}

async function setBypassCookie() {
  // Request any path with bypass query to set cookie
  const path = `/api/health?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${encodeURIComponent(
    bypassToken
  )}`
  const res = await httpGet(path)
  const cookie = extractCookie(res.headers['set-cookie'])
  if (!cookie) {
    console.log('Bypass cookie not returned; status:', res.status)
  }
  return cookie
}

async function main() {
  console.log('Seeding tenant:', tenant, 'on', domain)
  const cookie = await setBypassCookie()

  const themePayload = {
    primary: '#CDAA7D',
    accent: '#6E4F2F',
    text: '#333333',
    ink: '#111111',
    card: '#FFFFFF',
    muted: '#F0E8DE',
    radius: 12,
  }
  let r = await httpPost(`/api/theme?tenant=${encodeURIComponent(tenant)}`, themePayload, cookie)
  console.log('theme status:', r.status)

  const configPayload = {
    brand: {
      name: 'Buttercup Pantry Restaurant & Bakery',
      logoUrl: 'https://buttercuppantry.com/wp-content/uploads/2022/02/buttercup-logo.svg',
      headerMode: 'logo',
    },
    images: {},
    style: {
      heroVariant: 'logo',
      navVariant: 'sticky',
      flags: { specials: false, pairings: false, signatureGrid: true },
      accentSecondary: '#A37850',
    },
    copy: {
      tagline: "Home-cooked comfort & from-scratch bakery since 1985",
      heroSubtitle: "Serving Placerville with country fare, scratch pies & memories.",
      specials: 'hide',
      categoryIntros: {
        'Skillets, Scrambles & Omelets': 'Breakfast classics with hearty sides & scratch biscuits.',
        'Burger Shack / Sandwiches': 'Generous burgers, sandwiches & house specials.',
        'Starters': 'Shareables & lighter bites to start.',
        'Country Comfort Dinners': 'Dinner entrees made like grandma used to.',
        'Desserts & Bakery': "Pies, sundaes, and from-scratch sweets you won't forget.",
      },
    },
  }
  r = await httpPost(`/api/tenant/config?tenant=${encodeURIComponent(tenant)}`, configPayload, cookie)
  console.log('config status:', r.status)

  const menuPayload = {
    tenant,
    menu: {
      categories: [
        {
          id: 'skillets-scrambles-omelets',
          name: 'Skillets, Scrambles & Omelets',
          items: [
            {
              id: 'original-hangtown-fry',
              name: 'The Original “Hangtown Fry”',
              description:
                'Oysters, bacon, onions & eggs scrambled; topped with melted cheese. Served with hash or potatoes + biscuit/muffin or toast.',
              price: 15.0,
            },
            { id: 'smoked-bacon-and-eggs', name: 'Smoked Bacon & Eggs', description: 'Smoked bacon and eggs (choice).', price: 14.0 },
            { id: 'sausage-patties-and-eggs', name: 'Sausage Patties & Eggs', description: 'Sausage patties with eggs.', price: 14.0 },
            { id: 'smoked-pit-ham-and-eggs', name: 'Smoked Pit Ham & Eggs', description: 'Smoked pit ham and eggs.', price: 15.0 },
            { id: 'just-two-eggs', name: 'Just Two Eggs', description: 'Two eggs any style.', price: 11.0 },
          ],
        },
        {
          id: 'starters',
          name: 'Starters',
          items: [
            { id: 'chicken-wings', name: 'Chicken Wings', description: 'Choice of sweet chili, hot wing sauce or ranch.', price: 7.0 },
            {
              id: 'south-of-the-border-quesadilla',
              name: 'South of the Border Quesadilla',
              description: 'Flour tortilla stuffed with chicken, cheese, tomatoes, pico; sour cream & avocado.',
              price: 12.0,
            },
            { id: 'tempura-zucchini', name: 'Tempura Fried Zucchini', description: 'Fresh cut zucchini tempura, served with ranch.', price: 9.0 },
            { id: 'beer-battered-onion-rings', name: 'Beer Battered Onion Ring Basket', description: 'Onion rings with raspberry sauce.', price: 9.0 },
            { id: 'mozzarella-sticks', name: 'Mozzarella Sticks', description: 'Served with marinara sauce.', price: 9.0 },
          ],
        },
        {
          id: 'burger-shack-sandwiches',
          name: 'Burger Shack / Sandwiches',
          items: [
            {
              id: 'triple-coronary-bypass-burger',
              name: 'Triple Coronary Bypass Burger',
              description: 'Three beef patties, bacon, jack, swiss & cheddar + grilled onions & dressing.',
              price: 17.0,
            },
            {
              id: 'old-fashioned-texas-chili-size',
              name: 'Old Fashioned Texas Chili Size',
              description: 'Broiled patty smothered with homemade chili, jack & cheddar, onions.',
              price: 14.0,
            },
            { id: 'just-a-basic-burger', name: 'Just A Basic Burger', description: 'Lettuce, tomato, pickles, red onion.', price: 10.0 },
            {
              id: 'sourdough-cheese-burger',
              name: 'Sourdough Cheese Burger',
              description: 'Parmesan garlic butter sourdough with cheddar, bacon, lettuce & tomato.',
              price: 14.0,
            },
            { id: 'patty-melt', name: 'Patty Melt', description: 'Swirl corn rye, grilled onions, tomato & American cheese.', price: 13.85 },
            {
              id: 'monte-cristo',
              name: 'Monte Cristo',
              description:
                'Ham, turkey & jack cheese on sourdough, egg-battered, grilled. Powdered sugar + raspberry habanero sauce.',
              price: 14.85,
            },
          ],
        },
        {
          id: 'country-comfort-dinners',
          name: 'Country Comfort Dinners',
          items: [
            {
              id: 'chicken-fried-steak',
              name: 'Buttercup’s Original Chicken Fried Steak',
              description: 'Breaded rib eye, fried & topped with country gravy.',
              price: 26.0,
            },
            { id: 'slow-roast-bbq-ribs', name: 'Slow Roast BBQ Baby Back Ribs', description: 'House BBQ sauce, served with sides.', price: 22.0 },
            {
              id: 'meatloaf-and-gravy',
              name: 'Old Fashioned Meatloaf & Beef Gravy',
              description: 'Homemade meatloaf, beef gravy & sauteed mushrooms.',
              price: 18.0,
            },
            { id: 'grilled-beef-liver-onions', name: 'Grilled Beef Liver & Onions', description: 'Liver, grilled onions & bacon.', price: 18.0 },
            {
              id: 'chicken-parmesan',
              name: 'Chicken Parmesan',
              description: 'Breaded chicken, meat sauce, melted provolone, fettuccine alfredo, garlic bread.',
              price: 19.0,
            },
          ],
        },
        {
          id: 'desserts-bakery',
          name: 'Desserts & Bakery',
          items: [
            { id: 'buttercrunch-ice-cream-pie', name: 'Buttercrunch Ice Cream Pie', description: 'Signature pie from the bakery.', price: 8.5 },
            { id: 'apple-dumpling-supreme', name: 'Apple Dumpling Supreme', description: 'Apple dumpling with toppings & ice cream.', price: 7.0 },
            { id: 'old-fashioned-hot-fudge-sundae', name: 'Old Fashioned Hot Fudge Sundae', description: 'Classic sundae with hot fudge.', price: 7.0 },
            { id: 'mississippi-mud-pie', name: 'Mississippi Mud Pie', description: 'Decadent chocolate pie.', price: 7.0 },
          ],
        },
      ],
      images: {},
      featuredIds: ['original-hangtown-fry', 'buttercrunch-ice-cream-pie', 'monte-cristo'],
    },
  }

  r = await httpPost('/api/tenant/import', menuPayload, cookie)
  console.log('menu status:', r.status)

  console.log('Done.')
}

main().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})


