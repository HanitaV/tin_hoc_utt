"""
Universal UTT Elearning Scraper
------------------------------
Features:
- Dynamic course structure parsing (no hardcoded IDs)
- Authenticated scraping using Playwright
- Concurrent processing for speed
- Skips Quizzes and Assignments as requested
- Downloads Resources (files) and Pages (HTML)
"""

import asyncio
import json
import os
import re
import random
import unicodedata
from pathlib import Path
from urllib.parse import urljoin, unquote
from playwright.async_api import async_playwright, Page

def slugify(value):
    """
    Normalizes string, converts to lowercase, removes non-alpha characters,
    and converts spaces to hyphens.
    Adapted to handle Vietnamese accents by converting to ASCII.
    """
    value = str(value)
    # Normalize unicode to decompose characters (e.g. ă -> a + breve)
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    # Remove invalid filename chars
    value = re.sub(r'[\\/*?:"<>|]', '', value)
    value = value.strip()
    # Replace spaces with underscores
    value = re.sub(r'\s+', '_', value)
    return value


# Configuration
BASE_URL = "https://elearning.utt.edu.vn"
COURSE_URL = "https://elearning.utt.edu.vn/course/view.php?id=33"  # Tin hoc K76
OUTPUT_DIR = Path("scraped_content")
STATE_FILE = "auth_state.json"
CONCURRENCY = 3  # Reduced from 5 to 3
DELAY_RANGE = (1.5, 3.5)  # Seconds to sleep between requests

# Types to skip
SKIP_TYPES = ['quiz', 'assign', 'forum', 'url']

