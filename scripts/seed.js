import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

const dummyUsers = [
  {
    uid: 'farmer001',
    email: 'farmer1@krishilink.com',
    displayName: 'রহিম উদ্দিন',
    photoURL: 'https://i.pravatar.cc/150?img=11',
    role: 'farmer',
    phone: '+8801712345678',
    address: 'গাজীপুর, ঢাকা',
    district: 'Gazipur',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    uid: 'farmer002',
    email: 'farmer2@krishilink.com',
    displayName: 'করিম মিয়া',
    photoURL: 'https://i.pravatar.cc/150?img=12',
    role: 'farmer',
    phone: '+8801812345678',
    address: 'ময়মনসিংহ সদর',
    district: 'Mymensingh',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date()
  },
  {
    uid: 'farmer003',
    email: 'farmer3@krishilink.com',
    displayName: 'আব্দুল হালিম',
    photoURL: 'https://i.pravatar.cc/150?img=13',
    role: 'farmer',
    phone: '+8801912345678',
    address: 'রাজশাহী সদর',
    district: 'Rajshahi',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date()
  },
  {
    uid: 'buyer001',
    email: 'buyer1@krishilink.com',
    displayName: 'সাইফুল ইসলাম',
    photoURL: 'https://i.pravatar.cc/150?img=14',
    role: 'buyer',
    phone: '+8801612345678',
    address: 'মিরপুর, ঢাকা',
    district: 'Dhaka',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date()
  },
  {
    uid: 'buyer002',
    email: 'buyer2@krishilink.com',
    displayName: 'নাজমুল হক',
    photoURL: 'https://i.pravatar.cc/150?img=15',
    role: 'buyer',
    phone: '+8801512345678',
    address: 'চট্টগ্রাম সদর',
    district: 'Chittagong',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date()
  }
];

