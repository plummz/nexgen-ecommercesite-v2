require('dotenv').config();
const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host:     process.env.DB_HOST || process.env.PGHOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
      database: process.env.DB_NAME || process.env.PGDATABASE || 'nexgen_shop',
      user:     process.env.DB_USER || process.env.PGUSER     || 'postgres',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
    });

const CATEGORIES = [
  { slug:'pokemon',    name:'Pokémon Figures', icon:'🎮', sort_order:1 },
  { slug:'watches',    name:'Watches',         icon:'⌚', sort_order:2 },
  { slug:'laptops',    name:'Laptops',         icon:'💻', sort_order:3 },
  { slug:'phones',     name:'Phones',          icon:'📱', sort_order:4 },
  { slug:'headphones', name:'Headphones',      icon:'🎧', sort_order:5 },
  { slug:'keyboards',  name:'Keyboards',       icon:'⌨️', sort_order:6 },
  { slug:'shoes',      name:'Shoes',           icon:'👟', sort_order:7 },
  { slug:'fashion',    name:'Fashion',         icon:'👕', sort_order:8 },
  { slug:'bags',       name:'Bags',            icon:'👜', sort_order:9 },
  { slug:'food',       name:'Food & Snacks',   icon:'🍫', sort_order:10 },
  { slug:'toys',       name:'Toys',            icon:'🧸', sort_order:11 },
  { slug:'books',      name:'Books',           icon:'📚', sort_order:12 },
  { slug:'cameras',    name:'Cameras',         icon:'📷', sort_order:13 },
  { slug:'gaming',     name:'Gaming',          icon:'🕹️', sort_order:14 },
  { slug:'skincare',   name:'Skincare',        icon:'✨', sort_order:15 },
];

