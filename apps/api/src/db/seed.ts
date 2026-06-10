import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './index.js';
import { users, categories, products, shippingZones } from './schema.js';

async function seed() {
  console.log('🌱 Seeding database...');

  // ─── Admin User ─────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await db.insert(users).values({
    name: 'MacroStar Admin',
    email: 'admin@macrostar.ng',
    password: hashedPassword,
    role: 'superadmin',
  }).onConflictDoNothing();

  console.log('✅ Admin user created — email: admin@macrostar.ng | password: admin123');

  // ─── Categories ─────────────────────────────────────────────────────────────
  const categoryData = [
    { name: 'Desktop Computers', slug: 'desktop-computers', description: 'Full desktop PC systems and towers', sortOrder: 1 },
    { name: 'Laptops', slug: 'laptops', description: 'Portable laptops and notebooks', sortOrder: 2 },
    { name: 'Computer Parts', slug: 'computer-parts', description: 'CPUs, RAM, motherboards, storage and more', sortOrder: 3 },
    { name: 'Accessories', slug: 'accessories', description: 'Keyboards, mice, headsets, monitors and peripherals', sortOrder: 4 },
    { name: 'Gaming', slug: 'gaming', description: 'Gaming PCs, consoles, controllers, and gaming gear', sortOrder: 5 },
    { name: 'Software', slug: 'software', description: 'Software installations — games and productivity tools', sortOrder: 6 },
    { name: 'Repairs & Services', slug: 'repairs-services', description: 'Computer repair and maintenance services', sortOrder: 7 },
  ];

  const insertedCategories = await db.insert(categories).values(categoryData).onConflictDoNothing().returning();
  console.log(`✅ ${categoryData.length} categories seeded`);

  // get category IDs by slug
  const allCats = await db.query.categories.findMany();
  const catMap = Object.fromEntries(allCats.map(c => [c.slug, c.id]));

  // ─── Sub-categories ──────────────────────────────────────────────────────────
  const subCategories = [
    { name: 'Processors (CPU)', slug: 'processors', parentId: catMap['computer-parts'], sortOrder: 1 },
    { name: 'RAM & Memory', slug: 'ram-memory', parentId: catMap['computer-parts'], sortOrder: 2 },
    { name: 'Graphics Cards (GPU)', slug: 'graphics-cards', parentId: catMap['computer-parts'], sortOrder: 3 },
    { name: 'Motherboards', slug: 'motherboards', parentId: catMap['computer-parts'], sortOrder: 4 },
    { name: 'Storage (SSD/HDD)', slug: 'storage', parentId: catMap['computer-parts'], sortOrder: 5 },
    { name: 'Power Supply Units', slug: 'psu', parentId: catMap['computer-parts'], sortOrder: 6 },
    { name: 'Gaming Consoles', slug: 'gaming-consoles', parentId: catMap['gaming'], sortOrder: 1 },
    { name: 'Gaming Accessories', slug: 'gaming-accessories', parentId: catMap['gaming'], sortOrder: 2 },
    { name: 'Monitors', slug: 'monitors', parentId: catMap['accessories'], sortOrder: 1 },
    { name: 'Keyboards & Mice', slug: 'keyboards-mice', parentId: catMap['accessories'], sortOrder: 2 },
  ];

  await db.insert(categories).values(subCategories).onConflictDoNothing();
  console.log(`✅ ${subCategories.length} sub-categories seeded`);

  // ─── Products ────────────────────────────────────────────────────────────────
  const productData = [
    {
      name: 'HP Pavilion Desktop PC',
      slug: 'hp-pavilion-desktop-pc',
      description: 'Powerful HP Pavilion desktop with Intel Core i5 processor, 8GB RAM, and 512GB SSD. Perfect for home and office use.',
      shortDescription: 'Intel i5, 8GB RAM, 512GB SSD',
      price: '285000.00',
      comparePrice: '320000.00',
      sku: 'MST-DT-001',
      stock: 8,
      categoryId: catMap['desktop-computers'],
      images: ['/uploads/hp-pavilion.jpg'],
      specs: { Processor: 'Intel Core i5-12400', RAM: '8GB DDR4', Storage: '512GB NVMe SSD', OS: 'Windows 11 Home', Graphics: 'Intel UHD 730' },
      tags: ['desktop', 'hp', 'intel', 'office'],
      featured: true,
      brand: 'HP',
      warranty: '1 Year',
    },
    {
      name: 'Lenovo ThinkBook 15 Laptop',
      slug: 'lenovo-thinkbook-15',
      description: 'Business-grade Lenovo ThinkBook 15 with AMD Ryzen 5 processor, 16GB RAM, and a stunning Full HD display.',
      shortDescription: 'AMD Ryzen 5, 16GB RAM, 256GB SSD',
      price: '420000.00',
      comparePrice: '480000.00',
      sku: 'MST-LT-001',
      stock: 12,
      categoryId: catMap['laptops'],
      images: ['/uploads/lenovo-thinkbook.jpg'],
      specs: { Processor: 'AMD Ryzen 5 5500U', RAM: '16GB DDR4', Storage: '256GB NVMe SSD', Display: '15.6" FHD IPS', OS: 'Windows 11 Pro' },
      tags: ['laptop', 'lenovo', 'amd', 'business'],
      featured: true,
      brand: 'Lenovo',
      warranty: '1 Year',
    },
    {
      name: 'Dell Inspiron 15 Laptop',
      slug: 'dell-inspiron-15',
      description: 'Versatile Dell Inspiron 15 laptop with Intel Core i7, 16GB RAM, and dedicated NVIDIA graphics for work and light gaming.',
      shortDescription: 'Intel i7, 16GB RAM, GTX 1650',
      price: '580000.00',
      comparePrice: '650000.00',
      sku: 'MST-LT-002',
      stock: 6,
      categoryId: catMap['laptops'],
      images: ['/uploads/dell-inspiron.jpg'],
      specs: { Processor: 'Intel Core i7-1255U', RAM: '16GB DDR4', Storage: '512GB SSD', Graphics: 'NVIDIA GTX 1650 4GB', Display: '15.6" FHD' },
      tags: ['laptop', 'dell', 'gaming', 'intel'],
      featured: true,
      brand: 'Dell',
      warranty: '1 Year',
    },
    {
      name: 'Intel Core i5-12400 Processor',
      slug: 'intel-core-i5-12400',
      description: '12th Gen Intel Core i5-12400 desktop processor with 6 cores, 12 threads, up to 4.40 GHz boost clock.',
      shortDescription: '6-Core, 12-Thread, up to 4.4GHz',
      price: '95000.00',
      comparePrice: '110000.00',
      sku: 'MST-CPU-001',
      stock: 20,
      categoryId: catMap['processors'],
      images: ['/uploads/i5-12400.jpg'],
      specs: { Cores: '6', Threads: '12', 'Base Clock': '2.5 GHz', 'Boost Clock': '4.4 GHz', Cache: '18MB', Socket: 'LGA1700', TDP: '65W' },
      tags: ['cpu', 'intel', 'processor', 'i5'],
      featured: false,
      brand: 'Intel',
      warranty: '3 Years',
    },
    {
      name: 'Kingston 16GB DDR4 RAM 3200MHz',
      slug: 'kingston-16gb-ddr4-3200',
      description: 'Kingston FURY Beast 16GB DDR4 3200MHz RAM for desktop computers. Plug and play, no BIOS setup required.',
      shortDescription: '16GB DDR4 3200MHz, CL16',
      price: '28000.00',
      comparePrice: '35000.00',
      sku: 'MST-RAM-001',
      stock: 35,
      categoryId: catMap['ram-memory'],
      images: ['/uploads/kingston-ram.jpg'],
      specs: { Capacity: '16GB', Speed: '3200MHz', Type: 'DDR4', Latency: 'CL16', Voltage: '1.35V' },
      tags: ['ram', 'kingston', 'memory', 'ddr4'],
      featured: false,
      brand: 'Kingston',
      warranty: 'Lifetime',
    },
    {
      name: 'NVIDIA RTX 4060 Graphics Card',
      slug: 'nvidia-rtx-4060',
      description: 'NVIDIA GeForce RTX 4060 8GB GDDR6 graphics card. Experience ray tracing and AI-powered DLSS 3 for next-gen gaming.',
      shortDescription: '8GB GDDR6, DLSS 3, Ray Tracing',
      price: '380000.00',
      comparePrice: '420000.00',
      sku: 'MST-GPU-001',
      stock: 5,
      categoryId: catMap['graphics-cards'],
      images: ['/uploads/rtx4060.jpg'],
      specs: { Memory: '8GB GDDR6', 'Memory Bus': '128-bit', 'CUDA Cores': '3072', 'Boost Clock': '2460 MHz', TDP: '115W', Outputs: 'HDMI 2.1, 3x DP 1.4a' },
      tags: ['gpu', 'nvidia', 'gaming', 'rtx'],
      featured: true,
      brand: 'NVIDIA',
      warranty: '2 Years',
    },
    {
      name: 'Samsung 1TB NVMe SSD',
      slug: 'samsung-1tb-nvme-ssd',
      description: 'Samsung 990 Pro 1TB PCIe 4.0 NVMe SSD. Blazing-fast read speeds up to 7,450 MB/s for an instant boot and load experience.',
      shortDescription: '1TB, PCIe 4.0, up to 7450 MB/s',
      price: '72000.00',
      comparePrice: '85000.00',
      sku: 'MST-SSD-001',
      stock: 25,
      categoryId: catMap['storage'],
      images: ['/uploads/samsung-ssd.jpg'],
      specs: { Capacity: '1TB', Interface: 'PCIe 4.0 NVMe M.2', 'Read Speed': '7,450 MB/s', 'Write Speed': '6,900 MB/s', Form: 'M.2 2280' },
      tags: ['ssd', 'samsung', 'storage', 'nvme'],
      featured: false,
      brand: 'Samsung',
      warranty: '5 Years',
    },
    {
      name: 'Sony PlayStation 5 Console',
      slug: 'sony-playstation-5',
      description: 'Sony PlayStation 5 Disc Edition — the next generation of gaming. Experience lightning-fast loading, haptic feedback, and 4K gaming.',
      shortDescription: 'PS5 Disc Edition, 825GB SSD',
      price: '680000.00',
      comparePrice: '750000.00',
      sku: 'MST-CON-001',
      stock: 4,
      categoryId: catMap['gaming-consoles'],
      images: ['/uploads/ps5.jpg'],
      specs: { CPU: 'AMD Zen 2, 8-core', GPU: 'AMD RDNA 2, 10.28 TFLOPS', RAM: '16GB GDDR6', Storage: '825GB Custom SSD', Resolution: 'Up to 8K', 'Frame Rate': 'Up to 120fps' },
      tags: ['playstation', 'ps5', 'console', 'gaming', 'sony'],
      featured: true,
      brand: 'Sony',
      warranty: '1 Year',
    },
    {
      name: 'Windows 11 Pro Installation',
      slug: 'windows-11-pro-installation',
      description: 'Professional Windows 11 Pro installation service. Includes activation, driver setup, and basic optimization. Bring your device to our store.',
      shortDescription: 'Windows 11 Pro with activation',
      price: '15000.00',
      sku: 'MST-SW-001',
      stock: 999,
      categoryId: catMap['software'],
      images: ['/uploads/windows11.jpg'],
      specs: { OS: 'Windows 11 Pro', Activation: 'Genuine License', Includes: 'Driver Setup, Optimization', 'Service Time': '1-2 Hours' },
      tags: ['windows', 'software', 'installation', 'microsoft'],
      featured: false,
      brand: 'Microsoft',
    },
    {
      name: 'Laptop Repair Service',
      slug: 'laptop-repair-service',
      description: 'Professional laptop repair service. Diagnosis, hardware repair, screen replacement, keyboard fix, charging port repair and more.',
      shortDescription: 'Diagnosis + repair, same day',
      price: '10000.00',
      sku: 'MST-REP-001',
      stock: 999,
      categoryId: catMap['repairs-services'],
      images: ['/uploads/repair.jpg'],
      specs: { 'Service Type': 'Laptop Repair', Diagnosis: 'Free', Turnaround: 'Same Day - 3 Days', Warranty: '90-day repair warranty' },
      tags: ['repair', 'service', 'laptop', 'maintenance'],
      featured: false,
    },
  ];

  await db.insert(products).values(productData as any).onConflictDoNothing();
  console.log(`✅ ${productData.length} products seeded`);

  // ─── Shipping Zones (All 36 Nigerian States + FCT) ──────────────────────────
  const shippingZoneData = [
    // Tier 1 — South-South / nearby
    { name: 'Edo State', state: 'Edo', region: 'South-South', baseRate: '5000', perKgRate: '200', estimatedDays: 1 },
    { name: 'Delta State', state: 'Delta', region: 'South-South', baseRate: '7000', perKgRate: '200', estimatedDays: 2 },
    { name: 'Rivers State', state: 'Rivers', region: 'South-South', baseRate: '7000', perKgRate: '250', estimatedDays: 2 },
    { name: 'Bayelsa State', state: 'Bayelsa', region: 'South-South', baseRate: '7000', perKgRate: '250', estimatedDays: 2 },
    { name: 'Akwa Ibom State', state: 'Akwa Ibom', region: 'South-South', baseRate: '7000', perKgRate: '250', estimatedDays: 2 },
    { name: 'Cross River State', state: 'Cross River', region: 'South-South', baseRate: '7000', perKgRate: '250', estimatedDays: 2 },
    // Tier 2 — South-West / South-East / North-Central
    { name: 'Lagos State', state: 'Lagos', region: 'South-West', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    { name: 'Ogun State', state: 'Ogun', region: 'South-West', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    { name: 'Oyo State', state: 'Oyo', region: 'South-West', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    { name: 'Osun State', state: 'Osun', region: 'South-West', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    { name: 'Ondo State', state: 'Ondo', region: 'South-West', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    { name: 'Ekiti State', state: 'Ekiti', region: 'South-West', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    { name: 'Anambra State', state: 'Anambra', region: 'South-East', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    { name: 'Imo State', state: 'Imo', region: 'South-East', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    { name: 'Abia State', state: 'Abia', region: 'South-East', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    { name: 'Enugu State', state: 'Enugu', region: 'South-East', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    { name: 'Ebonyi State', state: 'Ebonyi', region: 'South-East', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    { name: 'Kogi State', state: 'Kogi', region: 'North-Central', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    { name: 'Benue State', state: 'Benue', region: 'North-Central', baseRate: '9000', perKgRate: '300', estimatedDays: 4 },
    { name: 'Kwara State', state: 'Kwara', region: 'North-Central', baseRate: '9000', perKgRate: '300', estimatedDays: 4 },
    { name: 'Nassarawa State', state: 'Nassarawa', region: 'North-Central', baseRate: '9000', perKgRate: '300', estimatedDays: 4 },
    { name: 'Plateau State', state: 'Plateau', region: 'North-Central', baseRate: '9000', perKgRate: '300', estimatedDays: 4 },
    { name: 'Niger State', state: 'Niger', region: 'North-Central', baseRate: '9000', perKgRate: '300', estimatedDays: 4 },
    { name: 'FCT Abuja', state: 'FCT Abuja', region: 'North-Central', baseRate: '9000', perKgRate: '300', estimatedDays: 3 },
    // Tier 3 — Far North
    { name: 'Kaduna State', state: 'Kaduna', region: 'North-West', baseRate: '12000', perKgRate: '400', estimatedDays: 5 },
    { name: 'Kano State', state: 'Kano', region: 'North-West', baseRate: '12000', perKgRate: '400', estimatedDays: 5 },
    { name: 'Katsina State', state: 'Katsina', region: 'North-West', baseRate: '12000', perKgRate: '400', estimatedDays: 6 },
    { name: 'Jigawa State', state: 'Jigawa', region: 'North-West', baseRate: '12000', perKgRate: '400', estimatedDays: 6 },
    { name: 'Bauchi State', state: 'Bauchi', region: 'North-East', baseRate: '12000', perKgRate: '400', estimatedDays: 6 },
    { name: 'Gombe State', state: 'Gombe', region: 'North-East', baseRate: '12000', perKgRate: '400', estimatedDays: 6 },
    { name: 'Adamawa State', state: 'Adamawa', region: 'North-East', baseRate: '12000', perKgRate: '400', estimatedDays: 6 },
    { name: 'Taraba State', state: 'Taraba', region: 'North-East', baseRate: '12000', perKgRate: '400', estimatedDays: 6 },
    { name: 'Borno State', state: 'Borno', region: 'North-East', baseRate: '12000', perKgRate: '400', estimatedDays: 7 },
    { name: 'Yobe State', state: 'Yobe', region: 'North-East', baseRate: '12000', perKgRate: '400', estimatedDays: 7 },
    { name: 'Sokoto State', state: 'Sokoto', region: 'North-West', baseRate: '12000', perKgRate: '400', estimatedDays: 7 },
    { name: 'Zamfara State', state: 'Zamfara', region: 'North-West', baseRate: '12000', perKgRate: '400', estimatedDays: 7 },
    { name: 'Kebbi State', state: 'Kebbi', region: 'North-West', baseRate: '12000', perKgRate: '400', estimatedDays: 7 },
  ];

  await db.insert(shippingZones).values(shippingZoneData).onConflictDoNothing();
  console.log(`✅ ${shippingZoneData.length} shipping zones seeded (all 36 states + FCT)`);

  console.log('\n🎉 Seed complete! MacroStar Technologies database is ready.');
  console.log('─────────────────────────────────────────────');
  console.log('Admin login:');
  console.log('  Email:    admin@macrostar.ng');
  console.log('  Password: admin123');
  console.log('─────────────────────────────────────────────');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
