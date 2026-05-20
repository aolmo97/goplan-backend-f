# GoPlan — Prompts de Backend para Claude Code
# Basados en el análisis del prototipo frontend (front-test)

Usa estos prompts en orden. Cada uno es autónomo y referencia
los tipos exactos del frontend (`src/types.ts`).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT 0 — CONTEXTO INICIAL (pegar siempre primero)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tengo un prototipo frontend React de GoPlan (app social para encontrar
compañía en planes reales). Debes construir el backend Express + Prisma
que lo alimente. Lee CLAUDE.md antes de empezar.

Stack del backend: Node.js + Express + TypeScript + Prisma + PostgreSQL + Socket.io.
Archivo de referencia de tipos: `apps/web/src/types.ts`

Shapes del frontend que el backend DEBE respetar:

// Plan (lo que la API debe devolver en los listados)
{
  id, title, description, category, date, time, location,
  locationDetails?, maxPeople, joinedCount, spotsLeft,
  isPrivate, creator: { name, avatar, isFollowing? },
  coverImage, joinedUsers: [{name, avatar}], comments: [Comment]
}

// Comment
{ id, userName, userAvatar, text, timestamp }

// ActiveChat (listado de chats)
{
  id, name, coverImage, membersCount, nextEvent?,
  lastMessageText, lastMessageTime, unreadCount, isGroup
}

// ChatMessage (mensajes dentro de una sala)
{ id, senderName, senderAvatar, text, time, isMe }

// UserProfile
{
  name, avatar, location, plansCount, joinedCount,
  matchesCount, aboutMe, interests: string[]
}

Todos los endpoints deben devolver estos shapes exactos para no
romper el frontend. Mapea los modelos Prisma a estos DTOs en cada
service o controller.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT 1 — AUTH COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implementa el módulo de autenticación completo en `apps/api/src/`.

Endpoints a crear:

POST /api/auth/register
  Body: { username: string, email: string, password: string, city?: string }
  - Valida con express-validator
  - Hash password con bcryptjs (saltRounds: 12)
  - Crea User en DB con role USER
  - Devuelve: { token: string, user: UserProfile }

POST /api/auth/login
  Body: { email: string, password: string }
  - Verifica credenciales
  - Devuelve: { token: string, user: UserProfile }

POST /api/auth/google
  Body: { idToken: string }
  - Verifica el Google ID token con fetch a
    https://oauth2.googleapis.com/tokeninfo?id_token=TOKEN
  - Crea o actualiza el User (upsert por googleId o email)
  - Devuelve: { token: string, user: UserProfile }

GET /api/auth/me  [requiere authenticate middleware]
  - Devuelve el UserProfile del usuario autenticado
  - Incluye plansCount, joinedCount, matchesCount calculados

Archivos a crear/modificar:
  - src/services/auth.service.ts   (lógica de negocio)
  - src/controllers/auth.controller.ts
  - src/routes/auth.routes.ts      (ya tiene la estructura, implementa los handlers)
  - src/lib/jwt.ts                 (ya existe, usa signToken/verifyToken)

El UserProfile devuelto debe ser:
{
  name: user.username,
  avatar: user.avatar || '',
  location: user.city || '',
  plansCount: <count plans created>,
  joinedCount: <count matches ACCEPTED>,
  matchesCount: <count matches total>,
  aboutMe: user.bio || '',
  interests: user.interests
}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT 2 — PLANES: CRUD + FEED + SWIPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implementa el módulo de Planes en `apps/api/src/`.

Endpoints:

GET /api/plans  [authenticate]
  Query params: category?, city?, date?, page=1, limit=10
  - Devuelve planes ACTIVE ordenados por fecha ASC
  - Excluye planes del propio usuario
  - Incluye featured (trending) separado si ?featured=true
  - Response:
    {
      plans: Plan[],           // shape del frontend
      trending: Plan[],        // primeros 5 por joinedCount
      total, page, hasMore
    }

