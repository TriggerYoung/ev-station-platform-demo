from flask import Blueprint, jsonify
from .db_utils import get_districts_summary

districts_bp = Blueprint("districts", __name__)

@districts_bp.route("/", methods=["GET"])
def get_districts():
    """ API 端点：获取行政区统计信息 """
    districts = get_districts_summary()

    if districts is None:
        return jsonify({"success": False, "error": "数据库连接失败"}), 500

    if not districts:
        return jsonify({"success": False, "error": "未找到行政区数据"}), 404

    return jsonify(districts)
