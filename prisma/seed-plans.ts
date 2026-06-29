import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('ℹ️  Plans already deleted — skipping delete step.');

  // Get first user to be creator (or create a seed user)
  let creator = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!creator) {
    console.log('No users found — skipping plan creation.');
    return;
  }

  console.log(`🌱 Creating plans as user: ${creator.username}`);

  const plans = [
    {
      title: 'Visita al Museo del Prado',
      description: 'Recorrido por las obras más emblemáticas del Prado: Velázquez, Goya y El Bosco. Guía experto incluido, máximo 8 personas para una experiencia íntima.',
      category: 'CULTURA',
      date: new Date('2026-07-15T10:00:00.000Z'),
      location: 'Museo del Prado, Madrid',
      locationDetails: 'C. de Ruiz de Alarcón, 23, Madrid',
      maxPeople: 8,
      coverImage: 'https://images.unsplash.com/photo-1561059488-916d69792237?w=800&q=80',
      isPrivate: false,
    },
    {
      title: 'Ruta en bici por el Retiro',
      description: 'Vuelta en bici por el parque del Retiro a primera hora de la mañana. Ritmo tranquilo, para todos los niveles. Después café en el quiosco del lago.',
      category: 'DEPORTE',
      date: new Date('2026-07-20T09:00:00.000Z'),
      location: 'Parque del Retiro, Madrid',
      locationDetails: 'Puerta de Alcalá, entrada principal',
      maxPeople: 10,
      coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      isPrivate: false,
    },
    {
      title: 'Cena en el Mercado de San Miguel',
      description: 'Tapeo nocturno por el Mercado de San Miguel. Cada uno paga lo suyo, la buena conversación es gratis. Quedamos a las 9 en la entrada.',
      category: 'GASTRONOMIA',
      date: new Date('2026-07-18T21:00:00.000Z'),
      location: 'Mercado de San Miguel, Madrid',
      locationDetails: 'Pl. de San Miguel, s/n, 28005 Madrid',
      maxPeople: 6,
      coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      isPrivate: false,
    },
    {
      title: 'Concierto de Jazz en Café Central',
      description: 'Noche de jazz en directo en el legendario Café Central. Ambiente íntimo, buena música y gente con gusto. Reserva tu sitio con antelación.',
      category: 'CONCIERTOS',
      date: new Date('2026-07-25T22:00:00.000Z'),
      location: 'Café Central, Madrid',
      locationDetails: 'Pl. del Ángel, 10, 28012 Madrid',
      maxPeople: 12,
      coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80',
      isPrivate: false,
    },
    {
      title: 'Senderismo Sierra de Guadarrama',
      description: 'Ruta circular de 12km por la Sierra de Guadarrama. Dificultad media, vistas increíbles. Salida en coche compartido desde Moncloa a las 7:30.',
      category: 'NATURALEZA',
      date: new Date('2026-08-02T07:30:00.000Z'),
      location: 'Sierra de Guadarrama',
      locationDetails: 'Punto de encuentro: Intercambiador de Moncloa',
      maxPeople: 8,
      coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
      isPrivate: false,
    },
    {
      title: 'Torneo de Pádel + Cañas',
      description: 'Tarde de pádel en las pistas de La Ermita. 2 horas de juego, todos los niveles, después cañas obligatorias. Trae raqueta si tienes.',
      category: 'DEPORTE',
      date: new Date('2026-07-22T18:00:00.000Z'),
      location: 'Club de Pádel La Ermita, Madrid',
      locationDetails: 'C. de los Yeseros, 8, Madrid',
      maxPeople: 8,
      coverImage: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80',
      isPrivate: false,
    },
    {
      title: 'Tarde de Board Games',
      description: 'Tarde de juegos de mesa en el Café Miscelánea. Catan, Ticket to Ride, Dixit y más. Consumición mínima de 5€. Gente nueva siempre bienvenida.',
      category: 'GAMING',
      date: new Date('2026-07-27T17:00:00.000Z'),
      location: 'Café Miscelánea, Madrid',
      locationDetails: 'C. de los Relatores, 15, 28012 Madrid',
      maxPeople: 10,
      coverImage: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=800&q=80',
      isPrivate: false,
    },
    {
      title: 'Networking Tech & Startups',
      description: 'Encuentro informal de personas del mundo tech y startups. Nada de pitches ni ventas, solo buenas conversaciones. Cerveza artesanal de por medio.',
      category: 'NETWORKING',
      date: new Date('2026-07-30T19:30:00.000Z'),
      location: 'Espacio Pangea, Madrid',
      locationDetails: 'C. del Conde de Romanones, 14, Madrid',
      maxPeople: 20,
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      isPrivate: false,
    },
    {
      title: 'Excursión a Toledo',
      description: 'Excursión de un día a Toledo en tren. Catedral, el Greco, callejuelas medievales y mazapán de verdad. Salida desde Atocha a las 9:15.',
      category: 'VIAJES',
      date: new Date('2026-08-10T09:15:00.000Z'),
      location: 'Estación de Atocha, Madrid',
      locationDetails: 'Glorieta del Emperador Carlos V, s/n',
      maxPeople: 12,
      coverImage: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
      isPrivate: false,
    },
    {
      title: 'Yoga al amanecer en el Retiro',
      description: 'Sesión de yoga al aire libre en el Retiro antes de que llegue el calor. Lleva tu esterilla. Todos los niveles bienvenidos, acabamos con fruta fresca.',
      category: 'DEPORTE',
      date: new Date('2026-07-16T07:00:00.000Z'),
      location: 'Parque del Retiro, Madrid',
      locationDetails: 'Junto al Estanque Grande',
      maxPeople: 15,
      coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
      isPrivate: false,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.create({
      data: { ...plan, creatorId: creator.id },
    });
    process.stdout.write('.');
  }

  console.log(`\n✅ Created ${plans.length} plans.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
