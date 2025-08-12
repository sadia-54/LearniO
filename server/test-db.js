const prisma = require('./db');

async function testDatabase() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test user creation
    const testUser = await prisma.users.upsert({
      where: { email: 'test@example.com' },
      update: { name: 'Test User Updated' },
      create: { 
        name: 'Test User', 
        email: 'test@example.com', 
        profile_picture: 'https://example.com/avatar.jpg' 
      },
    });
    
    console.log('✅ Test user created/updated:', testUser);
    
    // Test user retrieval
    const retrievedUser = await prisma.users.findUnique({
      where: { email: 'test@example.com' }
    });
    
    console.log('✅ Test user retrieved:', retrievedUser);
    
    // Clean up test user
    await prisma.users.delete({
      where: { email: 'test@example.com' }
    });
    
    console.log('✅ Test user cleaned up');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

testDatabase();
