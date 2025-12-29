# Frontend va Backendni Alohida Ishga Tushirish

## Talablar

1. Node.js va npm o'rnatilgan bo'lishi kerak
2. PostgreSQL ma'lumotlar bazasi
3. `.env` fayli (quyidagi o'zgaruvchilar bilan)

## O'rnatish

1. **Paketlarni o'rnatish:**
```bash
npm install
```

2. **Environment o'zgaruvchilarini sozlash:**

`.env` faylini yarating va quyidagi o'zgaruvchilarni to'ldiring:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SESSION_SECRET=your-secret-key-here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

3. **Ma'lumotlar bazasini sozlash:**

```bash
npm run db:push
```

## Alohida Ishga Tushirish

### Variant 1: Alohida Terminal Oynalarida

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```
Backend `http://localhost:5000` da ishga tushadi.

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```
Frontend `http://localhost:5173` da ishga tushadi.

### Variant 2: Birgalikda Ishga Tushirish (Eski Usul)

```bash
npm run dev
```
Bu frontend va backendni bir portda (5000) ishga tushiradi.

## Portlar

- **Backend API:** `http://localhost:5000`
- **Frontend:** `http://localhost:5173`
- **WebSocket:** `ws://localhost:5000/ws`

## API Endpoints

Barcha API so'rovlar `/api` prefiksi bilan boshlanadi:
- `/api/auth/user` - Foydalanuvchi ma'lumotlari
- `/api/users/login` - Login
- `/api/users/register` - Ro'yxatdan o'tish
- `/api/chats` - Chatlar ro'yxati
- va boshqalar...

## Muammolarni Hal Qilish

1. **CORS xatosi:** `.env` faylida `FRONTEND_URL` to'g'ri sozlanganligini tekshiring
2. **Database xatosi:** `DATABASE_URL` to'g'ri sozlanganligini va ma'lumotlar bazasi ishlayotganligini tekshiring
3. **Port band:** Agar port band bo'lsa, `.env` faylida `PORT` o'zgaruvchisini o'zgartiring

