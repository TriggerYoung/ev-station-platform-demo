# routes.py

from flask import Blueprint, jsonify, request
from .db_utils import add_business_data, get_all_business_data, delete_business_data, mark_business_as_read

business_bp = Blueprint("business", __name__)

@business_bp.route("/submit", methods=["POST"])
def submit_business():
    try:
        data = request.get_json()
        add_business_data(data)
        return jsonify({"message": "提交成功"}), 200
    except Exception as e:
        return jsonify({"message": "提交失败", "error": str(e)}), 500

@business_bp.route("/list", methods=["GET"])
def list_business():
    try:
        data = get_all_business_data()
        return jsonify({"data": data}), 200
    except Exception as e:
        return jsonify({"message": "获取失败", "error": str(e)}), 500

@business_bp.route("/delete/<int:item_id>", methods=["DELETE"])
def delete_business(item_id):
    try:
        delete_business_data(item_id)
        return jsonify({"message": "删除成功"}), 200
    except Exception as e:
        return jsonify({"message": "删除失败", "error": str(e)}), 500

@business_bp.route("/mark_read/<int:item_id>", methods=["POST"])
def mark_read(item_id):
    try:
        mark_business_as_read(item_id)
        return jsonify({"message": "已设为已读"}), 200
    except Exception as e:
        return jsonify({"message": "设置失败", "error": str(e)}), 500
