"""
UTT Elearning Scraper - Fast Parallel Version
Sử dụng aiohttp để cào nhiều trang cùng lúc
"""

import asyncio
import aiohttp
import json
import os
import re
from bs4 import BeautifulSoup
from pathlib import Path

# Configuration
BASE_URL = "https://elearning.utt.edu.vn"
OUTPUT_DIR = Path("scraped_content")
OUTPUT_DIR.mkdir(exist_ok=True)

# Cookie string từ browser (sẽ được cập nhật)
COOKIES = ""

# Danh sách tất cả các trang cần cào (chỉ pages, không quiz/assignment)
PAGES_TO_SCRAPE = [
    # Chương 1: Tin học căn bản
    {"id": "253", "section": "Chương 1", "name": "Thông tin và biểu diễn thông tin"},
    {"id": "254", "section": "Chương 1", "name": "Câu hỏi, Bài tập Chương 1"},
    {"id": "587", "section": "Chương 1", "name": "Câu hỏi trắc nghiệm"},
    
    # Sử dụng máy tính và Internet
    {"id": "574", "section": "Sử dụng máy tính", "name": "Làm việc với máy tính"},
    {"id": "575", "section": "Sử dụng máy tính", "name": "Bài 1 - Khởi động máy tính"},
    {"id": "576", "section": "Sử dụng Internet", "name": "Sử dụng Internet"},
    {"id": "580", "section": "Sử dụng máy tính", "name": "Câu hỏi trắc nghiệm - Máy tính"},
    {"id": "581", "section": "Sử dụng Internet", "name": "Câu hỏi trắc nghiệm - Internet"},
    {"id": "582", "section": "Sử dụng máy tính", "name": "Bài 2"},
    {"id": "583", "section": "Sử dụng máy tính", "name": "Bài 3"},
    {"id": "584", "section": "Sử dụng máy tính", "name": "Bài 4"},
    {"id": "585", "section": "Sử dụng máy tính", "name": "Bài 5"},
    {"id": "586", "section": "Sử dụng máy tính", "name": "Bài 6"},
    
    # Chương 2: Công dân số
    {"id": "262", "section": "Chương 2", "name": "Tổng quan về công nghệ 4.0"},
    {"id": "263", "section": "Chương 2", "name": "Chuyển đổi số"},
    {"id": "264", "section": "Chương 2", "name": "Hành trang công dân số"},
    
    # Chương 4: MS Word
    {"id": "535", "section": "Chương 4 - Word", "name": "Tổng quan MS Word"},
    {"id": "536", "section": "Chương 4 - Word", "name": "Định dạng văn bản"},
    {"id": "537", "section": "Chương 4 - Word", "name": "Định dạng đoạn văn"},
    {"id": "538", "section": "Chương 4 - Word", "name": "Bullets và Numbering"},
    {"id": "539", "section": "Chương 4 - Word", "name": "Bảng biểu"},
    {"id": "540", "section": "Chương 4 - Word", "name": "Chia cột, Drop Cap, Tab"},
    {"id": "541", "section": "Chương 4 - Word", "name": "Header Footer Page Number"},
    {"id": "542", "section": "Chương 4 - Word", "name": "Chèn ảnh và đối tượng"},
    {"id": "543", "section": "Chương 4 - Word", "name": "Bài tập Word 1"},
    {"id": "577", "section": "Chương 4 - Word", "name": "Câu hỏi trắc nghiệm Word"},
    
    # Hướng dẫn thực hành Word
    {"id": "255", "section": "Thực hành Word", "name": "Hướng dẫn 1"},
    {"id": "256", "section": "Thực hành Word", "name": "Hướng dẫn 2"},
    {"id": "257", "section": "Thực hành Word", "name": "Hướng dẫn 3"},
    {"id": "258", "section": "Thực hành Word", "name": "Hướng dẫn 4"},
    {"id": "259", "section": "Thực hành Word", "name": "Hướng dẫn 5"},
    
    # Chương 5: Excel
    {"id": "526", "section": "Chương 5 - Excel", "name": "Tổng quan Excel"},
    {"id": "527", "section": "Chương 5 - Excel", "name": "Nhập dữ liệu và định dạng"},
    {"id": "528", "section": "Chương 5 - Excel", "name": "Công thức và hàm cơ bản"},
    {"id": "529", "section": "Chương 5 - Excel", "name": "Các hàm thống kê"},
    {"id": "530", "section": "Chương 5 - Excel", "name": "Hàm điều kiện IF"},
    {"id": "531", "section": "Chương 5 - Excel", "name": "Hàm VLOOKUP HLOOKUP"},
    {"id": "532", "section": "Chương 5 - Excel", "name": "Cơ sở dữ liệu trong Excel"},
    {"id": "533", "section": "Chương 5 - Excel", "name": "Biểu đồ trong Excel"},
    {"id": "534", "section": "Chương 5 - Excel", "name": "In ấn trong Excel"},
    {"id": "554", "section": "Chương 5 - Excel", "name": "Bài tập Excel 1"},
    {"id": "578", "section": "Chương 5 - Excel", "name": "Câu hỏi trắc nghiệm Excel"},
    
    # Chương 6: PowerPoint
    {"id": "544", "section": "Chương 6 - PowerPoint", "name": "Giới thiệu PowerPoint"},
    {"id": "545", "section": "Chương 6 - PowerPoint", "name": "Tổng quan giao diện"},
    {"id": "546", "section": "Chương 6 - PowerPoint", "name": "Thiết lập hiệu ứng"},
    {"id": "547", "section": "Chương 6 - PowerPoint", "name": "Bài tập PowerPoint 1"},
    {"id": "562", "section": "Chương 6 - PowerPoint", "name": "Bài tập PowerPoint 2"},
    {"id": "579", "section": "Chương 6 - PowerPoint", "name": "Câu hỏi trắc nghiệm PowerPoint"},
]

