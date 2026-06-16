(function () {
  const state = {
    questionDb: null,
    fullTheoryMap: null,
    theme: "light",
    activeGroupId: "all",
    activeTopicId: null,
    activeUrl: null,
  };

  const THEME_KEY = "tinHocUttTheme";

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
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function getStoredTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch (error) {
      // ignore localStorage errors
    }

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  function applyThemeToFrame() {
    const frame = $("#contentFrame");
    if (!frame) return;

    try {
      const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
      if (doc && doc.documentElement) doc.documentElement.dataset.theme = state.theme;
    } catch (error) {
      // ignore frame access errors
    }
  }

  function updateThemeButton() {
    const button = $("#themeButton");
    if (!button) return;

    const isDark = state.theme === "dark";
    button.textContent = isDark ? "Giao diện sáng" : "Giao diện tối";
    button.setAttribute("aria-pressed", isDark ? "true" : "false");
  }

  function applyTheme(theme, shouldPersist) {
    state.theme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = state.theme;
    updateThemeButton();
    applyThemeToFrame();

    if (shouldPersist) {
      try {
        localStorage.setItem(THEME_KEY, state.theme);
      } catch (error) {
        // ignore localStorage errors
      }
    }
  }

  function toggleTheme() {
    applyTheme(state.theme === "dark" ? "light" : "dark", true);
  }

  function topicGroups() {
    return (state.fullTheoryMap && state.fullTheoryMap.topicGroups) || [];
  }

  function topics() {
    return (state.fullTheoryMap && state.fullTheoryMap.topics) || [];
  }

  function getGroup(groupId) {
    return topicGroups().find((group) => String(group.id) === String(groupId)) || null;
  }

  function getTopic(topicId) {
    return topics().find((topic) => String(topic.id) === String(topicId)) || null;
  }

  function topicQuestionIds(topic) {
    if (!topic || !Array.isArray(topic.questionIds)) return [];
    return topic.questionIds.map((id) => String(id).trim()).filter(Boolean);
  }

  function groupQuestionCount(groupId) {
    return topics()
      .filter((topic) => String(topic.groupId) === String(groupId))
      .reduce((sum, topic) => sum + topicQuestionIds(topic).length, 0);
  }

  function setTopbar(title, subtitle) {
    $("#viewTitle").textContent = title;
    $("#viewSubtitle").textContent = subtitle || "";
  }

  function setActiveTopic(topicId) {
    document.querySelectorAll("[data-topic-id]").forEach((button) => {
      button.classList.toggle("active", String(button.dataset.topicId) === String(topicId));
    });
  }

  function closeMobileNav() {
    const panel = $(".side-panel");
    const toggle = $("#menuToggle");
    if (panel) panel.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function toggleMobileNav() {
    const panel = $(".side-panel");
    const toggle = $("#menuToggle");
    if (!panel || !toggle) return;

    const next = !panel.classList.contains("nav-open");
    panel.classList.toggle("nav-open", next);
    toggle.setAttribute("aria-expanded", next ? "true" : "false");
  }

  function buildQuestionSetUrl(questionIds, title) {
    const params = new URLSearchParams();
    params.set("questionIds", questionIds.join(","));
    params.set("mode", "practice");
    params.set("title", title);
    return "../quiz.html?" + params.toString();
  }

  function openFrame(url, title, subtitle, topicId) {
    state.activeTopicId = topicId || null;
    state.activeUrl = url;
    $("#dashboard").style.display = "none";
    $("#viewer").classList.add("active");
    $("#contentFrame").src = url;
    $("#openExternal").href = url;
    $("#openExternal").style.display = "inline-flex";
    setTopbar(title, subtitle);
    setActiveTopic(topicId || "");
    closeMobileNav();
  }

  function showDashboard() {
    state.activeTopicId = null;
    state.activeUrl = null;
    $("#dashboard").style.display = "grid";
    $("#viewer").classList.remove("active");
    $("#openExternal").style.display = "none";
    setTopbar("Tổng quan theo chủ đề", "Chọn chủ đề để học lý thuyết ngắn và luyện ngay câu liên quan");
    setActiveTopic("");
    closeMobileNav();
  }

  function openFullTheory(fragment) {
    const suffix = fragment ? "#" + encodeURIComponent(fragment) : "";
    openFrame("full_theory.html" + suffix, "Lý thuyết theo chủ đề", "Đọc toàn bộ hệ thống lý thuyết", null);
  }

  function openTopic(topicId) {
    const topic = getTopic(topicId);
    if (!topic) return;

    const group = getGroup(topic.groupId);
    const count = topicQuestionIds(topic).length;
    openFrame(
      "full_theory.html#" + encodeURIComponent(topic.anchor),
      "Lý thuyết: " + topic.title,
      (group ? group.title + " · " : "") + count + " câu liên quan",
      topic.id
    );
  }

  function openTopicQuiz(topicId) {
    const topic = getTopic(topicId);
    if (!topic) return;

    const ids = topicQuestionIds(topic);
    if (!ids.length) return;

    openFrame(
      buildQuestionSetUrl(ids, topic.id.toUpperCase() + ": " + topic.title),
      "Luyện câu liên quan",
      topic.title + " · " + ids.length + " câu",
      topic.id
    );
  }

  function openQuiz() {
    openFrame("../quiz.html", "Đề tổng hợp 100 câu", "Luyện tốc độ sau khi đã học các chủ đề", null);
  }

  function setActiveGroup(groupId) {
    state.activeGroupId = groupId || "all";
    renderDashboard();
  }

  function filteredTopics() {
    const currentTopics = topics();
    if (state.activeGroupId === "all") return currentTopics;
    return currentTopics.filter((topic) => String(topic.groupId) === String(state.activeGroupId));
  }

  function renderStats() {
    const coverage = (state.fullTheoryMap && state.fullTheoryMap.coverage) || {};
    const assigned = Number(coverage.uniqueAssignedTotal || coverage.assignedTotal || 0);
    const total = Number(coverage.questionTotal || ((state.questionDb && state.questionDb.questions) || []).length || 0);

    return [
      { value: String(assigned), label: "câu đã gắn chủ đề" },
      { value: String(total), label: "câu trong ngân hàng" },
      { value: String(topics().length), label: "chủ đề nhỏ" },
      { value: String(topicGroups().length), label: "nhóm học" },
    ].map((item) => (
      '<div class="stat-card">' +
        '<div class="stat-value">' + escapeHtml(item.value) + '</div>' +
        '<div class="stat-label">' + escapeHtml(item.label) + '</div>' +
      '</div>'
    )).join("");
  }

  function renderGroupFilters() {
    const allCount = topics().reduce((sum, topic) => sum + topicQuestionIds(topic).length, 0);
    const buttons = [
      '<button class="group-chip' + (state.activeGroupId === "all" ? " active" : "") + '" type="button" data-group-filter="all">Tất cả <span>' + allCount + '</span></button>'
    ];

    for (const group of topicGroups()) {
      const active = state.activeGroupId === group.id ? " active" : "";
      buttons.push(
        '<button class="group-chip' + active + '" type="button" data-group-filter="' + escapeHtml(group.id) + '">' +
          escapeHtml(group.shortTitle || group.title) +
          ' <span>' + groupQuestionCount(group.id) + '</span>' +
        '</button>'
      );
    }

    return buttons.join("");
  }

  function renderTopicCards() {
    return filteredTopics().map((topic) => {
      const group = getGroup(topic.groupId);
      const count = topicQuestionIds(topic).length;
      const tips = Array.isArray(topic.tips) ? topic.tips.slice(0, 2) : [];

      return (
        '<article class="topic-card study-topic">' +
          '<div class="topic-body">' +
            '<div class="topic-meta">' +
              '<span class="topic-chip">' + escapeHtml(group ? (group.shortTitle || group.title) : "Chủ đề") + '</span>' +
              '<span class="topic-count">' + count + ' câu</span>' +
            '</div>' +
            '<h3>' + escapeHtml(topic.title) + '</h3>' +
            '<p>' + escapeHtml(topic.summary || "") + '</p>' +
            (tips.length ? '<div class="tip-preview">' + tips.map((tip) => '<span>' + escapeHtml(tip) + '</span>').join("") + '</div>' : "") +
            '<div class="topic-actions">' +
              '<button class="action-button primary" type="button" data-study-topic="' + escapeHtml(topic.id) + '">Học</button>' +
              '<button class="action-button" type="button" data-practice-topic="' + escapeHtml(topic.id) + '">Luyện</button>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join("");
  }

  function renderDashboard() {
    const visibleTopics = filteredTopics();
    const visibleCount = visibleTopics.reduce((sum, topic) => sum + topicQuestionIds(topic).length, 0);

    $("#dashboard").innerHTML =
      '<section class="focus-band focus-band-compact">' +
        '<div class="focus-copy">' +
          '<h2>Học Tin học theo chủ đề, hiểu trước rồi luyện câu</h2>' +
          '<p>Mỗi chủ đề có phần giải thích ngắn, ví dụ dễ nhớ, mẹo thi và bộ câu liên quan. Học xong một mảng thì luyện ngay để biết mình còn hổng chỗ nào.</p>' +
          '<div class="focus-actions">' +
            '<button class="action-button primary" type="button" data-open-full-theory>Đọc toàn bộ lý thuyết</button>' +
            '<button class="action-button" type="button" data-open-quiz>Làm đề tổng hợp</button>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="stats-grid">' + renderStats() + '</section>' +
      '<section class="panel topic-overview">' +
        '<div class="section-heading">' +
          '<div><h2>Chọn chủ đề để học</h2><p>Đang hiển thị ' + visibleTopics.length + ' chủ đề với ' + visibleCount + ' câu liên quan.</p></div>' +
        '</div>' +
        '<div class="group-filter" aria-label="Lọc nhóm chủ đề">' + renderGroupFilters() + '</div>' +
        '<div class="topic-grid">' + renderTopicCards() + '</div>' +
      '</section>';

    $("#dashboard").querySelectorAll("[data-open-full-theory]").forEach((button) => {
      button.addEventListener("click", () => openFullTheory());
    });
    $("#dashboard").querySelector("[data-open-quiz]").addEventListener("click", openQuiz);
    $("#dashboard").querySelectorAll("[data-group-filter]").forEach((button) => {
      button.addEventListener("click", () => setActiveGroup(button.dataset.groupFilter));
    });
    $("#dashboard").querySelectorAll("[data-study-topic]").forEach((button) => {
      button.addEventListener("click", () => openTopic(button.dataset.studyTopic));
    });
    $("#dashboard").querySelectorAll("[data-practice-topic]").forEach((button) => {
      button.addEventListener("click", () => openTopicQuiz(button.dataset.practiceTopic));
    });
  }

  function renderNav(filterValue) {
    const query = normalizeText(filterValue);
    const html = [];

    for (const group of topicGroups()) {
      const groupTopics = topics()
        .filter((topic) => String(topic.groupId) === String(group.id))
        .filter((topic) => {
          if (!query) return true;
          const text = normalizeText([topic.title, topic.summary, group.title, ...(topic.tips || [])].join(" "));
          return text.includes(query);
        });

      if (groupTopics.length === 0) continue;

      const sectionId = "nav-" + String(group.id).replace(/[^a-zA-Z0-9_-]/g, "-");
      html.push(
        '<section class="section open">' +
          '<button class="section-header" type="button" data-section-toggle="' + escapeHtml(sectionId) + '">' +
            '<span class="section-title">' + escapeHtml(group.title) + '</span>' +
            '<span class="section-count">' + groupTopics.length + '</span>' +
          '</button>' +
          '<div class="activity-list" id="' + escapeHtml(sectionId) + '">' +
            groupTopics.map((topic) => (
              '<button class="activity-link" type="button" data-topic-id="' + escapeHtml(topic.id) + '">' +
                '<span class="activity-badge">' + escapeHtml(String(topicQuestionIds(topic).length)) + '</span>' +
                '<span class="activity-title">' + escapeHtml(topic.title) + '</span>' +
              '</button>'
            )).join("") +
          '</div>' +
        '</section>'
      );
    }

    $("#navContainer").innerHTML = html.length ? html.join("") : '<div class="empty-state">Không tìm thấy chủ đề phù hợp.</div>';

    $("#navContainer").querySelectorAll("[data-section-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        button.closest(".section").classList.toggle("open");
      });
    });
    $("#navContainer").querySelectorAll("[data-topic-id]").forEach((button) => {
      button.addEventListener("click", () => openTopic(button.dataset.topicId));
    });

    if (state.activeTopicId) setActiveTopic(state.activeTopicId);
  }

  async function loadJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(url + " (" + response.status + ")");
    return response.json();
  }

  async function init() {
    applyTheme(getStoredTheme(), false);
    $("#homeButton").addEventListener("click", showDashboard);
    $("#fullTheoryButton").addEventListener("click", () => openFullTheory());
    $("#quizButton").addEventListener("click", openQuiz);
    $("#themeButton").addEventListener("click", toggleTheme);
    $("#contentFrame").addEventListener("load", applyThemeToFrame);
    $("#searchInput").addEventListener("input", (event) => renderNav(event.target.value));
    const menuToggle = $("#menuToggle");
    if (menuToggle) menuToggle.addEventListener("click", toggleMobileNav);

    try {
      const [questionDb, fullTheoryMap] = await Promise.all([
        loadJson("db/trac_nghiem_questions.json"),
        loadJson("db/full_theory_map.json"),
      ]);

      state.questionDb = questionDb;
      state.fullTheoryMap = fullTheoryMap;
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
