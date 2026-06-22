# GoPlan API Reference

Base URL: `http://xexvhvose28zsiwrimekw50f.217.154.105.133.sslip.io/api`

All protected endpoints require:
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## Auth

### POST `/api/auth/register`
Create account.

**Body**
```json
{
  "username": "string",
  "email": "string",
  "password": "string (min 6 chars)",
  "city": "string (optional)"
}
```

**Response 201**
```json
{
  "token": "jwt-string",
  "user": {
    "name": "string",
    "avatar": "string",
    "location": "string",
    "plansCount": 0,
    "joinedCount": 0,
    "matchesCount": 0,
    "aboutMe": "string",
    "interests": ["string"]
  }
}
```

**Errors**: `409` user already exists, `400` validation error

---

### POST `/api/auth/login`
Sign in with email + password.

**Body**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200** — same shape as register

**Errors**: `401` invalid credentials

---

### POST `/api/auth/google`
Sign in / register with Google ID token.

**Body**
```json
{ "idToken": "string" }
```

**Response 200** — same shape as register

**Errors**: `401` invalid Google token

---

### GET `/api/auth/me` 🔒
Get current user profile.

**Response 200**
```json
{
  "name": "string",
  "avatar": "string",
  "location": "string",
  "plansCount": 0,
  "joinedCount": 0,
  "matchesCount": 0,
  "aboutMe": "string",
  "interests": ["string"]
}
```

---

## Plans

### GET `/api/plans` 🔒
Feed of active plans (excludes own plans).

**Query params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | — | Filter: `CULTURA` `GASTRONOMIA` `VIAJES` `CONCIERTOS` `DEPORTE` `GAMING` `NATURALEZA` `NETWORKING` `OTRO` |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Response 200**
```json
{
  "plans": [<Plan>],
  "trending": [<Plan>],
  "total": 42,
  "page": 1,
  "hasMore": true
}
```

---

### GET `/api/plans/swipe` 🔒
Plans for swipe deck — excludes already-swiped and full plans. Returns up to 10.

**Response 200**
```json
{ "plans": [<Plan>] }
```

---

### GET `/api/plans/:id` 🔒
Single plan by ID.

**Response 200** — `<Plan>` object

**Errors**: `404` plan not found

---

### POST `/api/plans` 🔒
Create a plan (also creates a chat room for it).

**Body**
```json
{
  "title": "string",
  "description": "string",
  "category": "CULTURA | GASTRONOMIA | VIAJES | CONCIERTOS | DEPORTE | GAMING | NATURALEZA | NETWORKING | OTRO",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "location": "string",
  "locationDetails": "string (optional)",
  "maxPeople": 4,
  "isPrivate": false,
  "coverImage": "string url (optional)"
}
```

**Response 201** — `<Plan>` object

---

### PUT `/api/plans/:id` 🔒
Update own plan. Only creator can edit.

**Body** — all fields optional:
```json
{
  "title": "string",
  "description": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "location": "string",
  "locationDetails": "string",
  "maxPeople": 4,
  "isPrivate": false,
  "status": "ACTIVE | CANCELLED | COMPLETED"
}
```

**Response 200** — `<Plan>` object

**Errors**: `403` not the creator

---

### DELETE `/api/plans/:id` 🔒
Cancel own plan (sets status to CANCELLED, does not hard-delete).

**Response 204** — no body

**Errors**: `403` not the creator

---

