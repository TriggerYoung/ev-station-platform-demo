from flask import Blueprint, jsonify, request
from .db_utils import (
    get_districts,
    get_stations_by_adcode,
    get_piles_by_station,
    add_pile,
    update_pile,
    delete_pile,
    delete_piles_batch,
)

piles_bp = Blueprint("piles", __name__)


# 获取所有行政区
@piles_bp.route("/districts", methods=["GET"])
def get_districts_route():
    districts = get_districts()
    if districts is not None:
        return jsonify({"success": True, "data": districts})
    return jsonify({"success": False, "message": "Failed to fetch districts."})


# 获取指定行政区的充电站
@piles_bp.route("/stations", methods=["GET"])
def get_stations_route():
    adcode = request.args.get("adcode")
    if not adcode:
        return jsonify({"success": False, "message": "Missing adcode parameter."})

    stations = get_stations_by_adcode(adcode)
    if stations is not None:
        return jsonify({"success": True, "data": stations})
    return jsonify({"success": False, "message": "Failed to fetch stations."})


# 获取指定充电站的充电桩
@piles_bp.route("/piles", methods=["GET"])
def get_piles_route():
    station_id = request.args.get("station_id")
    if not station_id:
        return jsonify({"success": False, "message": "Missing station_id parameter."})

    piles = get_piles_by_station(station_id)
    if piles is not None:
        return jsonify({"success": True, "data": piles})
    return jsonify({"success": False, "message": "Failed to fetch piles."})


# 添加充电桩
@piles_bp.route("/add", methods=["POST"])
def add_pile_route():
    data = request.get_json()

    required_fields = [
        "pile_id",
        "station_id",
        "charging_type",
        "charging_power",
        "connector_type",
        "location_desc",
        "maintenance_needed",
    ]
    if not all(field in data for field in required_fields):
        return jsonify({"success": False, "message": "Missing required fields."})

    success = add_pile(**data)
    return jsonify(
        {
            "success": success,
            "message": (
                "Charging pile added successfully."
                if success
                else "Failed to add charging pile."
            ),
        }
    )


# 更新充电桩信息
@piles_bp.route("/update/<pile_id>", methods=["PUT"])
def update_pile_route(pile_id):  # 接收 pile_id
    data = request.get_json()

    required_fields = [
        "station_id",
        "charging_type",
        "charging_power",
        "connector_type",
        "location_desc",
        "maintenance_needed",
    ]
    if not all(field in data for field in required_fields):
        return jsonify({"success": False, "message": "Missing required fields."})

    # pile_id 到 data 中
    data["pile_id"] = pile_id

    success = update_pile(**data)
    return jsonify(
        {
            "success": success,
            "message": (
                "Charging pile updated successfully."
                if success
                else "Failed to update charging pile."
            ),
        }
    )


# 删除充电桩
@piles_bp.route("/delete", methods=["DELETE"])
def delete_pile_route():
    data = request.get_json()
    pile_id = data.get("pile_id")
    station_id = data.get("station_id")
    print("删除充电桩pile_id:", pile_id, "删除充电桩station_id:", station_id)
    if not pile_id or not station_id:
        return jsonify({"success": False, "message": "Missing pile_id or station_id."})

    success = delete_pile(pile_id, station_id)
    return jsonify(
        {
            "success": success,
            "message": (
                "Charging pile deleted successfully."
                if success
                else "Failed to delete charging pile."
            ),
        }
    )


# 批量删除充电桩
@piles_bp.route("/delete_batch", methods=["POST"])
def delete_piles_batch_route():
    data = request.get_json()
    pile_ids = data.get("pile_ids", [])
    station_id = data.get("station_id")

    if not pile_ids or not station_id:
        return jsonify({"success": False, "message": "Missing pile_ids or station_id."})

    success = delete_piles_batch(pile_ids, station_id)
    return jsonify(
        {
            "success": success,
            "message": (
                "Charging piles deleted successfully."
                if success
                else "Failed to delete charging piles."
            ),
        }
    )
