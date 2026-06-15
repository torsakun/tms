import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { join } from 'path';
import { log } from '../utils/logger';

const DATA_PATH = join(__dirname, '../data/users.json');

export type SeededUser = { id: string; email: string; name: string | null };
export type SeededUsers = { list: SeededUser[]; byEmail: Record<string, SeededUser> };

export async function seedUsers(prisma: PrismaClient): Promise<SeededUsers> {
  log.section('👥 Seeding Users...');

  const data: Array<{ id: string; email: string; name: string; role: string; password: string }> =
    JSON.parse(readFileSync(DATA_PATH, 'utf-8'));

  const result: SeededUsers = { list: [], byEmail: {} };

  for (const u of data) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role as any },
      create: { id: u.id, email: u.email, name: u.name, passwordHash, role: u.role as any },
      select: { id: true, email: true, name: true },
    });
    log.success(`${user.name} (${user.email}) [${u.role}]`);
    result.list.push(user);
    result.byEmail[user.email] = user;
  }

  log.summary(`${result.list.length} users seeded`);
  return result;
}
