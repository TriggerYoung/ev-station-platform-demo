# 新浪网新闻爬虫，需要登录，现停用。

import requests
from bs4 import BeautifulSoup
import time
import json
import os
from urllib.parse import quote
from tqdm import tqdm

CACHE_FILE = "community/news_cache.json"
CACHE_EXPIRE_SECONDS = 8 * 60 * 60

KEYWORD_MAP = {
    "infrastructure": "新能源汽车充电基础设施建设",
    "ev_trends": "新能源汽车",
    "battery_tech": "新能源汽车电池与技术",
    "clean_energy": "清洁能源",
    "policies": "新能源汽车政策与法规",
}

def _headers():
    """请求头：Cookie 仅允许从环境变量读取"""
    h = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "Referer": "https://search.sina.com.cn/news",
    }
    cookie = os.environ.get("SINA_NEWS_COOKIE", "").strip()
    if cookie:
        h["Cookie"] = cookie
    return h


def is_cache_valid():
    if not os.path.exists(CACHE_FILE):
        return False
    return time.time() - os.path.getmtime(CACHE_FILE) < CACHE_EXPIRE_SECONDS


def load_cache():
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_cache(data):
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def fetch_news_links(keyword):
    encoded_keyword = quote(keyword)
    url = f"https://search.sina.com.cn/?c=news&q={encoded_keyword}&from=home&ie=utf-8"
    try:
        resp = requests.get(url, headers=_headers(), timeout=10)
        resp.encoding = "utf-8"
        print(resp.url)  # 看是不是跳到别的页面了
        print(resp.text[:500])  # 打印前500字看看返回的内容
        soup = BeautifulSoup(resp.text, "html.parser")
        return [a["href"] for a in soup.select("div.box-result.clearfix a[href]")]
    except Exception as e:
        print(f"抓取失败 {keyword}: {str(e)}")
        return []


def parse_news_detail(url):
    try:
        # 首先检查URL是否是视频页面
        if "video.sina.com.cn" in url:
            print(f"[跳过] 视频页面: {url}")
            return None

        resp = requests.get(url, headers=_headers(), timeout=10)
        resp.encoding = "utf-8"
        soup = BeautifulSoup(resp.text, "html.parser")

        # 验证是否是标准新闻页面结构
        title_tag = (
            soup.find("h1", class_="main-title")
            or soup.find("h1", {"id": "artibodyTitle"})
            or soup.find("h1")
        )
        if not title_tag:
            print(f"[跳过] 非标准新闻页面，未找到标题: {url}")
            return None

        # 获取发布时间和来源
        date_source = soup.find("div", class_="date-source") or soup.find(
            "span", class_="date"
        )
        if not date_source:
            print(f"[跳过] 未找到发布时间和来源: {url}")
            return None

        title = title_tag.get_text(strip=True)

        # 处理发布时间
        publish_time_tag = (
            date_source.find("span", class_="date")
            if hasattr(date_source, "find")
            else date_source
        )
        publish_time = publish_time_tag.get_text(strip=True) if publish_time_tag else ""

        # 处理来源
        source_tag = (
            date_source.find("a")
            if hasattr(date_source, "find")
            else soup.find("span", class_="source") or soup.find("a", class_="source")
        )
        source = source_tag.get_text(strip=True) if source_tag else "未知来源"

        # 验证必要字段
        if not all([title, publish_time]):
            print(f"[跳过] 必要字段缺失: {url}")
            return None

        return {
            "title": title,
            "publish_time": publish_time,
            "source": source,
            "url": url,
        }
    except Exception as e:
        print(f"[解析失败] {url} 错误: {e}")
        return None


def run():
    if is_cache_valid():
        return load_cache()

    # 使用有序字典保证顺序且去重
    all_urls = {}  # {url: (category, keyword)}

    # 第一阶段：收集所有唯一URL并标记来源分类
    for category, keyword in KEYWORD_MAP.items():
        print(f"[收集URL] 处理分类: {category}")
        for url in fetch_news_links(keyword):
            if url not in all_urls:
                all_urls[url] = category

    # 第二阶段：批量处理唯一URL
    news_pool = {}
    for url, category in tqdm(all_urls.items(), desc="处理新闻"):
        if len(news_pool.get(category, [])) >= 10:
            continue

        news = parse_news_detail(url)
        if news:
            news_pool.setdefault(category, []).append(news)
            time.sleep(1)  # 礼貌爬取间隔

    save_cache(news_pool)
    return news_pool
