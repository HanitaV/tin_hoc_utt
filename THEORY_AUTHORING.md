# Hướng dẫn biên soạn lý thuyết bằng ChatGPT hoặc Gemini

Tài liệu này dành cho người bảo trì nội dung. Không nhúng trực tiếp vào trang học sinh.

## Mục tiêu

- Biến nội dung đã scrape trong `scraped_content/pages/` thành lý thuyết ngắn, dễ học, ít học thuật.
- Không thêm kiến thức ngoài tài liệu nếu chưa kiểm chứng.
- Mỗi chủ đề nên có: mục tiêu, ý cần nhớ, mẹo thi, lỗi hay nhầm, câu tự kiểm tra.
- Liên kết câu hỏi chỉ dùng ID thật trong `scraped_content/db/trac_nghiem_questions.json`.

## Quy trình đề xuất

1. Mở trang nguồn trong `scraped_content/pages/`.
2. Chọn đoạn liên quan tới một chủ đề nhỏ, ví dụ RAM/ROM hoặc chuyển đổi số.
3. Dán vào ChatGPT/Gemini kèm prompt ràng buộc.
4. Kiểm tra lại từng ý với trang nguồn.
5. Viết lại vào `scraped_content/full_theory.md`.
6. Nếu có câu hỏi tương ứng, thêm `questionIds` vào `scraped_content/db/full_theory_map.json`.
7. Chạy kiểm tra ID để chắc chắn không có câu hỏi bị sai tên.

## Prompt tóm tắt lý thuyết

```text
Tôi đang biên soạn tài liệu ôn Tin học cơ bản cho sinh viên mới học.
Hãy rút gọn đoạn tài liệu sau thành tiếng Việt dễ hiểu, ít học thuật.

Yêu cầu:
- Giữ đúng nội dung trong tài liệu.
- Không thêm kiến thức ngoài tài liệu, nếu có suy luận thì ghi rõ.
- Chia thành: Mục tiêu, Ý cần nhớ, Mẹo thi, Hay nhầm, Tự kiểm tra.
- Mỗi ý ngắn, dễ học, tránh câu dài.
- Thêm ví dụ đời thường nếu ví dụ đó không làm sai nội dung.

Tài liệu:
[dán đoạn scraped content]
```

## Prompt tạo mẹo nhớ

```text
Dựa trên đoạn tài liệu sau, hãy tạo các mẹo nhớ ngắn cho sinh viên làm trắc nghiệm.

Yêu cầu:
- Mẹo phải đúng với tài liệu.
- Ưu tiên mẹo phân biệt khái niệm dễ nhầm.
- Viết ngắn, không dùng ngôn ngữ quá học thuật.
- Nếu không đủ dữ liệu để tạo mẹo, hãy nói "không đủ dữ liệu".

Tài liệu:
[dán đoạn scraped content]
```

## Prompt tạo câu tự kiểm tra

```text
Từ đoạn tài liệu sau, hãy tạo 5 câu tự kiểm tra ngắn.

Yêu cầu:
- Câu hỏi kiểm tra hiểu khái niệm, không hỏi thuộc lòng câu chữ.
- Không cần đáp án dài.
- Không thêm chủ đề ngoài tài liệu.

Tài liệu:
[dán đoạn scraped content]
```

## Prompt kiểm tra nội dung có bịa không

```text
Hãy so sánh bản tóm tắt với tài liệu gốc.

Yêu cầu:
- Liệt kê ý nào có trong tài liệu gốc.
- Liệt kê ý nào là suy luận hoặc không thấy trong tài liệu gốc.
- Đề xuất sửa các ý không chắc chắn.

Tài liệu gốc:
[dán đoạn scraped content]

Bản tóm tắt:
[dán bản đã viết]
```

## Quy tắc nối câu hỏi

- Chỉ dùng `questionIds` tồn tại trong `scraped_content/db/trac_nghiem_questions.json`.
- Nếu chủ đề chưa có câu local, để `questionIds: []` và thêm `pendingQuestionSources`.
- Không gắn câu hỏi chỉ vì có một từ khóa giống nhau; câu hỏi phải kiểm tra đúng ý của chủ đề.
- Với Word, Excel, PowerPoint, ưu tiên nối các câu về phím tắt, phần mở rộng, thao tác tệp, nhóm lệnh hay gặp.

## Kiểm tra nhanh bằng Node

```bash
node -e "const q=require('./scraped_content/db/trac_nghiem_questions.json'); const m=require('./scraped_content/db/full_theory_map.json'); const ids=new Set(q.questions.map(x=>x.id)); const missing=[]; for (const t of m.topics) for (const id of t.questionIds||[]) if(!ids.has(id)) missing.push(t.id+':'+id); if(missing.length){console.error(missing.join('\n')); process.exit(1)} console.log('OK')"
```

## Gợi ý chất lượng

- Một chủ đề tốt nên học xong trong 10 phút.
- Mỗi bảng chỉ nên chứa các ý thật sự cần nhớ.
- Mẹo nên giúp loại trừ đáp án sai, không chỉ lặp lại định nghĩa.
- Nếu nội dung gốc quá dài, tách thành nhiều chủ đề nhỏ thay vì viết một mục lớn.
