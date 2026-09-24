import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { isDemoMode } from '../../demo/demoMode';

const ShenZhenWeather = () => {
    const [weather, setWeather] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isDemoMode()) {
            setWeather({ weather: '多云', temperature: '27', humidity: '68', winddirection: '东南', windpower: '2' });
            return;
        }

        const weatherApiKey = process.env.REACT_APP_AMAP_WEATHER_KEY;
        if (!weatherApiKey) {
            setError('天气服务未配置');
            return;
        }

        const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${encodeURIComponent(weatherApiKey)}&city=440300`;

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
