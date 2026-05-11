# routes.py
from flask import Blueprint, request, jsonify
from .db_utils import validate_user, get_users, add_user, delete_user, update_user

users_bp = Blueprint("users", __name__)


# 用户登录验证
@users_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    is_valid, user_info = validate_user(username, password)
    if is_valid:
        return jsonify(
            {
                "success": True,
                "message": "Login successful",
                "role": user_info["role"],
                "user_id": user_info["user_id"],
            }
        )
    return jsonify({"success": False, "message": "Error username or password!"})


# 分页查询用户
@users_bp.route("/", methods=["GET"])
def get_users_api():
    # 获取参数
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("pageSize", 10))
    search = request.args.get("search", "").strip()
    sort_field = request.args.get("sortField", "created_at")
    sort_order = request.args.get("sortOrder", "DESC")

    users, total = get_users(page, page_size, search, sort_field, sort_order)
    if users is not None:
        return jsonify({"success": True, "data": {"items": users, "total": total}})
    return jsonify({"success": False, "message": "Failed to fetch users."})


# 添加用户
@users_bp.route("/", methods=["POST"])
def add_user_api():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "viewer")
    if add_user(username, password, role):
        return jsonify({"success": True, "message": "User added successfully."})
    return jsonify({"success": False, "message": "Failed to add user."})


# 删除用户
@users_bp.route("/<int:user_id>", methods=["DELETE"])
def delete_user_api(user_id):
    if delete_user(user_id):
        return jsonify({"success": True, "message": "User deleted successfully."})
    return jsonify({"success": False, "message": "Failed to delete user."})


# 更新用户
@users_bp.route("/<int:user_id>", methods=["PUT"])
def update_user_api(user_id):
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    if update_user(user_id, username, password, role):
        return jsonify({"success": True, "message": "User updated successfully."})
    return jsonify({"success": False, "message": "Failed to update user."})
