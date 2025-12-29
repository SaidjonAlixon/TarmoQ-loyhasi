# Qo'ng'iroq Funksiyasini Test Qilish

## Usul 1: Ikki xil brauzer yoki Incognito rejim (Eng oson)

### Qadamlar:

1. **Birinchi foydalanuvchi:**
   - Oddiy brauzer oynasida (Chrome, Firefox, Edge) oching
   - `http://localhost:5173` ga kiring
   - Ro'yxatdan o'ting yoki login qiling (masalan: `user1` / `password1`)

2. **Ikkinchi foydalanuvchi:**
   - **Variant A:** Incognito/Private rejimda oching
     - Chrome: `Ctrl + Shift + N` (Windows) yoki `Cmd + Shift + N` (Mac)
     - Firefox: `Ctrl + Shift + P` (Windows) yoki `Cmd + Shift + P` (Mac)
     - Edge: `Ctrl + Shift + N`
   - **Variant B:** Boshqa brauzerda oching
     - Agar birinchi Chrome bo'lsa, Firefox yoki Edge da oching
   - `http://localhost:5173` ga kiring
   - Boshqa foydalanuvchi bilan ro'yxatdan o'ting (masalan: `user2` / `password2`)

3. **Qo'ng'iroq test qilish:**
   - Birinchi foydalanuvchi: Ikkinchi foydalanuvchini qidiring va chat yarating
   - Telefon yoki video ikonkasini bosing
   - Ikkinchi foydalanuvchida qo'ng'iroq dialog oynasi ochiladi
   - Qabul qiling yoki rad eting

## Usul 2: Ikki xil portda ishga tushirish (Agar kerak bo'lsa)

Agar bir xil brauzerda ikki xil portda ochish kerak bo'lsa:

1. **Birinchi frontend** (port 5173):
```bash
npm run dev:frontend
```

2. **Ikkinchi frontend** (port 5174):
```bash
# Yangi terminal oynasida
cd "C:\Users\Saidmuhammadalixon\Desktop\TarmoQ-loyhasi-main"
PORT=5174 vite --port 5174
```

Keyin:
- Birinchi foydalanuvchi: `http://localhost:5173`
- Ikkinchi foydalanuvchi: `http://localhost:5174`

## Usul 3: Ikki xil brauzer profilida

1. Chrome'da birinchi profil yarating
2. Chrome'da ikkinchi profil yarating
3. Har bir profilni alohida oynada oching

## Test qilish uchun foydalanuvchilar:

### Foydalanuvchi 1:
- Username: `testuser1`
- Password: `test123`
- Nickname: `Test User 1`

### Foydalanuvchi 2:
- Username: `testuser2`
- Password: `test123`
- Nickname: `Test User 2`

## Qo'ng'iroq test qadamlari:

1. ✅ Ikki foydalanuvchini oching (yugoridagi usullardan birini tanlang)
2. ✅ Birinchi foydalanuvchi: Ikkinchi foydalanuvchini qidiring
3. ✅ Chat yarating
4. ✅ Telefon yoki video ikonkasini bosing
5. ✅ Ikkinchi foydalanuvchida qo'ng'iroq dialog oynasi ochilishi kerak
6. ✅ Qabul qiling
7. ✅ Mikrofon va video tugmalarini test qiling
8. ✅ Qo'ng'iroqni tugating

## Muammolarni hal qilish:

- **Qo'ng'iroq ko'rinmayapti:** WebSocket ulanishini tekshiring (browser console'da)
- **Qo'ng'iroq signal kelmayapti:** Backend server ishlayotganini tekshiring
- **Session muammosi:** Har bir brauzer/oynada alohida login qiling

