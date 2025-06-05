# 🎵 MusicShare - Watch Together Platform

**MusicShare** là ứng dụng web thời gian thực cho phép bạn xem video YouTube và nghe nhạc cùng nhau với bạn bè trong các phòng được đồng bộ hóa hoàn hảo.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101)

## ✨ Tính năng chính

### 🎥 **Xem video đồng bộ**
- Phát/tạm dừng video đồng bộ với tất cả thành viên trong phòng
- Tua video real-time, mọi người sẽ được đồng bộ ngay lập tức
- Điều chỉnh âm lượng và đồng bộ với các thành viên khác
- Hỗ trợ video YouTube với chất lượng cao

### 🎵 **Quản lý hàng chờ phát**
- Tìm kiếm video YouTube với API chính thức
- Thêm video vào hàng chờ phát
- Xóa và sắp xếp lại thứ tự video
- Chọn video bất kỳ từ hàng chờ để phát ngay

### 💬 **Chat thời gian thực**
- Trò chuyện với các thành viên trong phòng
- Gửi emoji reactions trên màn hình video
- Thông báo hệ thống khi có người tham gia/rời phòng
- Lưu trữ lịch sử chat (100 tin nhắn gần nhất)

### 🔐 **Hệ thống phòng**
- Tạo phòng riêng tư với mã 6 ký tự ngẫu nhiên
- Tham gia phòng bằng mã phòng
- Quản lý thành viên trong phòng
- Hệ thống host và members

### � **Hiệu suất cao**
- Đồng bộ thời gian chính xác với heartbeat system
- Tự động sync khi người dùng tham gia phòng
- Xử lý reconnection khi mất kết nối
- Tối ưu hóa cho nhiều người dùng đồng thời

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework với App Router
- **TypeScript** - Type safety cho toàn bộ ứng dụng
- **Tailwind CSS** - Modern CSS framework
- **Radix UI** - Accessible UI components
- **Lucide React** - Beautiful icons
- **React YouTube** - YouTube player integration

### Backend & Real-time
- **Socket.IO** - WebSocket real-time communication
- **YouTube Data API v3** - Video search và metadata
- **Node.js HTTP Server** - Custom server với Socket.IO

### Planned Features
- **NextAuth.js** - Authentication system
- **Prisma** - Database ORM
- **PostgreSQL** - Production database

## � Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn
- YouTube Data API Key (tùy chọn)

### 1. Clone repository
```bash
git clone https://github.com/your-username/musicshare.git
cd musicshare
```

### 2. Cài đặt dependencies
```bash
npm install
# hoặc
yarn install
```

### 3. Cấu hình môi trường (tùy chọn)
Tạo file `.env.local` và thêm YouTube API key:
```env
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
```

> **Lưu ý**: Ứng dụng có thể hoạt động với API key mặc định, nhưng có thể bị giới hạn rate limit.

### 4. Chạy development server
```bash
npm run dev
# hoặc
yarn dev
```

