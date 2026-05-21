
## Mục tiêu
Xây dựng web ôn tập Đúng/Sai từ tài liệu PDF cốp pha tiếng Nhật, có TTS Lovable AI, highlight từ vựng, đếm giờ và luật chấm điểm rõ ràng.

## Trang & luồng

```text
/                -> Trang chủ: danh sách 6 đề, mô tả luật
/quiz/$examId    -> Màn làm bài (timer 30:00, 20 câu, 1 câu / màn hình)
/result/$examId  -> Kết quả: điểm, ĐẠT/TRƯỢT, xem lại từng câu
                    (hiển thị giải thích + audio sau khi nộp)
```

## Cấu trúc dữ liệu
- `src/data/exams.ts`: 6 đề × 20 câu, mỗi câu:
  ```ts
  { id, jp, romaji, vi, meaning, vocab: [{ jp, reading, vi }], answer: 'O'|'X', explanation }
  ```
- Trích từ PDF (`document--parse_document` đã chạy). Một số câu trong PDF bị OCR lỗi (vd. câu 13 đề 1 có ký tự lạ) — tôi sẽ làm sạch tay khi nhập liệu.

## Luật làm bài (theo yêu cầu)
- Bấm "Bắt đầu" -> timer 30:00 đếm ngược, hết giờ tự nộp.
- Mỗi câu chỉ hiển thị: **câu tiếng Nhật + nút phát audio**, 2 nút **○ ĐÚNG / × SAI**.
- Sau khi chọn -> tự chuyển câu tiếp theo (delay ~250ms), **khoá câu đã trả lời**, không cho quay lại.
- Phím **→** = câu sau (chỉ khi đã trả lời câu hiện tại), **←** bị vô hiệu hoá (theo luật không quay lại). Sẽ ghi chú nhỏ trên UI.
- Hết 20 câu -> chuyển `/result`.
- ≥16/20 = **ĐẠT**, <16 = **TRƯỢT**.

## Trang Kết quả
- Hiện điểm, badge ĐẠT/TRƯỢT, nút "Làm lại".
- Danh sách 20 câu (collapsible): câu Nhật (highlight từ vựng) + romaji + dịch nghĩa + đáp án bạn chọn vs đúng + giải thích + nút audio cho câu Nhật & từng từ vựng.

## Highlight từ vựng
- Với mỗi câu, duyệt mảng `vocab[].jp`, replace match đầu tiên trong `jp` bằng `<mark>` (giữ thứ tự, tránh chồng).
- Hover/tap `<mark>` -> tooltip hiện `reading` + nghĩa Việt.

## TTS Lovable AI Gateway (server-side)
- Route `src/routes/api/tts.ts` (POST `{ text, voice?: 'sentence'|'word' }`) -> trả MP3 binary.
- Dùng `LOVABLE_API_KEY` + model image-tts không có; **Lovable AI Gateway chưa cung cấp TTS riêng**, nên dùng **ElevenLabs qua key người dùng** hoặc **Web Speech API fallback**.
  - **Quyết định**: Sử dụng **Lovable AI Gateway với model `google/gemini-2.5-flash`** không hỗ trợ audio output trực tiếp. Để có "TTS chất lượng cao" như user chọn, cần ElevenLabs (`ELEVENLABS_API_KEY`).
  - **Sẽ hỏi lại trước khi build** nếu chưa rõ — nhưng theo lựa chọn user (Lovable AI), tôi sẽ thử dùng Gemini TTS nếu có, nếu không sẽ fallback Web Speech API ngay trong client để không block. **Cần xác nhận**: cho phép tôi dùng ElevenLabs (cần thêm API key) hay dùng Web Speech API trình duyệt (miễn phí, chất lượng trung bình)?
- Client: hook `usePlayAudio(text)` cache `Map<text, Blob URL>` để không gọi lại.

## UI / Design
- Theme sáng, sạch, font đọc tiếng Nhật rõ (Noto Sans JP qua Google Fonts).
- Component shadcn: `Button`, `Card`, `Progress` (thanh timer + tiến độ câu), `Badge`, `Tooltip`, `Accordion` (review).
- Layout câu hỏi: card lớn, chữ Nhật size 2xl, nút ○/× to.

## Files sẽ tạo
- `src/data/exams.ts`
- `src/lib/highlight.tsx` (render highlight + tooltip)
- `src/lib/tts.ts` (client cache + fetch /api/tts hoặc Web Speech fallback)
- `src/hooks/useCountdown.ts`
- `src/routes/index.tsx` (overwrite placeholder: danh sách 6 đề)
- `src/routes/quiz.$examId.tsx`
- `src/routes/result.$examId.tsx`
- `src/routes/api/tts.ts` (nếu dùng server TTS)
- State điểm tạm lưu `sessionStorage` để truyền từ quiz -> result.

## Cần bạn xác nhận 1 điểm trước khi build
Lovable AI Gateway hiện không có TTS thuần. Để "TTS tiếng Nhật chất lượng cao" tôi đề xuất 1 trong 2:
1. **ElevenLabs** (cần API key — chất lượng rất cao, có giọng Nhật)
2. **Web Speech API** (miễn phí, dùng giọng Nhật của trình duyệt — chất lượng tuỳ máy)

Bạn chọn (1) hay (2)? Sau khi bạn chọn, tôi sẽ implement toàn bộ.
