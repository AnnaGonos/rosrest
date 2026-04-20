import requests
import json
import uuid
from bs4 import BeautifulSoup
from slugify import slugify
from datetime import datetime
import csv
import time

BASE_URL = "https://rosrest.com/monitoring-zakon"
MAX_PAGE = 76
API_URL = "https://api.rosrest.com/api/monitoring-zakon"
TOKEN = ""

def parse_list_page(page_num):
    url = BASE_URL if page_num == 1 else f"{BASE_URL}/page/{page_num}/"
    resp = requests.get(url)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    articles = soup.select(".w-grid-list .w-grid-item")
    result = []
    for art in articles:
        title_tag = art.select_one("h2 a")
        date_tag = art.select_one("time")
        link = title_tag["href"]
        title = title_tag.text.strip()

        date = date_tag["datetime"] if date_tag and date_tag.has_attr("datetime") else ""
        result.append({"title": title, "date": date, "link": link})
    return result

def parse_detail_page(url):
    resp = requests.get(url)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    content = soup.select_one(".w-post-elm.post_content")
    if not content:
        return "", False
    
    html = str(content)
    html = html.replace('</p>', '</p><br>')
    if html.endswith('<br>'):
        html = html[:-4]
    has_img = bool(content.find("img"))
    return html, has_img

def send_to_api(title, slug, date, content):
    blocks = [
        {
            "id": str(uuid.uuid4()),
            "type": "TX01",
            "content": {"html": content or "<p>TX01<br>Текст<br>Обычный текстовый блок.</p>"},
            "order": 0,
            "parentBlockId": None,
            "children": []
        }
    ]
    published_at = date  
    data = {
        "title": title,
        "slug": slug,
        "isDraft": "false",
        "publishedAt": published_at,
        "blocks": json.dumps(blocks, ensure_ascii=False)
    }
    headers = {
        "Authorization": f"Bearer {TOKEN}"
    }
    resp = requests.post(API_URL, data=data, headers=headers)
    print(resp.status_code, resp.text)
    return resp.status_code, resp.text

def main():
    with open("laws_with_images.csv", "w", newline='', encoding="utf-8") as f_img, \
         open("laws_with_errors.csv", "w", newline='', encoding="utf-8") as f_err:
        writer_img = csv.DictWriter(f_img, fieldnames=["title", "date", "link"])
        writer_img.writeheader()
        writer_err = csv.DictWriter(f_err, fieldnames=["title", "date", "link", "error"])
        writer_err.writeheader()

        for page in range(1, MAX_PAGE + 1):
            print(f"Парсим страницу {page}")
            try:
                items = parse_list_page(page)
            except Exception as e:
                print(f"Ошибка на странице {page}: {e}")
                continue

            for item in items:
                try:
                    content, has_img = parse_detail_page(item["link"])
                    slug = slugify(item["title"], separator="-")
                    if has_img:
                        writer_img.writerow({"title": item["title"], "date": item["date"], "link": item["link"]})
                        print(f"Пропущено (есть изображение): {item['title']}")
                    else:
                        code, resp = send_to_api(item["title"], slug, item["date"], content)
                        if code == 200 or code == 201:
                            print(f"Добавлено: {item['title']} [{code}]")
                        else:
                            writer_err.writerow({
                                "title": item["title"],
                                "date": item["date"],
                                "link": item["link"],
                                "error": resp
                            })
                            print(f"Ошибка при добавлении: {item['title']} [{code}] {resp}")
                    time.sleep(0.5)
                except Exception as e:
                    writer_err.writerow({
                        "title": item["title"],
                        "date": item["date"],
                        "link": item["link"],
                        "error": str(e)
                    })
                    print(f"Ошибка при обработке {item['link']}: {e}")

if __name__ == "__main__":
    main()
