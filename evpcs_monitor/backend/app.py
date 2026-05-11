# app.py — Flask API entry; blueprint layout matches frontend routes.
# UI stills: root README「页面展示」, docs/screenshots/*.png
from pathlib import Path

from dotenv import load_dotenv

# 在导入业务模块前加载 backend/.env（与 app.py 同目录）
load_dotenv(Path(__file__).resolve().parent / ".env")

from flask import Flask
from flask_cors import CORS
from info_maintenance.users.routes import users_bp
from info_maintenance.charging_stations.routes import stations_bp
from info_maintenance.charging_piles.routes import piles_bp
from info_maintenance.districts.routes import districts_bp
from info_maintenance.charging_time_data.routes import ctdata_bp
from network_analysis.routes import locations_bp
from data_panel.routes import datapanel_bp
from analysis_report.routes import analysis_bp
from business.routes import business_bp
from community.routes import community_bp

app = Flask(__name__)

# 启用 CORS 支持
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# 注册蓝图（与前端路由对应；说明见根目录 README）
app.register_blueprint(stations_bp, url_prefix="/api/stations")
app.register_blueprint(piles_bp, url_prefix="/api/piles")
app.register_blueprint(users_bp, url_prefix="/api/users")
app.register_blueprint(districts_bp, url_prefix="/api/districts")
app.register_blueprint(ctdata_bp, url_prefix="/api/ctdata")
app.register_blueprint(locations_bp, url_prefix="/api/locations")
app.register_blueprint(datapanel_bp, url_prefix="/api/datapanel")
app.register_blueprint(analysis_bp, url_prefix="/api/analysis")
app.register_blueprint(business_bp, url_prefix="/api/business")
app.register_blueprint(community_bp, url_prefix="/api/community")


if __name__ == "__main__":
    app.run()
