"""
UTT Elearning Scraper - Playwright Version
Sử dụng Playwright với authenticated session từ browser đang mở
"""

import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

OUTPUT_DIR = Path("scraped_content")
OUTPUT_DIR.mkdir(exist_ok=True)

# Tất cả các trang cần cào
PAGES_TO_SCRAPE = [
    # Chương 1
    {"id": "253", "section": "Chương 1", "name": "Thông tin và biểu diễn thông tin"},
    {"id": "254", "section": "Chương 1", "name": "Câu hỏi, Bài tập Chương 1"},
    {"id": "587", "section": "Chương 1", "name": "Câu hỏi trắc nghiệm"},
    
    # Sử dụng máy tính và Internet
    {"id": "574", "section": "Máy tính & Internet", "name": "Làm việc với máy tính"},
    {"id": "575", "section": "Máy tính & Internet", "name": "Bài 1"},
    {"id": "576", "section": "Máy tính & Internet", "name": "Sử dụng Internet"},
    {"id": "580", "section": "Máy tính & Internet", "name": "Trắc nghiệm Máy tính"},
    {"id": "581", "section": "Máy tính & Internet", "name": "Trắc nghiệm Internet"},
    {"id": "582", "section": "Máy tính & Internet", "name": "Bài 2"},
    {"id": "583", "section": "Máy tính & Internet", "name": "Bài 3"},
    {"id": "584", "section": "Máy tính & Internet", "name": "Bài 4"},
    {"id": "585", "section": "Máy tính & Internet", "name": "Bài 5"},
    {"id": "586", "section": "Máy tính & Internet", "name": "Bài 6"},
    
    # Chương 2
    {"id": "262", "section": "Chương 2", "name": "Tổng quan công nghệ 4.0"},
    {"id": "263", "section": "Chương 2", "name": "Chuyển đổi số"},
    {"id": "264", "section": "Chương 2", "name": "Hành trang công dân số"},
    
    # Chương 4 - Word
    {"id": "535", "section": "Word", "name": "Tổng quan MS Word"},
    {"id": "536", "section": "Word", "name": "Định dạng văn bản"},
    {"id": "537", "section": "Word", "name": "Định dạng đoạn văn"},
    {"id": "538", "section": "Word", "name": "Bullets và Numbering"},
    {"id": "539", "section": "Word", "name": "Bảng biểu"},
    {"id": "540", "section": "Word", "name": "Chia cột, Drop Cap, Tab"},
    {"id": "541", "section": "Word", "name": "Header Footer"},
    {"id": "542", "section": "Word", "name": "Chèn ảnh"},
    {"id": "543", "section": "Word", "name": "Bài tập Word 1"},
    {"id": "577", "section": "Word", "name": "Trắc nghiệm Word"},
    {"id": "255", "section": "Thực hành Word", "name": "Hướng dẫn 1"},
    {"id": "256", "section": "Thực hành Word", "name": "Hướng dẫn 2"},
    {"id": "257", "section": "Thực hành Word", "name": "Hướng dẫn 3"},
    {"id": "258", "section": "Thực hành Word", "name": "Hướng dẫn 4"},
    {"id": "259", "section": "Thực hành Word", "name": "Hướng dẫn 5"},
    
    # Chương 5 - Excel
    {"id": "526", "section": "Excel", "name": "Tổng quan Excel"},
    {"id": "527", "section": "Excel", "name": "Nhập dữ liệu"},
    {"id": "528", "section": "Excel", "name": "Công thức và hàm"},
    {"id": "529", "section": "Excel", "name": "Hàm thống kê"},
    {"id": "530", "section": "Excel", "name": "Hàm IF"},
    {"id": "531", "section": "Excel", "name": "VLOOKUP HLOOKUP"},
    {"id": "532", "section": "Excel", "name": "CSDL Excel"},
    {"id": "533", "section": "Excel", "name": "Biểu đồ"},
    {"id": "534", "section": "Excel", "name": "In ấn"},
    {"id": "554", "section": "Excel", "name": "Bài tập Excel 1"},
    {"id": "578", "section": "Excel", "name": "Trắc nghiệm Excel"},
    
    # Chương 6 - PowerPoint
    {"id": "544", "section": "PowerPoint", "name": "Giới thiệu"},
    {"id": "545", "section": "PowerPoint", "name": "Giao diện"},
    {"id": "546", "section": "PowerPoint", "name": "Hiệu ứng"},
    {"id": "547", "section": "PowerPoint", "name": "Bài tập 1"},
    {"id": "562", "section": "PowerPoint", "name": "Bài tập 2"},
    {"id": "579", "section": "PowerPoint", "name": "Trắc nghiệm"},
]

