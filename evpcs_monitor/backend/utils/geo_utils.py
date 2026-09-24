import os

from ratelimiter import RateLimiter
import requests


@RateLimiter(max_calls=5, period=1)  # API限制每秒调用次数为5次
def get_address_adcode_by_tencent(location, key):
    """
    利用腾讯地图 API 根据经纬度获取详细地址名称和行政区编码。

    参数：
    - location: 经纬度坐标（字符串，格式：纬度,经度）
    - key: 腾讯地图 API 密钥

    返回：
    - 返回详细地址名称
    """

    url = f"https://apis.map.qq.com/ws/geocoder/v1/"
    params = {
        "key": key,
        "location": location
    }

    try:
        response = requests.get(url, params=params)
        result = response.json()

        # 检查请求是否成功
        if result["status"] == 0:
            # 获取地址名称
            address = result["result"]["formatted_addresses"]["standard_address"]
            adcode = result["result"]["ad_info"]["adcode"]

            print(f'Request Tencent_API successful, obtain a address: {address}, obtain a adcode: {adcode}')
            return address, adcode
        else:
            print(f"Error: {result['message']}")
            return None
    except Exception as e:
        print(f"Request error: {e}")
        return None


def main():
    address = '北京市海淀区北四环西路66号'
    location = '39.984154,116.307490'
    key = os.getenv("TENCENT_MAP_KEY", "").strip()
    if not key:
        raise RuntimeError("未设置 TENCENT_MAP_KEY")
    address, adcode = get_address_adcode_by_tencent(location, key)
    print(type(address), type(adcode))


if __name__ == '__main__':
    main()
