const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_PATH = path.join(ROOT, "scraped_content/db/trac_nghiem_questions.json");
const MAP_PATH = path.join(ROOT, "scraped_content/db/full_theory_map.json");
const MD_PATH = path.join(ROOT, "scraped_content/full_theory.md");

const db = JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf8"));
const allIds = new Set(db.questions.map((question) => String(question.id)));

function slugify(value) {
  return String(value)
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function range(activityId, start, end) {
  const ids = [];
  for (let i = start; i <= end; i += 1) ids.push(`${activityId}-q${i}`);
  return ids;
}

function ids(...parts) {
  return parts.flat();
}

function sourceIds(questionIds) {
  return Array.from(new Set(questionIds.map((id) => id.replace(/-q\d+$/, "")))).sort();
}

const topicGroups = [
  {
    id: "tin-hoc-nen-tang",
    title: "Tin học nền tảng",
    shortTitle: "Tin học",
    summary: "Máy tính, phần cứng, bộ nhớ, phần mềm, hệ điều hành và cách đọc các khái niệm nền.",
  },
  {
    id: "su-dung-windows",
    title: "Sử dụng Windows",
    shortTitle: "Windows",
    summary: "Tắt mở máy, cửa sổ, phím tắt, Control Panel, tệp, thư mục, shortcut, nén và in.",
  },
  {
    id: "internet-cong-dan-so",
    title: "Internet và Công dân số",
    shortTitle: "Internet",
    summary: "Internet, web, trình duyệt, tìm kiếm, email, giao tiếp trực tuyến, dịch vụ công và an toàn số.",
  },
  {
    id: "word",
    title: "Word",
    shortTitle: "Word",
    summary: "Cách học Word qua giao diện, thao tác tệp, soạn thảo, định dạng, bảng, đối tượng và trang in.",
  },
  {
    id: "excel",
    title: "Excel",
    shortTitle: "Excel",
    summary: "Bảng tính, ô, vùng, công thức, hàm, lỗi, sắp xếp, lọc, biểu đồ và in.",
  },
  {
    id: "powerpoint",
    title: "PowerPoint",
    shortTitle: "PowerPoint",
    summary: "Slide, layout, theme, master, văn bản, đối tượng, hiệu ứng, trình chiếu và in.",
  },
];

const topicDefs = [
  {
    id: "tt01",
    groupId: "tin-hoc-nen-tang",
    title: "Thiết bị số, phần cứng và thiết bị vào ra",
    summary: "Nhận diện phần cứng, máy tính cá nhân, thiết bị ngoại vi, thiết bị nhập và thiết bị xuất.",
    questionIds: ids(range("module-587", 1, 9), range("module-587", 22, 24), range("module-587", 28, 42)),
    goal: "Biết máy tính gồm những phần nào và phân loại đúng thiết bị nhập, xuất, lưu trữ.",
    explain: "Hãy tưởng tượng máy tính như một nơi xử lý công việc: có bộ phận nhận dữ liệu vào, bộ phận xử lý, nơi lưu dữ liệu và bộ phận đưa kết quả ra cho người dùng.",
    remember: [
      "Phần cứng là thứ có thể nhìn thấy hoặc chạm được.",
      "Thiết bị nhập đưa dữ liệu vào máy: bàn phím, chuột, máy quét, camera.",
      "Thiết bị xuất đưa kết quả ra: màn hình, máy in, loa, máy chiếu.",
      "Thiết bị ngoại vi là thiết bị gắn thêm quanh hệ thống chính.",
    ],
    example: "Máy quét đưa ảnh giấy vào máy nên là thiết bị nhập; máy in đưa văn bản từ máy ra giấy nên là thiết bị xuất.",
    tips: [
      "Nhập là từ ngoài vào máy; xuất là từ máy ra người dùng.",
      "Máy quét và máy in là cặp rất hay bị gài.",
      "CPU không phải thiết bị ngoại vi.",
    ],
    mistakes: [
      "Màn hình cảm ứng có thể vừa nhập vừa xuất, nhưng câu cơ bản thường xếp màn hình vào thiết bị xuất.",
      "Ổ cứng là thiết bị lưu trữ, không phải thiết bị nhập chính.",
    ],
    checks: [
      "Bàn phím thuộc thiết bị nhập hay xuất?",
      "Vì sao máy in không được xem là thiết bị nhập?",
      "Thiết bị ngoại vi khác thành phần xử lý chính ở điểm nào?",
    ],
  },
  {
    id: "tt02",
    groupId: "tin-hoc-nen-tang",
    title: "CPU, RAM, ROM, lưu trữ và hiệu năng",
    summary: "Phân biệt bộ xử lý, bộ nhớ tạm, bộ nhớ chỉ đọc, thiết bị lưu trữ và thông số cấu hình máy.",
    questionIds: ids(range("module-587", 10, 21), range("module-587", 25, 27), range("module-587", 62, 65)),
    goal: "Đọc được các thông số cơ bản và không nhầm RAM với ổ lưu trữ.",
    explain: "CPU giống người xử lý việc, RAM giống bàn làm việc tạm thời, còn HDD/SSD/USB giống tủ hồ sơ để cất lâu dài.",
    remember: [
      "CPU xử lý lệnh và dữ liệu.",
      "RAM là bộ nhớ tạm, tắt máy thì dữ liệu đang giữ sẽ mất.",
      "ROM thường là bộ nhớ chỉ đọc, phục vụ thông tin hệ thống mức thấp.",
      "HDD, SSD, USB, thẻ nhớ dùng để lưu trữ lâu dài.",
    ],
    example: "`2GHz - 320GB - 4GB`: 2GHz thường nói về CPU, 320GB là ổ lưu trữ, 4GB là RAM.",
    tips: [
      "RAM = nhớ tạm.",
      "ROM = chỉ đọc.",
      "GHz thường gắn với tốc độ CPU.",
    ],
    mistakes: [
      "RAM nhiều không đồng nghĩa ổ cứng nhiều.",
      "Ổ lưu trữ lớn không chắc làm máy nhanh nếu CPU/RAM yếu.",
    ],
    checks: [
      "Tắt máy thì dữ liệu trong RAM còn không?",
      "USB thuộc nhóm lưu trữ hay bộ xử lý?",
      "Thông số 4GB trong cấu hình thường chỉ gì?",
    ],
  },
  {
    id: "tt03",
    groupId: "tin-hoc-nen-tang",
    title: "Phần mềm, hệ điều hành, driver và mã nguồn mở",
    summary: "Phân biệt phần mềm hệ thống, phần mềm ứng dụng, driver, hệ điều hành và giấy phép phần mềm.",
    questionIds: range("module-587", 43, 61),
    goal: "Nhận ra phần mềm nào dùng để vận hành máy, phần mềm nào phục vụ công việc cụ thể.",
    explain: "Phần mềm là phần ra lệnh cho phần cứng. Trong đó hệ điều hành là lớp quan trọng nhất vì nó quản lý tài nguyên và cho ứng dụng chạy.",
    remember: [
      "Windows, Linux, macOS là hệ điều hành.",
      "Word, Excel, PowerPoint, trình duyệt là phần mềm ứng dụng.",
      "Driver giúp hệ điều hành điều khiển thiết bị.",
      "Mã nguồn mở vẫn có giấy phép sử dụng, không phải muốn dùng thế nào cũng được.",
    ],
    example: "Cài máy in mà Windows chưa nhận, thường cần driver máy in để hệ điều hành điều khiển đúng thiết bị.",
    tips: [
      "Cài đầu tiên để máy hoạt động ổn định thường là hệ điều hành.",
      "Điều khiển thiết bị thì nghĩ tới driver.",
      "Miễn phí và mã nguồn mở không phải luôn giống nhau.",
    ],
    mistakes: [
      "Windows không phải Word; Word chỉ là ứng dụng chạy trên Windows.",
      "Mã nguồn mở không có nghĩa là bỏ qua bản quyền.",
    ],
    checks: [
      "Driver dùng để làm gì?",
      "Linux thuộc loại phần mềm nào?",
      "LibreOffice khác Microsoft Office ở điểm nào về giấy phép?",
    ],
  },
  {
    id: "wd01",
    groupId: "su-dung-windows",
    title: "Khởi động, tắt máy, khóa máy và phiên làm việc",
    summary: "Các thao tác bắt đầu/kết thúc phiên làm việc, Shutdown, Restart, Sleep, Lock và tháo USB an toàn.",
    questionIds: ids(range("module-580", 1, 6), ["module-580-q8"], range("module-580", 10, 11)),
    goal: "Biết chọn đúng lệnh khi cần tắt máy, khởi động lại, khóa máy hoặc tạm nghỉ.",
    explain: "Windows có nhiều cách dừng công việc. Shutdown là tắt hẳn, Restart là tắt rồi mở lại, Sleep/Hibernate giữ trạng thái để quay lại nhanh hơn.",
    remember: [
      "Shutdown dùng để tắt máy.",
      "Restart dùng khi cần khởi động lại.",
      "Windows+L khóa máy khi rời khỏi chỗ ngồi.",
      "Tháo USB an toàn giúp giảm rủi ro mất dữ liệu.",
    ],
    example: "Đang làm bài ở phòng máy và ra ngoài vài phút: dùng Windows+L để khóa máy thay vì tắt máy.",
    tips: [
      "Rời máy ngắn: khóa máy.",
      "Máy lỗi nhẹ: Restart.",
      "Kết thúc buổi học: lưu dữ liệu rồi Shutdown.",
    ],
    mistakes: [
      "Sleep không giống Shutdown.",
      "Rút USB ngay khi đang ghi dữ liệu có thể làm hỏng tệp.",
    ],
    checks: [
      "Khi nào nên dùng Restart?",
      "Phím nào khóa máy nhanh?",
      "Trước khi Shutdown cần làm gì với tài liệu đang mở?",
    ],
  },
  {
    id: "wd02",
    groupId: "su-dung-windows",
    title: "Phím tắt Windows và thao tác nhanh",
    summary: "Các phím tắt đóng/chuyển cửa sổ, chụp màn hình, copy/cut/paste, di chuyển con trỏ và in.",
    questionIds: ids(range("module-580", 12, 23), ["module-580-q120"]),
    goal: "Nhớ các tổ hợp phím hay hỏi và hiểu tác dụng thay vì học vẹt ký tự.",
    explain: "Phím tắt là cách ra lệnh nhanh. Đề thường hỏi trực tiếp chức năng của tổ hợp phím hoặc yêu cầu chọn phím cho một thao tác.",
    remember: [
      "Alt+F4 đóng cửa sổ hiện hành.",
      "Alt+Tab chuyển giữa các cửa sổ.",
      "Ctrl+C sao chép, Ctrl+X cắt, Ctrl+V dán.",
      "Ctrl+P thường dùng để in.",
    ],
    example: "Muốn sao chép một tệp sang thư mục khác: chọn tệp, Ctrl+C, mở thư mục đích, Ctrl+V.",
    tips: [
      "C là Copy, X là Cut, V là Paste.",
      "Alt+Tab là chuyển cửa sổ.",
      "Print Screen liên quan chụp màn hình.",
    ],
    mistakes: [
      "Ctrl+X chưa mất dữ liệu ngay; dữ liệu chỉ chuyển sau khi dán thành công.",
      "Alt+F4 đóng cửa sổ, không phải luôn tắt máy.",
    ],
    checks: [
      "Ctrl+P dùng để làm gì?",
      "Muốn chuyển nhanh sang cửa sổ khác dùng phím nào?",
      "Ctrl+C khác Ctrl+X ở điểm nào?",
    ],
  },
  {
    id: "wd03",
    groupId: "su-dung-windows",
    title: "Control Panel, Settings, máy in, font và bộ gõ",
    summary: "Nơi chỉnh cấu hình Windows: tài khoản, chương trình, màn hình, máy in, ngày giờ, font và tiếng Việt.",
    questionIds: ids(["module-580-q7", "module-580-q9"], range("module-580", 24, 43), range("module-580", 111, 119)),
    goal: "Biết vào đúng khu vực thiết lập khi đề hỏi gỡ phần mềm, đổi máy in, chỉnh ngày giờ hoặc bộ gõ.",
    explain: "Control Panel và Settings giống bảng điều khiển của Windows. Những việc liên quan cấu hình hệ thống thường nằm ở đây.",
    remember: [
      "Programs and Features dùng để gỡ chương trình.",
      "Devices and Printers dùng với máy in và thiết bị.",
      "Date and Time hoặc Region liên quan ngày giờ và định dạng.",
      "UniKey là bộ gõ, font là kiểu hiển thị chữ.",
    ],
    example: "Muốn đặt máy in mặc định: mở Devices and Printers, chọn máy in, đặt làm mặc định.",
    tips: [
      "Gỡ phần mềm: Programs and Features.",
      "Máy in: Devices and Printers.",
      "Bộ gõ không phải font chữ.",
    ],
    mistakes: [
      "Control Panel không dùng để soạn văn bản.",
      "Đổi font không tự đổi kiểu gõ tiếng Việt.",
    ],
    checks: [
      "Muốn gỡ chương trình vào mục nào?",
      "Muốn đổi máy in mặc định làm ở đâu?",
      "UniKey Toolkit thường dùng để làm gì?",
    ],
  },
  {
    id: "wd04",
    groupId: "su-dung-windows",
    title: "Desktop, biểu tượng, shortcut và Clipboard",
    summary: "Màn hình nền, biểu tượng lối tắt, chọn đối tượng, sao chép, cắt, dán và đổi tên.",
    questionIds: range("module-580", 44, 61),
    goal: "Không nhầm shortcut với chương trình gốc và thao tác đúng với Clipboard.",
    explain: "Shortcut chỉ là lối tắt trỏ tới nơi khác. Clipboard là vùng nhớ tạm giữ dữ liệu khi copy hoặc cut.",
    remember: [
      "Xóa shortcut không xóa chương trình gốc.",
      "F2 thường dùng để đổi tên.",
      "Ctrl+A chọn tất cả.",
      "Shift chọn nhiều mục liền nhau, Ctrl chọn nhiều mục rời nhau.",
    ],
    example: "Xóa icon lối tắt của Word ngoài Desktop không làm mất Microsoft Word khỏi máy.",
    tips: [
      "Shortcut là lối tắt, không phải bản gốc.",
      "Shift = một dải liên tiếp.",
      "Ctrl = chọn rời rạc.",
    ],
    mistakes: [
      "Copy shortcut sang máy khác không chắc mở được tệp gốc.",
      "Cut khác Delete; Cut là chuẩn bị di chuyển.",
    ],
    checks: [
      "Vì sao xóa shortcut không xóa chương trình?",
      "Muốn chọn file 1 đến file 10 dùng Ctrl hay Shift?",
      "Clipboard liên quan thao tác nào?",
    ],
  },
  {
    id: "wd05",
    groupId: "su-dung-windows",
    title: "Tệp, thư mục, đường dẫn và phần mở rộng",
    summary: "Cách Windows tổ chức dữ liệu bằng file, folder, cây thư mục, tên tệp, đuôi tệp và kiểu tệp.",
    questionIds: range("module-580", 62, 89),
    goal: "Hiểu file/folder/path/extension để nhận diện đúng loại dữ liệu và thao tác quản lý tệp.",
    explain: "Thư mục giống ngăn chứa. Tệp là dữ liệu cụ thể. Đường dẫn là đường đi tới tệp. Phần mở rộng sau dấu chấm giúp đoán kiểu tệp.",
    remember: [
      "Tệp có tên và thường có phần mở rộng.",
      "Thư mục có thể chứa tệp và thư mục con.",
      "`.docx` là Word, `.xlsx` là Excel, `.pptx` là PowerPoint.",
      "`.zip`, `.rar` thường là tệp nén.",
    ],
    example: "`Baitap.docx`: phần tên là Baitap, phần mở rộng là .docx.",
    tips: [
      "Đuôi tệp cho biết kiểu tệp.",
      "Thư mục chứa tệp; tệp không chứa thư mục con.",
      "Dấu chấm ngăn tên và phần mở rộng.",
    ],
    mistakes: [
      "Đổi đuôi tệp không chắc biến nội dung thành kiểu mới.",
      "Hai tệp cùng tên trong cùng thư mục thường không được trùng hoàn toàn.",
    ],
    checks: [
      "`.pptx` nên mở bằng ứng dụng nào?",
      "Đường dẫn dùng để làm gì?",
      "Thư mục khác tệp ở điểm nào?",
    ],
  },
  {
    id: "wd06",
    groupId: "su-dung-windows",
    title: "Recycle Bin, tìm kiếm, ký tự đại diện, nén tệp và in",
    summary: "Khôi phục/xóa vĩnh viễn, tìm tệp bằng mẫu, dùng ZIP/RAR và thao tác in cơ bản.",
    questionIds: range("module-580", 90, 110),
    goal: "Biết xử lý tệp đã xóa, tìm tệp nhanh và gom/nén tệp khi cần gửi hoặc lưu.",
    explain: "Recycle Bin là nơi giữ tạm một số tệp bị xóa. Ký tự đại diện giúp tìm theo mẫu, còn nén tệp giúp gom nhiều tệp thành một gói.",
    remember: [
      "Restore dùng để khôi phục từ Recycle Bin.",
      "Shift+Delete thường bỏ qua Recycle Bin.",
      "`*` đại diện cho nhiều ký tự, `?` đại diện cho đúng một ký tự.",
      "ZIP/RAR là định dạng nén phổ biến.",
    ],
    example: "`*.jpg` tìm các tệp ảnh JPG; `Bai?.doc` khớp Bai1.doc nhưng không khớp Bai12.doc.",
    tips: [
      "`*` là nhiều ký tự.",
      "`?` là một ký tự.",
      "Gửi nhiều tệp thì nên nén lại.",
    ],
    mistakes: [
      "Tệp xóa từ USB có thể không nằm trong Recycle Bin tùy hệ thống.",
      "Nén tệp không phải là xóa tệp gốc.",
    ],
    checks: [
      "Muốn khôi phục tệp đã xóa tạm, vào đâu?",
      "`*.docx` tìm loại tệp nào?",
      "Vì sao nên nén nhiều tệp trước khi gửi?",
    ],
  },
  {
    id: "in01",
    groupId: "internet-cong-dan-so",
    title: "Mạng máy tính, LAN, WAN, Internet và Intranet",
    summary: "Phân biệt mạng cục bộ, mạng diện rộng, Internet, Intranet, tốc độ truyền và phương tiện truyền dẫn.",
    questionIds: range("module-587", 66, 84),
    goal: "Nhận diện đúng loại mạng và hiểu Internet là môi trường kết nối toàn cầu.",
    explain: "Mạng máy tính giúp các thiết bị trao đổi dữ liệu. LAN là gần, WAN là rộng, Internet là mạng toàn cầu kết nối rất nhiều mạng nhỏ.",
    remember: [
      "LAN là mạng cục bộ, phạm vi nhỏ.",
      "WAN là mạng diện rộng.",
      "Internet là mạng toàn cầu.",
      "Download là tải dữ liệu từ mạng về máy.",
    ],
    example: "Phòng máy trong trường có thể là LAN; các chi nhánh ở nhiều tỉnh nối với nhau là WAN.",
    tips: [
      "LAN = Local = gần.",
      "WAN = Wide = rộng.",
      "Internet lớn hơn WWW.",
    ],
    mistakes: [
      "LAN có thể kết nối Internet nhưng không phải Internet.",
      "Tốc độ truyền khác dung lượng lưu trữ.",
    ],
    checks: [
      "LAN khác WAN ở phạm vi nào?",
      "Intranet thường dùng trong phạm vi nào?",
      "Download nghĩa là gì?",
    ],
  },
  {
    id: "in02",
    groupId: "internet-cong-dan-so",
    title: "Internet, WWW, HTTP, URL, IP và tên miền",
    summary: "Các khái niệm nền khi truy cập web: địa chỉ IP, tên miền, URL, HTTP, WWW và hyperlink.",
    questionIds: ids(range("module-581", 1, 13), range("module-581", 28, 31), ["module-581-q49"]),
    goal: "Không nhầm Internet với WWW, website với trình duyệt, URL với email.",
    explain: "Internet là hạ tầng kết nối. WWW là dịch vụ web chạy trên Internet. URL là địa chỉ tài nguyên, còn trình duyệt là phần mềm để xem web.",
    remember: [
      "WWW là World Wide Web.",
      "HTTP là giao thức truyền tải nội dung web.",
      "URL là địa chỉ tài nguyên trên Internet.",
      "Tên miền có các phần ngăn cách bằng dấu chấm.",
    ],
    example: "`https://utt.edu.vn` là địa chỉ web; `ten@example.com` là địa chỉ email.",
    tips: [
      "Có dấu @ thì thường nghĩ tới email.",
      "Web cần trình duyệt để xem.",
      "Link là liên kết dẫn sang nội dung khác.",
    ],
    mistakes: [
      "Internet Explorer là trình duyệt, không phải Internet.",
      "Website không phải trình duyệt.",
    ],
    checks: [
      "WWW là Internet hay dịch vụ trên Internet?",
      "URL dùng để làm gì?",
      "Tên miền thường được phân cách bằng ký tự nào?",
    ],
  },
  {
    id: "in03",
    groupId: "internet-cong-dan-so",
    title: "Trình duyệt web, tab, lịch sử và đánh dấu trang",
    summary: "Chrome, Firefox, Edge/Internet Explorer, tab, Back, Forward, Refresh, Stop, History và Favorites.",
    questionIds: ids(range("module-581", 14, 23), range("module-581", 32, 48), range("module-581", 50, 58)),
    goal: "Dùng đúng nút và phím tắt trong trình duyệt khi đề hỏi thao tác web.",
    explain: "Trình duyệt là ứng dụng để xem trang web. Các nút Back, Forward, Refresh, Stop, Home giúp điều hướng khi duyệt web.",
    remember: [
      "Refresh tải lại trang.",
      "Stop dừng tải trang.",
      "Back quay lại trang trước.",
      "Favorites/Bookmarks lưu địa chỉ ưa thích.",
    ],
    example: "Đang xem trang bị lỗi hiển thị, thử Refresh để tải lại nội dung.",
    tips: [
      "Ctrl+T thường mở tab mới.",
      "Ctrl+W thường đóng tab hiện tại.",
      "Ctrl+H thường mở lịch sử duyệt web.",
    ],
    mistakes: [
      "Nút Home không phải luôn quay lại trang vừa xem trước đó.",
      "Lưu bookmark không lưu toàn bộ nội dung trang về máy.",
    ],
    checks: [
      "Refresh khác Stop thế nào?",
      "Muốn xem lịch sử duyệt web dùng mục nào?",
      "Bookmark dùng để làm gì?",
    ],
  },
  {
    id: "in04",
    groupId: "internet-cong-dan-so",
    title: "Biểu mẫu web, tìm kiếm, tải xuống, lưu và in trang web",
    summary: "Form, gửi biểu mẫu, Google, từ khóa tìm kiếm, lưu ảnh/trang web, tải xuống và in nội dung web.",
    questionIds: ids(range("module-581", 59, 60), range("module-581", 62, 72)),
    goal: "Biết thao tác với nội dung web và tìm kiếm thông tin hiệu quả.",
    explain: "Khi dùng web, bạn thường điền form, tìm thông tin, tải tệp, lưu ảnh hoặc in trang. Đề hay hỏi tên nút hoặc cách gõ từ khóa.",
    remember: [
      "Search engine giúp tìm thông tin trên Internet.",
      "Từ khóa càng rõ, kết quả càng sát.",
      "Form dùng để nhập và gửi dữ liệu lên website.",
      "Lưu ảnh khác lưu cả trang web.",
    ],
    example: "Muốn tìm trong một website cụ thể có thể dùng cú pháp kiểu `tu khoa site:tenmien`.",
    tips: [
      "Tìm kiếm tốt bắt đầu từ từ khóa ngắn, đúng trọng tâm.",
      "Submit/Send thường dùng để gửi biểu mẫu.",
      "Save image dùng để lưu ảnh.",
    ],
    mistakes: [
      "Gõ câu quá dài đôi khi làm kết quả kém chính xác.",
      "In trang web có thể kèm tiêu đề, địa chỉ và số trang tùy thiết lập.",
    ],
    checks: [
      "Công cụ tìm kiếm dùng để làm gì?",
      "Form web thường có thao tác cuối là gì?",
      "Muốn lưu ảnh trên web thì chọn lệnh nào?",
    ],
  },
  {
    id: "in05",
    groupId: "internet-cong-dan-so",
    title: "Email: địa chỉ, lợi ích, soạn thư và thư nháp",
    summary: "Cấu trúc địa chỉ email, ưu điểm của thư điện tử, soạn thư, thư rác, tệp đính kèm và thư nháp.",
    questionIds: ids(range("module-581", 73, 88), range("module-587", 85, 88)),
    goal: "Nhận diện địa chỉ email đúng và biết quy trình cơ bản khi soạn thư.",
    explain: "Email là thư điện tử. Một địa chỉ email thường có tên người dùng, dấu @ và tên miền dịch vụ.",
    remember: [
      "Email thường có dạng `ten@mien`.",
      "Drafts/Thư nháp chứa thư đang soạn chưa gửi.",
      "Spam/Junk chứa thư rác.",
      "Attachment là tệp đính kèm.",
    ],
    example: "`sinhvien@example.com` là email hợp lệ hơn `sinhvien.example.com` vì có dấu @.",
    tips: [
      "Không có @ thì thường không phải email.",
      "File gửi kèm = attachment.",
      "Thư chưa gửi thường nằm ở Drafts.",
    ],
    mistakes: [
      "Email nhanh hơn thư giấy nhưng vẫn có rủi ro thư rác và tệp độc hại.",
      "Subject không bắt buộc về kỹ thuật ở mọi hệ thống nhưng rất cần để người nhận hiểu nội dung.",
    ],
    checks: [
      "Địa chỉ email cần ký tự nào?",
      "Thư đang soạn dở thường lưu ở đâu?",
      "Attachment nghĩa là gì?",
    ],
  },
  {
    id: "in06",
    groupId: "internet-cong-dan-so",
    title: "Email: trả lời, chuyển tiếp, quản lý và tìm thư",
    summary: "Reply, Reply all, Forward, lọc thư, tìm thư, sổ địa chỉ và phân biệt thư đã đọc/chưa đọc.",
    questionIds: range("module-581", 89, 108),
    goal: "Biết chọn đúng nút khi trả lời, chuyển tiếp hoặc quản lý hộp thư.",
    explain: "Một email sau khi nhận có thể được trả lời cho người gửi, trả lời cho nhiều người, hoặc chuyển tiếp cho người khác.",
    remember: [
      "Reply trả lời người gửi.",
      "Reply all trả lời nhiều người trong luồng thư.",
      "Forward chuyển tiếp thư cho người khác.",
      "BCC giúp ẩn người nhận với các người nhận khác.",
    ],
    example: "Muốn gửi lại một thư đã nhận cho bạn khác: dùng Forward, không dùng Reply.",
    tips: [
      "RE: thường là thư trả lời.",
      "Forward là chuyển tiếp.",
      "BCC dùng khi muốn giấu danh sách người nhận.",
    ],
    mistakes: [
      "Reply all có thể gửi cho nhiều người ngoài ý muốn.",
      "Xóa thư không giống chặn người gửi.",
    ],
    checks: [
      "Reply khác Forward ở điểm nào?",
      "Khi nào dùng Reply all?",
      "BCC dùng để làm gì?",
    ],
  },
  {
    id: "in07",
    groupId: "internet-cong-dan-so",
    title: "Chat, mạng xã hội, diễn đàn, blog và VoIP",
    summary: "Tin nhắn tức thời, trao đổi thời gian thực, mạng xã hội, cộng đồng trực tuyến, blog, forum và gọi thoại qua Internet.",
    questionIds: ids(range("module-581", 109, 118), range("module-587", 89, 96)),
    goal: "Phân biệt các hình thức giao tiếp trực tuyến hay xuất hiện trong đề.",
    explain: "Không phải mọi giao tiếp trên Internet đều là email. Chat, forum, blog, mạng xã hội và VoIP có cách dùng khác nhau.",
    remember: [
      "Instant messaging là tin nhắn tức thời.",
      "Forum là nơi thảo luận theo chủ đề.",
      "Blog là trang tin cá nhân hoặc nhật ký trực tuyến.",
      "VoIP là gọi thoại qua giao thức Internet.",
    ],
    example: "Gọi điện qua ứng dụng dùng Internet là ví dụ của VoIP.",
    tips: [
      "Thời gian thực thì nghĩ tới chat hoặc VoIP.",
      "Cộng đồng thảo luận theo chủ đề thì nghĩ tới forum.",
      "Trang cá nhân thường gắn với blog.",
    ],
    mistakes: [
      "Email không phải chat thời gian thực.",
      "Mạng xã hội không chỉ dùng để nhắn tin.",
    ],
    checks: [
      "VoIP dùng để làm gì?",
      "Forum khác blog ở điểm nào?",
      "Tin nhắn tức thời có ưu điểm gì?",
    ],
  },
  {
    id: "in08",
    groupId: "internet-cong-dan-so",
    title: "Dịch vụ công, chuyển đổi số và giao dịch trực tuyến",
    summary: "Dịch vụ công trực tuyến, biểu mẫu điện tử, mua hàng online, thanh toán và nguyên tắc giảm rủi ro.",
    questionIds: ids(["module-581-q61"], range("module-581", 119, 120)),
    goal: "Hiểu chuyển đổi số qua việc làm thủ tục, giao dịch và mua hàng trên môi trường mạng.",
    explain: "Dịch vụ công trực tuyến giúp người dân làm thủ tục qua mạng. Giao dịch online tiện hơn nhưng cần kiểm tra nguồn và bảo vệ thông tin.",
    remember: [
      "Dịch vụ công trực tuyến là dịch vụ của cơ quan nhà nước cung cấp qua mạng.",
      "Khi thanh toán online cần kiểm tra website và bảo mật tài khoản.",
      "Không nhập thông tin nhạy cảm vào trang không đáng tin.",
    ],
    example: "Nộp hồ sơ trực tuyến và theo dõi kết quả qua website là ví dụ dễ hiểu của chuyển đổi số.",
    tips: [
      "Có thủ tục nhà nước qua mạng thì nghĩ tới dịch vụ công trực tuyến.",
      "Giao dịch online cần kiểm tra địa chỉ và độ tin cậy.",
      "Không chia sẻ mã OTP.",
    ],
    mistakes: [
      "Website đẹp không đồng nghĩa an toàn.",
      "Chuyển đổi số không chỉ là scan giấy thành PDF.",
    ],
    checks: [
      "Dịch vụ công trực tuyến giúp tiết kiệm gì?",
      "Khi mua hàng online nên kiểm tra gì?",
      "OTP có nên gửi cho người khác không?",
    ],
  },
  {
    id: "in09",
    groupId: "internet-cong-dan-so",
    title: "An toàn số, mật khẩu, virus, bản quyền và bảo vệ dữ liệu",
    summary: "Mật khẩu mạnh, firewall, virus, mã độc, email lạ, cập nhật phần mềm, bản quyền và thói quen bảo vệ dữ liệu.",
    questionIds: ids(range("module-587", 97, 120), range("module-581", 24, 27)),
    goal: "Biết cách chọn hành vi an toàn khi dùng máy tính và Internet.",
    explain: "An toàn số là bảo vệ tài khoản, thiết bị, dữ liệu và quyền sử dụng phần mềm. Đề thường hỏi tình huống thực tế: email lạ, mật khẩu, giao dịch, virus.",
    remember: [
      "Mật khẩu mạnh nên dài, khó đoán và không dùng lại nhiều nơi.",
      "Firewall giúp chặn một số kết nối không mong muốn.",
      "Virus và mã độc có thể phá hoại hoặc đánh cắp dữ liệu.",
      "Bản quyền phần mềm quy định quyền sử dụng hợp pháp.",
    ],
    example: "Nhận email có tệp đính kèm từ người lạ: không mở vội, cần kiểm tra nguồn hoặc quét an toàn.",
    tips: [
      "Email lạ + file đính kèm = cẩn thận.",
      "Cập nhật hệ điều hành giúp vá lỗi bảo mật.",
      "Mật khẩu tốt không dùng ngày sinh hoặc tên dễ đoán.",
    ],
    mistakes: [
      "HTTPS không đảm bảo nội dung website chắc chắn tốt.",
      "Phần mềm miễn phí không phải lúc nào cũng dùng tùy ý trong cơ quan.",
    ],
    checks: [
      "Mật khẩu nào khó đoán hơn: ngày sinh hay chuỗi dài nhiều loại ký tự?",
      "Firewall dùng để làm gì?",
      "Vì sao cần sao lưu dữ liệu?",
    ],
  },
  {
    id: "wo01",
    groupId: "word",
    title: "Word: giao diện, tệp, lưu, mở, trợ giúp và chế độ xem",
    summary: "Khởi động Word, phần mở rộng, thanh tiêu đề, Quick Access, Help, Zoom, Open, Save, Save As và cửa sổ tài liệu.",
    questionIds: ids(range("module-577", 1, 27), range("module-577", 32, 36)),
    goal: "Làm quen giao diện Word và nhớ các lệnh tệp cơ bản.",
    explain: "Khi học Word, hãy học từ ngoài vào trong: mở chương trình, nhận diện thanh công cụ, mở/lưu tài liệu, đổi chế độ xem rồi mới đến định dạng.",
    remember: [
      "`.docx` là phần mở rộng Word hiện đại.",
      "Ctrl+N tạo tài liệu mới, Ctrl+O mở, Ctrl+S lưu.",
      "F1 thường mở Help.",
      "Save lưu vào tệp hiện tại, Save As lưu thành bản mới.",
    ],
    example: "Muốn lưu tài liệu với tên khác: dùng Save As thay vì Save.",
    tips: [
      "N = New, O = Open, S = Save.",
      "Tên tài liệu thường nằm trên thanh tiêu đề.",
      "AutoRecover giúp tự lưu thông tin khôi phục.",
    ],
    mistakes: [
      "Close đóng tài liệu/cửa sổ, không phải luôn thoát toàn bộ Word.",
      "Zoom 100% là mức hiển thị, không đổi kích thước chữ thật.",
    ],
    checks: [
      "Ctrl+O dùng để làm gì?",
      "Save khác Save As ở điểm nào?",
      "Đuôi tệp Word 2010 mặc định thường là gì?",
    ],
  },
  {
    id: "wo02",
    groupId: "word",
    title: "Word: soạn thảo, chọn, tìm, thay thế và ký tự đặc biệt",
    summary: "Chèn ký hiệu, chọn văn bản, xóa, copy/cut, Find, Replace, Undo, AutoCorrect và kiểm tra lỗi.",
    questionIds: ids(range("module-577", 28, 31), range("module-577", 37, 51)),
    goal: "Biết thao tác với nội dung văn bản trước khi định dạng đẹp.",
    explain: "Soạn thảo là phần nhập và sửa nội dung. Các lệnh Find, Replace, Undo, Cut/Copy/Paste giúp sửa nhanh và giảm lỗi.",
    remember: [
      "Ctrl+F tìm kiếm.",
      "Ctrl+H thay thế.",
      "Ctrl+A chọn toàn bộ văn bản.",
      "Ctrl+Z hoàn tác thao tác vừa làm.",
    ],
    example: "Muốn đổi tất cả chữ `CNTT` thành `Tin học`: dùng Replace thay vì sửa từng chỗ.",
    tips: [
      "F = Find.",
      "H = Replace trong Word.",
      "Undo là quay lại bước trước.",
    ],
    mistakes: [
      "Delete một khối văn bản sẽ mất phần đã chọn nếu chưa lưu/hoàn tác.",
      "AutoCorrect có thể sửa tự động không đúng với tiếng Việt nếu cấu hình chưa phù hợp.",
    ],
    checks: [
      "Ctrl+H dùng khi nào?",
      "Muốn chọn toàn bộ văn bản dùng phím nào?",
      "Undo giúp gì khi thao tác nhầm?",
    ],
  },
  {
    id: "wo03",
    groupId: "word",
    title: "Word: định dạng chữ, đoạn, tab, style và danh sách",
    summary: "Font, cỡ chữ, đậm/nghiêng/gạch chân, chữ hoa/thường, thụt dòng, khoảng cách, tab, bullet, numbering và style.",
    questionIds: range("module-577", 52, 82),
    goal: "Hiểu lệnh định dạng tác động lên chữ, đoạn hay kiểu trình bày.",
    explain: "Định dạng chữ làm thay đổi ký tự; định dạng đoạn làm thay đổi cả đoạn như căn lề, thụt dòng, giãn dòng, khoảng cách.",
    remember: [
      "Ctrl+B in đậm, Ctrl+I in nghiêng, Ctrl+U gạch chân.",
      "Ctrl+E căn giữa, Ctrl+L căn trái, Ctrl+R căn phải, Ctrl+J căn đều.",
      "Bullet là dấu đầu dòng, Numbering là đánh số.",
      "Style giúp áp dụng một bộ định dạng nhanh.",
    ],
    example: "Muốn tiêu đề nhìn thống nhất ở nhiều chỗ: tạo hoặc áp dụng Style thay vì định dạng từng dòng.",
    tips: [
      "B = Bold, I = Italic, U = Underline.",
      "Bullet dùng cho liệt kê không thứ tự.",
      "Numbering dùng khi thứ tự quan trọng.",
    ],
    mistakes: [
      "Căn lề đoạn không giống căn lề trang.",
      "Caps Lock khác lệnh đổi chữ hoa/thường trong Word.",
    ],
    checks: [
      "Ctrl+J dùng để làm gì?",
      "Bullet khác Numbering ở điểm nào?",
      "Style giúp tiết kiệm thời gian thế nào?",
    ],
  },
  {
    id: "wo04",
    groupId: "word",
    title: "Word: bảng, hình ảnh, biểu đồ, Text Box và đối tượng",
    summary: "Chèn bảng, chỉnh ô, gộp ô, xóa bảng, chèn ảnh, biểu đồ, shape, Text Box và định dạng đối tượng.",
    questionIds: range("module-577", 83, 99),
    goal: "Biết nhóm lệnh Insert và thao tác với bảng/đối tượng trong văn bản.",
    explain: "Bảng dùng để trình bày dữ liệu theo hàng cột. Hình ảnh, biểu đồ, shape và Text Box là các đối tượng chèn thêm vào tài liệu.",
    remember: [
      "Table dùng để chèn bảng.",
      "Picture dùng để chèn ảnh.",
      "Chart dùng để chèn biểu đồ.",
      "Text Box là khung văn bản độc lập.",
    ],
    example: "Bảng 5x6 nghĩa là 5 hàng và 6 cột hoặc theo cách đề diễn đạt kích thước bảng cần đọc kỹ đáp án.",
    tips: [
      "Insert là tab hay gặp khi chèn thêm đối tượng.",
      "Merge Cells là gộp ô.",
      "Picture liên quan ảnh.",
    ],
    mistakes: [
      "Xóa nội dung trong bảng không giống xóa cả bảng.",
      "Textbox cần lưu/thoát chỉnh sửa đúng cách để giữ nội dung.",
    ],
    checks: [
      "Muốn chèn ảnh vào Word dùng nhóm lệnh nào?",
      "Merge Cells nghĩa là gì?",
      "Text Box dùng để làm gì?",
    ],
  },
  {
    id: "wo05",
    groupId: "word",
    title: "Word: trang in, header/footer, số trang, PDF, bảo vệ và thể thức",
    summary: "Footnote, số trang, ngắt trang, header/footer, hướng giấy, lề, in, PDF, mật khẩu, gửi email và thể thức văn bản.",
    questionIds: range("module-577", 100, 120),
    goal: "Nắm các lệnh hoàn thiện tài liệu trước khi nộp hoặc in.",
    explain: "Sau khi soạn xong, cần kiểm tra bố cục trang, lề, hướng giấy, số trang, header/footer, xem trước khi in và lưu sang định dạng phù hợp.",
    remember: [
      "Portrait là giấy dọc, Landscape là giấy ngang.",
      "Header ở đầu trang, Footer ở cuối trang.",
      "Ctrl+P dùng để in.",
      "PDF thường dùng để gửi bản ổn định bố cục.",
    ],
    example: "Muốn in văn bản ngang khổ giấy: đổi Orientation sang Landscape.",
    tips: [
      "Portrait = dọc.",
      "Landscape = ngang.",
      "Print Preview giúp xem trước khi in.",
    ],
    mistakes: [
      "Lề trang khác khoảng cách đoạn văn.",
      "Lưu PDF không giống lưu file Word để tiếp tục chỉnh sửa dễ dàng.",
    ],
    checks: [
      "Header và Footer nằm ở đâu?",
      "Muốn đổi hướng giấy dùng nhóm thiết lập nào?",
      "PDF hữu ích khi nào?",
    ],
  },
  {
    id: "ex01",
    groupId: "excel",
    title: "Excel: giao diện, workbook, worksheet, ô, vùng và nhập dữ liệu",
    summary: "Tệp Excel, sheet, hàng, cột, ô, địa chỉ ô, vùng dữ liệu, kiểu dữ liệu, chọn vùng và sửa ô.",
    questionIds: range("module-578", 1, 24),
    goal: "Hiểu cấu trúc bảng tính trước khi học công thức.",
    explain: "Excel làm việc theo ô. Nhiều ô tạo thành vùng, nhiều sheet nằm trong một workbook. Công thức và dữ liệu đều được nhập vào ô.",
    remember: [
      "Workbook là cả tệp Excel.",
      "Worksheet là từng trang tính.",
      "Ô giao giữa hàng và cột, ví dụ A1.",
      "Vùng ô viết dạng A1:C5.",
    ],
    example: "`$A$1` là địa chỉ tuyệt đối; A1 là địa chỉ tương đối.",
    tips: [
      "Cột dùng chữ, hàng dùng số.",
      "F2 thường sửa nội dung ô.",
      "F4 giúp đổi kiểu tham chiếu khi sửa công thức.",
    ],
    mistakes: [
      "Workbook không phải worksheet.",
      "A1:C5 là vùng, không phải một ô.",
    ],
    checks: [
      "A1 là ô hay vùng?",
      "Workbook khác worksheet thế nào?",
      "Địa chỉ tuyệt đối có dấu gì?",
    ],
  },
  {
    id: "ex02",
    groupId: "excel",
    title: "Excel: sắp xếp, lọc, hàng, cột, sheet và cố định vùng",
    summary: "Sort, Filter, xóa/chèn hàng cột, đổi độ rộng cột, Freeze Panes, đổi tên và di chuyển sheet.",
    questionIds: range("module-578", 25, 41),
    goal: "Quản lý bảng dữ liệu dài bằng thao tác tổ chức hàng, cột và sheet.",
    explain: "Excel không chỉ tính toán; nó còn giúp xem dữ liệu dễ hơn bằng sắp xếp, lọc, cố định tiêu đề và quản lý sheet.",
    remember: [
      "Sort là sắp xếp dữ liệu.",
      "Filter là lọc để chỉ xem phần cần thiết.",
      "Freeze Panes giữ hàng/cột cố định khi cuộn.",
      "Sheet có thể đổi tên, di chuyển hoặc chèn thêm.",
    ],
    example: "Muốn xem nhanh học sinh xếp loại xuất sắc: dùng Filter trên cột xếp loại.",
    tips: [
      "Sort đổi thứ tự dòng.",
      "Filter ẩn bớt dòng không phù hợp.",
      "Freeze giúp giữ tiêu đề.",
    ],
    mistakes: [
      "Lọc dữ liệu không xóa dữ liệu.",
      "Xóa hàng/cột khác xóa nội dung trong ô.",
    ],
    checks: [
      "Sort khác Filter ở điểm nào?",
      "Freeze Panes dùng khi nào?",
      "Đổi tên sheet có làm mất dữ liệu không?",
    ],
  },
  {
    id: "ex03",
    groupId: "excel",
    title: "Excel: công thức, nối chuỗi và lỗi thường gặp",
    summary: "Dấu bằng, phép toán, sao chép công thức, nối chuỗi, lỗi tham chiếu, lỗi chia 0, sai tên hàm và ô quá hẹp.",
    questionIds: range("module-578", 42, 51),
    goal: "Nhận ra công thức Excel và đọc được lỗi cơ bản khi tính toán.",
    explain: "Công thức Excel bắt đầu bằng dấu bằng. Khi sao chép công thức, địa chỉ tương đối có thể thay đổi theo vị trí mới.",
    remember: [
      "Công thức bắt đầu bằng `=`.",
      "`&` thường dùng để nối chuỗi.",
      "`#DIV/0!` là lỗi chia cho 0.",
      "`#####` thường do ô không đủ rộng để hiển thị.",
    ],
    example: "Nếu ô A2 là 0, công thức `=5/A2` sẽ gây lỗi chia cho 0.",
    tips: [
      "Thấy dấu = thì nghĩ tới công thức.",
      "Sai tên hàm thường ra lỗi tên hàm.",
      "Ô hiện ##### thì thử kéo rộng cột.",
    ],
    mistakes: [
      "Dữ liệu dạng chữ và số có thể xử lý khác nhau.",
      "Copy công thức có thể làm đổi địa chỉ ô nếu không khóa bằng `$`.",
    ],
    checks: [
      "Công thức Excel bắt đầu bằng ký tự nào?",
      "`#####` thường báo điều gì?",
      "Muốn nối hai chuỗi thường dùng ký hiệu nào?",
    ],
  },
  {
    id: "ex04",
    groupId: "excel",
    title: "Excel: hàm tính toán, đếm, làm tròn và xử lý văn bản",
    summary: "SUM, MIN, MAX, AVERAGE, COUNT, COUNTA, ROUND, PRODUCT, MOD, MID, VALUE và phép tính lồng nhau.",
    questionIds: range("module-578", 52, 77),
    goal: "Nhớ nhóm hàm phổ biến và đọc được kết quả công thức đơn giản.",
    explain: "Hàm Excel là công thức có tên sẵn. Đề thường hỏi hàm làm gì hoặc tính kết quả khi tham số nhỏ.",
    remember: [
      "SUM tính tổng.",
      "AVERAGE tính trung bình.",
      "MIN/MAX tìm nhỏ nhất/lớn nhất.",
      "COUNT đếm ô chứa số, COUNTA đếm ô không rỗng.",
    ],
    example: "`=MAX(30,10,65,5)` cho kết quả 65.",
    tips: [
      "SUM = tổng.",
      "COUNT chỉ đếm số.",
      "MID lấy một phần chuỗi.",
    ],
    mistakes: [
      "AVERAGE viết sai tên hàm thì Excel báo lỗi.",
      "COUNT và COUNTA rất dễ bị nhầm.",
    ],
    checks: [
      "Hàm nào tính trung bình?",
      "COUNT khác COUNTA thế nào?",
      "MOD dùng để lấy gì?",
    ],
  },
  {
    id: "ex05",
    groupId: "excel",
    title: "Excel: IF, điều kiện, ngày tháng và dò tìm",
    summary: "IF, AND, OR, điều kiện so sánh, MONTH, TODAY, YEAR, NOW, HLOOKUP và VLOOKUP.",
    questionIds: range("module-578", 78, 95),
    goal: "Hiểu hàm điều kiện và các hàm ngày tháng/dò tìm hay xuất hiện trong đề.",
    explain: "IF giúp Excel chọn kết quả theo điều kiện. Các hàm ngày tháng lấy thông tin từ ngày, còn hàm dò tìm tra cứu dữ liệu theo bảng.",
    remember: [
      "IF có dạng điều kiện, giá trị nếu đúng, giá trị nếu sai.",
      "AND yêu cầu nhiều điều kiện cùng đúng.",
      "OR chỉ cần một điều kiện đúng.",
      "TODAY trả về ngày hiện tại.",
    ],
    example: "`=IF(G6>=5,\"Đạt\",\"Không đạt\")` dùng để xếp loại theo điểm.",
    tips: [
      "IF là nếu-thì-ngược lại.",
      "AND = tất cả đúng.",
      "OR = ít nhất một đúng.",
    ],
    mistakes: [
      "Thứ tự điều kiện trong IF lồng nhau rất quan trọng.",
      "Ngày tháng phụ thuộc định dạng hệ thống.",
    ],
    checks: [
      "IF dùng để làm gì?",
      "AND khác OR ở điểm nào?",
      "TODAY trả về thông tin gì?",
    ],
  },
  {
    id: "ex06",
    groupId: "excel",
    title: "Excel: định dạng, biểu đồ, in, bảo vệ và mật khẩu",
    summary: "Định dạng số/ngày/phần trăm, Format Cells, Merge Cells, biểu đồ, in bảng tính, bảo vệ sheet và đặt mật khẩu.",
    questionIds: range("module-578", 96, 120),
    goal: "Hoàn thiện bảng tính để dễ đọc, dễ in và bảo vệ khi cần.",
    explain: "Sau khi tính toán, bảng tính cần được định dạng, có thể vẽ biểu đồ, thiết lập trang in và bảo vệ dữ liệu quan trọng.",
    remember: [
      "Ctrl+1 mở Format Cells.",
      "Merge Cells dùng để gộp ô.",
      "Chart dùng để tạo biểu đồ.",
      "Protect Sheet/Workbook liên quan bảo vệ dữ liệu.",
    ],
    example: "Muốn hiển thị số dưới dạng phần trăm: dùng nút % hoặc định dạng Percentage.",
    tips: [
      "Format Cells là nơi chỉnh nhiều kiểu hiển thị.",
      "Biểu đồ giúp nhìn xu hướng nhanh hơn bảng số.",
      "Trước khi in nên xem Page Setup/Print Preview.",
    ],
    mistakes: [
      "Gộp ô có thể làm việc sắp xếp/lọc khó hơn.",
      "Đặt mật khẩu mà quên thì rất khó mở lại.",
    ],
    checks: [
      "Ctrl+1 mở hộp thoại nào?",
      "Merge Cells dùng để làm gì?",
      "Biểu đồ hữu ích khi nào?",
    ],
  },
  {
    id: "pp01",
    groupId: "powerpoint",
    title: "PowerPoint: mục tiêu trình bày, giao diện, tệp và chế độ xem",
    summary: "Cấu trúc bài thuyết trình, mở/tạo/lưu/đóng file, đuôi tệp, Quick Access, Help, Gridlines và các chế độ xem.",
    questionIds: range("module-579", 1, 30),
    goal: "Biết bắt đầu một bài trình chiếu và nhận diện lệnh tệp/giao diện cơ bản.",
    explain: "PowerPoint dùng để trình bày ý tưởng bằng slide. Học phần này nên bắt đầu từ mục tiêu bài nói, cấu trúc slide và thao tác tệp.",
    remember: [
      "Bài trình chiếu gồm nhiều slide.",
      "`.pptx` là đuôi PowerPoint hiện đại.",
      "Ctrl+S lưu file.",
      "Gridlines giúp căn chỉnh đối tượng.",
    ],
    example: "Muốn tạo bài mới từ mẫu có sẵn: chọn mẫu theme hoặc sample template khi tạo mới.",
    tips: [
      "Trước khi làm slide phải rõ người nghe và mục tiêu.",
      "Save lưu file hiện tại.",
      "Close đóng file hiện hành.",
    ],
    mistakes: [
      "Thoát file hiện hành không nhất thiết thoát toàn bộ PowerPoint.",
      "Chế độ đọc và chế độ sắp xếp slide không giống nhau.",
    ],
    checks: [
      "PowerPoint dùng để làm gì?",
      "Đuôi file PowerPoint 2010 thường là gì?",
      "Gridlines giúp gì khi thiết kế slide?",
    ],
  },
  {
    id: "pp02",
    groupId: "powerpoint",
    title: "PowerPoint: slide, layout, theme, master và quản lý slide",
    summary: "Slide, layout, placeholder, theme, background, Slide Master, thêm/xóa/nhân bản/sao chép/chọn nhiều slide.",
    questionIds: range("module-579", 31, 56),
    goal: "Hiểu cấu trúc slide và các lệnh quản lý slide thường gặp.",
    explain: "Slide là từng trang trình chiếu. Layout là bố cục placeholder. Theme là phong cách chung. Slide Master giúp chỉnh mẫu chung cho nhiều slide.",
    remember: [
      "Ctrl+M thường thêm slide mới.",
      "Duplicate Slide nhân bản slide.",
      "Layout quyết định vùng tiêu đề/nội dung.",
      "Slide Master chỉnh mẫu chung.",
    ],
    example: "Muốn toàn bộ slide có cùng font/màu nền: chỉnh theme hoặc Slide Master thay vì sửa từng slide.",
    tips: [
      "Layout = bố cục.",
      "Theme = phong cách.",
      "Master = mẫu chung.",
    ],
    mistakes: [
      "Layout không phải Theme.",
      "Duplicate tạo bản sao, Delete là xóa.",
    ],
    checks: [
      "Mỗi trang trình diễn gọi là gì?",
      "Slide Master dùng để làm gì?",
      "Theme khác Layout thế nào?",
    ],
  },
  {
    id: "pp03",
    groupId: "powerpoint",
    title: "PowerPoint: văn bản, placeholder, căn lề, bullet và numbering",
    summary: "Outline, placeholder, khung văn bản, Line Spacing, Clear Formatting, Shadow, màu nền chữ, căn lề, bullet và numbering.",
    questionIds: range("module-579", 57, 71),
    goal: "Định dạng chữ trên slide rõ ràng, dễ đọc và đúng lệnh.",
    explain: "Văn bản trên slide nên ngắn gọn. Các lệnh căn lề, bullet, numbering và line spacing giúp nội dung dễ nhìn hơn.",
    remember: [
      "Ctrl+E căn giữa.",
      "Ctrl+R căn phải.",
      "Bullet là dấu đầu dòng.",
      "Numbering là danh sách đánh số.",
    ],
    example: "Danh sách các ý ngang hàng nên dùng Bullet, các bước theo thứ tự nên dùng Numbering.",
    tips: [
      "Slide không nên quá nhiều chữ.",
      "Căn giữa thường dùng cho tiêu đề.",
      "Line spacing chỉnh khoảng cách dòng.",
    ],
    mistakes: [
      "Placeholder không phải nội dung thật; nó là vùng chờ nhập nội dung.",
      "Xóa khung văn bản sẽ xóa cả nội dung trong khung.",
    ],
    checks: [
      "Ctrl+E trong PowerPoint thường làm gì?",
      "Bullet khác Numbering ở điểm nào?",
      "Placeholder dùng để làm gì?",
    ],
  },
  {
    id: "pp04",
    groupId: "powerpoint",
    title: "PowerPoint: bảng, biểu đồ, hình ảnh, shape và đối tượng",
    summary: "Chèn bảng, biểu đồ, SmartArt/sơ đồ, ảnh, shapes, screenshot, WordArt, equation, căn chỉnh và định dạng đối tượng.",
    questionIds: range("module-579", 72, 99),
    goal: "Biết chèn và chỉnh các đối tượng trực quan để slide dễ hiểu hơn.",
    explain: "PowerPoint mạnh ở phần trực quan. Bảng dùng cho dữ liệu, biểu đồ cho so sánh/xu hướng, hình ảnh và shape giúp minh họa ý tưởng.",
    remember: [
      "Insert/Table chèn bảng.",
      "Insert/Chart chèn biểu đồ.",
      "Insert/Shapes chèn hình vẽ.",
      "Lock Aspect Ratio giữ tỉ lệ ảnh khi đổi kích thước.",
    ],
    example: "Muốn chèn biểu đồ cột để so sánh doanh số: dùng Insert/Chart rồi nhập dữ liệu.",
    tips: [
      "Chart = biểu đồ.",
      "Shapes = hình vẽ.",
      "WordArt = chữ nghệ thuật.",
    ],
    mistakes: [
      "Kéo ảnh không giữ tỉ lệ có thể làm ảnh méo.",
      "Bảng và biểu đồ phục vụ mục đích khác nhau.",
    ],
    checks: [
      "Insert/Chart dùng để làm gì?",
      "Lock Aspect Ratio giúp gì?",
      "Shapes dùng khi nào?",
    ],
  },
  {
    id: "pp05",
    groupId: "powerpoint",
    title: "PowerPoint: hiệu ứng, trình chiếu, ghi chú, in và phím tắt",
    summary: "Animation, Transition, Effect Options, trình chiếu từ đầu/slide hiện tại, ghi chú, ẩn slide, kiểm tra chính tả và in.",
    questionIds: range("module-579", 100, 118),
    goal: "Phân biệt hiệu ứng đối tượng với chuyển slide và nhớ phím trình chiếu.",
    explain: "Animation áp dụng cho đối tượng trên slide. Transition áp dụng khi chuyển từ slide này sang slide khác. Trình chiếu là bước chạy thử bài nói.",
    remember: [
      "Animation là hiệu ứng của đối tượng.",
      "Transition là hiệu ứng chuyển slide.",
      "F5 trình chiếu từ đầu.",
      "Shift+F5 trình chiếu từ slide hiện tại.",
    ],
    example: "Chữ bay vào slide là Animation; hiệu ứng lật sang slide kế tiếp là Transition.",
    tips: [
      "F5 = từ đầu.",
      "Shift+F5 = từ slide hiện tại.",
      "Esc thoát trình chiếu.",
    ],
    mistakes: [
      "Dùng quá nhiều hiệu ứng làm bài trình bày rối.",
      "Animation và Transition là hai nhóm khác nhau.",
    ],
    checks: [
      "F5 khác Shift+F5 ở điểm nào?",
      "Animation dùng cho đối tượng hay slide?",
      "Transition xuất hiện khi nào?",
    ],
  },
];

function enrichTopic(topic) {
  const heading = `${topic.id.toUpperCase()} - ${topic.title}`;
  return {
    id: topic.id,
    groupId: topic.groupId,
    title: topic.title,
    anchor: slugify(heading),
    summary: topic.summary,
    sourceActivityIds: sourceIds(topic.questionIds),
    questionIds: topic.questionIds,
    tips: topic.tips,
  };
}

function validateTopics(topics) {
  const seen = new Map();
  for (const topic of topics) {
    if (!topic.questionIds.length) throw new Error(`${topic.id} has no questions`);
    for (const id of topic.questionIds) {
      if (!allIds.has(id)) throw new Error(`Missing question id in DB: ${id}`);
      if (seen.has(id)) throw new Error(`Duplicate question id: ${id} in ${seen.get(id)} and ${topic.id}`);
      seen.set(id, topic.id);
    }
  }

  const missing = db.questions.map((q) => String(q.id)).filter((id) => !seen.has(id));
  if (missing.length) throw new Error(`Unassigned questions: ${missing.join(", ")}`);
  if (seen.size !== db.questions.length) throw new Error(`Assigned ${seen.size}, expected ${db.questions.length}`);
}

function renderList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function renderTopic(topic) {
  return [
    `### ${topic.id.toUpperCase()} - ${topic.title}`,
    "",
    `Mục tiêu: ${topic.goal}`,
    "",
    `Giải thích đơn giản: ${topic.explain}`,
    "",
    "Ý cần nhớ:",
    "",
    renderList(topic.remember),
    "",
    "Ví dụ dễ nhớ:",
    "",
    topic.example,
    "",
    "Mẹo thi:",
    "",
    renderList(topic.tips),
    "",
    "Hay nhầm:",
    "",
    renderList(topic.mistakes),
    "",
    "Tự kiểm tra:",
    "",
    renderList(topic.checks),
    "",
  ].join("\n");
}

function renderMarkdown() {
  const groupById = new Map(topicGroups.map((group) => [group.id, group]));
  const topicsByGroup = new Map();
  for (const topic of topicDefs) {
    if (!groupById.has(topic.groupId)) throw new Error(`Unknown group ${topic.groupId}`);
    if (!topicsByGroup.has(topic.groupId)) topicsByGroup.set(topic.groupId, []);
    topicsByGroup.get(topic.groupId).push(topic);
  }

  const lines = [
    "# Lý thuyết Tin học theo chủ đề",
    "",
    "Tài liệu này dùng để học nền tảng trước khi luyện đề. Cách học tốt nhất là đọc một chủ đề nhỏ, tự nói lại bằng lời của mình, rồi làm ngay phần câu hỏi liên quan.",
    "",
    "Cách học đề xuất:",
    "",
    "1. Chọn một nhóm chủ đề đang yếu.",
    "2. Đọc phần giải thích đơn giản trước, chưa cần học thuộc từng dòng.",
    "3. Ghi lại mẹo ngắn cho câu hay sai.",
    "4. Bấm nút luyện câu ngay dưới tiêu đề chủ đề để kiểm tra lại.",
    "",
    "Bảng nhớ nhanh:",
    "",
    "| Việc cần học | Cách học nhanh |",
    "| --- | --- |",
    "| Khái niệm | Tự giải thích bằng một câu ngắn |",
    "| Phím tắt | Bấm thử một lần nếu có máy |",
    "| Nút lệnh | Nhớ nó tác động lên tệp, chữ, đoạn, bảng hay slide |",
    "| Công thức | Đọc từ dấu `=` và kiểm tra từng tham chiếu |",
    "",
  ];

  for (const group of topicGroups) {
    lines.push(`## ${group.title}`, "", group.summary, "");
    for (const topic of topicsByGroup.get(group.id) || []) {
      lines.push(renderTopic(topic));
    }
  }

  lines.push(
    "## Cách ôn sau khi đọc xong",
    "",
    "1. Làm các chủ đề có nhiều câu trước để lấy điểm nền.",
    "2. Với câu sai, ghi theo mẫu: từ khóa trong câu -> đáp án đúng -> mẹo nhớ.",
    "3. Với Word, Excel, PowerPoint, ưu tiên phím tắt, tên tab, tác dụng nút và thao tác quen tay.",
    "4. Với Internet và Công dân số, ưu tiên tình huống an toàn, email, trình duyệt, giao dịch trực tuyến.",
    "",
    "Mẫu ghi lỗi:",
    "",
    "```text",
    "Alt+Tab -> chuyển cửa sổ -> Tab là chuyển qua lại.",
    "Ctrl+H trong Word -> Replace -> H nhớ là hộp Find and Replace.",
    "SUM -> tính tổng -> đừng nhầm với AVERAGE là trung bình.",
    "```",
    ""
  );

  return lines.join("\n");
}

const topics = topicDefs.map(enrichTopic);
validateTopics(topics);

const fullTheoryMap = {
  schemaVersion: 2,
  title: "Lý thuyết Tin học theo chủ đề",
  description: "Bản đồ chủ đề dùng để nối lý thuyết với ngân hàng câu hỏi.",
  coverage: {
    questionTotal: db.questions.length,
    assignedTotal: topics.reduce((sum, topic) => sum + topic.questionIds.length, 0),
    uniqueAssignedTotal: new Set(topics.flatMap((topic) => topic.questionIds)).size,
    assignmentPolicy: "one-primary-topic-per-question",
  },
  topicGroups,
  topics,
};

fs.writeFileSync(MAP_PATH, `${JSON.stringify(fullTheoryMap, null, 2)}\n`, "utf8");
fs.writeFileSync(MD_PATH, renderMarkdown(), "utf8");

console.log(`Wrote ${path.relative(ROOT, MAP_PATH)} with ${topics.length} topics`);
console.log(`Wrote ${path.relative(ROOT, MD_PATH)}`);
