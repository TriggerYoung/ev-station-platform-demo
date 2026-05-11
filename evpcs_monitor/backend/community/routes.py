# routes.py
from flask import Blueprint, jsonify, request
from .news_spider import run
from .db_utils import (
    fetch_comments,
    fetch_replies,
    insert_comment,
    toggle_like_comment,
    fetch_hot_comments,
    fetch_user_comments,
    delete_comment_by_user,
    fetch_user_replies,
)
from .generate_wordcloud import generate_wordcloud_base64

community_bp = Blueprint("community", __name__)


@community_bp.route("/news", methods=["GET"])
def get_news():
    try:
        news_data = run()
        return jsonify({"success": True, "data": news_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@community_bp.route("/comments", methods=["GET"])
def get_comments():
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 10))
    user_id = request.args.get("user_id", type=int)
    offset = (page - 1) * page_size
    data = fetch_comments(offset=offset, limit=page_size, current_user_id=user_id)
    return jsonify({"success": True, "data": data})


@community_bp.route("/comments/replies", methods=["GET"])
def get_replies():
    parent_id = request.args.get("parent_id", type=int)
    data = fetch_replies(parent_id)
    return jsonify({"success": True, "data": data})


@community_bp.route("/comments", methods=["POST"])
def post_comment():
    d = request.json
    ok = insert_comment(d["user_id"], d["content"], d.get("parent_id"))
    return jsonify({"success": ok})


@community_bp.route("/comments/like/<int:comment_id>", methods=["POST"])
def like_comment(comment_id):
    d = request.json
    likes, liked = toggle_like_comment(d["user_id"], comment_id)
    return jsonify({"success": True, "data": {"likes": likes, "liked": liked}})


@community_bp.route("/comments/hot")
def get_hot_comments():
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 10))
    user_id = request.args.get("user_id")
    offset = (page - 1) * page_size
    data = fetch_hot_comments(offset=offset, limit=page_size, current_user_id=user_id)
    return jsonify({"data": data})


@community_bp.route("/comments/my")
def my_comments():
    user_id = request.args.get("user_id", type=int)
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 10, type=int)
    offset = (page - 1) * page_size
    data = fetch_user_comments(user_id=user_id, offset=offset, limit=page_size)
    return jsonify({"data": data})


@community_bp.route("/comments/<int:comment_id>", methods=["DELETE"])
def delete_comment(comment_id):
    user_id = request.json.get("user_id")
    success = delete_comment_by_user(user_id, comment_id)
    if success:
        return jsonify({"message": "Deleted"})
    else:
        return jsonify({"message": "Delete failed"}), 400


@community_bp.route("/comments/messages/<int:user_id>")
def get_messages(user_id):
    """
    获取用户的所有回复消息
    """
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 10, type=int)
    offset = (page - 1) * page_size
    # 获取回复消息
    data = fetch_user_replies(user_id=user_id, offset=offset, limit=page_size)
    return jsonify({"success": True, "data": data})


@community_bp.route("/comments/wordcloud")
def get_wordcloud_image_source():
    img_base64 = generate_wordcloud_base64()
    if img_base64:
        return jsonify({"image": img_base64})
    else:
        return jsonify({"error": "暂无可用评论生成词云"}), 404
