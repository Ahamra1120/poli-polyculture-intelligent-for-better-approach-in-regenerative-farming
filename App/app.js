// ECharts Instances
let tempChart, humidChart, soilMoistureChart, phChart, historyChart;

// Current Device Data State
const deviceData = {
    'greenhouse-1': { temp_air: 24.5, hum_air: 65, hum_soil: 45, ph_soil: 6.5 },
    'field-a': { temp_air: 28.2, hum_air: 55, hum_soil: 30, ph_soil: 5.8 },
    'orchard-b': { temp_air: 26.0, hum_air: 70, hum_soil: 60, ph_soil: 6.8 }
};

let currentDevice = 'greenhouse-1';

// History Data State
const maxHistoryItems = 10;
let historyTimes = [];
let historyTemps = [];
let historyHums = [];

// Theme Colors
const colors = {
    green: '#16a34a',
    blue: '#3b82f6',
    brown: '#d97706',
    purple: '#8b5cf6',
    textMain: '#1e293b',
    textMuted: '#64748b'
};

const fontConfig = {
    fontFamily: '"DM Mono", monospace'
};

// Initialize Charts
function initCharts() {
    tempChart = echarts.init(document.getElementById('tempChart'));
    humidChart = echarts.init(document.getElementById('humidChart'));
    soilMoistureChart = echarts.init(document.getElementById('soilMoistureChart'));
    phChart = echarts.init(document.getElementById('phChart'));
    historyChart = echarts.init(document.getElementById('historyChart'));

    // Common Gauge Config Template
    const getGaugeOption = (name, min, max, unit, color, val) => ({
        series: [
            {
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                center: ['50%', '75%'],
                radius: '100%',
                min: min,
                max: max,
                splitNumber: 4,
                axisLine: {
                    lineStyle: {
                        width: 10,
                        color: [
                            [1, '#e2e8f0']
                        ]
                    }
                },
                progress: {
                    show: true,
                    width: 10,
                    itemStyle: {
                        color: color
                    }
                },
                pointer: {
                    icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
                    length: '12%',
                    width: 20,
                    offsetCenter: [0, '-60%'],
                    itemStyle: {
                        color: 'auto'
                    }
                },
                axisTick: {
                    length: 12,
                    lineStyle: {
                        color: 'auto',
                        width: 2
                    }
                },
                splitLine: {
                    length: 20,
                    lineStyle: {
                        color: 'auto',
                        width: 5
                    }
                },
                axisLabel: {
                    color: colors.textMuted,
                    fontSize: 12,
                    distance: -40,
                    formatter: function (value) {
                        return value;
                    }
                },
                title: {
                    offsetCenter: [0, '-10%'],
                    fontSize: 14,
                    color: colors.textMuted,
                    fontFamily: '"DM Sans", sans-serif'
                },
                detail: {
                    fontSize: 28,
                    offsetCenter: [0, '0%'],
                    valueAnimation: true,
                    formatter: function (value) {
                        return '{value|' + value.toFixed(1) + '}{unit|' + unit + '}';
                    },
                    rich: {
                        value: {
                            fontSize: 32,
                            fontWeight: 'bolder',
                            color: colors.textMain,
                            fontFamily: fontConfig.fontFamily
                        },
                        unit: {
                            fontSize: 16,
                            color: colors.textMuted,
                            padding: [0, 0, -10, 5]
                        }
                    }
                },
                data: [
                    {
                        value: val,
                        name: ''
                    }
                ]
            }
        ]
    });

    // Initial Options
    tempChart.setOption(getGaugeOption('Temp', 0, 50, '°C', colors.green, deviceData[currentDevice].temp_air));
    humidChart.setOption(getGaugeOption('Humid', 0, 100, '%', colors.blue, deviceData[currentDevice].hum_air));
    soilMoistureChart.setOption(getGaugeOption('Soil', 0, 100, '%', colors.brown, deviceData[currentDevice].hum_soil));
    phChart.setOption(getGaugeOption('pH', 0, 14, '', colors.purple, deviceData[currentDevice].ph_soil));

    // History Chart
    const historyOption = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['Temperatur', 'Kelembaban'],
            bottom: 0,
            textStyle: { fontFamily: '"DM Sans", sans-serif' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: historyTimes,
            axisLabel: { fontFamily: fontConfig.fontFamily }
        },
        yAxis: {
            type: 'value',
            axisLabel: { fontFamily: fontConfig.fontFamily }
        },
        series: [
            {
                name: 'Temperatur',
                type: 'line',
                smooth: true,
                itemStyle: { color: colors.green },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(22, 163, 74, 0.4)' },
                        { offset: 1, color: 'rgba(22, 163, 74, 0.05)' }
                    ])
                },
                data: historyTemps
            },
            {
                name: 'Kelembaban',
                type: 'line',
                smooth: true,
                itemStyle: { color: colors.blue },
                data: historyHums
            }
        ]
    };
    historyChart.setOption(historyOption);
}

