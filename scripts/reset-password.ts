import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'supat.t@gmail.com';
  let user = await prisma.user.findUnique({ where: { email } });
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  if (!user) {
    console.log(`User ${email} does not exist. Creating...`);
    user = await prisma.user.create({
      data: {
        email,
        name: 'Supat T',
        passwordHash: hashedPassword,
        // Optional: role might be required, but we will see
      }
    });
    console.log('Created user:', user.email);
  } else {
    console.log(`User ${email} exists. Resetting password to "password123"...`);
    user = await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword }
    });
    console.log('Password reset for:', user.email);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