class UniversalScraper:
    def __init__(self):
        self.output_dir = OUTPUT_DIR
        self.output_dir.mkdir(exist_ok=True, parents=True)
        self.resources_dir = self.output_dir / "resources"
        self.resources_dir.mkdir(exist_ok=True)
        self.pages_dir = self.output_dir / "pages"
        self.pages_dir.mkdir(exist_ok=True)
        
    async def login_if_needed(self, context):
        """Check login status and prompt user if needed"""
        page = await context.new_page()
        try:
            await page.goto(COURSE_URL)
            # Check if redirected to login
            if "login/index.php" in page.url:
                print("⚠️  Authentication required!")
                print("    Please log in via the browser window...")
                
                # Wait for user to login and be redirected back to course or dashboard
                await page.wait_for_url(lambda u: "login/index.php" not in u, timeout=300000) # 5 mins
                
                print("✓ Login detected! Saving state...")
                await context.storage_state(path=STATE_FILE)
            else:
                print("✓ Already logged in (session valid).")
        except Exception as e:
            print(f"Login check failed: {e}")
        finally:
            await page.close()

    async def parse_course_structure(self, context):
        """Parse the main course page to build the structure"""
        print(f"Scanning course: {COURSE_URL}...")
        page = await context.new_page()
        await page.goto(COURSE_URL)
        
        structure = await page.evaluate('''() => {
            const sections = [];
            document.querySelectorAll('.course-section').forEach(section => {
                const sectionName = section.querySelector('.sectionname')?.innerText.trim() || "General";
                const sectionId = section.id;
                
                const activities = [];
                section.querySelectorAll('.activity').forEach(act => {
                    const link = act.querySelector('a.aalink');
                    if (!link) return;
                    
                    const name = act.querySelector('.instancename')?.innerText.replace(' Bình luận', '').trim();
                    const url = link.href;
                    
                    // Determine type based on class or url
                    let type = 'unknown';
                    if (act.classList.contains('modtype_page')) type = 'page';
                    else if (act.classList.contains('modtype_resource')) type = 'resource';
                    else if (act.classList.contains('modtype_quiz')) type = 'quiz';
                    else if (act.classList.contains('modtype_assign')) type = 'assign';
                    else if (act.classList.contains('modtype_forum')) type = 'forum';
                    else if (act.classList.contains('modtype_folder')) type = 'folder';
                    else if (act.classList.contains('modtype_url')) type = 'url';
                    
                    activities.push({
                        name: name,
                        url: url,
                        type: type,
                        id: act.id
                    });
                });
                
                if (activities.length > 0) {
                    sections.push({
                        name: sectionName,
                        id: sectionId,
                        activities: activities
                    });
                }
            });
            return sections;
        }''')
        
        await page.close()
        return structure

    async def process_activity(self, context, activity, section_name, semaphore):
        """Process a single activity based on its type"""
        if activity['type'] in SKIP_TYPES:
            return {**activity, "status": "skipped", "reason": "type_ignored"}

        async with semaphore:
            # Add delay to be "human-like" and avoid rate limits
            delay = random.uniform(*DELAY_RANGE)
            await asyncio.sleep(delay)
            
            print(f"→ Processing [{activity['type']}]: {activity['name']} (delay {delay:.1f}s)...")
            try:
                page = await context.new_page()
                
                if activity['type'] == 'page':
                    result = await self.scrape_page_content(page, activity, section_name)
                elif activity['type'] == 'resource':
                    result = await self.download_resource(page, activity, section_name)
                elif activity['type'] == 'folder':
                    # TODO: Handle folder
                    result = {**activity, "status": "skipped", "reason": "folder_not_implemented"}
                else:
                    result = {**activity, "status": "skipped", "reason": "unknown_type"}
                
                await page.close()
                return result
                
            except Exception as e:
                print(f"✗ Failed {activity['name']}: {e}")
                return {**activity, "status": "error", "error": str(e)}

    async def scrape_page_content(self, page: Page, activity, section_name):
        """Scrape content from a modtype_page and download embedded assets"""
        await page.goto(activity['url'])
        
        # 1. Extract content and asset URLs
        data = await page.evaluate('''() => {
            const main = document.querySelector('[role="main"]');
            if (!main) return { html: "", assets: [] };
            
            const assets = [];
            
            // Find images
            main.querySelectorAll('img').forEach((img, index) => {
                if (img.src && !img.src.startsWith('data:')) {
                    assets.push({ type: 'image', url: img.src, original_src: img.src });
                }
            });
            
            // Find file links (basic heuristic)
            main.querySelectorAll('a').forEach((a) => {
                const href = a.href;
                if (href && (href.includes('pluginfile.php') || href.match(/\.(pdf|docx?|xlsx?|pptx?|zip|rar)$/i))) {
                    assets.push({ type: 'file', url: href, original_src: href });
                }
            });
            
            return { html: main.innerHTML, assets: assets };
        }''')
        
        content_html = data['html']
        assets = data['assets']
        
        # 2. Download assets
        safe_name = slugify(activity['name'])
        if not safe_name: safe_name = f"page_{activity['id']}"
        
        # Create assets folder for this page
        assets_dir = self.pages_dir / "assets" / safe_name
        if assets:
            assets_dir.mkdir(parents=True, exist_ok=True)
            
        print(f"   + Found {len(assets)} assets in page.")
        
        for asset in assets:
            try:
                # Use request context to download with cookies
                response = await page.context.request.get(asset['url'])
                if response.status == 200:
                    body = await response.body()
                    
                    # Determine filename
                    filename = os.path.basename(unquote(asset['url']).split('?')[0])
                    if not filename or len(filename) > 50:
                        ext = os.path.splitext(filename)[1] if filename else ""
                        if not ext: 
                            content_type = response.headers.get('content-type', '')
                            if 'image/jpeg' in content_type: ext = '.jpg'
                            elif 'image/png' in content_type: ext = '.png'
                            elif 'application/pdf' in content_type: ext = '.pdf'
                        filename = f"asset_{random.randint(1000,9999)}{ext}"
                    
                    # Sanitize filename
                    filename = slugify(filename)
                    if '.' not in filename: # Try to keep extension if slugify stripped it
                         # Re-add extension logic if needed, but slugify keeps alphanumeric. 
                         # Let's just append a safe extension if we know it or keep original logic
                         pass 
                         
                    # Simpler filename logic to keep extensions safe
                    original_name = os.path.basename(unquote(asset['url']).split('?')[0])
                    name_part, ext_part = os.path.splitext(original_name)
                    safe_filename = f"{slugify(name_part)}{ext_part}"
                    
                    file_path = assets_dir / safe_filename
                    
                    with open(file_path, "wb") as f:
                        f.write(body)
                        
                    # Replace in HTML
                    # Use simple string replacement (could be fragile but works for exact matches)
                    rel_path = f"assets/{safe_name}/{safe_filename}"
                    content_html = content_html.replace(asset['original_src'], rel_path)
                    
            except Exception as e:
                print(f"     ! Failed to download asset {asset['url']}: {e}")

        # 3. Save HTML
        file_name = f"{safe_name}.html"
        file_path = self.pages_dir / file_name
        
        full_html = f"""
        <html>
        <head>
            <title>{activity['name']}</title>
            <meta charset='utf-8'>
            <script src="../theme.js"></script>
            <link rel="stylesheet" href="../page_theme.css">
        </head>
        <body>
            <h1>{activity['name']}</h1>
            <h3>Section: {section_name}</h3>
            <hr>
            {content_html}
        </body>
        </html>
        """
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(full_html)
            
        return {**activity, "status": "success", "local_path": str(file_path)}

    async def download_resource(self, page: Page, activity, section_name):
        """Download a file resource with fallback for preview pages"""
        print(f"      Downloading {activity['name']}...")
        try:
            # Method 1: Expect download on navigation (for direct downloads)
            async with page.expect_download(timeout=10000) as download_info:
                await page.goto(activity['url'])
            download = await download_info.value
            
        except Exception:
            # Method 2: If timeout, likely a view page. Find the download link.
            print("      ! Direct download failed/timed out. Looking for link on page...")
            try:
                # Common Moodle resource selectors
                # .resourceworkaround a -> "Click here..."
                # .resourcecontent a -> often the file link
                # div[role="main"] a -> generic fallback
                
                # Check if we are on a page
                if page.url == activity['url']: # Reload if needed, but we are likely there
                    pass
                
                # Try to get the download URL from the page
                download_url = await page.evaluate('''() => {
                    const selectors = [
                        '.resourceworkaround a', 
                        '.resourcecontent a', 
                        'div[role="main"] .box a' # Fallback
                    ];
                    for (let s of selectors) {
                        const el = document.querySelector(s);
                        if (el && el.href) return el.href;
                    }
                    return null;
                }''')
                
                if download_url:
                    print(f"      -> Found download link: {download_url}")
                    async with page.expect_download(timeout=30000) as download_info:
                        await page.goto(download_url)
                    download = await download_info.value
                else:
                    raise Exception("Could not find download link on resource page.")

            except Exception as e2:
                print(f"      ✗ Download failed: {e2}")
                # Save as HTML if we can't download (maybe it's just a page?)
                return await self.scrape_page_content(page, activity, section_name)

        # Process the download
        original_name = download.suggested_filename
        ext = os.path.splitext(original_name)[1]
        
        # Clean suffix from name if present (e.g. "Name \nFile")
        clean_name = activity['name'].replace('\nFile', '').replace('\nTrang', '').strip()
        safe_name = slugify(clean_name)
        if not safe_name: safe_name = f"resource_{activity['id']}"
        
        # Determine extension if missing
        if not ext and 'pdf' in original_name.lower(): ext = '.pdf' # Basic heuristic
        
        # Append extension if not present in safe_name
        # (Compare lowercase to avoid case issues)
        if ext and not safe_name.lower().endswith(ext.lower()):
            safe_name += ext
            
        save_path = self.resources_dir / safe_name
        await download.save_as(save_path)
        
        return {**activity, "status": "success", "local_path": str(save_path)}

    async def run(self):
        print("="*60)
        print("UNIVERSAL SCRAPER - INIT")
        print("="*60)
        
        async with async_playwright() as p:
            # Load storage state if exists
            context_args = {}
            if os.path.exists(STATE_FILE):
                context_args['storage_state'] = STATE_FILE
                
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context(**context_args)
            
            # 1. Login Check
            await self.login_if_needed(context)
            
            # 2. Get Structure
            structure = await self.parse_course_structure(context)
            print(f"✓ Found {len(structure)} sections.")
            
            # Save structure
            with open(self.output_dir / "course_structure_scraped.json", "w", encoding="utf-8") as f:
                json.dump(structure, f, ensure_ascii=False, indent=2)
            
            # 3. Process All Activities
            all_activities = []
            for section in structure:
                for act in section['activities']:
                    all_activities.append((section['name'], act))
            
            print(f"✓ Found {len(all_activities)} total activities.")
            print(f"✓ Starting concurrent download (Tabs: {CONCURRENCY})...")
            
            semaphore = asyncio.Semaphore(CONCURRENCY)
            tasks = [
                self.process_activity(context, act, sec_name, semaphore) 
                for sec_name, act in all_activities
            ]
            
            results = await asyncio.gather(*tasks)
            
            # 4. Summary
            success_count = sum(1 for r in results if r['status'] == 'success')
            skipped_count = sum(1 for r in results if r['status'] == 'skipped')
            error_count = sum(1 for r in results if r['status'] == 'error')
            
            print("\n" + "="*60)
            print("SUMMARY")
            print(f"✓ Success: {success_count}")
            print(f"• Skipped: {skipped_count}")
            print(f"✗ Errors : {error_count}")
            print("="*60)
            
            # Save final report
            with open(self.output_dir / "scrape_report.json", "w", encoding="utf-8") as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            
            await browser.close()

if __name__ == "__main__":
    scraper = UniversalScraper()
    asyncio.run(scraper.run())
