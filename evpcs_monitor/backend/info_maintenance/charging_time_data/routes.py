# charging_time_data/routes.py
from flask import Blueprint, jsonify, request
from .db_utils import query_ctdata

ctdata_bp = Blueprint("ctdata", __name__)


@ctdata_bp.route("/", methods=["GET"])
def get_ctdata():
    """
    根据查询参数返回 "charging_data" 测量的时序数据：
      - station_id: 可选，过滤指定充电站数据
      - start, stop: 起止时间（ISO 格式），例如 "2022-09-01T00:00:00Z"
      - fields: 逗号分隔的字段列表，例如 "volume,occupancy,duration,e_price,s_price"
    通过 pivot 处理后，每个记录包含 time、station_id 及各字段。
    """
    station_id = request.args.get("station_id", default=None, type=str)
    start = request.args.get("start", default="2022-09-01T00:00:00Z", type=str)
    stop = request.args.get("stop", default="2022-09-02T00:00:00Z", type=str)
    fields = request.args.get("fields", default=None, type=str)
    print("接收参数：\n",station_id, start, stop, fields)
    try:
        result = query_ctdata(
            station_id=station_id, start=start, stop=stop, fields=fields
        )
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    station_id = input("请输入要查询的 station_id：").strip() or None
    result = query_ctdata(station_id=station_id)
    print(result)
