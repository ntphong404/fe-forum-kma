# Chatbot Integration với Rasa

## Tổng quan
Đã tích hợp chatbot với Rasa API để cung cấp trải nghiệm chat thông minh và động.

## Cấu hình

### Environment Variables
Trong file `.env`, thêm:
```
VITE_CHAT_BOT_URL=http://localhost:5005/webhooks/rest/webhook
```

## API Integration

### Request Format
```json
{
  "sender": "user_1735628340123_abc123",
  "message": "Cho em văn bản về quy chế đào tạo"
}
```

- **sender**: ID duy nhất cho mỗi phiên chat (được tự động tạo)
- **message**: Nội dung tin nhắn từ người dùng

### Response Format

#### 1. Response với Buttons (Actions)
```json
[
  {
    "recipient_id": "user_1735628340123_abc123",
    "text": "Mình có các biểu mẫu sau. Bạn có thể click vào để tải xuống:",
    "buttons": [
      {
        "title": "📥 Đơn xin nghỉ học.docx",
        "payload": "LINK_FILE_DON_XIN_NGHI_HOC",
        "type": "web_url"
      },
      {
        "title": "📥 Đơn xin xác nhận sinh viên.docx",
        "payload": "LINK_FILE_DON_XIN_XAC_NHAN",
        "type": "web_url"
      }
    ]
  }
]
```

#### 2. Response Text đơn giản
```json
[
  {
    "recipient_id": "user_1735628340123_abc123",
    "text": "Sinh viên được xin nghỉ tạm thời và bảo lưu kết quả đã học trong các trường hợp sau:\n- Được điều động vào lực lượng vũ trang\n- Được cơ quan có thẩm quyền điều động..."
  }
]
```

## Cấu trúc Code

### Files Created/Modified

1. **`src/features/chatbot/types/chatbot.types.ts`**
   - Định nghĩa TypeScript types cho request/response
   - ChatBotMessage, ChatBotButton, ChatBotRequest, ChatBotResponse

2. **`src/features/chatbot/services/chatbot.service.ts`**
   - Service để gọi API chatbot
   - Xử lý POST request đến Rasa webhook

3. **`src/features/chatbot/components/AIChatButton.tsx`**
   - Component chatbot UI
   - Tích hợp với chatbot service
   - Hiển thị buttons nếu có trong response
   - Xử lý click vào button (mở link trong tab mới)

4. **`src/vite-env.d.ts`**
   - Thêm type definition cho `VITE_CHAT_BOT_URL`

## Features

### ✅ Đã implement
- ✅ Gọi API Rasa với POST request
- ✅ Hiển thị response text
- ✅ Hiển thị buttons khi có
- ✅ Click vào button để mở link
- ✅ Unique sender ID cho mỗi phiên
- ✅ Loading state
- ✅ Error handling (fallback khi API lỗi)
- ✅ Auto-scroll khi có tin nhắn mới

### Button Actions
Khi response có buttons:
- Buttons hiển thị dưới tin nhắn của bot
- Click vào button type `web_url` sẽ mở link trong `payload` ở tab mới
- Buttons có styling đẹp với hover effect

## Testing

### Cách test
1. Chạy Rasa server: `rasa run --enable-api --cors "*"`
2. Chạy frontend: `npm run dev`
3. Click vào icon chatbot ở góc dưới bên phải
4. Gửi tin nhắn test

### Test Cases
- ✅ Gửi tin nhắn text thông thường
- ✅ Nhận response có buttons
- ✅ Click vào button để mở link
- ✅ Test error handling (tắt Rasa server)

## Error Handling

Khi API lỗi (ví dụ: Rasa server không chạy):
- Hiển thị message: "Xin lỗi, hiện tại hệ thống đang gặp sự cố..."
- Console.error để debug
- Không crash app

## Notes

- Sender ID được tạo tự động theo format: `user_{timestamp}_{random}`
- Tất cả response đều là array (có thể có nhiều messages cùng lúc)
- Support hiển thị multiple buttons cho mỗi message
- Buttons chỉ hiển thị cho bot messages, không hiển thị cho user messages
