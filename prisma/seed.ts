import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('password123', 12);

  // Users
  const [carlos, elena, mark, julia, sophia, pulse] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'carlos@planmate.app' },
      update: { avatar: 'https://i.pravatar.cc/300?img=12' },
      create: {
        username: 'Carlos García',
        email: 'carlos@planmate.app',
        password,
        city: 'Madrid',
        role: 'USER',
        avatar: 'https://i.pravatar.cc/300?img=12',
        interests: ['Culture', 'Food', 'Outdoors']
      }
    }),
    prisma.user.upsert({
      where: { email: 'elena@planmate.app' },
      update: { avatar: 'https://i.pravatar.cc/300?img=5' },
      create: {
        username: 'Elena Petrova',
        email: 'elena@planmate.app',
        password,
        city: 'Madrid',
        role: 'USER',
        avatar: 'https://i.pravatar.cc/300?img=5',
        interests: ['Outdoors', 'Nature', 'Hiking']
      }
    }),
    prisma.user.upsert({
      where: { email: 'mark@planmate.app' },
      update: { avatar: 'https://i.pravatar.cc/300?img=33' },
      create: {
        username: 'Mark Thompson',
        email: 'mark@planmate.app',
        password,
        city: 'Austin',
        role: 'USER',
        avatar: 'https://i.pravatar.cc/300?img=33',
        interests: ['Sports', 'Networking', 'Tech']
      }
    }),
    prisma.user.upsert({
      where: { email: 'julia@planmate.app' },
      update: { avatar: 'https://i.pravatar.cc/300?img=25' },
      create: {
        username: 'Julia Santos',
        email: 'julia@planmate.app',
        password,
        city: 'Madrid',
        role: 'USER',
        avatar: 'https://i.pravatar.cc/300?img=25',
        interests: ['Culture', 'Concerts', 'Food']
      }
    }),
    prisma.user.upsert({
      where: { email: 'sophia@planmate.app' },
      update: { avatar: 'https://i.pravatar.cc/300?img=47' },
      create: {
        username: 'Sophia Rivera',
        email: 'sophia@planmate.app',
        password,
        city: 'Austin, Texas',
        role: 'USER',
        bio: "Always looking for new coffee spots and weekend hiking trails. I believe the best connections happen away from the screen. Let's explore the city together!",
        avatar: 'https://i.pravatar.cc/300?img=47',
        interests: ['Hiking', 'Latte Art', 'Golden Hour', 'Indie Rock', 'Pottery']
      }
    }),
    prisma.user.upsert({
      where: { email: 'pulse@planmate.app' },
      update: {},
      create: {
        username: 'Pulse Productions',
        email: 'pulse@planmate.app',
        password,
        city: 'Madrid',
        role: 'COMPANY',
        interests: []
      }
    })
  ]);

  // Plans
  const plan1 = await prisma.plan.upsert({
    where: { id: 'plan-1' },
    update: { coverImage: 'https://picsum.photos/seed/succulent/800/500' },
    create: {
      id: 'plan-1',
      title: 'Sunset Succulent Planting & Wine Night',
      description: 'Join us for an evening of creativity and relaxation! We\'ll be learning the basics of succulent care while potting our own custom arrangements. All materials (plants, pots, soil) are provided, along with a curated select list of local organic wines. Perfect for plant lovers of all experience levels.',
      category: 'Outdoors',
      date: new Date('2026-10-24T18:30:00.000Z'),
      location: 'Urban Oasis Collective',
      locationDetails: '742 Mission St, San Francisco, CA 94103',
      maxPeople: 20,
      isPrivate: false,
      coverImage: 'https://picsum.photos/seed/succulent/800/500',
      creatorId: carlos.id,
      chat: {
        create: {
          name: 'Sunset Succulent Planting & Wine Night',
          members: { create: [{ userId: carlos.id }, { userId: elena.id }, { userId: mark.id }] }
        }
      }
    }
  });

  const plan2 = await prisma.plan.upsert({
    where: { id: 'plan-2' },
    update: { coverImage: 'https://picsum.photos/seed/artgallery/800/500' },
    create: {
      id: 'plan-2',
      title: 'Modern Art Gallery Tour',
      description: 'Explore the latest contemporary art exhibitions with a small curated group. We\'ll visit three galleries and discuss the works over coffee afterward. Art background not required — just curiosity!',
      category: 'Culture',
      date: new Date('2026-11-05T11:00:00.000Z'),
      location: 'Museo Reina Sofía',
      locationDetails: 'C. de Santa Isabel, 52, Madrid 28012',
      maxPeople: 5,
      isPrivate: false,
      coverImage: 'https://picsum.photos/seed/artgallery/800/500',
      creatorId: carlos.id,
      chat: {
        create: {
          name: 'Modern Art Gallery Tour',
          members: { create: [{ userId: carlos.id }] }
        }
      }
    }
  });

  const plan3 = await prisma.plan.upsert({
    where: { id: 'plan-3' },
    update: { coverImage: 'https://picsum.photos/seed/picnicpark/800/500' },
    create: {
      id: 'plan-3',
      title: 'Picnic & Frisbee in Retiro',
      description: 'Bring your own food and drinks for a relaxed Saturday picnic in Parque del Retiro. We\'ll play Frisbee, chat, and enjoy the park. All skill levels welcome — it\'s about fun, not competition!',
      category: 'Outdoors',
      date: new Date('2026-09-12T12:00:00.000Z'),
      location: 'Parque del Retiro',
      locationDetails: 'Pl. de la Independencia, 7, Madrid 28001',
      maxPeople: 12,
      isPrivate: false,
      coverImage: 'https://picsum.photos/seed/picnicpark/800/500',
      creatorId: elena.id,
      chat: {
        create: {
          name: 'Picnic & Frisbee in Retiro',
          members: { create: [{ userId: elena.id }] }
        }
      }
    }
  });

  // Swipe deck plans
  const swipePlans = [
    {
      id: 'plan-swipe-1',
      title: 'Prado Museum Visit',
      description: 'A guided tour of the Prado Museum highlights.',
      category: 'Culture',
      date: new Date('2026-08-15T10:00:00.000Z'),
      location: 'Museo del Prado, Madrid',
      maxPeople: 8,
      coverImage: 'https://picsum.photos/seed/pradomuseum/800/500',
      creatorId: julia.id
    },
    {
      id: 'plan-swipe-2',
      title: 'Yoga in the Park',
      description: 'Morning yoga session at Retiro park. All levels welcome.',
      category: 'Sport',
      date: new Date('2026-08-20T08:00:00.000Z'),
      location: 'Parque del Retiro, Madrid',
      maxPeople: 15,
      coverImage: 'https://picsum.photos/seed/yogapark/800/500',
      creatorId: julia.id
    },
    {
      id: 'plan-swipe-3',
      title: 'Food Market Tour',
      description: 'Explore the best local food markets in Madrid and taste authentic dishes.',
      category: 'Food',
      date: new Date('2026-09-01T11:00:00.000Z'),
      location: 'Mercado de San Miguel, Madrid',
      maxPeople: 10,
      coverImage: 'https://picsum.photos/seed/foodmarket/800/500',
      creatorId: mark.id
    },
    {
      id: 'plan-swipe-4',
      title: 'Trail Hiking Adventure',
      description: 'A 10km hike through the Sierra de Guadarrama mountains.',
      category: 'Outdoors',
      date: new Date('2026-09-07T07:00:00.000Z'),
      location: 'Sierra de Guadarrama',
      maxPeople: 12,
      coverImage: 'https://picsum.photos/seed/trailhike/800/500',
      creatorId: mark.id
    },
    {
      id: 'plan-swipe-5',
      title: 'Tech Networking Meetup',
      description: 'Connect with local developers and entrepreneurs over drinks.',
      category: 'Tech',
      date: new Date('2026-09-15T19:00:00.000Z'),
      location: 'WeWork Gran Vía, Madrid',
      maxPeople: 30,
      coverImage: 'https://picsum.photos/seed/technetwork/800/500',
      creatorId: julia.id
    }
  ];

  for (const swipePlan of swipePlans) {
    await prisma.plan.upsert({
      where: { id: swipePlan.id },
      update: { coverImage: swipePlan.coverImage },
      create: {
        ...swipePlan,
        chat: {
          create: {
            name: swipePlan.title,
            members: { create: [{ userId: swipePlan.creatorId }] }
          }
        }
      }
    });
  }

  // Matches: Elena and Mark joined plan-1
  const plan1Chat = await prisma.chat.findUnique({ where: { planId: plan1.id } });

  await Promise.all([
    prisma.match.upsert({
      where: { userId_planId: { userId: elena.id, planId: plan1.id } },
      update: {},
      create: { userId: elena.id, planId: plan1.id, status: 'ACCEPTED' }
    }),
    prisma.match.upsert({
      where: { userId_planId: { userId: mark.id, planId: plan1.id } },
      update: {},
      create: { userId: mark.id, planId: plan1.id, status: 'ACCEPTED' }
    })
  ]);

  // Comments on plan-1
  const commentsExist = await prisma.comment.count({ where: { planId: plan1.id } });
  if (commentsExist === 0) {
    await prisma.comment.createMany({
      data: [
        { planId: plan1.id, userId: elena.id, text: "Can't wait! Should we bring our own gardening gloves or are those provided too?" },
        { planId: plan1.id, userId: mark.id, text: "This sounds amazing! What types of wine will be available? I love a good Tempranillo." },
        { planId: plan1.id, userId: julia.id, text: "I've been wanting to try this! Is there a skill level requirement?" }
      ]
    });
  }

  // Chat messages for plan-1 chat
  if (plan1Chat) {
    const msgCount = await prisma.message.count({ where: { chatId: plan1Chat.id } });
    if (msgCount === 0) {
      await prisma.message.createMany({
        data: [
          { chatId: plan1Chat.id, senderId: elena.id, content: "Hey everyone! So excited for Saturday!" },
          { chatId: plan1Chat.id, senderId: carlos.id, content: "Same! I've been setting up the pots 🌱" },
          { chatId: plan1Chat.id, senderId: mark.id, content: "Should I bring anything?" },
          { chatId: plan1Chat.id, senderId: carlos.id, content: "Just bring yourselves! Everything is provided." }
        ]
      });
    }
  }

  // Events (created by Pulse Productions)
  await Promise.all([
    prisma.event.upsert({
      where: { id: 'event-1' },
      update: { imageUrl: 'https://picsum.photos/seed/electronicfest/800/500' },
      create: {
        id: 'event-1',
        title: 'Electronic Beats Festival',
        description: 'Three stages, 20+ artists, and an unforgettable night of electronic music in the heart of Madrid.',
        location: 'Madrid Río, Madrid',
        date: new Date('2026-08-24T18:00:00.000Z'),
        capacity: 5000,
        price: '€45',
        imageUrl: 'https://picsum.photos/seed/electronicfest/800/500',
        isPromoted: true,
        companyId: pulse.id
      }
    }),
    prisma.event.upsert({
      where: { id: 'event-2' },
      update: { imageUrl: 'https://picsum.photos/seed/streetfoodfest/800/500' },
      create: {
        id: 'event-2',
        title: 'Street Food Festival',
        description: 'A celebration of global street food with over 40 vendors from around the world.',
        location: 'Matadero Madrid',
        date: new Date('2026-09-05T12:00:00.000Z'),
        capacity: 2000,
        price: 'FREE',
        imageUrl: 'https://picsum.photos/seed/streetfoodfest/800/500',
        isPromoted: false,
        companyId: pulse.id
      }
    }),
    prisma.event.upsert({
      where: { id: 'event-3' },
      update: { imageUrl: 'https://picsum.photos/seed/indiefilm/800/500' },
      create: {
        id: 'event-3',
        title: 'Indie Film Screening Night',
        description: 'A curated evening of award-winning independent films under the stars.',
        location: 'CineBici, Parque Tierno Galván',
        date: new Date('2026-09-20T21:00:00.000Z'),
        capacity: 300,
        price: '€12',
        imageUrl: 'https://picsum.photos/seed/indiefilm/800/500',
        isPromoted: false,
        companyId: pulse.id
      }
    })
  ]);

  console.log('Seed complete!');
  console.log('Test credentials: carlos@planmate.app / elena@planmate.app / sophia@planmate.app — all password: password123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
