const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      passwordHash, 
      name: 'Admin User', 
      role: 'ADMIN' 
    },
    create: {
      email,
      passwordHash,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });

  console.log('🎉 Demo admin user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
}

main()
  .catch(e => {
    console.error('Error creating demo user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
