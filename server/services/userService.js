const prisma = require('../db');

async function upsertGoogleUser(profile) {
  try {
    const email = profile.emails[0].value;
    const name = profile.displayName;
    const profile_picture = profile.photos[0]?.value;
    
    console.log('🔄 Upserting Google user:', { email, name });
    
    const user = await prisma.users.upsert({
      where: { email },
      update: { name, profile_picture },
      create: { name, email, profile_picture },
    });
    
    console.log('✅ Google user upserted:', user);
    return user;
  } catch (error) {
    console.error('❌ Error upserting Google user:', error);
    throw error;
  }
}

async function upsertUser({ name, email, profile_picture }) {
  try {
    console.log('🔄 Upserting user:', { email, name, profile_picture });
    
    const user = await prisma.users.upsert({
      where: { email },
      update: { name, profile_picture },
      create: { name, email, profile_picture },
    });
    
    console.log('✅ User upserted successfully:', user);
    return user;
  } catch (error) {
    console.error('❌ Error upserting user:', error);
    throw error;
  }
}

module.exports = { upsertGoogleUser, upsertUser };