const PRODUCTS = [
  // POKEMON
  { name:'Charizard Figure',  slug:'charizard-figure',  cat:'pokemon', price:499, orig:900, image:'charizard.png',  rating:4.9, sold:1204, badge:'HOT',
    desc:'Premium Charizard figure with flame base. Officially licensed Nintendo merchandise.',
    vars:['Standard Edition','Shiny Edition','Mega Charizard X','Mega Charizard Y','Gigantamax Edition'] },
  { name:'Pikachu Figure',    slug:'pikachu-figure',    cat:'pokemon', price:449, orig:800, image:'pikachu.png',    rating:4.8, sold:3201, badge:'BESTSELLER',
    desc:'Iconic Pikachu in battle stance with lightning bolt effects on both sides.',
    vars:['Standard','Detective Pikachu','Ash\'s Pikachu','Gigantamax','Holiday Edition'] },
  { name:'Bulbasaur Figure',  slug:'bulbasaur-figure',  cat:'pokemon', price:399, orig:700, image:'bulbasaur.png',  rating:4.7, sold:890,  badge:null,
    desc:'Lovable starter Pokémon with detailed vine bulb and grass base display.',
    vars:['Standard','Shiny','Mega Venusaur','Baby Bulbasaur','Gigantamax Venusaur'] },
  { name:'Squirtle Figure',   slug:'squirtle-figure',   cat:'pokemon', price:399, orig:700, image:'squirtle.png',   rating:4.7, sold:970,  badge:null,
    desc:'Cheerful Tiny Turtle with translucent water wave base.',
    vars:['Standard','Shiny','Blastoise Evolution','Mega Blastoise','Gigantamax'] },
  { name:'Meowth Figure',     slug:'meowth-figure',     cat:'pokemon', price:379, orig:650, image:'meowth.png',     rating:4.6, sold:540,  badge:null,
    desc:'Team Rocket\'s Meowth sitting on a treasure chest full of coins and gems.',
    vars:['Standard','Alolan Meowth','Galarian Meowth','Persian Set','Gold Edition'] },
  { name:'Mew Figure',        slug:'mew-figure',        cat:'pokemon', price:599, orig:1100, image:'mew.png',       rating:5.0, sold:2100, badge:'RARE',
    desc:'Mythical Mew floating on a psychic energy base. One of the rarest collectibles!',
    vars:['Standard','Shiny Mew','Mewtwo Set','Armored Mewtwo','Shadow Mew'] },
  { name:'Dragonite Figure',  slug:'dragonite-figure',  cat:'pokemon', price:549, orig:950, image:'dragonite.png',  rating:4.8, sold:730,  badge:null,
    desc:'Gentle Dragon Pokémon with highly detailed scales and wings.',
    vars:['Standard','Shiny','Dragonair Set','Lance\'s Dragonite','Holiday Edition'] },
  { name:'Rayquaza Figure',   slug:'rayquaza-figure',   cat:'pokemon', price:699, orig:1200, image:'rayquaza.png',  rating:4.9, sold:1560, badge:'LEGENDARY',
    desc:'Sky High Pokémon fully articulated on a display stand. A showpiece for collectors.',
    vars:['Standard','Shiny','Mega Rayquaza','Black Rayquaza','Crystal Edition'] },
  // WATCHES
  { name:'NexGen Smart Watch Pro', slug:'nexgen-smart-watch-pro', cat:'watches', price:2499, orig:4500, image:'smartwatch1.png', rating:4.7, sold:892, badge:'NEW',
    desc:'Feature-packed smartwatch with health monitoring, GPS, and 7-day battery life.',
    vars:['Black 42mm','Black 46mm','Silver 42mm','Silver 46mm','Rose Gold 42mm','Navy Blue 46mm'] },
  { name:'Classic Analog Watch',   slug:'classic-analog-watch',   cat:'watches', price:1299, orig:2200, image:'analogwatch.png', rating:4.5, sold:445, badge:null,
    desc:'Elegant timepiece with genuine leather strap and sapphire crystal glass.',
    vars:['Brown Leather','Black Leather','Blue Dial','White Dial','Chronograph Silver','Rose Gold'] },
  { name:'Sports Tracker Watch',   slug:'sports-tracker-watch',   cat:'watches', price:899, orig:1800, image:'sportstracker.png', rating:4.6, sold:1230, badge:'SALE',
    desc:'Waterproof sports watch with step counter, heart rate, and multi-sport modes.',
    vars:['Black','Blue','Red','Green','Orange','Yellow','Purple','White','Camo','Pink'] },
  // LAPTOPS
  { name:'NexBook Air 14"',         slug:'nexbook-air-14',         cat:'laptops', price:28999, orig:45000, image:'inteli5.png',    rating:4.8, sold:234, badge:'HOT',
    desc:'Ultra-thin laptop with Intel Core i5, 16GB RAM, 512GB SSD, all-day battery.',
    vars:['i5 8GB 256GB Silver','i5 16GB 512GB Silver','i7 16GB 512GB Silver','i7 32GB 1TB Space Grey'] },
  { name:'NexBook Gaming Pro 15"',  slug:'nexbook-gaming-pro-15',  cat:'laptops', price:49999, orig:75000, image:'rtx4060.png',    rating:4.9, sold:98,  badge:'BESTSELLER',
    desc:'Gaming powerhouse with RTX 4060, i7 processor, 144Hz display, RGB keyboard.',
    vars:['RTX 4060 16GB','RTX 4060 32GB','RTX 4070 16GB','RTX 4070 32GB','RTX 4080 32GB'] },
  { name:'NexBook Chromebook 11"',  slug:'nexbook-chromebook-11',  cat:'laptops', price:8999,  orig:15000, image:'chromebook.png', rating:4.4, sold:567, badge:null,
    desc:'Lightweight Chromebook for everyday use, school, and online work.',
    vars:['4GB 64GB White','4GB 64GB Black','8GB 128GB Silver','Touch Screen 8GB 128GB'] },
  // PHONES
  { name:'NexPhone 15 Pro',  slug:'nexphone-15-pro',  cat:'phones', price:39999, orig:55000, image:'snapgen3.png',    rating:4.9, sold:3421, badge:'HOT',
    desc:'Flagship smartphone with 200MP camera, Snapdragon 8 Gen 3, 5G ready.',
    vars:['128GB Black','128GB White','256GB Black','256GB Titanium','512GB Black','1TB Black'] },
  { name:'NexPhone Lite',    slug:'nexphone-lite',    cat:'phones', price:12999, orig:18000, image:'nexphonelite.png', rating:4.6, sold:8900, badge:'BESTSELLER',
    desc:'Affordable powerhouse with 64MP camera, 5000mAh battery, fast charging.',
    vars:['64GB Black','64GB Blue','128GB Black','128GB White','256GB Black'] },
  { name:'NexPhone Fold',    slug:'nexphone-fold',    cat:'phones', price:69999, orig:95000, image:'foldphone1.png',   rating:4.8, sold:156,  badge:'NEW',
    desc:'Foldable smartphone with 7.6" inner display and dual-screen multitasking.',
    vars:['256GB Black','256GB Beige','512GB Black','Pen Edition 256GB','Luxury Gold 512GB'] },
  // HEADPHONES
  { name:'NexSound Pro Wireless',   slug:'nexsound-pro-wireless',   cat:'headphones', price:2999, orig:5500, image:'headphonewireless1.png', rating:4.8, sold:4230, badge:'BESTSELLER',
    desc:'40-hour battery ANC headphones with crystal-clear audio and foldable design.',
    vars:['Black','White','Navy Blue','Midnight Green','Rose Gold','Matte Silver'] },
  { name:'NexBuds True Wireless',   slug:'nexbuds-true-wireless',   cat:'headphones', price:1299, orig:2500, image:'headphonewireless2.png', rating:4.7, sold:9870, badge:'HOT',
    desc:'True wireless earbuds with ANC, 8hr battery, IPX5 water resistant.',
    vars:['Black','White','Blue','Coral','Sage Green','Lavender'] },
  { name:'NexSound Gaming Headset', slug:'nexsound-gaming-headset', cat:'headphones', price:1799, orig:3200, image:'headphonewireless3.png', rating:4.6, sold:2100, badge:null,
    desc:'7.1 surround sound gaming headset with retractable mic and RGB lighting.',
    vars:['Black RGB','White RGB','Red Black','Blue Black','Camo','Pink'] },
  // KEYBOARDS
  { name:'NexKey Mechanical 75%',   slug:'nexkey-mechanical-75',   cat:'keyboards', price:2499, orig:4000, image:'keyboard1.png', rating:4.9, sold:1870, badge:'HOT',
    desc:'Hot-swappable mechanical keyboard with RGB, gasket mount, premium feel.',
    vars:['Red Switch Black','Red Switch White','Blue Switch Black','Brown Switch Black','Silent Red White'] },
  { name:'NexKey Wireless Compact', slug:'nexkey-wireless-compact', cat:'keyboards', price:1499, orig:2800, image:'keyboard2.png', rating:4.7, sold:3400, badge:null,
    desc:'Compact 60% wireless keyboard, Bluetooth 5.0, 3-device pairing, 30-day battery.',
    vars:['White','Black','Pink','Blue','Grey','Cream','Sage','Lavender','Mint','Dark Mode'] },
  // SHOES
  { name:'NexRun Trainer Pro',       slug:'nexrun-trainer-pro',       cat:'shoes', price:3499, orig:5500, image:'shoes1.png', rating:4.7, sold:2340, badge:'NEW',
    desc:'Responsive running shoes with carbon fiber plate and ultra-light foam.',
    vars:['White/Black US7','White/Black US8','White/Black US9','White/Black US10','Black/Red US8','Navy/White US8'] },
  { name:'NexStep Lifestyle Sneaker', slug:'nexstep-lifestyle-sneaker', cat:'shoes', price:2199, orig:3800, image:'shoes2.png', rating:4.6, sold:5670, badge:'BESTSELLER',
    desc:'Premium everyday sneakers with cushioned insole and durable outsole.',
    vars:['White US7','White US8','White US9','Black US8','Black US9','Grey US8','Beige US9'] },
  // FASHION
  { name:'NexWear Graphic Tee', slug:'nexwear-graphic-tee', cat:'fashion', price:399, orig:699, image:'whiteT1.png',    rating:4.5, sold:12400, badge:'BESTSELLER',
    desc:'Premium 100% cotton graphic tee, pre-shrunk, double-stitched collar.',
    vars:['White XS','White S','White M','White L','Black M','Black L','Black XL','Grey M','Navy M','Red M'] },
  { name:'NexWear Polo Shirt',  slug:'nexwear-polo-shirt',  cat:'fashion', price:599, orig:999, image:'poloshirt1.png', rating:4.6, sold:8900, badge:null,
    desc:'Breathable pique polo with embroidered logo, perfect for work or casual.',
    vars:['White S','White M','White L','Black M','Black L','Navy S','Navy M','Grey M','Maroon M','Blue XL'] },
  { name:'NexWear Hoodie',      slug:'nexwear-hoodie',      cat:'fashion', price:999, orig:1800, image:'hoodie1.png',   rating:4.8, sold:4560, badge:'HOT',
    desc:'Fleece-lined hoodie with kangaroo pocket, adjustable drawstring.',
    vars:['Black S','Black M','Black L','White S','White M','Grey M','Navy M','Green M','Pink M','Cream S'] },
  // BAGS
  { name:'NexBag Everyday Backpack', slug:'nexbag-everyday-backpack', cat:'bags', price:1299, orig:2200, image:'backpack1.png',    rating:4.7, sold:3210, badge:'NEW',
    desc:'30L waterproof backpack with laptop compartment, USB charging port, anti-theft.',
    vars:['Black','Navy','Grey','Olive','Camo','Brown','Burgundy','Sky Blue','Rose','Beige'] },
  { name:'NexBag Crossbody Slim',    slug:'nexbag-crossbody-slim',    cat:'bags', price:799,  orig:1400, image:'crossbodybag1.png', rating:4.6, sold:6780, badge:null,
    desc:'Compact crossbody bag with RFID-blocking pocket, adjustable strap.',
    vars:['Black','Brown','Navy','Tan','Grey','White','Red','Olive','Pink','Beige'] },
  // FOOD
  { name:'Choco Premium Box',  slug:'choco-premium-box',  cat:'food', price:299, orig:450, image:'food1.png', rating:4.8, sold:15600, badge:'BESTSELLER',
    desc:'Assorted premium chocolates imported from Belgium. Perfect for gifting.',
    vars:['Dark Chocolate 200g','Milk Chocolate 200g','White Chocolate 200g','Mixed 200g','Truffle Box 12pcs'] },
  { name:'NexSnack Chips Pack', slug:'nexsnack-chips-pack', cat:'food', price:149, orig:220, image:'food2.png', rating:4.5, sold:28900, badge:null,
    desc:'Crispy kettle-cooked potato chips in bold flavors, family pack size.',
    vars:['Classic Salt 200g','BBQ 200g','Cheese 200g','Sour Cream 200g','Spicy 200g','Honey Butter 200g'] },
  // TOYS
  { name:'NexBrick Building Set', slug:'nexbrick-building-set', cat:'toys', price:1499, orig:2500, image:'toy1.png', rating:4.9, sold:4320, badge:'HOT',
    desc:'Compatible building blocks set with 1000+ pieces. Stimulates creativity.',
    vars:['City Set 1000pcs','Space Set 850pcs','Castle Set 1200pcs','Pirate Ship 900pcs','Robot 750pcs'] },
  { name:'RC Racing Car Pro',     slug:'rc-racing-car-pro',     cat:'toys', price:1999, orig:3500, image:'toy2.png', rating:4.7, sold:2100, badge:null,
    desc:'1:10 scale remote-control racing car, 40km/h top speed, rechargeable.',
    vars:['Red 2.4GHz','Blue 2.4GHz','Yellow 2.4GHz','Black 2.4GHz','Monster Truck Red','Drift Edition White'] },
  // BOOKS
  { name:'Learn Web Dev Series',        slug:'learn-web-dev-series',        cat:'books', price:599, orig:999, image:'book1.png', rating:4.8, sold:3400, badge:'NEW',
    desc:'Comprehensive guide to HTML, CSS, JavaScript for beginners to advanced.',
    vars:['HTML & CSS Basics','JavaScript Fundamentals','React for Beginners','Node.js Essentials','Python Crash Course'] },
  { name:'Filipino Fiction Bestsellers', slug:'filipino-fiction-bestsellers', cat:'books', price:349, orig:599, image:'book2.jpg', rating:4.7, sold:8900, badge:null,
    desc:'Award-winning Filipino novels and short stories. Pambansang literatura.',
    vars:['Noli Me Tangere','El Filibusterismo','Florante at Laura','Dekada 70','Smaller and Smaller Circles'] },
  // CAMERAS
  { name:'NexCam DSLR Pro',   slug:'nexcam-dslr-pro',   cat:'cameras', price:29999, orig:45000, image:'cam1.png', rating:4.9, sold:345,  badge:'PRO',
    desc:'Professional 24MP DSLR with 4K video, 51-point AF system, weather sealed.',
    vars:['Body Only','18-55mm Kit','18-135mm Kit','50mm Prime Kit','70-300mm Kit','Double Zoom Kit'] },
  { name:'NexCam Action 4K',  slug:'nexcam-action-4k',  cat:'cameras', price:8999,  orig:15000, image:'cam2.png', rating:4.8, sold:2340, badge:'HOT',
    desc:'Waterproof 4K action camera with stabilization, voice control, 170° wide angle.',
    vars:['Standard Black','Adventure Bundle','Surf Bundle','Bike Mount Bundle','Drone Bundle','Vlog Bundle'] },
  // GAMING
  { name:'NexPad Wireless Controller', slug:'nexpad-wireless-controller', cat:'gaming', price:1299, orig:2200, image:'game1.png', rating:4.8, sold:5670, badge:'BESTSELLER',
    desc:'Wireless gaming controller with haptic feedback, trigger stops, 20hr battery.',
    vars:['Black','White','Red','Blue','Camo','Cosmic Purple','Midnight Black','Arctic White'] },
  { name:'NexStation Gaming Chair',    slug:'nexstation-gaming-chair',    cat:'gaming', price:4999, orig:8500, image:'game2.png', rating:4.7, sold:1230, badge:'NEW',
    desc:'Ergonomic gaming chair with lumbar support, 4D armrests, 165° recline.',
    vars:['Black/Red','Black/Blue','Black/White','All Black','All White','Grey/Black','Purple/Black','Pink/White'] },
  // SKINCARE
  { name:'NexGlow Serum Kit',      slug:'nexglow-serum-kit',      cat:'skincare', price:899, orig:1600, image:'skin1.png', rating:4.8, sold:9870, badge:'HOT',
    desc:'Complete brightening serum kit with Vitamin C, hyaluronic acid, and niacinamide.',
    vars:['Vitamin C Serum 30ml','Hyaluronic Acid 30ml','Niacinamide 10% 30ml','Starter Kit 3pcs','Full Routine 6pcs'] },
  { name:'NexGlow Sunscreen SPF50', slug:'nexglow-sunscreen-spf50', cat:'skincare', price:349, orig:620,  image:'skin2.png', rating:4.9, sold:21000, badge:'BESTSELLER',
    desc:'Lightweight SPF50 PA++++ sunscreen. Non-greasy, reef-safe formula.',
    vars:['50ml Tube','100ml Tube','Tinted 50ml','Matte Finish 50ml','Sport SPF60 100ml','Travel Set 3x30ml'] },
];

