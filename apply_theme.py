import os
from pathlib import Path

PAGES_DIR = Path("scraped_content/pages")
CSS_LINK = '<link rel="stylesheet" href="../page_theme.css">'
SCRIPT_LINK = '<script src="../theme.js"></script>'

def main():
    print("Applying theme to existing pages...")
    count = 0
    for file_path in PAGES_DIR.glob("*.html"):
        try:
            content = file_path.read_text(encoding='utf-8')
            changed = False
            if 'theme.js' not in content:
                if CSS_LINK in content:
                    content = content.replace(CSS_LINK, f'{SCRIPT_LINK}\n{CSS_LINK}', 1)
                    changed = True
                elif '</head>' in content:
                    content = content.replace('</head>', f'{SCRIPT_LINK}\n</head>', 1)
                    changed = True

            if 'page_theme.css' not in content:
                if '</head>' in content:
                    content = content.replace('</head>', f'{CSS_LINK}\n</head>', 1)
                    changed = True

            if changed:
                file_path.write_text(content, encoding='utf-8')
                count += 1
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            
    print(f"✓ Updated {count} files with theme.")

if __name__ == "__main__":
    main()