GET /api/plans/swipe  [authenticate]
  - Devuelve hasta 10 planes que el usuario NO ha swipeado aún
    (no tiene Match con ese planId)
  - Solo planes ACTIVE con spotsLeft > 0
  - Response: { plans: Plan[] }

GET /api/plans/:id  [authenticate]
  - Plan completo con comments y joinedUsers
  - Añade isFollowing en creator (¿el usuario sigue al creador?)
  - Response: Plan (shape completo del frontend)

POST /api/plans  [authenticate]
  Body: { title, description, category, date, time, location,
          locationDetails?, maxPeople, isPrivate, coverImage? }
  - Crea el plan con creatorId = req.user.id
  - Crea automáticamente un Chat asociado al plan
  - Response: Plan creado

PUT /api/plans/:id  [authenticate]
  - Solo puede editar el creador
  - Campos editables: title, description, date, time, location,
    locationDetails, maxPeople, isPrivate, status

DELETE /api/plans/:id  [authenticate]
  - Solo puede borrar el creador
  - Soft delete: cambia status a CANCELLED

Archivos a crear:
  - src/services/plans.service.ts
  - src/controllers/plans.controller.ts
  - src/routes/plans.routes.ts  (ya tiene estructura)

Función helper `mapPlanToDTO(plan, currentUserId)`:
  Convierte el modelo Prisma al shape del frontend. 
  Calcula spotsLeft = maxPeople - joinedCount.
  Formatea date y time por separado (ISO → "YYYY-MM-DD" y "HH:MM").


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT 3 — SISTEMA DE MATCHES (SWIPE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implementa el módulo de Matches (swipe derecha/izquierda).

Endpoints:

POST /api/matches/swipe  [authenticate]
  Body: { planId: string, action: 'join' | 'skip' }
  
  Si action === 'skip':
    - Registra Match con status REJECTED (para no volver a mostrar el plan)
    - Response: { matched: false }
  
  Si action === 'join':
    - Crea Match con status PENDING
    - Si el plan es del tipo "open" (sin aprobación), auto-acepta: ACCEPTED
    - Si hay otro usuario que también quiso unirse → es un "match social":
        · Emite evento Socket.io 'match:new' a ambos usuarios
        · El payload del evento debe ser:
          {
            planId, planTitle, planCoverImage,
            matchedWith: { name, avatar }
          }
        · Esto activa el modal "It's a Match!" en el frontend
    - Añade al usuario al Chat del plan (crea ChatMember)
    - Actualiza joinedCount del plan
    - Response: { matched: boolean, matchData?: { planName, partner } }

GET /api/matches  [authenticate]
  - Devuelve todos los matches ACCEPTED del usuario
  - Incluye info del plan y del otro usuario
  - Response: Match[]

PUT /api/matches/:id  [authenticate]
  Body: { status: 'ACCEPTED' | 'REJECTED' }
  - Solo el creador del plan puede aceptar/rechazar
  - Si ACCEPTED: añade al usuario al Chat del plan

Archivos a crear:
  - src/services/matches.service.ts
  - src/controllers/matches.controller.ts
  - src/routes/matches.routes.ts  (ya tiene estructura)

IMPORTANTE: El swipe hacia la derecha en el frontend llama a
POST /api/matches/swipe con action: 'join'.
El swipe izquierda llama con action: 'skip'.
El frontend espera que tras un 'join' exitoso, si `matched: true`,
muestra el modal de match con `matchData.planName` y `matchData.partner`.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT 4 — CHAT EN TIEMPO REAL (Socket.io + REST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implementa el módulo de Chat (REST para listas + Socket para mensajes).

REST endpoints:

GET /api/chats  [authenticate]
  - Devuelve todos los chats donde el usuario es miembro
  - Response: ActiveChat[] con el shape exacto del frontend:
    {
      id, name, coverImage, membersCount,
      nextEvent?,           // fecha del plan asociado si existe
      lastMessageText,      // texto del último mensaje
      lastMessageTime,      // "10:30 AM" | "YESTERDAY" | "MON" | "OCT 12"
      unreadCount,          // mensajes después de lastSeenAt del usuario
      isGroup               // true si membersCount > 2
    }
  - Para chats 1-a-1: name = nombre del otro usuario, coverImage = avatar del otro
  - Para chats de grupo: name = nombre del plan, coverImage = coverImage del plan

GET /api/chats/:id/messages  [authenticate]
  Query: page=1, limit=50
  - Devuelve mensajes del chat, ordenados por createdAt ASC
  - Response: ChatMessage[] con shape del frontend:
    {
      id, senderName, senderAvatar, text,
      time,     // formato "HH:MM AM/PM"
      isMe      // true si senderId === req.user.id
    }

POST /api/chats/:id/messages  [authenticate]
  Body: { content: string }
  - Crea el mensaje en DB
  - Emite via Socket.io al room `chat:{id}`
  - Response: ChatMessage (nuevo mensaje)

PUT /api/chats/:id/read  [authenticate]
  - Actualiza lastSeenAt del ChatMember para este chat
  - Resetea unreadCount a 0

Socket events (ya inicializados en socket.server.ts, completa la lógica):

'chat:join'        → socket.join(`chat:${chatId}`)
'chat:message'     → guarda en DB + emite a room
'chat:typing'      → emite a room (sin guardar en DB)
'chat:stop_typing' → emite a room

Esquema Prisma a extender: añade campo `lastSeenAt DateTime?` a ChatMember
para calcular unreadCount correctamente.

Archivos a crear/modificar:
  - src/services/chats.service.ts
  - src/controllers/chats.controller.ts
  - src/routes/chats.routes.ts
  - src/socket/socket.server.ts (completar lógica existente)
  - prisma/schema.prisma (añadir lastSeenAt a ChatMember)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT 5 — PERFIL DE USUARIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implementa el módulo de Usuarios y Perfil.

Endpoints:

GET /api/users/me  [authenticate]
  - Devuelve el UserProfile completo del usuario autenticado
  - Calcula plansCount, joinedCount, matchesCount en tiempo real

PUT /api/users/me  [authenticate]
  Body: { name?, bio?, city?, interests?, avatar? }
  - Actualiza el perfil
  - Si se incluye avatar (base64 o URL), sube a Cloudinary
    (usa el SDK cloudinary si CLOUDINARY_API_KEY está en .env,
     si no, acepta URL directa)
  - Response: UserProfile actualizado

GET /api/users/:id  [authenticate]
  - Perfil público de otro usuario
  - Incluye isFollowing (¿el usuario autenticado sigue a este?)
  - Response: UserProfile + plansCreated: Plan[] (últimos 6)

POST /api/users/:id/follow  [authenticate]
  - Toggle follow/unfollow
  - Si ya sigue → deja de seguir
  - Si no sigue → sigue
  - Response: { isFollowing: boolean }

GET /api/users/me/plans  [authenticate]
  - Planes creados por el usuario autenticado
  - Response: Plan[]

GET /api/users/me/joined  [authenticate]
  - Planes a los que se ha unido (matches ACCEPTED)
  - Response: Plan[]

Nota: El frontend Profile muestra:
  - plansCount = planes creados
  - joinedCount = planes a los que se unió
  - matchesCount = matches totales (para mostrar conexiones sociales)

Archivos a crear:
  - src/services/users.service.ts
  - src/controllers/users.controller.ts
  - src/routes/users.routes.ts

Añade al schema Prisma si no existe:
  model Follow {
    id          String @id @default(cuid())
    followerId  String
    followingId String
    createdAt   DateTime @default(now())
    follower    User @relation("Follower", fields: [followerId], references: [id])
    following   User @relation("Following", fields: [followingId], references: [id])
    @@unique([followerId, followingId])
  }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT 6 — EVENTOS DE EMPRESA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implementa el módulo de Eventos (creados por empresas/COMPANY role).

El frontend muestra dos tipos de eventos en la pantalla Events:
  1. TRENDING: scroll horizontal, sin precio detallado (TRENDING_EVENTS en data.ts)
  2. NEARBY: lista con organizerLogo, date, location, price (OTHER_EVENTS en data.ts)

Endpoints:

GET /api/events  [authenticate]
  Query: category?, city?, page=1, limit=10
  - Devuelve eventos futuros, ordenados por fecha
  - Response:
    {
      trending: EventDTO[],    // top 5 por isPromoted + asistencia
      nearby: EventDTO[],      // resto paginado
      total, page, hasMore
    }

  EventDTO (shape que necesita el frontend):
    {
      id, title, description,
      coverImage, organizerLogo,
      date,        // "Aug 24, 18:00"
      location,
      price,       // "FREE" | "€45"
      company: { name, logo },
      goingCount, interestedCount,
      userStatus: 'none' | 'interested' | 'going'
    }

GET /api/events/:id  [authenticate]
  - Detalle completo del evento

POST /api/events  [authenticate, requireRole('COMPANY')]
  Body: { title, description, location, date, capacity, imageUrl?, price? }
  - Solo usuarios con role COMPANY pueden crear eventos

POST /api/events/:id/attend  [authenticate]
  Body: { status: 'interested' | 'going' | 'none' }
  - Registra asistencia del usuario al evento (upsert)
  - Response: { goingCount, interestedCount, userStatus }

Archivos a crear:
  - src/services/events.service.ts
  - src/controllers/events.controller.ts
  - src/routes/events.routes.ts

Añade al schema Prisma:
  model EventAttendance {
    id      String @id @default(cuid())
    eventId String
    userId  String
    status  String  // 'interested' | 'going'
    event   Event @relation(fields: [eventId], references: [id])
    @@unique([eventId, userId])
  }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT 7 — CONECTAR FRONTEND AL BACKEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ahora conecta el frontend React al backend. El prototipo tiene todos
los datos hardcodeados en `src/data.ts`. Migra cada sección a llamadas
reales usando React Query.

Crea los siguientes hooks en `apps/web/src/hooks/`:

1. useAuth.ts
   - useMutation para register → POST /api/auth/register
   - useMutation para login → POST /api/auth/login
   - useMutation para googleLogin → POST /api/auth/google
   - useQuery para me → GET /api/auth/me (enabled si hay token)
   - Tras login/register exitoso: llama a useAuthStore.setAuth(token, user)

2. usePlans.ts
   - useQuery 'plans-feed' → GET /api/plans?category=...
   - useQuery 'plans-swipe' → GET /api/plans/swipe
   - useQuery 'plan-detail' → GET /api/plans/:id
   - useMutation 'create-plan' → POST /api/plans
   - useMutation 'update-plan' → PUT /api/plans/:id

3. useMatches.ts
   - useMutation 'swipe' → POST /api/matches/swipe
     · En onSuccess: si data.matched === true → muestra modal de match
     · Invalida query 'plans-swipe'

4. useChats.ts
   - useQuery 'chats-list' → GET /api/chats
   - useQuery 'chat-messages' → GET /api/chats/:id/messages
   - useMutation 'send-message' → POST /api/chats/:id/messages

5. useProfile.ts
   - useQuery 'my-profile' → GET /api/users/me
   - useMutation 'update-profile' → PUT /api/users/me
   - useMutation 'follow' → POST /api/users/:id/follow

Sustituye en App.tsx:
  - INITIAL_PLANS → useQuery 'plans-feed'
  - DISCOVER_DECK_PLANS → useQuery 'plans-swipe'
  - INITIAL_CHATS → useQuery 'chats-list'
  - INITIAL_PROFILE → useQuery 'my-profile'
  - TRENDING_EVENTS / OTHER_EVENTS → useQuery 'events'

Añade estados de loading y error en cada vista que consuma datos.
Usa el patrón: if (isLoading) return <SkeletonCard />


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT 8 — SOCKET.IO EN EL FRONTEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Conecta el frontend al servidor Socket.io para el chat en tiempo real.

En `apps/web/src/hooks/useSocket.ts` crea:

export function useSocket() {
  const token = useAuthStore(s => s.token);
  
  useEffect(() => {
    if (!token) return;
    connectSocket();
    return () => disconnectSocket();
  }, [token]);
}

En `apps/web/src/hooks/useChatRoom.ts`:

export function useChatRoom(chatId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const socket = getSocket();
    socket.emit('chat:join', chatId);
    
    // Nuevo mensaje → añadir al array local de mensajes
    socket.on('chat:message', (message: ChatMessage) => {
      queryClient.setQueryData(['chat-messages', chatId], (old: ChatMessage[]) => 
        [...(old || []), message]
      );
    });
    
    // Typing indicators
    socket.on('chat:typing', ({ userId }) => { /* mostrar "..." */ });
    socket.on('chat:stop_typing', ({ userId }) => { /* ocultar */ });
    
    return () => {
      socket.off('chat:message');
      socket.off('chat:typing');
      socket.off('chat:stop_typing');
    };
  }, [chatId]);
}

