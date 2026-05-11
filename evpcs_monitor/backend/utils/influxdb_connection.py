import os
import subprocess
import time
import shutil
import requests
from influxdb_client import InfluxDBClient, WriteOptions

# ---- 配置区域（勿在代码中写真实 Token，使用环境变量）----
INFLUXDB_TOKEN = os.getenv("INFLUXDB_TOKEN", "")
INFLUXDB_URL = os.getenv("INFLUXDB_URL", "http://localhost:8086")
INFLUXDB_ORG = os.getenv("INFLUXDB_ORG", "myorg")
INFLUXDB_BUCKET = os.getenv("INFLUXDB_BUCKET", "charging_data")

# Mac 上查找 influxd 可执行文件
def find_influxd():
    # 1. 尝试 PATH 中查找
    path = shutil.which("influxd")
    if path:
        return path
    # 2. Homebrew 默认路径 (Apple Silicon / Intel)
    for prefix in ("/opt/homebrew/bin", "/usr/local/bin"):
        candidate = os.path.join(prefix, "influxd")
        if os.path.isfile(candidate):
            return candidate
    return None

INFLUXD_PATH = find_influxd()

# ---- 工具函数 ----

def is_influxdb_running():
    """检测 InfluxDB 是否在 8086 端口响应."""
    try:
        resp = requests.get(f"{INFLUXDB_URL}/ping", timeout=2)
        return resp.status_code == 204
    except Exception:
        return False

def start_influxdb():
    """macOS 下启动 InfluxDB，如果没有在运行，则后台启动 influxd."""
    if is_influxdb_running():
        return

    if not INFLUXD_PATH:
        print("[错误] 找不到 influxd 可执行文件，请确认已安装并在 PATH 中。")
        exit(1)

    print("[提示] InfluxDB 未运行，正在从可执行文件启动...")
    # 后台启动，不阻塞当前脚本
    subprocess.Popen([INFLUXD_PATH], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(5)

    if is_influxdb_running():
        print("[成功] InfluxDB 已启动。")
    else:
        print("[错误] 启动 InfluxDB 失败，请检查日志或手动启动。")
        exit(1)

def get_influxdb_client():
    """获取 InfluxDB 客户端及各子 API（写、查询、删除）."""
    if not INFLUXDB_TOKEN:
        print(
            "[错误] 未设置环境变量 INFLUXDB_TOKEN。请在本机执行 InfluxDB 初始化后，"
            "将管理员 Token 写入环境变量（可参考 backend/.env.example）。"
        )
        exit(1)

    start_influxdb()

    try:
        client = InfluxDBClient(
            url=INFLUXDB_URL,
            token=INFLUXDB_TOKEN,
            org=INFLUXDB_ORG,
            timeout=30_000
        )
        write_api = client.write_api(write_options=WriteOptions(batch_size=500, flush_interval=1_000))
        query_api = client.query_api()
        delete_api= client.delete_api()

        print(f"成功连接到 InfluxDB：{INFLUXDB_URL}")
        print(f"组织: {INFLUXDB_ORG}，Bucket: {INFLUXDB_BUCKET}")
        return client, write_api, query_api, delete_api

    except Exception as e:
        print(f"[错误] 连接 InfluxDB 失败: {e}")
        exit(1)

if __name__ == "__main__":
    get_influxdb_client()