### Plan object shape
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "location": "string",
  "locationDetails": "string (optional)",
  "maxPeople": 4,
  "joinedCount": 2,
  "spotsLeft": 2,
  "isPrivate": false,
  "coverImage": "string",
  "creator": {
    "name": "string",
    "avatar": "string",
    "isFollowing": false
  },
  "joinedUsers": [
    { "name": "string", "avatar": "string" }
  ],
  "comments": [
    {
      "id": "string",
      "userName": "string",
      "userAvatar": "string",
      "text": "string",
      "timestamp": "2h ago"
    }
  ]
}
```

---

## Matches

### POST `/api/matches/swipe` 🔒
Swipe join or skip on a plan.

**Body**
```json
{
  "planId": "string",
  "action": "join | skip"
}
```

**Response 200**
```json
{
  "matched": false
}
```
or when another user already joined the same plan:
```json
{
  "matched": true,
  "matchData": {
    "planName": "string",
    "partner": { "name": "string", "avatar": "string" }
  }
}
```

**Errors**: `409` plan is full / already swiped

---

### GET `/api/matches` 🔒
List accepted matches for current user.

**Response 200**
```json
[
  {
    "id": "string",
    "userId": "string",
    "planId": "string",
    "status": "ACCEPTED",
    "plan": { ...prisma plan with creator }
  }
]
```

---

### PUT `/api/matches/:id` 🔒
Update match status. Only the plan creator can call this.

**Body**
```json
{ "status": "ACCEPTED | REJECTED" }
```

**Response 200** — updated match object

**Errors**: `403` not the plan creator

---

## Chats

### GET `/api/chats` 🔒
List all chats the current user belongs to.

**Response 200**
```json
[
  {
    "id": "string",
    "name": "string",
    "coverImage": "string",
    "membersCount": 3,
    "nextEvent": "ISO8601 (optional)",
    "lastMessageText": "string",
    "lastMessageTime": "10:30 AM | YESTERDAY | MON | OCT 12",
    "unreadCount": 2,
    "isGroup": true,
    "hasUpdates": true
  }
]
```

---

### GET `/api/chats/:id/messages` 🔒
Paginated messages for a chat.

**Query params**
| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 50 |

**Response 200**
```json
[
  {
    "id": "string",
    "senderName": "string",
    "senderAvatar": "string",
    "text": "string",
    "time": "10:30 AM",
    "isMe": true
  }
]
```

**Errors**: `403` not a chat member

---

### POST `/api/chats/:id/messages` 🔒
Send a message (also emits via Socket.io to all room members).

**Body**
```json
{ "content": "string" }
```

**Response 201** — message object (same shape as above, `isMe: true`)

**Errors**: `403` not a chat member, `400` empty content

---

### PUT `/api/chats/:id/read` 🔒
Mark chat as read (updates lastSeenAt, resets unreadCount).

**Response 204** — no body

---

## Users

### GET `/api/users/me` 🔒
Get own profile.

**Response 200** — profile object (same as `/api/auth/me`)

---

### PUT `/api/users/me` 🔒
Update own profile.

**Body** — all optional:
```json
{
  "name": "string",
  "bio": "string",
  "city": "string",
  "interests": ["string"],
  "avatar": "string (URL or base64 data:image — uploaded to Cloudinary if configured)"
}
```

**Response 200** — updated profile object

---

### GET `/api/users/me/plans` 🔒
Plans created by current user.

**Response 200** — `[<Plan>]`

---

### GET `/api/users/me/joined` 🔒
Plans the current user has joined (accepted matches).

**Response 200** — `[<Plan>]`

---

### GET `/api/users/:id` 🔒
Public profile of any user.

**Response 200**
```json
{
  "name": "string",
  "avatar": "string",
  "location": "string",
  "plansCount": 0,
  "joinedCount": 0,
  "matchesCount": 0,
  "aboutMe": "string",
  "interests": ["string"],
  "isFollowing": false,
  "plansCreated": [<Plan>]
}
```

**Errors**: `404` user not found

---

### POST `/api/users/:id/follow` 🔒
Toggle follow/unfollow a user.

**Response 200**
```json
{ "isFollowing": true }
```

**Errors**: `400` cannot follow yourself

---

## Events

### GET `/api/events` 🔒
List events (created by COMPANY/ADMIN users).

**Query params**
| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 10 |

**Response 200** — paginated event list

---

### GET `/api/events/:id` 🔒
Single event.

**Errors**: `404` event not found

---

### POST `/api/events` 🔒 (COMPANY or ADMIN only)
Create an event.

**Body**
```json
{
  "title": "string",
  "description": "string",
  "date": "ISO8601",
  "location": "string",
  "coverImage": "string (optional)"
}
```

**Response 201** — event object

---

### POST `/api/events/:id/attend` 🔒
Set attendance status for an event.

**Body**
```json
{ "status": "interested | going | none" }
```

**Response 200** — updated attendance object

---

## Socket.io (Realtime)

Connect to: `ws://xexvhvose28zsiwrimekw50f.217.154.105.133.sslip.io`

Auth on connect:
```js
io({ auth: { token: "<jwt>" } })
```

User auto-joins room `user:<id>` on connection.

### Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `chat:join` | client → server | `{ chatId: "string" }` — joins `chat:<chatId>` room |
| `chat:message` | server → client | `{ id, senderName, senderAvatar, text, time, isMe: false }` |
| `chat:typing` | client → server | `{ chatId: "string" }` — broadcasts to room, no DB save |
| `chat:stop_typing` | client → server | `{ chatId: "string" }` |
| `match:new` | server → client | `{ planId, planTitle, planCoverImage, matchedWith: { name, avatar } }` |

---

## Error format

All errors return:
```json
{ "error": "message string" }
```

Common HTTP codes:
| Code | Meaning |
|------|---------|
| `400` | Bad request / validation |
| `401` | Missing or invalid token |
| `403` | Forbidden (wrong user/role) |
| `404` | Resource not found |
| `409` | Conflict (duplicate, full plan) |
| `500` | Internal server error |
