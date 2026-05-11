# generate_wordcloud.py
from .db_utils import fetch_all_comments_content
from wordcloud import WordCloud
from io import BytesIO
import base64
import os

# 可换成你项目中静态路径下的字体文件
FONT_PATH = os.path.join(os.path.dirname(__file__), "fonts", "simhei.ttf")


def generate_wordcloud_base64():
    comments = fetch_all_comments_content()
    text = " ".join(comments)

    if not text.strip():
        return None

    wc = WordCloud(
        font_path=FONT_PATH,
        background_color="white",
        width=800,
        height=400,
        max_words=200,
    ).generate(text)

    img_io = BytesIO()
    wc.to_image().save(img_io, format="PNG")
    img_io.seek(0)
    img_base64 = base64.b64encode(img_io.getvalue()).decode("utf-8")
    return img_base64
