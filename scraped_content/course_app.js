(function () {
  const state = {
    siteDb: null,
    questionDb: null,
    theoryMap: null,
    activeActivityId: null,
    activeUrl: null,
  };

  const studyDays = [
    { day: 1, title: "Máy tính và thành phần", brief: "Phần cứng, phần mềm, CPU, RAM, thiết bị vào/ra.", activities: ["module-587"] },
    { day: 2, title: "Hệ điều hành và mạng", brief: "Hệ điều hành, driver, LAN, WAN, Internet, tốc độ truyền.", activities: ["module-587"] },
    { day: 3, title: "Windows và quản lý tệp", brief: "Tệp, thư mục, shortcut, Recycle Bin, phím tắt.", activities: ["module-580"] },
    { day: 4, title: "Internet và email", brief: "WWW, URL, trình duyệt, tìm kiếm, email, an toàn.", activities: ["module-581"] },
    { day: 5, title: "Word cơ bản", brief: "Giao diện, tệp, lưu, tìm kiếm, thay thế.", activities: ["module-577"] },
    { day: 6, title: "Word định dạng", brief: "Font, paragraph, bảng, trang in, header/footer.", activities: ["module-577"] },
    { day: 7, title: "PowerPoint", brief: "Slide, layout, theme, Slide Master, chèn đối tượng.", activities: ["module-579"] },
    { day: 8, title: "Excel cấu trúc", brief: "Workbook, worksheet, cell, range, địa chỉ, công thức.", activities: ["module-578"] },
    { day: 9, title: "Excel hàm và lỗi", brief: "SUM, IF, COUNTIF, SUMIF, lỗi công thức, Sort/Filter.", activities: ["module-578"] },
    { day: 10, title: "Mô phỏng thi 80 câu", brief: "Tổng ôn chủ đề, luyện tốc độ và phân loại câu sai.", activities: ["module-587", "module-580", "module-581", "module-577", "module-578", "module-579"] },
  ];

  const topics = [
    {
      title: "Tin học căn bản",
      text: "Phần cứng, phần mềm, bộ nhớ, mạng máy tính.",
      image: "pages/assets/Chuong_1_-_Thong_tin_va_bieu_dien_thong_tin_Trang/blobid0.png",
      activityId: "module-587",
    },
    {
      title: "Windows",
      text: "Cửa sổ, tệp, thư mục, shortcut, bảng điều khiển.",
      image: "pages/assets/Lam_viec_voi_may_tinh_Trang/image.png",
      activityId: "module-580",
    },
    {
      title: "Internet",
      text: "Trình duyệt, URL, tìm kiếm, email và bảo mật.",
      image: "pages/assets/Su_dung_Internet_Trang/image_(1).png",
      activityId: "module-581",
    },
    {
      title: "Word",
      text: "Soạn thảo, định dạng, bảng, hình, trang in.",
      image: "pages/assets/Tong_quan_ve_MS_Word_Trang/image_(4).png",
      activityId: "module-577",
    },
    {
      title: "Excel",
      text: "Bảng tính, địa chỉ ô, công thức, hàm và lỗi.",
      image: "pages/assets/Tong_quan_ve_Excel_2019_Trang/image_(8).png",
      activityId: "module-578",
    },
    {
      title: "PowerPoint",
      text: "Slide, layout, theme, đối tượng và trình chiếu.",
      image: "pages/assets/Tong_quan_giao_dien_PowerPoint_Trang/image.png",
      activityId: "module-579",
    },
  ];

  function $(selector) {
    return document.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function activityLabel(activity) {
    if (!activity) return "Mục";
    if ((activity.tags || []).includes("quiz") || activity.type === "quiz") return "Đề";
    return "Bài";
  }

  function isRenderableActivity(activity) {
    if (!activity) return false;
    if (activity.localPath && activity.availableLocal) return true;
    if (activity.type === "quiz" || (activity.tags || []).includes("quiz")) return true;
    return false;
  }

  function cleanTitle(value) {
    return String(value ?? "")
      .replace(/\s*Trang\s*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function activitiesObject() {
    return (state.siteDb && state.siteDb.activities) || {};
  }

  function getActivity(id) {
    return activitiesObject()[id] || null;
  }

  function getQuestionCount(activityId) {
    const sources = (state.questionDb && state.questionDb.sources) || [];
    const source = sources.find((item) => String(item.activityId) === String(activityId));
    return source ? Number(source.questionCount || 0) : 0;
  }

  function getTheoryDay(dayNumber) {
    const days = (state.theoryMap && state.theoryMap.days) || [];
    return days.find((item) => Number(item.day) === Number(dayNumber)) || null;
  }

  function getDayQuestionIds(day) {
    if (!day || !Array.isArray(day.questionIds)) return [];
    return day.questionIds.map((id) => String(id).trim()).filter(Boolean);
  }

  function buildQuestionSetUrl(questionIds, title) {
    const params = new URLSearchParams();
    params.set("questionIds", questionIds.join(","));
    params.set("mode", "practice");
    params.set("title", title);
    return "../quiz.html?" + params.toString();
  }

  function setTopbar(title, subtitle) {
    $("#viewTitle").textContent = title;
    $("#viewSubtitle").textContent = subtitle || "";
  }

  function setActiveButton(activityId) {
    document.querySelectorAll(".activity-link").forEach((button) => {
      button.classList.toggle("active", button.dataset.activityId === String(activityId));
    });
  }

  function showDashboard() {
    state.activeActivityId = null;
    state.activeUrl = null;
    $("#dashboard").style.display = "grid";
    $("#viewer").classList.remove("active");
    $("#openExternal").style.display = "none";
    setTopbar("Tổng quan ôn tập", "Lộ trình 10 ngày, tài liệu cấp tốc và ngân hàng luyện chủ đề");
    setActiveButton("");
  }

  function openFrame(url, title, subtitle, activityId) {
    state.activeActivityId = activityId || null;
    state.activeUrl = url;
    $("#dashboard").style.display = "none";
    $("#viewer").classList.add("active");
    $("#contentFrame").src = url;
    $("#openExternal").href = url;
    $("#openExternal").style.display = "inline-flex";
    setTopbar(title, subtitle);
    setActiveButton(activityId || "");
  }

  function openStudyGuide(fragment) {
    const suffix = fragment ? "#" + encodeURIComponent(fragment) : "";
    openFrame("study_guide.html" + suffix, "Tài liệu ôn tập", "Bản 10 ngày lý thuyết và 3 ngày cấp tốc", null);
  }

  function openQuiz(activityId, mode) {
    const params = activityId ? "?activityId=" + encodeURIComponent(activityId) + "&mode=" + encodeURIComponent(mode || "practice") : "";
    const title = activityId ? "Luyện trắc nghiệm theo chủ đề" : "Đề tổng hợp 100 câu";
    const activity = activityId ? getActivity(activityId) : null;
    const subtitle = activity ? cleanTitle(activity.sectionName || activity.name) : "Dùng để luyện tốc độ sau khi đã học chủ đề";
    openFrame("../quiz.html" + params, title, subtitle, activityId || null);
  }

  function openTheoryQuiz(dayNumber) {
    const day = getTheoryDay(dayNumber);
    const questionIds = getDayQuestionIds(day);
    if (!day || questionIds.length === 0) {
      setTopbar("Chưa có câu hỏi liên kết", "Ngày này chưa được nối với ngân hàng đề");
      return;
    }

    const title = "Ngày " + day.day + ": " + day.title;
    openFrame(
      buildQuestionSetUrl(questionIds, title),
      "Luyện câu liên quan",
      title + " · " + questionIds.length + " câu",
      null
    );
  }

  function openActivity(activityId) {
    const activity = getActivity(activityId);
    if (!activity) return;

    if (activity.type === "quiz" || (activity.tags || []).includes("quiz")) {
      openFrame("../trac_nghiem_index.html", cleanTitle(activity.name), "Danh sách luyện trắc nghiệm offline", activity.id);
      return;
    }

    if (activity.localPath && activity.availableLocal) {
      openFrame(activity.localPath, cleanTitle(activity.name), cleanTitle(activity.sectionName), activity.id);
      return;
    }

    setTopbar("Chưa có bản offline", cleanTitle(activity.name));
  }

  function renderStats() {
    const activities = Object.values(activitiesObject());
    const pageCount = activities.filter((item) => item.type === "page" && item.availableLocal).length;
    const questionCount = ((state.questionDb && state.questionDb.questions) || []).length;
    const quizSourceCount = ((state.questionDb && state.questionDb.sources) || []).length;

    return [
      { value: String(pageCount), label: "bài và trang offline" },
      { value: String(questionCount), label: "câu hỏi theo chủ đề" },
      { value: "10", label: "ngày luyện lý thuyết" },
      { value: String(quizSourceCount), label: "nguồn trắc nghiệm đã parse" },
    ].map((item) => (
      '<div class="stat-card">' +
        '<div class="stat-value">' + escapeHtml(item.value) + '</div>' +
        '<div class="stat-label">' + escapeHtml(item.label) + '</div>' +
      '</div>'
    )).join("");
  }

  function renderDayCards() {
    return studyDays.map((item) => {
      const linkedDay = getTheoryDay(item.day);
      const title = linkedDay ? linkedDay.title : item.title;
      const brief = linkedDay ? linkedDay.summary : item.brief;
      const count = getDayQuestionIds(linkedDay).length;
      return (
        '<article class="day-card">' +
          '<div class="day-card-head">' +
            '<span class="day-number">' + item.day + '</span>' +
            '<span class="day-meta">' + (count ? escapeHtml(String(count) + " câu liên quan") : "Chưa nối câu hỏi") + '</span>' +
          '</div>' +
          '<h3>' + escapeHtml(title) + '</h3>' +
          '<p>' + escapeHtml(brief) + '</p>' +
          '<div class="day-actions">' +
            '<button class="text-link" type="button" data-day-guide="' + item.day + '">Mở lý thuyết</button>' +
            '<button class="text-link" type="button" data-day-quiz="' + item.day + '"' + (count ? "" : " disabled") + '>Luyện câu liên quan</button>' +
          '</div>' +
        '</article>'
      );
    }).join("");
  }

  function renderTopicCards() {
    return topics.map((item) => {
      const count = getQuestionCount(item.activityId);
      return (
        '<article class="topic-card">' +
          '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
          '<div class="topic-body">' +
            '<h3>' + escapeHtml(item.title) + '</h3>' +
            '<p>' + escapeHtml(item.text) + '</p>' +
            '<div class="link-row">' +
              '<button class="text-link" type="button" data-open-activity="' + escapeHtml(item.activityId) + '">Mở bài</button>' +
              '<button class="text-link" type="button" data-practice="' + escapeHtml(item.activityId) + '">Luyện ' + count + ' câu</button>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join("");
  }

  function renderDashboard() {
    $("#dashboard").innerHTML =
      '<section class="focus-band">' +
        '<div class="focus-copy">' +
          '<h2>Ôn Tin học theo chủ đề, không học vẹt câu hỏi</h2>' +
          '<p>Website gom bài giảng offline, tài liệu 10 ngày lý thuyết, kế hoạch 3 ngày cấp tốc và khu luyện trắc nghiệm. Ngân hàng câu hỏi dùng để nhận diện chủ đề, vì đề thi 80 câu có thể rất ít câu trùng nguyên văn.</p>' +
          '<div class="focus-actions">' +
            '<button class="action-button primary" type="button" data-open-guide>Mở tài liệu 10 ngày</button>' +
            '<button class="action-button" type="button" data-open-quiz>Làm đề tổng hợp</button>' +
          '</div>' +
        '</div>' +
        '<div class="focus-media">' +
          '<img src="pages/assets/Tong_quan_ve_Excel_2019_Trang/image_(8).png" alt="Giao diện Excel trong bài giảng">' +
        '</div>' +
      '</section>' +
      '<section class="stats-grid">' + renderStats() + '</section>' +
      '<section class="panel" style="padding:16px">' +
        '<div class="section-heading">' +
          '<div><h2>Lịch luyện lý thuyết 10 ngày</h2><p>Mỗi ngày học từ khóa, làm thao tác ngắn và luyện đúng nguồn câu hỏi.</p></div>' +
        '</div>' +
        '<div class="day-grid">' + renderDayCards() + '</div>' +
      '</section>' +
      '<section class="panel" style="padding:16px">' +
        '<div class="section-heading">' +
          '<div><h2>Chủ đề trọng tâm</h2><p>Mở bài gốc hoặc luyện ngay nguồn câu hỏi tương ứng.</p></div>' +
        '</div>' +
        '<div class="topic-grid">' + renderTopicCards() + '</div>' +
      '</section>';

    $("#dashboard").querySelector("[data-open-guide]").addEventListener("click", () => openStudyGuide("lich-luyen-ly-thuyet-10-ngay"));
    $("#dashboard").querySelector("[data-open-quiz]").addEventListener("click", () => openQuiz());
    $("#dashboard").querySelectorAll("[data-day-guide]").forEach((button) => {
      button.addEventListener("click", () => openStudyGuide("ngay-ly-thuyet-" + button.dataset.dayGuide));
    });
    $("#dashboard").querySelectorAll("[data-day-quiz]").forEach((button) => {
      button.addEventListener("click", () => openTheoryQuiz(button.dataset.dayQuiz));
    });
    $("#dashboard").querySelectorAll("[data-open-activity]").forEach((button) => {
      button.addEventListener("click", () => openActivity(button.dataset.openActivity));
    });
    $("#dashboard").querySelectorAll("[data-practice]").forEach((button) => {
      button.addEventListener("click", () => openQuiz(button.dataset.practice, "practice"));
    });
  }

  function renderNav(filterValue) {
    const query = normalizeText(filterValue);
    const sections = (state.siteDb && state.siteDb.sections) || [];
    const activities = activitiesObject();
    const html = [];

    for (const section of sections) {
      const sectionActivities = (section.activityIds || [])
        .map((id) => activities[id])
        .filter(Boolean)
        .filter(isRenderableActivity)
        .filter((activity) => {
          if (!query) return true;
          const text = normalizeText([activity.name, activity.sectionName, activity.type].join(" "));
          return text.includes(query);
        });

      if (query && sectionActivities.length === 0) continue;

      const sectionId = "nav-" + String(section.id || "").replace(/[^a-zA-Z0-9_-]/g, "-");
      const openClass = query || html.length < 3 ? " open" : "";
      html.push(
        '<section class="section' + openClass + '">' +
          '<button class="section-header" type="button" data-section-toggle="' + escapeHtml(sectionId) + '">' +
            '<span class="section-title">' + escapeHtml(cleanTitle(section.name)) + '</span>' +
            '<span class="section-count">' + sectionActivities.length + '</span>' +
          '</button>' +
          '<div class="activity-list" id="' + escapeHtml(sectionId) + '">' +
            sectionActivities.map((activity) => (
              '<button class="activity-link" type="button" data-activity-id="' + escapeHtml(activity.id) + '">' +
                '<span class="activity-badge">' + escapeHtml(activityLabel(activity)) + '</span>' +
                '<span class="activity-title">' + escapeHtml(cleanTitle(activity.name)) + '</span>' +
              '</button>'
            )).join("") +
          '</div>' +
        '</section>'
      );
    }

    $("#navContainer").innerHTML = html.length ? html.join("") : '<div class="empty-state">Không tìm thấy bài phù hợp.</div>';

    $("#navContainer").querySelectorAll("[data-section-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        button.closest(".section").classList.toggle("open");
      });
    });

    $("#navContainer").querySelectorAll("[data-activity-id]").forEach((button) => {
      button.addEventListener("click", () => openActivity(button.dataset.activityId));
    });

    if (state.activeActivityId) setActiveButton(state.activeActivityId);
  }

  async function loadJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(url + " (" + response.status + ")");
    return response.json();
  }

  async function init() {
    $("#homeButton").addEventListener("click", showDashboard);
    $("#guideButton").addEventListener("click", () => openStudyGuide("lich-luyen-ly-thuyet-10-ngay"));
    $("#quizButton").addEventListener("click", () => openQuiz());
    $("#searchInput").addEventListener("input", (event) => renderNav(event.target.value));

    try {
      const [siteDb, questionDb, theoryMap] = await Promise.all([
        loadJson("db/site_db.json"),
        loadJson("db/trac_nghiem_questions.json"),
        loadJson("db/theory_question_map.json"),
      ]);

      state.siteDb = siteDb;
      state.questionDb = questionDb;
      state.theoryMap = theoryMap;
      renderNav("");
      renderDashboard();
      showDashboard();
    } catch (error) {
      $("#dashboard").innerHTML = '<div class="error-state">Không tải được dữ liệu website: ' + escapeHtml(error.message || error) + '. Hãy mở bằng server tĩnh, ví dụ <code>python3 -m http.server</code>.</div>';
      setTopbar("Không tải được dữ liệu", "Kiểm tra lại đường dẫn JSON hoặc cách mở website");
    }
  }

  window.addEventListener("DOMContentLoaded", init);
}());
