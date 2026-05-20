import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('password123', 12);

  // Users
  const [carlos, elena, mark, julia, sophia, pulse] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'carlos@goplan.app' },
      update: {},
      create: {
        username: 'Carlos García',
        email: 'carlos@goplan.app',
        password,
        city: 'Madrid',
        role: 'USER',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhhmH9xqRZwMxV0A2OBUNmnFC2jADVOCkw3E3b565HMZ_aq55SiryHrR84tyXDn6wfLVIrnMKdEAwEGYhKG_dC9uR1bQ0DPlSMw11EGCwlFwYN0IMGhlArfzUvZ_xj8T0nFJiJSZHzl6zZppYz7IM2vTZoc3Hw5flnAQMjbswZHknFg-3vqtsnKmYBXfEl3ZpOoZ3xw_MxHGV7ySz1dZiCAw-N2FrBRHopuVkq-9vcY9HE17KSGMHhmY8odODq736tCqaPEA39CcPV',
        interests: ['Culture', 'Food', 'Outdoors']
      }
    }),
    prisma.user.upsert({
      where: { email: 'elena@goplan.app' },
      update: {},
      create: {
        username: 'Elena Petrova',
        email: 'elena@goplan.app',
        password,
        city: 'Madrid',
        role: 'USER',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrEkSQSp_gT7gPBssGNjbV2bk0r29g806FhmVvocHQGe-t8WR3RjjWEb1v5JP4MLqaD7lAUF5SsBmJ8AmeiGXYDxC4ATQSTZBv6pxYwlQinc0V3fiCQReW3fa01F2i4TV1gCt4hn5GTduSHpLxGdbyGQKLO51WqgfSZmggvU7O08slOx_w89xuonuSD3OUY7Q2QlLrXNS9oTbZY09pve0AylpKleAFzwiQKMeiF-MgjuO2auIuGcyEJ9Rj6bg70zdIXocg8CpLgSZU',
        interests: ['Outdoors', 'Nature', 'Hiking']
      }
    }),
    prisma.user.upsert({
      where: { email: 'mark@goplan.app' },
      update: {},
      create: {
        username: 'Mark Thompson',
        email: 'mark@goplan.app',
        password,
        city: 'Austin',
        role: 'USER',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCg8qS5DznLc1dh6Brcw4qFwASREpwu9GgTQqwXVRaIL_hbeQhd1IqGW99dtogpPfWDcJ4qEY7ty90IFNqdEOYjMcUrKCSzDiXeHc8P9cls67P2acnIMExAhrl2n8xhj1xTTqQIIr_WoC6OGNMOJEWwrBbvoutR2KkleaHqjepaT_cCG6PD3aMwXUOxrW0-9e0_o-icuXsLCSHSWwnagWQDmy_mJ5_Qg1EDgMSPwdZUwOwpUavWyYEzKA1twuaTH0HsubOcYBhA9Jnz',
        interests: ['Sports', 'Networking', 'Tech']
      }
    }),
    prisma.user.upsert({
      where: { email: 'julia@goplan.app' },
      update: {},
      create: {
        username: 'Julia Santos',
        email: 'julia@goplan.app',
        password,
        city: 'Madrid',
        role: 'USER',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTkj8MBBQg2EiLvhZPMfdUkCczcxzT1L2AKY8A2jqmPs-TdrpSaEBRw_4yfvARMxQOHCoVHc7q5aSwlihAuobFCQmuoS_0occUzUTZe4_yxNBu28577-3oMJT3K8VEy3gZY9koYJB-LLZUXocZ7q2eCv0u7BDxbm5_Uk1HakHXpWxlA5wd4isTuiE4k3a8L_L5x0FFADFMfhfQbvUccVup6vfiSDDy0m2iFX9H16RwHgFrd0LqkvbPVSgDYQSwYRxFWRqlyAXp1piu',
        interests: ['Culture', 'Concerts', 'Food']
      }
    }),
    prisma.user.upsert({
      where: { email: 'sophia@goplan.app' },
      update: {},
      create: {
        username: 'Sophia Rivera',
        email: 'sophia@goplan.app',
        password,
        city: 'Austin, Texas',
        role: 'USER',
        bio: "Always looking for new coffee spots and weekend hiking trails. I believe the best connections happen away from the screen. Let's explore the city together!",
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCr8AM4JiMQTHf7zkEDVch8MDRL6QT2jg-S-OFYVGWNppcHLvHhTbuEhAta31ds5tWvbMu5SQzjHAytvem-jqUxkXmclbrJXc6AlrhQfYSHw2fqjEWDTuaCTzKGctXX7JQ0211gsADTNfGP_rUxYwhTNG7O1QzcPWI2Gl0vDOWeB5Zbsygb_089Vo-CJveTSacUX-ITLBGWLGszSMnuj3gV-JV5BWIWE5j2hxZ4_MsPD5US8DacolXS2AXyx9LJ0K_1R9f86WkJGC94',
        interests: ['Hiking', 'Latte Art', 'Golden Hour', 'Indie Rock', 'Pottery']
      }
    }),
    prisma.user.upsert({
      where: { email: 'pulse@goplan.app' },
      update: {},
      create: {
        username: 'Pulse Productions',
        email: 'pulse@goplan.app',
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
    update: {},
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
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuKDMiJwn-V5nQ3V3Iumi2uy6rVHhUKZYiR6SkoPuA_k61dW5x1FbziDOquDSZ5c0UkGlYsC0oprlzatARiebryyOSl7nQi6ykIZlxTslmQPlL3ux9Tjb3UEFGtCcasbhi6xTaPWiyrBrD90LI8c5KhC--oIlnZgbeSG3oYg5o4irGJrGbqSoq6smf0cnxmM5Lr--u9wp6z10xmYWZuJl8Vpdu8EcE_5HzYIO9wU3w6wseozioMBSK99aBYKUr-65spAr9GJ2gyh2e',
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
    update: {},
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
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXV2cQOHUc5FJziC8orF97zXonUmEQNgG-YdS75PO0CKlok8xyxdmjQYzFLf_hDh8V6ebH6RivVydsRh4XlX5fc4iQBL4O8PdlwrS1qt8VhcO_i7ilVZi4o0qUS6roTHnmPhI9k4VzHm9x-ZCH_lbGVZuhl56ioBDowuTlkZEbGJDI59KaiahmWhV3MQf9D3r9ZEh04MxRarw5ivXKuY5kXWznJRb3n3_-aPQjcGVm4QHR7tid74fzjH0lCCDeI-dbvwbTkMBZv1Cd',
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
    update: {},
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
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy-C-oPnX5ZGk00oVKr6zdlBITWLm1b3VF_gJJku3OdPVWHcSwOWIWTVG_Z-H3nYZvNpXhhzmsH7-YaB0UMzYZPuRULac1jb944UD-gT--aT10Y16wLtfGOl_Jny3-O196Wlxw4x1bOOplJlKvfGRaM4FViDGmjS0DvbaCcS4NVwNwrhEtER2KT23Qj2Vitb6LBh5oFjwPdMPNnzLoksWvla3WaRM-WeWNLWewlhG_jQaZYcZZ01bHR1zPgt8Ic7kuNSU7yOQbH1yS',
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
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXV2cQOHUc5FJziC8orF97zXonUmEQNgG-YdS75PO0CKlok8xyxdmjQYzFLf_hDh8V6ebH6RivVydsRh4XlX5fc4iQBL4O8PdlwrS1qt8VhcO_i7ilVZi4o0qUS6roTHnmPhI9k4VzHm9x-ZCH_lbGVZuhl56ioBDowuTlkZEbGJDI59KaiahmWhV3MQf9D3r9ZEh04MxRarw5ivXKuY5kXWznJRb3n3_-aPQjcGVm4QHR7tid74fzjH0lCCDeI-dbvwbTkMBZv1Cd',
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
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy-C-oPnX5ZGk00oVKr6zdlBITWLm1b3VF_gJJku3OdPVWHcSwOWIWTVG_Z-H3nYZvNpXhhzmsH7-YaB0UMzYZPuRULac1jb944UD-gT--aT10Y16wLtfGOl_Jny3-O196Wlxw4x1bOOplJlKvfGRaM4FViDGmjS0DvbaCcS4NVwNwrhEtER2KT23Qj2Vitb6LBh5oFjwPdMPNnzLoksWvla3WaRM-WeWNLWewlhG_jQaZYcZZ01bHR1zPgt8Ic7kuNSU7yOQbH1yS',
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
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7-9Gq6yoPOmbVPObF-GV_8QISWTV2Js6tmdkZArjRjnet3N2raT7uPbWxojOgSZB8UmjzmMOxmToetfhKzaKgc86T__LbQvlgHJl-nDBn8EAz3KKmu-S5mUn4AZNNGo5o9TXiBslJhc8aAEE2wVdfAb5TMqF8pXv35_SMldy9kQmzuGdBfEGVzlgDWdRk3XFpys34-HfOgjrXIerjcOJtQC-gN12XzDAM47R5t_vWDjVfYzyDQCeAoFvl3ILRa7_lCHY5jtrwrG7v',
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
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnxSZQnEsqB1qqHIRmHJlayiMGy7qmwxd5jSkaN5x-H1liGnUMPgEZWSfV2hC4QPqs2-d0EMq1AOysBG8bJDSijfxecMYOhzHc_UNCmhhq-S0ucsx3zIwKI5s00QboCUELHCWAXj8d4WRGbEzGw6eEiiVyFaNYnstIJAvuPSuxKou_KJjCXDTdlhXae_a5CLPtJas_HKynxI35sJKiJXLOiq1wULc_yqdk3EXOXSYziJAfLl6ywahnsT7mYnhW9lCnKjxHXSvvB8k7',
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
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhhmH9xqRZwMxV0A2OBUNmnFC2jADVOCkw3E3b565HMZ_aq55SiryHrR84tyXDn6wfLVIrnMKdEAwEGYhKG_dC9uR1bQ0DPlSMw11EGCwlFwYN0IMGhlArfzUvZ_xj8T0nFJiJSZHzl6zZppYz7IM2vTZoc3Hw5flnAQMjbswZHknFg-3vqtsnKmYBXfEl3ZpOoZ3xw_MxHGV7ySz1dZiCAw-N2FrBRHopuVkq-9vcY9HE17KSGMHhmY8odODq736tCqaPEA39CcPV',
      creatorId: julia.id
    }
  ];

  for (const swipePlan of swipePlans) {
    await prisma.plan.upsert({
      where: { id: swipePlan.id },
      update: {},
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
      update: {},
      create: {
        id: 'event-1',
        title: 'Electronic Beats Festival',
        description: 'Three stages, 20+ artists, and an unforgettable night of electronic music in the heart of Madrid.',
        location: 'Madrid Río, Madrid',
        date: new Date('2026-08-24T18:00:00.000Z'),
        capacity: 5000,
        price: '€45',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhhmH9xqRZwMxV0A2OBUNmnFC2jADVOCkw3E3b565HMZ_aq55SiryHrR84tyXDn6wfLVIrnMKdEAwEGYhKG_dC9uR1bQ0DPlSMw11EGCwlFwYN0IMGhlArfzUvZ_xj8T0nFJiJSZHzl6zZppYz7IM2vTZoc3Hw5flnAQMjbswZHknFg-3vqtsnKmYBXfEl3ZpOoZ3xw_MxHGV7ySz1dZiCAw-N2FrBRHopuVkq-9vcY9HE17KSGMHhmY8odODq736tCqaPEA39CcPV',
        isPromoted: true,
        companyId: pulse.id
      }
    }),
    prisma.event.upsert({
      where: { id: 'event-2' },
      update: {},
      create: {
        id: 'event-2',
        title: 'Street Food Festival',
        description: 'A celebration of global street food with over 40 vendors from around the world.',
        location: 'Matadero Madrid',
        date: new Date('2026-09-05T12:00:00.000Z'),
        capacity: 2000,
        price: 'FREE',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7-9Gq6yoPOmbVPObF-GV_8QISWTV2Js6tmdkZArjRjnet3N2raT7uPbWxojOgSZB8UmjzmMOxmToetfhKzaKgc86T__LbQvlgHJl-nDBn8EAz3KKmu-S5mUn4AZNNGo5o9TXiBslJhc8aAEE2wVdfAb5TMqF8pXv35_SMldy9kQmzuGdBfEGVzlgDWdRk3XFpys34-HfOgjrXIerjcOJtQC-gN12XzDAM47R5t_vWDjVfYzyDQCeAoFvl3ILRa7_lCHY5jtrwrG7v',
        isPromoted: false,
        companyId: pulse.id
      }
    }),
    prisma.event.upsert({
      where: { id: 'event-3' },
      update: {},
      create: {
        id: 'event-3',
        title: 'Indie Film Screening Night',
        description: 'A curated evening of award-winning independent films under the stars.',
        location: 'CineBici, Parque Tierno Galván',
        date: new Date('2026-09-20T21:00:00.000Z'),
        capacity: 300,
        price: '€12',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXV2cQOHUc5FJziC8orF97zXonUmEQNgG-YdS75PO0CKlok8xyxdmjQYzFLf_hDh8V6ebH6RivVydsRh4XlX5fc4iQBL4O8PdlwrS1qt8VhcO_i7ilVZi4o0qUS6roTHnmPhI9k4VzHm9x-ZCH_lbGVZuhl56ioBDowuTlkZEbGJDI59KaiahmWhV3MQf9D3r9ZEh04MxRarw5ivXKuY5kXWznJRb3n3_-aPQjcGVm4QHR7tid74fzjH0lCCDeI-dbvwbTkMBZv1Cd',
        isPromoted: false,
        companyId: pulse.id
      }
    })
  ]);

  console.log('Seed complete!');
  console.log('Test credentials: carlos@goplan.app / elena@goplan.app / sophia@goplan.app — all password: password123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