def parse_cookies(cookie_string):
    """Parse cookie string into dict"""
    cookies = {}
    for item in cookie_string.split(';'):
        item = item.strip()
        if '=' in item:
            key, value = item.split('=', 1)
            cookies[key.strip()] = value.strip()
    return cookies

async def fetch_page(session, page_info, semaphore):
    """Fetch a single page content"""
    async with semaphore:
        url = f"{BASE_URL}/mod/page/view.php?id={page_info['id']}"
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Extract title
                    title_elem = soup.find('h2')
                    title = title_elem.get_text(strip=True) if title_elem else page_info['name']
                    
                    # Extract main content
                    main_content = soup.find('div', {'class': 'box generalbox'})
                    if not main_content:
                        main_content = soup.find('div', {'role': 'main'})
                    
                    content_html = str(main_content) if main_content else ""
                    content_text = main_content.get_text(strip=True) if main_content else ""
                    
                    # Extract images
                    images = []
                    if main_content:
                        for img in main_content.find_all('img'):
                            src = img.get('src', '')
                            if src:
                                images.append(src)
                    
                    print(f"✓ Scraped: {title[:50]}...")
                    
                    return {
                        "id": page_info['id'],
                        "section": page_info['section'],
                        "name": page_info['name'],
                        "title": title,
                        "url": url,
                        "html": content_html,
                        "text": content_text,
                        "images": images,
                        "status": "success"
                    }
                else:
                    print(f"✗ Error {response.status}: {page_info['name']}")
                    return {
                        "id": page_info['id'],
                        "section": page_info['section'],
                        "name": page_info['name'],
                        "status": "error",
                        "error": f"HTTP {response.status}"
                    }
        except Exception as e:
            print(f"✗ Exception: {page_info['name']} - {str(e)}")
            return {
                "id": page_info['id'],
                "section": page_info['section'],
                "name": page_info['name'],
                "status": "error",
                "error": str(e)
            }

async def main():
    if not COOKIES:
        print("ERROR: Please set the COOKIES variable with your session cookies!")
        print("Get cookies from browser console: document.cookie")
        return
    
    cookies = parse_cookies(COOKIES)
    
    # Limit concurrent requests to avoid overwhelming the server
    semaphore = asyncio.Semaphore(5)  # 5 concurrent requests
    
    async with aiohttp.ClientSession(cookies=cookies) as session:
        tasks = [fetch_page(session, page, semaphore) for page in PAGES_TO_SCRAPE]
        results = await asyncio.gather(*tasks)
    
    # Save results
    output_file = OUTPUT_DIR / "all_content.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # Summary
    success = sum(1 for r in results if r.get('status') == 'success')
    print(f"\n{'='*50}")
    print(f"Scraped {success}/{len(results)} pages successfully")
    print(f"Output saved to: {output_file}")

if __name__ == "__main__":
    asyncio.run(main())
