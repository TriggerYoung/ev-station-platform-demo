# routes.py
from flask import Blueprint, request, jsonify, Response
from .db_utils import (
    get_stations,
    add_station,
    update_station,
    delete_station,
    batch_delete_stations,
    upsert_station,
    batch_download_stations,
)
import os
from werkzeug.utils import secure_filename
import openpyxl
import csv

stations_bp = Blueprint("stations", __name__)


# 查询充电站
@stations_bp.route("/", methods=["GET"])
def get_charging_stations():
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("pageSize", 10))
    search = request.args.get("search", "").strip()
    sort_field = request.args.get("sortField", "created_at")
    sort_order = request.args.get("sortOrder", "DESC")

    stations, total = get_stations(
        page=page,
        page_size=page_size,
        search=search,
        sort_field=sort_field,
        sort_order=sort_order,
    )

    if stations is not None:
        return jsonify({"success": True, "data": {"items": stations, "total": total}})
    return jsonify({"success": False, "message": "Failed to fetch charging stations."})


# 添加充电站（新增）
@stations_bp.route("/", methods=["POST"])
def add_charging_station():
    data = request.get_json()
    station_id = data.get("station_id")
    longitude = data.get("longitude")
    latitude = data.get("latitude")
    pile_count = data.get("pile_count", 0)
    address = data.get("address")
    adcode = data.get("adcode")
    has_parking_fee = data.get("has_parking_fee", 0)
    status = data.get("status", 1)
    if add_station(
        station_id,
        longitude,
        latitude,
        pile_count,
        address,
        adcode,
        has_parking_fee,
        status,
    ):
        return jsonify(
            {"success": True, "message": "Charging station added successfully."}
        )
    return jsonify({"success": False, "message": "Failed to add charging station."})


# 删除充电站
@stations_bp.route("/<station_id>", methods=["DELETE"])
def delete_charging_station(station_id):
    if delete_station(station_id):
        return jsonify(
            {"success": True, "message": "Charging station deleted successfully."}
        )
    return jsonify({"success": False, "message": "Failed to delete charging station."})


# 更新充电站
@stations_bp.route("/<station_id>", methods=["PUT"])
def update_charging_station(station_id):
    data = request.get_json()
    longitude = data.get("longitude")
    latitude = data.get("latitude")
    pile_count = data.get("pile_count")
    address = data.get("address")
    adcode = data.get("adcode")
    has_parking_fee = data.get("has_parking_fee")
    status = data.get("status")
    if update_station(
        station_id,
        longitude,
        latitude,
        pile_count,
        address,
        adcode,
        has_parking_fee,
        status,
    ):
        return jsonify(
            {"success": True, "message": "Charging station updated successfully."}
        )
    return jsonify({"success": False, "message": "Failed to update charging station."})


# 批量删除充电站
@stations_bp.route("/delete_batch", methods=["POST"])
def delete_charging_stations_batch():
    try:
        data = request.get_json()
        station_ids = data.get("station_ids")

        if not station_ids or not isinstance(station_ids, list):
            return jsonify({"success": False, "message": "Invalid station IDs"}), 400

        success = batch_delete_stations(station_ids)

        if success:
            return jsonify(
                {"success": True, "message": "Charging stations deleted successfully."}
            )
        else:
            return (
                jsonify(
                    {"success": False, "message": "Failed to delete charging stations."}
                ),
                500,
            )

    except Exception as e:
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


# 上传文件接口（支持 CSV 和 Excel 文件）
@stations_bp.route("/upload", methods=["POST"])
def upload_stations():
    if "file" not in request.files:
        return (
            jsonify({"success": False, "message": "No file part in the request"}),
            400,
        )

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "message": "No file selected"}), 400

    # 安全化文件名并保存到 uploads 文件夹
    filename = secure_filename(file.filename)
    upload_folder = os.path.join(os.getcwd(), "uploads")
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    # 根据文件扩展名解析文件内容
    try:
        stations = []
        if filename.lower().endswith(".csv"):
            with open(file_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                stations = [row for row in reader]
        else:
            wb = openpyxl.load_workbook(file_path)
            ws = wb.active
            rows = list(ws.rows)
            if not rows or len(rows) < 2:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Uploaded file is empty or has no data",
                        }
                    ),
                    400,
                )
            headers = [cell.value for cell in rows[0]]
            for row in rows[1:]:
                station = {headers[i]: row[i].value for i in range(len(headers))}
                stations.append(station)

        # 遍历解析到的数据，依次进行插入或更新操作
        success_count = 0
        for station in stations:
            res = upsert_station(
                station.get("station_id"),
                station.get("longitude"),
                station.get("latitude"),
                station.get("pile_count", 0),
                station.get("address"),
                station.get("adcode"),
                station.get("has_parking_fee", 0),
                station.get("status", 1),
            )
            if res:
                success_count += 1

        return jsonify(
            {
                "success": True,
                "message": f"File uploaded and processed successfully. {success_count} stations added/updated.",
            }
        )

    except Exception as e:
        print(e)
        return (
            jsonify({"success": False, "message": f"Error processing file: {str(e)}"}),
            500,
        )


@stations_bp.route("/download", methods=["POST"])
def download_charging_stations():
    """
    批量下载充电站数据接口：
    接收 JSON 参数：
      {
         "columns": ["station_id", "longitude", "latitude", ...]  // 可选，不传则导出所有字段
      }
    返回生成的 Excel 文件。
    """
    try:
        data = request.get_json() or {}
        columns = data.get("columns")
        
        file_bytes = batch_download_stations(columns=columns)
        if file_bytes is None:
            return (
                jsonify(
                    {"success": False, "message": "Failed to generate download file."}
                ),
                500,
            )

        response = Response(
            file_bytes,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response.headers["Content-Disposition"] = (
            "attachment; filename=ChargingStations.xlsx"
        )
        return response

    except Exception as e:
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500