// Update charts with new data
function updateCharts(data, timestampStr) {
    tempChart.setOption({ series: [{ data: [{ value: data.temp_air }] }] });
    humidChart.setOption({ series: [{ data: [{ value: data.hum_air }] }] });
    soilMoistureChart.setOption({ series: [{ data: [{ value: data.hum_soil }] }] });
    phChart.setOption({ series: [{ data: [{ value: data.ph_soil }] }] });

    if (timestampStr) {
        // Extract time from 'yyyy-mm-dd hh:mm:ss'
        const timeOnly = timestampStr.split(' ')[1] || timestampStr;

        historyTimes.push(timeOnly);
        historyTemps.push(parseFloat(data.temp_air.toFixed(1)));
        historyHums.push(parseFloat(data.hum_air.toFixed(1)));

        if (historyTimes.length > maxHistoryItems) {
            historyTimes.shift();
            historyTemps.shift();
            historyHums.shift();
        }

        historyChart.setOption({
            xAxis: { data: historyTimes },
            series: [
                { data: historyTemps },
                { data: historyHums }
            ]
        });
    }
}

// MQTT Configuration
const mqttBrokerUrl = 'wss://broker.emqx.io:8084/mqtt';
const mqttOptions = {
    clientId: 'poli_web_' + Math.random().toString(16).substr(2, 8),
    keepalive: 60,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
};

let mqttClient;

function setupMQTT() {
    const statusIcon = document.getElementById('mqttStatusIcon');
    const statusText = document.getElementById('mqttStatusText');

    mqttClient = mqtt.connect(mqttBrokerUrl, mqttOptions);

    mqttClient.on('connect', () => {
        console.log('Connected to MQTT Broker: ' + mqttBrokerUrl);
        statusIcon.className = 'status-indicator connected';
        statusText.innerText = 'Terhubung';

        // Subscribe to predefined Hackathon topics
        mqttClient.subscribe('hackviet/data/sensors');
        mqttClient.subscribe('hackviet/data/gps');
        console.log('Subscribed to hackviet/data/sensors and hackviet/data/gps');
    });

    mqttClient.on('error', (err) => {
        console.error('MQTT Connection Error: ', err);
        statusIcon.className = 'status-indicator disconnected';
        statusText.innerText = 'Koneksi Gagal';
    });

    mqttClient.on('reconnect', () => {
        statusIcon.className = 'status-indicator connecting';
        statusText.innerText = 'Menghubungkan...';
    });

    mqttClient.on('message', (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());
            console.log(`Received data on ${topic}:`, payload);

            if (topic === 'hackviet/data/sensors') {
                // Update local state for current device
                if (payload.temp_air !== undefined) deviceData[currentDevice].temp_air = payload.temp_air;
                if (payload.hum_air !== undefined) deviceData[currentDevice].hum_air = payload.hum_air;
                if (payload.hum_soil !== undefined) deviceData[currentDevice].hum_soil = payload.hum_soil;
                if (payload.ph_soil !== undefined) deviceData[currentDevice].ph_soil = payload.ph_soil;

                // Update UI
                updateCharts(deviceData[currentDevice], payload.timestamp);
            } else if (topic === 'hackviet/data/gps') {
                // Update GPS Info UI
                if (payload.lat !== undefined) document.getElementById('gpsLat').innerText = payload.lat.toFixed(6);
                if (payload.long !== undefined) document.getElementById('gpsLong').innerText = payload.long.toFixed(6);
                if (payload.timestamp !== undefined) document.getElementById('gpsTime').innerText = `Diperbarui: ${payload.timestamp}`;
            }
        } catch (e) {
            console.error('Failed to parse MQTT message:', e);
        }
    });
}

