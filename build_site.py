import json
import os
import re
import unicodedata
from pathlib import Path

# Config
CONTENT_DIR = Path("scraped_content")
STRUCTURE_FILE = CONTENT_DIR / "course_structure_scraped.json"
OUTPUT_HTML = CONTENT_DIR / "index.html"
PAGES_DIR = CONTENT_DIR / "pages"
RESOURCES_DIR = CONTENT_DIR / "resources"

def slugify(value):
    """
    Same slugify logic as scraper to ensure matching filenames
    """
    value = str(value)
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[\\/*?:"<>|]', '', value)
    value = value.strip()
    value = re.sub(r'\s+', '_', value)
    return value

def generate_html(structure):
    """
    Generates the main index.html with sidebar and iframe
    """
    template = '''<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tin học UTT - Ôn theo chủ đề</title>
  <script src="theme.js"></script>
  <link rel="stylesheet" href="course_app.css">
</head>
<body>
  <div class="app-shell">
    <aside class="side-panel">
      <header class="brand">
        <div class="brand-copy">
          <div class="brand-mark">UTT</div>
          <h1>Tin học UTT</h1>
          <p>Ôn lý thuyết và luyện trắc nghiệm theo chủ đề.</p>
        </div>
        <button class="menu-toggle" id="menuToggle" type="button" aria-expanded="false">Chủ đề</button>
      </header>

      <div class="quick-actions">
        <button class="action-button primary" id="homeButton" type="button">Tổng quan</button>
        <button class="action-button" id="fullTheoryButton" type="button">Lý thuyết</button>
        <button class="action-button" id="quizButton" type="button">Luyện đề</button>
      </div>

      <div class="search-box">
        <label for="searchInput">Tìm chủ đề</label>
        <input id="searchInput" type="search" placeholder="Phím tắt, email, Excel...">
      </div>

      <nav class="nav-scroll" id="navContainer" aria-label="Danh sách chủ đề"></nav>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div class="crumb">
          <strong id="viewTitle">Tổng quan ôn tập</strong>
          <span id="viewSubtitle">Đang tải dữ liệu...</span>
        </div>
        <div class="topbar-actions">
          <button class="action-button theme-button" id="themeButton" type="button" aria-pressed="false">Giao diện tối</button>
          <a class="action-button" id="openExternal" href="#" target="_blank" rel="noopener" style="display:none">Mở tab mới</a>
        </div>
      </header>

      <section class="main-area">
        <div class="dashboard" id="dashboard"></div>
        <div class="viewer" id="viewer">
          <iframe class="viewer-frame" id="contentFrame" title="Nội dung bài học"></iframe>
        </div>
      </section>
    </main>
  </div>

  <script src="course_app.js"></script>
</body>
</html>
'''

    OUTPUT_HTML.write_text(template, encoding='utf-8')
    print(f"✓ Website generated at: {OUTPUT_HTML}")
    return
    
    # Generate Sidebar Content
    sidebar_html = ""
    for i, section in enumerate(structure):
        section_id = f"section-{i}"
        sidebar_html += f'''
        <div class="section-item">
            <div class="section-header" onclick="toggleSection('{section_id}')">
                <span class="icon">📂</span> {section['name']}
                <span class="chevron">▼</span>
            </div>
            <div class="section-content" id="{section_id}">
        '''

        rendered_any = False
        for activity in section.get('activities', []):
            safe_name = slugify(activity['name'])
            
            # Determine link
            link = "#"
            icon = "📄"
            type_class = activity['type']
            
            if activity['type'] == 'page':
                # Check formatting
                fname = f"{safe_name}.html"
                if not (PAGES_DIR / fname).exists():
                    fname = f"page_{activity['id']}.html" # Fallback
                link = f"pages/{fname}"
                icon = "📝"
                rendered_any = True
            elif activity['type'] == 'resource':
                # Try to find the file in resources
                # This is tricky without exact extension, so we might need a search or just guess
                # For now let's point to resources dir or try to find it
                link = f"resources/" # Placeholder, JS can try to resolve? 
                # Better: List files in resources and find match?
                # For static site, we might just put a "Download" placeholder or try best guess
                
                # Try to find file starting with safe_name
                found = False
                if RESOURCES_DIR.exists():
                    for f in os.listdir(RESOURCES_DIR):
                        if f.startswith(safe_name):
                            link = f"resources/{f}"
                            found = True
                            break
                if not found:
                    link = f"resources/resource_{activity['id']}" # Fallback guess
                
                icon = "💾"
                rendered_any = True
            elif activity['type'] == 'url':
                link = activity['url']
                icon = "🔗"
                rendered_any = True
            elif activity['type'] == 'quiz':
                # Moodle quiz activities are skipped in offline scrape, but we provide
                # an offline practice UI via trac_nghiem_index.html at repo root.
                link = "../trac_nghiem_index.html"
                icon = "❓"
                rendered_any = True
            else:
                continue # Skip others for now?

            sidebar_html += f'''
                <a href="{link}" class="activity-link {type_class}" target="content-frame" onclick="setActive(this)">
                    <span class="activity-icon">{icon}</span>
                    <span class="activity-name">{activity['name']}</span>
                </a>
            '''

        # If a section ends up empty (e.g. only skipped activity types), provide a
        # shortcut to the offline quiz list when it's clearly a quiz section.
        if not rendered_any and 'trắc nghiệm' in section.get('name', '').lower():
            sidebar_html += '''
                <a href="../trac_nghiem_index.html" class="activity-link quiz" target="content-frame" onclick="setActive(this)">
                    <span class="activity-icon">❓</span>
                    <span class="activity-name">Danh sách trắc nghiệm (offline)</span>
                </a>
            '''
            
        sidebar_html += '''
            </div>
        </div>
        '''

    # Full HTML Template
    template = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Course Viewer - UTT Elearning</title>
    <style>
        :root {{
            --primary: #2563eb;
            --bg-dark: #0f172a;
            --sidebar-bg: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border: #334155;
            --hover: #334155;
            --active: #2563eb;
        }}
        
        * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', system-ui, sans-serif; }}
        
        body {{
            display: flex;
            height: 100vh;
            background-color: var(--bg-dark);
            color: var(--text-main);
            overflow: hidden;
        }}
        
        /* Sidebar */
        .sidebar {{
            width: 300px;
            background-color: var(--sidebar-bg);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            transition: transform 0.3s;
        }}
        
        .sidebar-header {{
            padding: 20px;
            border-bottom: 1px solid var(--border);
            background: rgba(0,0,0,0.2);
        }}
        
        .sidebar-header h2 {{ font-size: 1.2rem; font-weight: 600; color: #fff; }}
        .sidebar-header p {{ font-size: 0.8rem; color: var(--text-muted); margin-top: 5px; }}
        
        .nav-container {{
            flex: 1;
            overflow-y: auto;
            padding: 10px 0;
        }}
        
        .nav-container::-webkit-scrollbar {{ width: 6px; }}
        .nav-container::-webkit-scrollbar-thumb {{ background: #475569; border-radius: 3px; }}
        
        /* Section Items */
        .section-item {{ border-bottom: 1px solid rgba(255,255,255,0.05); }}
        
        .section-header {{
            padding: 12px 15px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: var(--text-main);
            transition: background 0.2s;
            font-size: 0.95rem;
        }}
        
        .section-header:hover {{ background-color: var(--hover); }}
        .section-header .icon {{ margin-right: 10px; opacity: 0.7; }}
        .section-header .chevron {{ font-size: 0.7rem; transition: transform 0.2s; }}
        
        .section-content {{
            display: none;
            background-color: rgba(0,0,0,0.2);
        }}
        
        .section-content.open {{ display: block; }}
        .section-content.open .chevron {{ transform: rotate(180deg); }}
        
        /* Activity Links */
        .activity-link {{
            display: flex;
            align-items: center;
            padding: 10px 15px 10px 35px;
            color: var(--text-muted);
            text-decoration: none;
            border-left: 3px solid transparent;
            font-size: 0.9rem;
            transition: all 0.2s;
        }}
        
        .activity-link:hover {{
            background-color: rgba(255,255,255,0.05);
            color: #fff;
        }}
        
        .activity-link.active {{
            background-color: rgba(37, 99, 235, 0.1);
            color: #60a5fa;
            border-left-color: var(--primary);
        }}
        
        .activity-icon {{ margin-right: 10px; font-size: 1.1em; }}
        
        /* Main Content */
        .main-content {{
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #fff; /* Pages are usually white */
        }}
        
        #content-frame {{
            flex: 1;
            border: none;
            width: 100%;
            height: 100%;
        }}
        
        .welcome-screen {{
            position: absolute;
            top: 0; left: 300px; right: 0; bottom: 0;
            background: var(--bg-dark);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            z-index: 10;
        }}
        
        .welcome-screen h1 {{ font-size: 2.5rem; margin-bottom: 20px; background: linear-gradient(to right, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        .welcome-screen p {{ color: var(--text-muted); font-size: 1.1rem; }}
        
    </style>
</head>
<body>

    <aside class="sidebar">
        <div class="sidebar-header">
            <h2>Tin học K76</h2>
            <p>Offline Course Viewer</p>
        </div>
        <div class="nav-container">
            {sidebar_html}
        </div>
    </aside>

    <main class="main-content">
        <div id="welcome" class="welcome-screen">
            <h1>Welcome Back</h1>
            <p>Select a lesson from the sidebar to start learning.</p>
        </div>
        <iframe name="content-frame" id="content-frame" onload="hideWelcome()"></iframe>
    </main>

    <script>
        function toggleSection(id) {{
            const el = document.getElementById(id);
            el.classList.toggle('open');
            // Toggle chevron logic handled by CSS via class .open parent
        }}

        function setActive(el) {{
            document.querySelectorAll('.activity-link').forEach(a => a.classList.remove('active'));
            el.classList.add('active');
            hideWelcome();
        }}
        
        function hideWelcome() {{
            document.getElementById('welcome').style.display = 'none';
        }}
        
        // Open first section by default
        document.querySelector('.section-content').classList.add('open');
    </script>
</body>
</html>
    '''
    
    with open(OUTPUT_HTML, 'w', encoding='utf-8') as f:
        f.write(template)
    
    print(f"✓ Website generated at: {OUTPUT_HTML}")


def main():
    print("Building static site...")
    if not STRUCTURE_FILE.exists():
        print(f"Error: Structure file not found at {STRUCTURE_FILE}")
        return
        
    with open(STRUCTURE_FILE, 'r', encoding='utf-8') as f:
        structure = json.load(f)
        
    generate_html(structure)

if __name__ == "__main__":
    main()