### 5. Mở trình duyệt
Truy cập [http://localhost:3000](http://localhost:3000) để sử dụng ứng dụng.

## 📁 Cấu trúc dự án

```
musicshare/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Trang chủ
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   └── room/              # Room pages
│   │       ├── create/        # Tạo phòng mới
│   │       └── [code]/        # Trang phòng với dynamic routing
│   ├── components/            # React components
│   │   ├── Button.tsx         # Custom button component
│   │   ├── EmojiReactions.tsx # Emoji overlay system
│   │   ├── UserNameModal.tsx  # User name input modal
│   │   ├── VideoPlayer.tsx    # YouTube player wrapper
│   │   ├── VideoQueue.tsx     # Queue management
│   │   ├── VideoSearch.tsx    # YouTube search interface
│   │   └── ui/                # Reusable UI components
│   ├── lib/                   # Utilities
│   │   ├── socket.ts          # Socket.IO client configuration
│   │   ├── utils.ts           # Helper functions
│   │   ├── local-storage.ts   # LocalStorage utilities
│   │   └── page-visibility.ts # Page visibility API
│   └── types/                 # TypeScript definitions
├── public/                    # Static assets
├── server.js                  # Custom Socket.IO server
├── package.json              # Dependencies và scripts
├── next.config.ts            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS config
└── tsconfig.json             # TypeScript config
```

## 🎮 Cách sử dụng

### Tạo phòng mới
1. Vào trang chủ và nhấn "Tạo phòng mới"
2. Nhập tên phòng và tên của bạn
3. Chia sẻ mã phòng 6 ký tự với bạn bè

### Tham gia phòng
1. Nhập mã phòng 6 ký tự
2. Nhập tên của bạn
3. Bắt đầu xem video cùng nhau!

### Sử dụng video player
- **Tìm kiếm video**: Sử dụng thanh search để tìm video YouTube
- **Thêm vào queue**: Click vào video để thêm vào hàng chờ
- **Điều khiển phát**: Play/Pause, seek, volume đều được đồng bộ
- **Chat**: Sử dụng khung chat bên phải để trò chuyện
- **Emoji reactions**: Click vào màn hình video để gửi emoji

## 🚀 Scripts có sẵn

```bash
# Chạy development server với Socket.IO
npm run dev

# Build cho production
npm run build

# Chạy production server
npm start

# Lint code
npm run lint
```

## 🔧 API Endpoints

### Socket.IO Events

#### Client → Server
- `create-room` - Tạo phòng mới
- `join-room` - Tham gia phòng
- `leave-room` - Rời phòng
- `chat-message` - Gửi tin nhắn chat
- `send-emoji` - Gửi emoji reaction
- `search-youtube` - Tìm kiếm video YouTube
- `add-to-queue` - Thêm video vào hàng chờ
- `play/pause/seek` - Điều khiển video
- `request-sync` - Yêu cầu đồng bộ

#### Server → Client
- `room-created/joined` - Thông báo tham gia phòng thành công
- `user-joined/left` - Thông báo thành viên tham gia/rời
- `new-message` - Tin nhắn chat mới
- `youtube-search-results` - Kết quả tìm kiếm
- `sync-playback` - Đồng bộ trạng thái video
- `queue-updated` - Cập nhật hàng chờ

## 🌟 Tính năng nổi bật

### Đồng bộ thời gian chính xác
- Sử dụng server timestamp để tính toán offset
- Heartbeat system để duy trì kết nối
- Auto-sync khi người dùng quay lại tab

### Xử lý lỗi thông minh
- Tự động reconnect khi mất kết nối
- Fallback khi YouTube API không khả dụng
- Graceful handling cho video bị restricted

### UX được tối ưu
- Responsive design cho mọi thiết bị
- Loading states cho mọi action
- Real-time feedback cho user interactions

## 🔮 Roadmap

### Phase 1 - Core Features ✅
- [x] Real-time video synchronization
- [x] Room management system
- [x] YouTube integration
- [x] Chat system
- [x] Queue management

### Phase 2 - Authentication & Database
- [ ] User authentication với NextAuth.js
- [ ] Lưu trữ rooms và user data với Prisma + PostgreSQL
- [ ] User profiles và history
- [ ] Room persistence

### Phase 3 - Advanced Features
- [ ] Video upload và streaming
- [ ] Playlist management
- [ ] Friend system
- [ ] Room discovery
- [ ] Mobile app với React Native

### Phase 4 - Enterprise Features
- [ ] Room analytics
- [ ] Moderation tools
- [ ] Premium features
- [ ] API for third-party integration

## 🐛 Troubleshooting

### Video không load được
- Kiểm tra video có public và embeddable không
- Thử với video khác để xác định vấn đề
- Kiểm tra YouTube API quota

### Đồng bộ không chính xác
- Refresh trang và tham gia lại phòng
- Kiểm tra kết nối internet
- Sử dụng chức năng "Request Sync"

### Kết nối Socket.IO lỗi
- Kiểm tra port 3000 có được mở không
- Disable ad blocker có thể block WebSocket
- Kiểm tra firewall settings

## 🤝 Contributing

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Socket.IO](https://socket.io/) - Real-time communication
- [YouTube API](https://developers.google.com/youtube/v3) - Video data và search
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Radix UI](https://www.radix-ui.com/) - UI Components

---

⭐ **Nếu project này hữu ích, hãy cho chúng tôi một star!** ⭐