const dummyCrops = [
  {
    name: 'ধান (BR-28)',
    description: 'উচ্চ ফলনশীল BR-28 জাতের ধান। জৈব সার ব্যবহার করে চাষ করা হয়েছে। দানা মোটা ও সুগন্ধযুক্ত।',
    category: 'grains',
    quantity: 500,
    unit: 'kg',
    pricePerUnit: 45,
    location: 'গাজীপুর, ঢাকা',
    district: 'Gazipur',
    images: [
      'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800',
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800'
    ],
    harvestDate: new Date('2024-11-15'),
    status: 'available',
    owner: {
      uid: 'farmer001',
      displayName: 'রহিম উদ্দিন',
      email: 'farmer1@krishilink.com',
      photoURL: 'https://i.pravatar.cc/150?img=11',
      phone: '+8801712345678'
    },
    interests: [],
    createdAt: new Date('2024-11-20'),
    updatedAt: new Date()
  },
  {
    name: 'আলু (ডায়মন্ড)',
    description: 'ডায়মন্ড জাতের তাজা আলু। ঠাণ্ডা জায়গায় সংরক্ষণ করা হয়েছে। রান্নার জন্য উপযুক্ত।',
    category: 'vegetables',
    quantity: 1000,
    unit: 'kg',
    pricePerUnit: 35,
    location: 'ময়মনসিংহ সদর',
    district: 'Mymensingh',
    images: [
      'https://images.unsplash.com/photo-1518977676601-b53f82ber69c?w=800',
      'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=800'
    ],
    harvestDate: new Date('2024-12-01'),
    status: 'available',
    owner: {
      uid: 'farmer002',
      displayName: 'করিম মিয়া',
      email: 'farmer2@krishilink.com',
      photoURL: 'https://i.pravatar.cc/150?img=12',
      phone: '+8801812345678'
    },
    interests: [],
    createdAt: new Date('2024-12-05'),
    updatedAt: new Date()
  },
  {
    name: 'আম (হিমসাগর)',
    description: 'রাজশাহীর বিখ্যাত হিমসাগর আম। সম্পূর্ণ জৈব পদ্ধতিতে চাষ করা। মিষ্টি ও রসালো।',
    category: 'fruits',
    quantity: 300,
    unit: 'kg',
    pricePerUnit: 120,
    location: 'রাজশাহী সদর',
    district: 'Rajshahi',
    images: [
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800',
      'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800'
    ],
    harvestDate: new Date('2025-06-01'),
    status: 'available',
    owner: {
      uid: 'farmer003',
      displayName: 'আব্দুল হালিম',
      email: 'farmer3@krishilink.com',
      photoURL: 'https://i.pravatar.cc/150?img=13',
      phone: '+8801912345678'
    },
    interests: [],
    createdAt: new Date('2024-12-10'),
    updatedAt: new Date()
  },
  {
    name: 'টমেটো',
    description: 'হাইব্রিড জাতের লাল টাটকা টমেটো। কীটনাশকমুক্ত। সালাদ ও রান্না দুটোতেই ব্যবহার করা যায়।',
    category: 'vegetables',
    quantity: 200,
    unit: 'kg',
    pricePerUnit: 60,
    location: 'গাজীপুর, ঢাকা',
    district: 'Gazipur',
    images: [
      'https://images.unsplash.com/photo-1546470427-227c7aa0a2c8?w=800',
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'
    ],
    harvestDate: new Date('2024-12-10'),
    status: 'available',
    owner: {
      uid: 'farmer001',
      displayName: 'রহিম উদ্দিন',
      email: 'farmer1@krishilink.com',
      photoURL: 'https://i.pravatar.cc/150?img=11',
      phone: '+8801712345678'
    },
    interests: [
      {
        buyerUid: 'buyer001',
        buyerName: 'সাইফুল ইসলাম',
        buyerEmail: 'buyer1@krishilink.com',
        buyerPhone: '+8801612345678',
        message: 'আমি ৫০ কেজি টমেটো কিনতে চাই। দাম একটু কমানো যাবে?',
        status: 'pending',
        createdAt: new Date('2024-12-12')
      }
    ],
    createdAt: new Date('2024-12-08'),
    updatedAt: new Date()
  },
  {
    name: 'পেঁয়াজ',
    description: 'দেশি জাতের পেঁয়াজ। শুকনো ও ভালোভাবে সংরক্ষিত। দীর্ঘদিন রাখা যায়।',
    category: 'vegetables',
    quantity: 800,
    unit: 'kg',
    pricePerUnit: 55,
    location: 'ময়মনসিংহ সদর',
    district: 'Mymensingh',
    images: [
      'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800',
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800'
    ],
    harvestDate: new Date('2024-11-25'),
    status: 'available',
    owner: {
      uid: 'farmer002',
      displayName: 'করিম মিয়া',
      email: 'farmer2@krishilink.com',
      photoURL: 'https://i.pravatar.cc/150?img=12',
      phone: '+8801812345678'
    },
    interests: [],
    createdAt: new Date('2024-11-28'),
    updatedAt: new Date()
  },
  {
    name: 'কলা (সাগর)',
    description: 'সাগর কলা - মিষ্টি ও পুষ্টিকর। সম্পূর্ণ পাকা অবস্থায় সংগ্রহ করা।',
    category: 'fruits',
    quantity: 150,
    unit: 'dozen',
    pricePerUnit: 80,
    location: 'রাজশাহী সদর',
    district: 'Rajshahi',
    images: [
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800',
      'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800'
    ],
    harvestDate: new Date('2024-12-12'),
    status: 'available',
    owner: {
      uid: 'farmer003',
      displayName: 'আব্দুল হালিম',
      email: 'farmer3@krishilink.com',
      photoURL: 'https://i.pravatar.cc/150?img=13',
      phone: '+8801912345678'
    },
    interests: [
      {
        buyerUid: 'buyer002',
        buyerName: 'নাজমুল হক',
        buyerEmail: 'buyer2@krishilink.com',
        buyerPhone: '+8801512345678',
        message: '৫০ ডজন কলা দরকার। ডেলিভারি চট্টগ্রামে দেওয়া যাবে?',
        status: 'accepted',
        createdAt: new Date('2024-12-13')
      }
    ],
    createdAt: new Date('2024-12-11'),
    updatedAt: new Date()
  },
  {
    name: 'গম',
    description: 'উচ্চমানের গম। আটা তৈরির জন্য উপযুক্ত। পরিষ্কার ও শুকনো।',
    category: 'grains',
    quantity: 400,
    unit: 'kg',
    pricePerUnit: 42,
    location: 'রাজশাহী সদর',
    district: 'Rajshahi',
    images: [
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800'
    ],
    harvestDate: new Date('2024-10-20'),
    status: 'available',
    owner: {
      uid: 'farmer003',
      displayName: 'আব্দুল হালিম',
      email: 'farmer3@krishilink.com',
      photoURL: 'https://i.pravatar.cc/150?img=13',
      phone: '+8801912345678'
    },
    interests: [],
    createdAt: new Date('2024-10-25'),
    updatedAt: new Date()
  },
  {
    name: 'মরিচ (কাঁচা)',
    description: 'তাজা কাঁচা মরিচ। ঝাল কম। রান্নায় স্বাদ বাড়ায়।',
    category: 'vegetables',
    quantity: 50,
    unit: 'kg',
    pricePerUnit: 100,
    location: 'গাজীপুর, ঢাকা',
    district: 'Gazipur',
    images: [
      'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800',
      'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=800'
    ],
    harvestDate: new Date('2024-12-14'),
    status: 'available',
    owner: {
      uid: 'farmer001',
      displayName: 'রহিম উদ্দিন',
      email: 'farmer1@krishilink.com',
      photoURL: 'https://i.pravatar.cc/150?img=11',
      phone: '+8801712345678'
    },
    interests: [],
    createdAt: new Date('2024-12-14'),
    updatedAt: new Date()
  },
  {
    name: 'সরিষা',
    description: 'দেশি জাতের সরিষা। তেল তৈরির জন্য উপযুক্ত। ভালো মানের।',
    category: 'grains',
    quantity: 200,
    unit: 'kg',
    pricePerUnit: 95,
    location: 'ময়মনসিংহ সদর',
    district: 'Mymensingh',
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800'
    ],
    harvestDate: new Date('2024-11-10'),
    status: 'sold',
    owner: {
      uid: 'farmer002',
      displayName: 'করিম মিয়া',
      email: 'farmer2@krishilink.com',
      photoURL: 'https://i.pravatar.cc/150?img=12',
      phone: '+8801812345678'
    },
    interests: [
      {
        buyerUid: 'buyer001',
        buyerName: 'সাইফুল ইসলাম',
        buyerEmail: 'buyer1@krishilink.com',
        buyerPhone: '+8801612345678',
        message: 'পুরো ২০০ কেজি সরিষা কিনতে চাই।',
        status: 'accepted',
        createdAt: new Date('2024-11-12')
      }
    ],
    createdAt: new Date('2024-11-08'),
    updatedAt: new Date()
  },
  {
    name: 'পেঁপে',
    description: 'তাজা পাকা পেঁপে। মিষ্টি ও সুস্বাদু। ভিটামিন সমৃদ্ধ।',
    category: 'fruits',
    quantity: 100,
    unit: 'pieces',
    pricePerUnit: 40,
    location: 'গাজীপুর, ঢাকা',
    district: 'Gazipur',
    images: [
      'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=800',
      'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=800'
    ],
    harvestDate: new Date('2024-12-13'),
    status: 'available',
    owner: {
      uid: 'farmer001',
      displayName: 'রহিম উদ্দিন',
      email: 'farmer1@krishilink.com',
      photoURL: 'https://i.pravatar.cc/150?img=11',
      phone: '+8801712345678'
    },
    interests: [],
    createdAt: new Date('2024-12-13'),
    updatedAt: new Date()
  }
];

async function seedDatabase() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('krishilink');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('crops').deleteMany({});
    
    // Insert users
    console.log('👥 Inserting users...');
    const usersResult = await db.collection('users').insertMany(dummyUsers);
    console.log(`   ✅ Inserted ${usersResult.insertedCount} users`);
    
    // Insert crops
    console.log('🌾 Inserting crops...');
    const cropsResult = await db.collection('crops').insertMany(dummyCrops);
    console.log(`   ✅ Inserted ${cropsResult.insertedCount} crops`);
    
    console.log('\n🎉 Database seeded successfully!');
    console.log(`   - Users: ${usersResult.insertedCount}`);
    console.log(`   - Crops: ${cropsResult.insertedCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    await client.close();
    console.log('\n👋 Connection closed');
  }
}

seedDatabase();