En `App.tsx`, en la vista 'chat-room':
  - Sustituye el envío local de mensajes por:
    sendMessage({ chatId: selectedChatId, content: currentMessageDraft })
  - Usa useChatRoom(selectedChatId) para recibir mensajes en tiempo real

Para el modal de Match:
  useEffect(() => {
    const socket = getSocket();
    socket.on('match:new', (data) => {
      setMatchedPlanName(data.planTitle);
      setMatchPartner({ name: data.matchedWith.name, avatar: data.matchedWith.avatar });
      setMatchModalVisible(true);
    });
    return () => socket.off('match:new');
  }, []);


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT 9 — SEED Y TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crea el seed de datos para desarrollo y tests básicos.

1. `apps/api/prisma/seed.ts`
   Inserta datos que reflejan EXACTAMENTE los datos del frontend prototype:
   
   Usuarios:
     - Carlos García (USER, Madrid)
     - Elena Petrova (USER, Madrid)
     - Mark Thompson (USER, Austin)
     - Julia Santos (USER, Madrid)
     - Sophia Rivera (USER, Austin)
     - Pulse Productions (COMPANY, Madrid)  ← para eventos
   
   Planes (usar los de INITIAL_PLANS del frontend):
     - "Sunset Succulent Planting & Wine Night" (Carlos, Outdoors, maxPeople:20)
     - "Modern Art Gallery Tour" (Carlos, Culture, maxPeople:5)
     - "Picnic & Frisbee in Retiro" (Elena, Outdoors, maxPeople:12)
     + 5 planes más para el swipe deck (DISCOVER_DECK_PLANS)
   
   Matches: Elena y Mark joined plan-1 (ACCEPTED)
   Chats: Crear chats con los mensajes de INITIAL_CHATS del frontend
   Eventos: Los 3 de OTHER_EVENTS del frontend (creados por Pulse Productions)

2. Tests en `apps/api/src/services/__tests__/`:
   
   plans.service.test.ts:
     ✓ getFeed devuelve planes en formato correcto
     ✓ getSwipeFeed excluye planes ya vistos
     ✓ createPlan crea un chat automáticamente
     ✓ spotsLeft se calcula correctamente
   
   matches.service.test.ts:
     ✓ swipe('skip') crea Match REJECTED
     ✓ swipe('join') crea Match PENDING/ACCEPTED
     ✓ swipe('join') en plan lleno devuelve error
     ✓ swipe('join') en plan ya swipeado devuelve error
   
   auth.service.test.ts:
     ✓ register crea usuario con password hasheado
     ✓ login devuelve token válido
     ✓ login con password incorrecto devuelve 401

Ejecuta `npm run db:seed` para poblar la base de datos.
El seed debe usar los mismos IDs o slugs del frontend para
que la integración sea directa.
