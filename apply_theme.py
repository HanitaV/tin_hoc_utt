import os
from pathlib import Path

PAGES_DIR = Path("scraped_content/pages")
CSS_LINK = '<link rel="stylesheet" href="../page_theme.css">'

def main():
    print("Applying theme to existing pages...")
    count = 0
    for file_path in PAGES_DIR.glob("*.html"):
        try:
            content = file_path.read_text(encoding='utf-8')
            if 'page_theme.css' not in content:
                # Inject before </head>
                if '</head>' in content:
                    new_content = content.replace('</head>', f'{CSS_LINK}\n</head>')
                    file_path.write_text(new_content, encoding='utf-8')
                    count += 1
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            
    print(f"✓ Updated {count} files with theme.")

if __name__ == "__main__":
    main()