// Device Selector Logic
document.getElementById('deviceSelect').addEventListener('change', (e) => {
    currentDevice = e.target.value;

    // Clear history on device change
    historyTimes = [];
    historyTemps = [];
    historyHums = [];
    historyChart.setOption({ xAxis: { data: historyTimes }, series: [{ data: historyTemps }, { data: historyHums }] });

    updateCharts(deviceData[currentDevice]);
});

// Window Resize Handling
window.addEventListener('resize', () => {
    tempChart.resize();
    humidChart.resize();
    soilMoistureChart.resize();
    phChart.resize();
    historyChart.resize();
});

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    setupMQTT();

    // Simulate incoming MQTT data for demonstration if no actual publisher exists
    setInterval(() => {
        if (!mqttClient || !mqttClient.connected) return;

        // Randomly fluctuate values slightly to show real-time effect
        const data = deviceData[currentDevice];

        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

        const SensorPayload = {
            timestamp: timestamp,
            temp_air: data.temp_air + (Math.random() * 0.4 - 0.2),
            hum_air: data.hum_air + (Math.random() * 1 - 0.5),
            hum_soil: data.hum_soil + (Math.random() * 1 - 0.5),
            ph_soil: data.ph_soil + (Math.random() * 0.1 - 0.05)
        };

        const GpsPayload = {
            timestamp: timestamp,
            lat: -6.200000 + (Math.random() * 0.001 - 0.0005),
            long: 106.816666 + (Math.random() * 0.001 - 0.0005)
        };

        // Publish to broker so our own app receives it
        mqttClient.publish('hackviet/data/sensors', JSON.stringify(SensorPayload));
        mqttClient.publish('hackviet/data/gps', JSON.stringify(GpsPayload));
    }, 5000);
});

// Tab Switching Logic
function showSection(sectionId, element) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Remove active class from nav
    document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId + 'Section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Add active class to clicked element
    if (element) {
        element.classList.add('active');
    }

    // Update Header Text
    const title = document.querySelector('#pageTitle');
    const subtitle = document.querySelector('#pageSubtitle');

    if (sectionId === 'dashboard') {
        title.innerText = 'Pemantauan Lahan';
        subtitle.innerText = 'Pantau kondisi tanaman Anda secara real-time';
        // Resize charts to fix ECharts visibility issues when container was hidden
        setTimeout(() => {
            if(tempChart) tempChart.resize();
            if(humidChart) humidChart.resize();
            if(soilMoistureChart) soilMoistureChart.resize();
            if(phChart) phChart.resize();
            if(historyChart) historyChart.resize();
        }, 100);
    } else if (sectionId === 'analysis') {
        title.innerText = 'Analisis Data';
        subtitle.innerText = 'Wawasan mendalam tentang tren lingkungan pertanian Anda';
        if (!window.analysisChartInit) {
            initAnalysisChart();
            window.analysisChartInit = true;
        } else {
            setTimeout(() => window.chart1 && window.chart1.resize(), 100);
        }
    } else if (sectionId === 'settings') {
        title.innerText = 'Pengaturan';
        subtitle.innerText = 'Sesuaikan profil dan preferensi perangkat Anda';
    }
}

// Global reference for analysis chart
window.chart1 = null;
window.analysisChartInit = false;
function initAnalysisChart() {
    setTimeout(() => {
        const chartEl = document.getElementById('analysisChart1');
        if (chartEl) {
            window.chart1 = echarts.init(chartEl);
            window.chart1.setOption({
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] },
                yAxis: { type: 'value', name: '%' },
                series: [{
                    data: [45, 42, 38, 60, 58, 52, 48],
                    type: 'bar',
                    itemStyle: { color: '#d97706', borderRadius: [4, 4, 0, 0] }
                }]
            });
            window.addEventListener('resize', () => window.chart1 && window.chart1.resize());
        }
    }, 100);
}

