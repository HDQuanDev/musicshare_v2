# MusicShare 🎵🎬

Ứng dụng web thời gian thực để xem phim và nghe nhạc cùng nhau với bạn bè.

## ✨ Tính năng

- 🎥 **Xem phim cùng nhau**: Đồng bộ thời gian phát video với bạn bè
- 🎵 **Nghe nhạc cùng nhau**: Chia sẻ playlist và nghe nhạc đồng bộ  
- 💬 **Chat thời gian thực**: Trò chuyện trong khi thưởng thức nội dung
- 🔐 **Phòng riêng tư**: Tạo và gia nhập phòng với mã bảo mật
- 📱 **Responsive**: Hoạt động tốt trên desktop và mobile

## 🚀 Công nghệ sử dụng

- **Frontend**: Next.js 15 với TypeScript và Tailwind CSS
- **Real-time**: Socket.IO cho đồng bộ hóa
- **UI Components**: Lucide React icons, Radix UI
- **Authentication**: NextAuth.js (sẽ được thêm)
- **Database**: Prisma với PostgreSQL (sẽ được thêm)

## 🛠️ Cài đặt và chạy

1. **Clone project:**
```bash
git clone <repository-url>
cd musicshare
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Chạy development server:**
```bash
npm run dev
```

4. **Mở trình duyệt:** 
Truy cập [http://localhost:3000](http://localhost:3000)

## 📁 Cấu trúc project

```
src/
├── app/                 # App Router pages
│   ├── page.tsx        # Trang chính
│   ├── room/           # Các trang phòng
│   └── api/            # API routes
├── components/         # React components
├── lib/               # Utilities và helpers
└── types/             # TypeScript type definitions
```

## 🔮 Tính năng sẽ được thêm

- [ ] Socket.IO server cho real-time sync
- [ ] Authentication với NextAuth.js
- [ ] Database với Prisma + PostgreSQL
- [ ] Upload và streaming media files
- [ ] Room management system
- [ ] Chat system
- [ ] User profiles và friends system

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
