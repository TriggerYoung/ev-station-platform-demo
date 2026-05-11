# db_utils.py
from utils.db_connetion import connect_to_db


def insert_comment(user_id, content, parent_id=None):
    conn = connect_to_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO comments (user_id, content, parent_id) VALUES (%s,%s,%s)",
                (user_id, content, parent_id),
            )
        conn.commit()
        return True
    finally:
        conn.close()


def fetch_comments(offset=0, limit=10, current_user_id=None):
    """
    仅返回一级评论，并标记当前用户是否已点赞
    """
    conn = connect_to_db()
    try:
        with conn.cursor() as cur:
            sql = """
            SELECT c.comment_id, c.content, c.parent_id, c.likes, c.created_at,
                   u.username, COUNT(r.comment_id) AS reply_count,
                   (cl.user_id IS NOT NULL) AS liked
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.user_id
            LEFT JOIN comments r ON r.parent_id = c.comment_id
            LEFT JOIN comment_likes cl
              ON cl.comment_id = c.comment_id AND cl.user_id = %s
            WHERE c.parent_id IS NULL
            GROUP BY c.comment_id
            ORDER BY c.created_at DESC
            LIMIT %s OFFSET %s
            """
            cur.execute(sql, (current_user_id, limit, offset))
            return cur.fetchall()
    finally:
        conn.close()


def fetch_replies(parent_id):
    """
    返回指定父评论下的所有直接回复（按时间升序）
    """
    conn = connect_to_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT c.comment_id, c.content, c.parent_id, c.created_at, u.username
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.user_id
                WHERE c.parent_id = %s
                ORDER BY c.created_at ASC
            """,
                (parent_id,),
            )
            return cur.fetchall()
    finally:
        conn.close()


def toggle_like_comment(user_id, comment_id):
    """
    点赞/取消点赞，返回最新点赞数
    """
    conn = connect_to_db()
    try:
        with conn.cursor() as cur:
            # 如果已点赞，则取消
            cur.execute(
                "SELECT 1 FROM comment_likes WHERE user_id=%s AND comment_id=%s",
                (user_id, comment_id),
            )
            if cur.fetchone():
                cur.execute(
                    "DELETE FROM comment_likes WHERE user_id=%s AND comment_id=%s",
                    (user_id, comment_id),
                )
                cur.execute(
                    "UPDATE comments SET likes = likes - 1 WHERE comment_id=%s",
                    (comment_id,),
                )
                liked = False
            else:
                cur.execute(
                    "INSERT INTO comment_likes (user_id, comment_id) VALUES (%s,%s)",
                    (user_id, comment_id),
                )
                cur.execute(
                    "UPDATE comments SET likes = likes + 1 WHERE comment_id=%s",
                    (comment_id,),
                )
                liked = True
        conn.commit()
        # 获取最新点赞数
        with conn.cursor() as cur2:
            cur2.execute(
                "SELECT likes FROM comments WHERE comment_id=%s", (comment_id,)
            )
            likes = cur2.fetchone()["likes"]
        return likes, liked
    finally:
        conn.close()


def fetch_hot_comments(offset=0, limit=10, current_user_id=None):
    """
    获取热门评论，按点赞数降序，一级评论（parent_id is NULL）
    """
    conn = connect_to_db()
    try:
        with conn.cursor() as cur:
            sql = """
            SELECT c.comment_id, c.content, c.parent_id, c.likes, c.created_at,
                   u.username, COUNT(r.comment_id) AS reply_count,
                   (cl.user_id IS NOT NULL) AS liked
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.user_id
            LEFT JOIN comments r ON r.parent_id = c.comment_id
            LEFT JOIN comment_likes cl
              ON cl.comment_id = c.comment_id AND cl.user_id = %s
            WHERE c.parent_id IS NULL
            GROUP BY c.comment_id
            ORDER BY c.likes DESC, c.created_at DESC
            LIMIT %s OFFSET %s
            """
            cur.execute(sql, (current_user_id, limit, offset))
            return cur.fetchall()
    finally:
        conn.close()


def fetch_user_comments(user_id, offset=0, limit=10):
    """
    获取当前用户的所有留言（包括一级评论和回复）
    """
    conn = connect_to_db()
    try:
        with conn.cursor() as cur:
            sql = """
            SELECT c.comment_id, c.content, c.parent_id, c.likes, c.created_at,
                   u.username,
                   (cl.user_id IS NOT NULL) AS liked,
                   pc.content AS parent_content,
                   pu.username AS parent_author
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.user_id
            LEFT JOIN comment_likes cl ON cl.comment_id = c.comment_id AND cl.user_id = %s
            LEFT JOIN comments pc ON c.parent_id = pc.comment_id
            LEFT JOIN users pu ON pc.user_id = pu.user_id
            WHERE c.user_id = %s
            ORDER BY c.created_at DESC
            LIMIT %s OFFSET %s
            """
            cur.execute(sql, (user_id, user_id, limit, offset))
            return cur.fetchall()
    finally:
        conn.close()


def delete_comment_by_user(user_id, comment_id):
    """
    用户只能删除自己发的评论
    """
    conn = connect_to_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM comments WHERE comment_id = %s AND user_id = %s",
                (comment_id, user_id),
            )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def fetch_user_replies(user_id, offset=0, limit=10):
    """
    获取当前用户的所有回复消息
    """
    conn = connect_to_db()
    try:
        with conn.cursor() as cur:
            sql = """
            SELECT c.comment_id, c.content, c.parent_id, c.likes, c.created_at,
                   u.username, pc.content AS parent_content, pu.username AS parent_author
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.user_id
            LEFT JOIN comments pc ON c.parent_id = pc.comment_id
            LEFT JOIN users pu ON pc.user_id = pu.user_id
            WHERE c.user_id = %s AND c.parent_id IS NOT NULL
            ORDER BY c.created_at DESC
            LIMIT %s OFFSET %s
            """
            cur.execute(sql, (user_id, limit, offset))
            return cur.fetchall()
    finally:
        conn.close()


def fetch_all_comments_content():
    """
    获取所有评论内容，用于生成词云
    """
    conn = connect_to_db()
    comments = []
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT content FROM comments")
            rows = cur.fetchall()
            comments = [row['content'] for row in rows if row['content']]
    finally:
        conn.close()
    return comments
