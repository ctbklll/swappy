# Swappy

ระบบจัดการตารางเวรและแลกเวรสำหรับพนักงานปฏิบัติการ — Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 + Supabase (PostgreSQL)

## ตั้งค่า

1. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่าจาก Supabase (Project Settings → Database → Connection string)
   - `DATABASE_URL` — transaction pooler (พอร์ต 6543, ต่อท้าย `?pgbouncer=true`) ใช้ตอนรันแอป
   - `DIRECT_URL` — session pooler (พอร์ต 5432) ใช้ตอน migrate
   - รหัสผ่านที่มีอักขระพิเศษต้อง URL-encode (เช่น `!` → `%21`)
   - `AUTH_SECRET` — สตริงสุ่มยาว ๆ
2. สร้างตารางและข้อมูลทดลอง

```bash
npm install
npm run db:push     # สร้างตารางบน Supabase (หรือ npm run db:migrate เพื่อเก็บ migration)
npm run db:seed     # (ไม่บังคับ) ผู้ใช้ทดลอง: admin@swappy.app, somchai@swappy.app ... รหัส password123
npm run dev         # http://localhost:3000
```

ผู้ใช้คนแรกที่ลงทะเบียนในฐานข้อมูลว่างจะเป็น Admin อัตโนมัติ

## โครงสร้าง
- `prisma/schema.prisma` — โมเดลข้อมูล, `prisma/seed.ts` — ข้อมูลทดลอง
- `src/app/(auth)` — login / register
- `src/app/(app)` — dashboard, friends, swaps, notifications, settings, admin
- `src/app/api/**` — REST API routes (ใช้ Prisma)
- `src/lib/db.ts` — Prisma client (driver adapter `pg`)
- `src/proxy.ts` — redirect ผู้ที่ยังไม่ล็อกอิน
