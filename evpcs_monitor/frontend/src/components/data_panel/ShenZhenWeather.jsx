import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ShenZhenWeather = () => {
    const [weather, setWeather] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // 高德天气API的url
        const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=766c44acbb2e8d26a2492abfbbbe7193&city=440300`;

        // 获取天气信息
        axios.get(url)
            .then(response => {
                if (response.data.status === '1') {
                    setWeather(response.data.lives[0]);
                } else {
                    setError('获取天气信息失败');
                }
            })
            .catch(err => {
                setError('请求天气数据失败');
            });
    }, []);

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }

    if (!weather) {
        return <div>加载中...</div>;
    }

    const { weather: weatherDescription, temperature, humidity, winddirection, windpower } = weather;

    return (
        <div style={{ color: 'white', fontSize: '16px' }}>
            <span>{`天气：${weatherDescription}，温度：${temperature}°C，湿度：${humidity}%`}</span>
        </div>
    );
};

export default ShenZhenWeather;
