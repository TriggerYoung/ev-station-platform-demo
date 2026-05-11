# routes.py
from flask import Blueprint, jsonify, request
from .db_utils import get_stations, get_districts, get_realtime_field_data, get_price_data, get_occupancy_rate_ranking


datapanel_bp = Blueprint("datapanel", __name__)


# 查询充电站的经纬度坐标信息、充电桩容量
@datapanel_bp.route("/stations", methods=["GET"])
def get_station_locations_info():
    stations = get_stations()
    if stations is None:
        return jsonify({"status": "error", "message": "获取充电站数据失败"}), 500
    return jsonify(stations)


# 查询所有行政区的信息
@datapanel_bp.route("/districts", methods=["GET"])
def get_district_info():
    districts = get_districts()
    if districts is None:
        return jsonify({"status": "error", "message": "获取行政区信息失败"}), 500
    return jsonify(districts)


# 查询实时充电量信息
@datapanel_bp.route("/realtime/volume", methods=["GET"])
def get_realtime_volume_info():
    start_time = request.args.get('start', default="2022-09-01T00:00:00Z")  # 默认时间是2022-09-01T00:00:00Z
    data = get_realtime_field_data(start=start_time, field="volume")
    return jsonify(data)


# 查询实时充电量信息
@datapanel_bp.route("/realtime/occupancy", methods=["GET"])
def get_realtime_occupancy_info():
    start_time = request.args.get('start', default="2022-09-01T00:00:00Z")  # 默认时间是2022-09-01T00:00:00Z
    data = get_realtime_field_data(start=start_time, field="occupancy")
    return jsonify(data)


# 查询平均价格信息
@datapanel_bp.route("/realtime/price", methods=["GET"])
def get_realtime_price_info():
    start_time = request.args.get('start', default="2022-09-01T00:00:00Z")  # 默认时间是2022-09-01T00:00:00Z
    s_price = get_price_data(start=start_time, field="s_price")  # 查询服务价格
    e_price = get_price_data(start=start_time, field="e_price")  # 查询电价
    data = []
    
    # 确保服务价格和电价数据长度一致
    if len(s_price) == len(e_price):
        for i in range(len(s_price)):
            data.append({
                'time': s_price[i]['time'],
                'service_price': s_price[i]['value'],
                'electric_price': e_price[i]['value']
            })
    
    return jsonify(data)


@datapanel_bp.route('/realtime/occupancy_ranking', methods=['GET'])
def get_occupancy_ranking_route():
    """
    获取充电站的占用率排名
    请求参数：
    - start: 时间段的开始时间（可选），格式为 "YYYY-MM-DDTHH:MM:SSZ"（默认为 "2022-09-01T00:00:00Z"）
    
    返回：
    - 时间段内按占用率排名的充电站列表
    """
    # 从请求中获取时间段的开始时间，若无则使用默认值
    start_time = request.args.get('start', default="2022-09-01T00:00:00Z")  # 默认时间是2022-09-01T00:00:00Z

    try:
        # 调用数据库处理函数获取占用率排名
        ranking = get_occupancy_rate_ranking(start=start_time)

        # 返回排名数据
        return jsonify(ranking)
    except Exception as e:
        print(f"API 调用失败: {e}")
        return jsonify({"error": "查询失败"}), 500