async def scrape_page(context, page_info, semaphore):
    """Scrape a single page"""
    async with semaphore:
        page = await context.new_page()
        url = f"https://elearning.utt.edu.vn/mod/page/view.php?id={page_info['id']}"
        
        try:
            await page.goto(url, wait_until='domcontentloaded', timeout=15000)
            
            # Extract content
            result = await page.evaluate('''() => {
                const title = document.querySelector('h2')?.innerText || document.title;
                const mainContent = document.querySelector('#region-main .box.generalbox') || 
                                  document.querySelector('.page-content') ||
                                  document.querySelector('[role="main"]');
                
                const images = [];
                if (mainContent) {
                    mainContent.querySelectorAll('img').forEach(img => {
                        if (img.src) images.push(img.src);
                    });
                }
                
                return {
                    title: title,
                    html: mainContent ? mainContent.innerHTML : '',
                    text: mainContent ? mainContent.innerText : '',
                    images: images
                };
            }''')
            
            await page.close()
            
            print(f"✓ {page_info['section']}: {page_info['name']}")
            
            return {
                "id": page_info['id'],
                "section": page_info['section'],
                "name": page_info['name'],
                "url": url,
                **result,
                "status": "success"
            }
            
        except Exception as e:
            await page.close()
            print(f"✗ {page_info['name']}: {str(e)[:50]}")
            return {
                "id": page_info['id'],
                "section": page_info['section'],
                "name": page_info['name'],
                "url": url,
                "status": "error",
                "error": str(e)
            }

async def main():
    print("=" * 60)
    print("UTT Elearning Scraper - Playwright Edition")
    print("=" * 60)
    print(f"\nSẽ cào {len(PAGES_TO_SCRAPE)} trang...")
    print("Sử dụng 5 tabs song song để tăng tốc\n")
    
    async with async_playwright() as p:
        # Launch browser với persistent context để giữ session
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        
        # Đầu tiên mở trang login để user đăng nhập
        login_page = await context.new_page()
        await login_page.goto("https://elearning.utt.edu.vn/login/index.php")
        
        print("⚠️  Vui lòng đăng nhập vào website trong browser vừa mở...")
        print("    Sau khi đăng nhập xong, nhấn ENTER để tiếp tục...")
        input()
        
        await login_page.close()
        
        # Scrape với 5 concurrent tabs
        semaphore = asyncio.Semaphore(5)
        tasks = [scrape_page(context, page, semaphore) for page in PAGES_TO_SCRAPE]
        results = await asyncio.gather(*tasks)
        
        await browser.close()
    
    # Save results
    output_file = OUTPUT_DIR / "all_content.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # Create sections summary
    sections = {}
    for r in results:
        if r.get('status') == 'success':
            sec = r['section']
            if sec not in sections:
                sections[sec] = []
            sections[sec].append({
                "id": r['id'],
                "name": r['name'],
                "title": r.get('title', r['name'])
            })
    
    sections_file = OUTPUT_DIR / "sections.json"
    with open(sections_file, 'w', encoding='utf-8') as f:
        json.dump(sections, f, ensure_ascii=False, indent=2)
    
    # Summary
    success = sum(1 for r in results if r.get('status') == 'success')
    print(f"\n{'='*60}")
    print(f"✓ Hoàn thành: {success}/{len(results)} trang")
    print(f"✓ Nội dung lưu tại: {output_file}")
    print(f"✓ Các chương lưu tại: {sections_file}")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
