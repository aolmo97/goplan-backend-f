import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find all PENDING matches on PUBLIC plans
  const pending = await prisma.match.findMany({
    where: {
      status: 'PENDING',
      plan: { isPrivate: false }
    },
    include: {
      plan: { include: { chat: true } }
    }
  });

  console.log(`Found ${pending.length} pending matches on public plans`);

  let fixed = 0;
  for (const match of pending) {
    await prisma.match.update({
      where: { id: match.id },
      data: { status: 'ACCEPTED' }
    });

    const chat = match.plan.chat;
    if (chat) {
      await prisma.chatMember.upsert({
        where: { chatId_userId: { chatId: chat.id, userId: match.userId } },
        create: { chatId: chat.id, userId: match.userId },
        update: {}
      });
    }
    fixed++;
  }

  console.log(`Fixed ${fixed} matches → ACCEPTED + ChatMember created`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
