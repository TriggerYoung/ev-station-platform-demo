from flask import Blueprint, jsonify
from .db_utils import get_station_locations, get_districts
import os
import json

locations_bp = Blueprint("locations", __name__)

# 设置数据存储目录
DATA_DIR = './network_data'

# 查询充电站的经纬度坐标信息、充电桩容量
@locations_bp.route("/", methods=["GET"])
def get_charging_station_locations():
    stations = get_station_locations()
    if stations is None:
        return jsonify({"status": "error", "message": "获取充电站数据失败"}), 500
    return jsonify(stations)

# 查询所有行政区的信息
@locations_bp.route("/districts", methods=["GET"])
def get_district_info():
    districts = get_districts()
    if districts is None:
        return jsonify({"status": "error", "message": "获取行政区信息失败"}), 500
    return jsonify(districts)

# 查询某个行政区下的社群数据
@locations_bp.route("/community/<district_code>", methods=["GET"])
def get_station_community_data_for_district(district_code):
    community_file = os.path.join(DATA_DIR, f"{district_code}_community.json")
    if os.path.exists(community_file):
        with open(community_file, 'r', encoding="utf-8") as f:
            community_data = json.load(f)
        return community_data
    else:
        return jsonify({"status": "error", "message": "该行政区社群数据不存在"}), 500