const COUPONS = [
  { code:'NEXGEN10',  type:'percent',  discount:10,  min_order:0,    category:null,      max_uses:null },
  { code:'NEXGEN20',  type:'percent',  discount:20,  min_order:0,    category:null,      max_uses:null },
  { code:'SAVE100',   type:'fixed',    discount:100, min_order:0,    category:null,      max_uses:null },
  { code:'SAVE500',   type:'fixed',    discount:500, min_order:2000, category:null,      max_uses:null },
  { code:'POKEMON15', type:'percent',  discount:15,  min_order:0,    category:'pokemon', max_uses:null },
  { code:'FREESHIP',  type:'freeship', discount:0,   min_order:0,    category:null,      max_uses:null },
  { code:'WELCOME50', type:'fixed',    discount:50,  min_order:0,    category:null,      max_uses:1000 },
  { code:'FLASH30',   type:'percent',  discount:30,  min_order:0,    category:null,      max_uses:500  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Admin user
    const hash = await bcrypt.hash('admin1234', 12);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, avatar)
      VALUES ($1, $2, $3, 'admin', $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Admin', 'admin@nexgen.shop', hash, 'A']);
    console.log('Admin user seeded.');

    // Categories
    const catMap = {};
    for (const c of CATEGORIES) {
      const { rows } = await client.query(`
        INSERT INTO categories (slug, name, icon, sort_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE SET name=$2, icon=$3
        RETURNING id, slug
      `, [c.slug, c.name, c.icon, c.sort_order]);
      catMap[rows[0].slug] = rows[0].id;
    }
    console.log('Categories seeded.');

    // Products
    for (const p of PRODUCTS) {
      const catId = catMap[p.cat];
      const { rows } = await client.query(`
        INSERT INTO products (name, slug, category_id, price, original_price, description, image, badge, rating, sold_count, stock)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 100)
        ON CONFLICT (slug) DO UPDATE SET
          name=$1, price=$4, original_price=$5, description=$6, image=$7, badge=$8
        RETURNING id
      `, [p.name, p.slug, catId, p.price, p.orig, p.desc, p.image, p.badge, p.rating, p.sold]);

      const productId = rows[0].id;

      // Variations
      for (let i = 0; i < p.vars.length; i++) {
        await client.query(`
          INSERT INTO product_variations (product_id, name, stock, sort_order)
          VALUES ($1, $2, 50, $3)
          ON CONFLICT DO NOTHING
        `, [productId, p.vars[i], i]);
      }
    }
    console.log(`Seeded ${PRODUCTS.length} products.`);

    // Coupons
    for (const c of COUPONS) {
      await client.query(`
        INSERT INTO coupons (code, type, discount, min_order, category, max_uses)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (code) DO NOTHING
      `, [c.code, c.type, c.discount, c.min_order, c.category, c.max_uses]);
    }
    console.log('Coupons seeded.');

    await client.query('COMMIT');
    console.log('Seed complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    // Only end the pool if running standalone
    if (require.main === module) await pool.end();
  }
}

if (require.main === module) {
  seed().catch(() => process.exit(1));
}

module.exports = seed;
