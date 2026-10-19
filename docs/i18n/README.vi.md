<div align="center">

<img src="../images/logo.svg" width="96" alt="Logo Briefing">

# Briefing

**Bộ não thứ hai của nhóm bạn — ghi chú Markdown cục bộ, chia sẻ ngang hàng (peer‑to‑peer) và Claude có thể đọc được.**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![Giấy phép: MIT](https://img.shields.io/badge/license-MIT-e3a43a.svg)](../../LICENSE)
![Nền tảng](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-Claude%20ready-d97757)

<a href="https://github.com/renankelm10/briefingMCP/releases/latest"><img src="https://img.shields.io/badge/T%E1%BA%A3i%20xu%E1%BB%91ng-Windows%20%7C%20macOS%20%7C%20Linux-e3a43a?style=for-the-badge&logo=github&logoColor=white" alt="Tải xuống" height="40"></a>


<!-- langs -->
[English](../../README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Bahasa Indonesia](README.id.md) · **Tiếng Việt** · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="Trình soạn thảo Briefing với xem trước trực tiếp, thẻ và liên kết ngược" width="900">

</div>

---

## Briefing là gì?

Briefing là ứng dụng ghi chú trên máy tính dành cho các nhóm muốn có **một kho tri thức chung mà không cần dịch vụ đám mây ở giữa**.

- 📝 **Viết** trong các tệp Markdown thông thường, nằm trong một thư mục bình thường trên máy tính của bạn ("vault" của bạn).
- 🔄 **Chia sẻ** một thư mục với nhóm: mỗi máy tính giữ một bản sao giống hệt, và thay đổi được gửi **trực tiếp giữa các máy tính**, mã hóa đầu‑cuối, chỉ trong vài giây.
- 🧠 **Hỏi** bất cứ điều gì: mọi ghi chú được lập chỉ mục bởi một mô hình AI chạy **ngay trên máy của bạn**, và **Claude** (hoặc bất kỳ ứng dụng khách MCP nào) có thể tìm kiếm, đọc và ghi ghi chú của bạn qua máy chủ MCP tích hợp.

Kết quả: bạn và đồng nghiệp có thể cùng lúc làm việc, mỗi người với Claude của riêng mình, trên cùng một nguồn tri thức của công ty, và luôn thấy phiên bản mới nhất.

> Hiện giao diện đang bằng **tiếng Bồ Đào Nha (Brazil)**. Rất hoan nghênh các bản dịch — xem [Đóng góp](../../CONTRIBUTING.md).

## Cách hoạt động

<div align="center"><img src="../images/architecture.svg" alt="Kiến trúc: hai máy tính đồng bộ trực tiếp, mỗi máy có chỉ mục AI cục bộ được Claude đọc qua MCP" width="860"></div>

1. **Bạn tạo một nhóm** và chọn một thư mục. Briefing tạo mã mời dạng `BRF-7Q2M-…`.
2. **Đồng nghiệp dán mã.** Hai máy tính tìm thấy nhau qua DHT công khai của [Hyperswarm](https://github.com/holepunchto/hyperswarm) — *chỉ* dùng để khám phá — rồi mở một kết nối trực tiếp được mã hóa bằng Noise. Mỗi bên chứng minh mình biết mã trước khi trao đổi bất kỳ tệp nào.
3. **Mọi thay đổi được gửi ngay lập tức**, dù do bạn, đồng nghiệp hay một Claude viết. Các chỉnh sửa đồng thời được hợp nhất từng dòng (giống Git); nếu hai người sửa cùng những dòng giống nhau, phiên bản còn lại được lưu thành *bản sao xung đột*, giống hệt nhau trên mọi máy — không mất gì cả.
4. **Mỗi máy tính lập chỉ mục ghi chú cục bộ** (embedding đa ngôn ngữ + tìm kiếm từ khóa). Claude truy vấn chỉ mục qua MCP và nhận các đoạn liên quan nhất chỉ trong vài mili giây.

## Tính năng

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="Chế độ đọc"></td>
<td width="50%"><img src="../images/08-teams.png" alt="Thư mục nhóm"></td>
</tr>
<tr>
<td><b>Viết.</b> Trình soạn thảo xem trước trực tiếp, <code>[[liên kết]]</code> có tự động hoàn thành, liên kết ngược, thẻ, callout, công việc, bảng, nhúng, thuộc tính, dán ảnh, mẫu, ghi chú hằng ngày.</td>
<td><b>Thư mục nhóm.</b> Tạo nhóm, chia sẻ mã, và thư mục luôn giống hệt trên mọi máy tính. Trạng thái trực tuyến, hợp nhất, bản sao xung đột, lịch sử.</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="Tìm kiếm ngữ nghĩa"></td>
<td><img src="../images/05-brain-claude.png" alt="Kết nối Claude"></td>
</tr>
<tr>
<td><b>Bộ não thứ hai.</b> <kbd>Ctrl</kbd>+<kbd>J</kbd> để hỏi bằng ngôn ngữ tự nhiên. Tìm kiếm kết hợp (ý nghĩa + từ chính xác), hoàn toàn ngoại tuyến sau lần tải mô hình đầu tiên.</td>
<td><b>Claude qua MCP.</b> Một cú nhấp để đăng ký máy chủ MCP vào Claude Code. Claude có thêm <code>search</code>, <code>read_note</code>, <code>write_note</code> và nhiều công cụ khác.</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="Chế độ đồ thị"></td>
<td><img src="../images/06-tasks.png" alt="Bảng công việc"></td>
</tr>
<tr>
<td><b>Đồ thị.</b> Xem các ghi chú liên kết với nhau thế nào; đồ thị cục bộ, bộ lọc, kéo thả và phóng to.</td>
<td><b>Công việc & lịch.</b> Mọi <code>- [ ]</code> trong vault gom vào một bảng, kèm lịch các ghi chú hằng ngày.</td>
</tr>
</table>

<details>
<summary><b>Danh sách đầy đủ tính năng</b></summary>

- Thẻ (khôi phục khi mở lại), chuyển nhanh, bảng lệnh, tìm kiếm toàn văn và theo `#thẻ`
- Xem trước trực tiếp: cú pháp Markdown ẩn đi ngoài dòng đang chỉnh sửa; bảng, callout, ảnh và ô đánh dấu hiển thị ngay
- Xem trước khi di chuột lên liên kết, các lần nhắc chưa liên kết có thể liên kết bằng một cú nhấp
- Đổi tên hoặc di chuyển ghi chú sẽ cập nhật mọi liên kết trỏ đến nó
- Mẫu có biến (`{{title}}`, `{{date:DD/MM/YYYY}}`, `{{time}}`) và mẫu **bản tóm tắt dự án** có sẵn
- Lịch sử phiên bản cho từng ghi chú, có thể khôi phục; mục bị xóa đi vào thùng rác hệ thống
- Xuất ghi chú ra PDF
- Giao diện sáng / tối / theo hệ thống, màu nhấn, cỡ chữ, độ rộng dòng, bảng điều chỉnh kích thước, chế độ tập trung
- Hoạt động với các thư mục Markdown có sẵn (kể cả vault của Obsidian)

</details>

## Cài đặt

Tải phiên bản mới nhất cho hệ thống của bạn tại **[Releases](https://github.com/renankelm10/briefingMCP/releases)**.

| Hệ thống | Tệp | Ghi chú |
|---|---|---|
| Windows 10/11 | `Briefing-Setup-x.y.z.exe` | Chưa được ký số: ở cảnh báo SmartScreen, nhấp **Thông tin thêm → Vẫn chạy**. |
| macOS 12+ (Apple Silicon) | `Briefing-x.y.z-arm64.dmg` | Chưa được công chứng: nhấp chuột phải vào ứng dụng → **Mở**, hoặc chạy `xattr -dr com.apple.quarantine /Applications/Briefing.app`. Mac dùng chip Intel: hãy build từ mã nguồn. |
| Linux (x64) | `Briefing-x.y.z.AppImage` / `.deb` | AppImage: `chmod +x Briefing-*.AppImage`. Trên Ubuntu 24.04+ nên dùng `.deb` (`sudo apt install ./briefing_*.deb`), gói này cấu hình sandbox của Chromium. |

Lần đầu khởi động, Briefing tạo một vault mẫu trong `Tài liệu/Briefing`. Dùng **Arquivo → Abrir outro vault…** để mở bất kỳ thư mục nào.

### Build từ mã nguồn

Cần [Node.js 22+](https://nodejs.org).

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # chạy ứng dụng
npm run dist         # tạo bộ cài cho hệ thống của bạn (trong release/)
```

## Thư mục nhóm trong 3 bước

1. Mở thư mục muốn chia sẻ làm vault, rồi nhấn <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> (**Equipes**).
2. **Criar equipe** → mã mời được sao chép. Gửi cho đồng nghiệp qua một kênh riêng tư.
3. Đồng nghiệp mở **Equipes → Entrar numa equipe**, dán mã và chọn một thư mục trống. Tệp sẽ đến ngay khi cả hai máy tính trực tuyến.

Briefing phải đang chạy trên cả hai máy tính để đồng bộ. Ai có mã sẽ trở thành thành viên đầy đủ — hãy giữ nó như một mật khẩu.

## Kết nối Claude (MCP)

Mở **✦ Segundo cérebro → Conectar automaticamente**, hoặc chạy:

```bash
claude mcp add briefing --scope user -- node "/path/to/briefingMCP/src/mcp/server.mjs"
```

Khởi động lại Claude Code. Máy chủ cung cấp vault đang mở và mọi thư mục nhóm:

| Công cụ | Chức năng |
|---|---|
| `search` | Tìm kiếm kết hợp ngữ nghĩa + từ khóa; trả về các đoạn liên quan nhất kèm tệp và số dòng |
| `read_note` | Toàn bộ nội dung một ghi chú (theo đường dẫn hoặc chỉ theo tên) |
| `list_notes` | Các ghi chú trong một vault hay thư mục, kèm thời gian sửa đổi |
| `recent_changes` | Ghi chú mới sửa gần đây — kể cả thay đổi đến từ đồng nghiệp |
| `write_note` | Tạo, ghi đè hoặc thêm vào ghi chú (đồng bộ ngay với nhóm) |
| `vault_info` | Danh sách vault, số ghi chú/đoạn đã lập chỉ mục, trạng thái tìm kiếm ngữ nghĩa |

Bất kỳ ứng dụng khách MCP nào hỗ trợ máy chủ stdio đều hoạt động tương tự. Dùng `BRIEFING_VAULTS="/a;/b"` để chọn vault một cách rõ ràng.

## Bảo mật & quyền riêng tư

- Không tài khoản, không máy chủ, không thu thập dữ liệu. Ghi chú là các tệp bình thường trên ổ đĩa của bạn.
- Kết nối đồng bộ được mã hóa đầu‑cuối và xác thực bằng mã mời; tệp từ mạng không bao giờ được ghi ra ngoài thư mục chia sẻ, và Briefing không bao giờ mở tệp thực thi nhận từ người khác.
- Embedding được tính cục bộ; mô hình (`multilingual-e5-small`, ~120 MB) chỉ tải một lần từ Hugging Face.
- Phản hồi MCP đánh dấu nội dung ghi chú là dữ liệu không đáng tin cậy để giảm rủi ro prompt injection.

Đọc toàn bộ mô hình mối đe dọa trong **[SECURITY.md](../../SECURITY.md)**. Hãy báo cáo lỗ hổng một cách riêng tư.

## Phím tắt

| Phím tắt | Thao tác | Phím tắt | Thao tác |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | Chuyển nhanh | <kbd>Ctrl</kbd>+<kbd>J</kbd> | Hỏi bộ não thứ hai |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | Bảng lệnh | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | Thư mục nhóm |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | Ghi chú mới | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | Bản tóm tắt dự án mới |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Đọc / chỉnh sửa | <kbd>Ctrl</kbd>+<kbd>G</kbd> | Đồ thị |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | Thẻ mới / đóng thẻ | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | Ghi chú hằng ngày |

Trên macOS dùng <kbd>⌘</kbd> thay cho <kbd>Ctrl</kbd>.

## Câu hỏi thường gặp

**Đây có phải Obsidian không?** Không. Briefing là một dự án mã nguồn mở độc lập, được viết từ đầu. Nó tương thích với các thư mục Markdown thông thường nên bạn có thể mở vault có sẵn, nhưng không liên kết hay được Obsidian bảo trợ.

**Có cần internet không?** Chỉ để tìm đồng nghiệp (DHT) và tải mô hình AI một lần. Ghi chú, tìm kiếm và quyền truy cập của Claude đều hoạt động ngoại tuyến.

**Nếu hai người cùng sửa một ghi chú thì sao?** Các phần khác nhau được hợp nhất tự động. Nếu cùng những dòng bị thay đổi, cả hai phiên bản đều được giữ: một trong ghi chú, một trong bản sao `(conflito de …)` ngay bên cạnh.

**Dữ liệu của tôi ở đâu?** Trong thư mục vault của bạn (tệp `.md`). Dữ liệu riêng của Briefing nằm ở `<vault>/.briefing/` (chỉ mục, lịch sử) và thư mục cấu hình người dùng (`%APPDATA%\Briefing`, `~/Library/Application Support/Briefing`, `~/.config/Briefing`).

## Lộ trình

- Dịch giao diện (i18n)
- Ứng dụng đồng hành trên di động
- Relay tùy chọn cho các mạng chặn kết nối trực tiếp
- Phân quyền theo thành viên và thay khóa nhóm
- Bộ cài được ký số và công chứng

## Đóng góp

Rất hoan nghênh issue và pull request. Xem **[CONTRIBUTING.md](../../CONTRIBUTING.md)** để biết cách thiết lập, chạy kiểm thử và cấu trúc dự án.

## Giấy phép

[MIT](../../LICENSE) © 2026 Renan Kelm
