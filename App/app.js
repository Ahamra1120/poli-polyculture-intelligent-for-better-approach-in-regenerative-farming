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
const enableMockPublisher = false;
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

                if (typeof updateLiveSensorView === 'function') {
                    updateLiveSensorView(payload, null);
                }
            } else if (topic === 'hackviet/data/gps') {
                // Update GPS Info UI
                if (payload.lat !== undefined) document.getElementById('gpsLat').innerText = payload.lat.toFixed(6);
                if (payload.long !== undefined) document.getElementById('gpsLong').innerText = payload.long.toFixed(6);
                if (payload.timestamp !== undefined) document.getElementById('gpsTime').innerText = `Diperbarui: ${payload.timestamp}`;

                if (typeof updateLiveSensorView === 'function') {
                    updateLiveSensorView(null, payload);
                }
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
    if (!enableMockPublisher) return;

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
<<<<<<< HEAD

// --- Bed Management & Plant Analysis Logic ---

// State
let beds = [];
let currentPingSession = [];
let latestSensorData = null;
let latestGpsData = null;

// Mock Plant Database (dapat disesuaikan dengan DATABASE TANAMAN.pdf)
const plantDatabase = [
    { id: 'padi', name: 'Padi', idealTemp: [25, 30], idealHum: [60, 80], idealSoilHum: [70, 90], idealPh: [5.5, 6.5] },
    { id: 'jagung', name: 'Jagung', idealTemp: [21, 27], idealHum: [50, 70], idealSoilHum: [50, 70], idealPh: [5.8, 7.0] },
    { id: 'tomat', name: 'Tomat', idealTemp: [20, 26], idealHum: [60, 70], idealSoilHum: [60, 80], idealPh: [6.0, 6.8] }
];

// Initialize UI elements
const addBedBtn = document.getElementById('addBedBtn');
const pingModal = document.getElementById('pingModal');
const cancelPingBtn = document.getElementById('cancelPingBtn');
const recordPingLiveBtn = document.getElementById('recordPingLiveBtn');
const recordPingDemoBtn = document.getElementById('recordPingDemoBtn');
const finishBedBtn = document.getElementById('finishBedBtn');
const pingCountEl = document.getElementById('pingCount');
const liveSensorDataEl = document.getElementById('liveSensorData');
const pingListEl = document.getElementById('pingList');
const bedListEl = document.getElementById('bedList');
const bedMapLayer = document.getElementById('bedMapLayer');
const mapInstructions = document.getElementById('mapInstructions');

const plantAnalysisModal = document.getElementById('plantAnalysisModal');
const closeAnalysisBtn = document.getElementById('closeAnalysisBtn');
const plantSelect = document.getElementById('plantSelect');
let analyzingBedIndex = null;

if (plantSelect) {
    // Populate Plant Select
    plantDatabase.forEach(plant => {
        const opt = document.createElement('option');
        opt.value = plant.id;
        opt.textContent = plant.name;
        plantSelect.appendChild(opt);
    });
}

// Event Listeners for Bed Management
if (addBedBtn) {
    addBedBtn.addEventListener('click', () => {
        currentPingSession = [];
        updatePingUI();
        pingModal.style.display = 'flex';
    });
}

if (cancelPingBtn) {
    cancelPingBtn.addEventListener('click', () => {
        pingModal.style.display = 'none';
    });
}

if (recordPingLiveBtn) {
    recordPingLiveBtn.addEventListener('click', () => {
        if (!latestSensorData || !latestGpsData) {
            alert("Data sensor atau GPS live belum tersedia. Tunggu perangkat fisik (Hardware) mengirim data melalui MQTT.");
            return;
        }
        
        const pingData = {
            id: currentPingSession.length + 1,
            timestamp: new Date().toLocaleTimeString(),
            temp: latestSensorData.temp_air,
            hum: latestSensorData.hum_air,
            soilHum: latestSensorData.hum_soil,
            ph: latestSensorData.ph_soil,
            lat: latestGpsData.lat,
            long: latestGpsData.long
        };
        
        currentPingSession.push(pingData);
        updatePingUI();
    });
}

if (recordPingDemoBtn) {
    recordPingDemoBtn.addEventListener('click', () => {
        // Titik pusat awal (contoh: lahan utama)
        const baseLat = -6.200000;
        const baseLong = 106.816666;
        
        // Tentukan bentuk bangun datar berdasarkan jumlah bedeng yang sudah ada
        // (selang-seling antara Kotak(4), Segi Lima(5), dan Segi Enam(6))
        const sides = beds.length % 3 === 0 ? 4 : (beds.length % 3 === 1 ? 5 : 6); 
        const radius = 0.0008; // Jarak dari titik tengah ke sudut bangun datar
        
        const pingIndex = currentPingSession.length;
        
        // Hitung sudut (angle) untuk titik sudut bangun datar yang sedang digambar
        // Jika user melakukan ping lebih dari jumlah sudut (misal 5 kali ping di kotak), titik akan kembali ke awal (loop).
        const angle = (Math.PI * 2 * pingIndex) / sides;
        
        // Tambahkan pergeseran (offset) antar-bedeng agar bedeng baru tidak menimpa bedeng lama di peta
        const bedShiftX = (beds.length % 3) * 0.002;
        const bedShiftY = Math.floor(beds.length / 3) * 0.002;
        
        // Kalkulasi posisi persis menggunakan trigonometri
        const offsetLat = Math.cos(angle) * radius + bedShiftY;
        const offsetLong = Math.sin(angle) * radius + bedShiftX;
        
        const pingData = {
            id: currentPingSession.length + 1,
            timestamp: new Date().toLocaleTimeString(),
            temp: 24.0 + (Math.random() * 6), // 24 to 30
            hum: 50.0 + (Math.random() * 30), // 50 to 80
            soilHum: 40.0 + (Math.random() * 40), // 40 to 80
            ph: 5.0 + (Math.random() * 2.5), // 5.0 to 7.5
            lat: baseLat + offsetLat,
            long: baseLong + offsetLong
        };
        
        currentPingSession.push(pingData);
        updatePingUI();
    });
}

if (finishBedBtn) {
    finishBedBtn.addEventListener('click', () => {
        if (currentPingSession.length < 3) return;
        
        // Calculate summary
        let sumTemp = 0, sumHum = 0, sumSoil = 0, sumPh = 0;
        currentPingSession.forEach(p => {
            sumTemp += p.temp;
            sumHum += p.hum;
            sumSoil += p.soilHum;
            sumPh += p.ph;
        });
        
        const count = currentPingSession.length;
        const bedSummary = {
            avgTemp: +(sumTemp / count).toFixed(1),
            avgHum: +(sumHum / count).toFixed(1),
            avgSoil: +(sumSoil / count).toFixed(1),
            avgPh: +(sumPh / count).toFixed(1)
        };
        
        const newBed = {
            id: beds.length + 1,
            name: `Bedeng ${beds.length + 1}`,
            pings: [...currentPingSession],
            summary: bedSummary
        };
        
        beds.push(newBed);
        pingModal.style.display = 'none';
        
        renderBedList();
        renderMap();
    });
}

function updatePingUI() {
    pingCountEl.innerText = currentPingSession.length;
    
    pingListEl.innerHTML = '';
    currentPingSession.forEach(p => {
        const li = document.createElement('li');
        li.style.borderBottom = '1px dashed #e2e8f0';
        li.style.paddingBottom = '0.5rem';
        li.innerHTML = `<strong>Ping #${p.id}</strong> (${p.timestamp}) - GPS: ${p.lat.toFixed(5)}, ${p.long.toFixed(5)} <br> <span style="color:var(--text-muted)">Suhu: ${p.temp.toFixed(1)}°C, pH: ${p.ph.toFixed(1)}</span>`;
        pingListEl.appendChild(li);
    });
    
    if (currentPingSession.length >= 3) {
        finishBedBtn.disabled = false;
        finishBedBtn.style.opacity = '1';
    } else {
        finishBedBtn.disabled = true;
        finishBedBtn.style.opacity = '0.5';
    }
}

// Global update hook for MQTT data
function updateLiveSensorView(sensor, gps) {
    if (sensor && sensor.temp_air !== undefined) latestSensorData = sensor;
    if (gps && gps.lat !== undefined) latestGpsData = gps;
    
    if (pingModal && pingModal.style.display === 'flex' && latestSensorData && latestGpsData) {
        liveSensorDataEl.innerHTML = `
            <strong>Data Sensor Tersedia:</strong><br>
            Suhu: <strong>${latestSensorData.temp_air.toFixed(1)}°C</strong> | pH: <strong>${latestSensorData.ph_soil.toFixed(1)}</strong><br>
            Kel. Udara: <strong>${latestSensorData.hum_air.toFixed(1)}%</strong> | Kel. Tanah: <strong>${latestSensorData.hum_soil.toFixed(1)}%</strong><br>
            GPS: <strong>${latestGpsData.lat.toFixed(6)}, ${latestGpsData.long.toFixed(6)}</strong>
        `;
    }
}

function renderBedList() {
    if(!bedListEl) return;
    bedListEl.innerHTML = '';
    beds.forEach((bed, index) => {
        const card = document.createElement('div');
        card.className = 'bed-card';
        card.innerHTML = `
            <div class="bed-card-header">
                <div class="bed-card-title"><i class="ph ph-bounding-box" style="color: var(--primary-green);"></i> ${bed.name}</div>
                <span class="sensor-type" style="background: var(--primary-light); color: var(--primary-dark); border: 1px solid rgba(22,163,74,0.3);">${bed.pings.length} Titik</span>
            </div>
            <div class="bed-card-stats">
                <div class="stat-item"><i class="ph ph-thermometer" style="color: var(--accent-brown);"></i> ${bed.summary.avgTemp}°C</div>
                <div class="stat-item"><i class="ph ph-drop" style="color: var(--accent-blue);"></i> ${bed.summary.avgHum}%</div>
                <div class="stat-item"><i class="ph ph-waves" style="color: var(--primary-green);"></i> ${bed.summary.avgSoil}%</div>
                <div class="stat-item"><i class="ph ph-flask" style="color: var(--accent-purple);"></i> pH ${bed.summary.avgPh}</div>
            </div>
            <button class="btn-primary" style="padding: 0.6rem; font-size: 0.85rem; margin-top: 0.5rem; background: var(--bg-color); color: var(--primary-green); border: 1px solid var(--primary-green);" onclick="openAnalysis(${index})">
                <i class="ph ph-magic-wand"></i> Cek Kebutuhan Tanaman
            </button>
        `;
        bedListEl.appendChild(card);
    });
}

function renderMap() {
    if(!bedMapLayer) return;
    bedMapLayer.innerHTML = '';
    
    if (beds.length === 0) {
        if(mapInstructions) mapInstructions.style.display = 'block';
        return;
    }
    
    if(mapInstructions) mapInstructions.style.display = 'none';
    
    // Find min/max to establish map bounds (Scale to fit)
    let minLat = 90, maxLat = -90, minLong = 180, maxLong = -180;
    
    beds.forEach(bed => {
        bed.pings.forEach(p => {
            if (p.lat < minLat) minLat = p.lat;
            if (p.lat > maxLat) maxLat = p.lat;
            if (p.long < minLong) minLong = p.long;
            if (p.long > maxLong) maxLong = p.long;
        });
    });
    
    // Add small padding to bounds
    const latDiff = (maxLat - minLat) || 0.002; 
    const longDiff = (maxLong - minLong) || 0.002;
    
    minLat -= latDiff * 0.2;
    maxLat += latDiff * 0.2;
    minLong -= longDiff * 0.2;
    maxLong += longDiff * 0.2;
    
    const mapW = bedMapLayer.clientWidth;
    const mapH = bedMapLayer.clientHeight;
    
    const getX = (long) => ((long - minLong) / (maxLong - minLong)) * mapW;
    const getY = (lat) => ((maxLat - lat) / (maxLat - minLat)) * mapH; // Invert Y
    
    // Create SVG layer for polygons
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.style.position = "absolute";
    svg.style.inset = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none"; // Let clicks pass through
    bedMapLayer.appendChild(svg);
    
    beds.forEach(bed => {
        // Draw Polygon tracing the pings
        if (bed.pings.length >= 3) {
            let pointsStr = "";
            bed.pings.forEach(p => {
                pointsStr += `${getX(p.long)},${getY(p.lat)} `;
            });
            
            const polygon = document.createElementNS(svgNS, "polygon");
            polygon.setAttribute("points", pointsStr.trim());
            polygon.setAttribute("fill", "rgba(22, 163, 74, 0.2)");
            polygon.setAttribute("stroke", "#16a34a"); // var(--primary-green)
            polygon.setAttribute("stroke-width", "2");
            polygon.style.pointerEvents = "auto";
            polygon.style.cursor = "pointer";
            polygon.style.transition = "fill 0.2s";
            
            // Hover effect
            polygon.addEventListener("mouseenter", () => polygon.setAttribute("fill", "rgba(22, 163, 74, 0.4)"));
            polygon.addEventListener("mouseleave", () => polygon.setAttribute("fill", "rgba(22, 163, 74, 0.2)"));
            
            svg.appendChild(polygon);
        }
        
        // Calculate Center for Label
        let centerLat = 0, centerLong = 0;
        bed.pings.forEach(p => { 
            centerLat += p.lat; 
            centerLong += p.long; 
        });
        centerLat /= bed.pings.length;
        centerLong /= bed.pings.length;
        
        const label = document.createElement('div');
        label.className = 'map-bed-label';
        label.innerText = bed.name;
        label.style.left = getX(centerLong) + 'px';
        label.style.top = getY(centerLat) + 'px';
        bedMapLayer.appendChild(label);

        // Draw Pings as points over the box
        bed.pings.forEach(p => {
            const dot = document.createElement('div');
            dot.className = 'map-point';
            dot.style.left = getX(p.long) + 'px';
            dot.style.top = getY(p.lat) + 'px';
            bedMapLayer.appendChild(dot);
        });
    });
}

// Handle window resize for map
window.addEventListener('resize', () => {
    if (beds.length > 0) renderMap();
});

// Plant Analysis Logic
window.openAnalysis = function(bedIndex) {
    analyzingBedIndex = bedIndex;
    plantSelect.value = "";
    document.getElementById('analysisResult').style.display = 'none';
    plantAnalysisModal.style.display = 'flex';
};

if (closeAnalysisBtn) {
    closeAnalysisBtn.addEventListener('click', () => {
        plantAnalysisModal.style.display = 'none';
    });
}

if (plantSelect) {
    plantSelect.addEventListener('change', (e) => {
        const plantId = e.target.value;
        const plant = plantDatabase.find(p => p.id === plantId);
        const bed = beds[analyzingBedIndex];
        
        if (!plant || !bed) return;
        
        // Display current stats
        document.getElementById('currentBedStats').innerHTML = `
            Suhu: <strong>${bed.summary.avgTemp}°C</strong><br>
            Kel. Udara: <strong>${bed.summary.avgHum}%</strong><br>
            Kel. Tanah: <strong>${bed.summary.avgSoil}%</strong><br>
            pH Tanah: <strong>${bed.summary.avgPh}</strong>
        `;
        
        // Display ideal stats
        document.getElementById('idealPlantStats').innerHTML = `
            Suhu: <strong>${plant.idealTemp[0]} - ${plant.idealTemp[1]}°C</strong><br>
            Kel. Udara: <strong>${plant.idealHum[0]} - ${plant.idealHum[1]}%</strong><br>
            Kel. Tanah: <strong>${plant.idealSoilHum[0]} - ${plant.idealSoilHum[1]}%</strong><br>
            pH Tanah: <strong>${plant.idealPh[0]} - ${plant.idealPh[1]}</strong>
        `;
        
        // Generate Recommendation
        let issues = [];
        if (bed.summary.avgPh < plant.idealPh[0]) issues.push("pH terlalu asam. Tambahkan kapur dolomit.");
        if (bed.summary.avgPh > plant.idealPh[1]) issues.push("pH terlalu basa. Tambahkan bahan organik atau belerang.");
        
        if (bed.summary.avgSoil < plant.idealSoilHum[0]) issues.push("Tanah terlalu kering. Perlu peningkatan frekuensi penyiraman.");
        if (bed.summary.avgSoil > plant.idealSoilHum[1]) issues.push("Tanah terlalu basah. Perbaiki drainase lahan.");
        
        if (bed.summary.avgTemp > plant.idealTemp[1]) issues.push("Suhu terlalu panas. Pertimbangkan penggunaan paranet (shading net).");
        if (bed.summary.avgTemp < plant.idealTemp[0]) issues.push("Suhu terlalu dingin. Perhatikan waktu tanam.");
        
        const recBox = document.getElementById('recommendationBox');
        if (issues.length === 0) {
            recBox.style.borderLeftColor = '#10b981';
            recBox.style.backgroundColor = '#dcfce7';
            recBox.innerHTML = `<strong><i class="ph ph-check-circle" style="color:#10b981;"></i> Sangat Cocok!</strong><br>Kondisi lahan saat ini sudah sesuai dengan kebutuhan ideal tanaman ${plant.name}.`;
        } else {
            recBox.style.borderLeftColor = '#f59e0b';
            recBox.style.backgroundColor = '#fef3c7';
            recBox.innerHTML = `<strong><i class="ph ph-warning" style="color:#f59e0b;"></i> Perlu Tindakan:</strong><ul style="margin-top: 0.5rem; padding-left: 1.5rem; margin-bottom: 0;">` + 
                issues.map(i => `<li style="margin-bottom: 0.25rem;">${i}</li>`).join('') + `</ul>`;
        }
        
        document.getElementById('analysisResult').style.display = 'block';
    });
}


=======
>>>>>>> eb3778a78b74ef3db72db4d22c6e42b1e9805411
