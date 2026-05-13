const crops = {
    cabai: {
        name: "Cabai Rawit",
        scientific: "Capsicum frutescens",
        spacing: [50, 60],
        ph: [6.0, 7.0],
        temp: [24, 28],
        yieldPerPlant: 0.75,
        companions: [
            { name: "Kemangi", role: "repellent", type: "companion", note: "Bantu tekan thrips dan lalat putih." },
            { name: "Marigold", role: "refugia", type: "refugia", note: "Menarik predator hama dan menekan nematoda." },
            { name: "Bayam", role: "sela", type: "ground", note: "Panen cepat di sela awal pertumbuhan." }
        ]
    },
    terung: {
        name: "Terung Ungu",
        scientific: "Solanum melongena",
        spacing: [60, 70],
        ph: [5.5, 6.8],
        temp: [26, 29],
        yieldPerPlant: 1.4,
        companions: [
            { name: "Kemangi", role: "repellent", type: "companion", note: "Aroma kuat membantu mengganggu serangga pengisap." },
            { name: "Buncis", role: "legume", type: "ground", note: "Menambah nitrogen dan menutup tanah." },
            { name: "Zinnia", role: "refugia", type: "refugia", note: "Mengundang penyerbuk dan lalat syrphid." }
        ]
    },
    jagung: {
        name: "Jagung",
        scientific: "Zea mays",
        spacing: [75, 20],
        ph: [5.5, 7.5],
        temp: [25, 33],
        yieldPerPlant: 0.28,
        companions: [
            { name: "Kacang Panjang", role: "legume", type: "companion", note: "Fiksasi nitrogen dan dapat merambat di turus." },
            { name: "Labu/cover", role: "penutup", type: "ground", note: "Menekan gulma di permukaan tanah." },
            { name: "Bunga Matahari", role: "refugia", type: "refugia", note: "Mengundang lebah dan predator alami." }
        ]
    },
    padi: {
        name: "Padi Gogo",
        scientific: "Oryza sativa",
        spacing: [25, 25],
        ph: [5.0, 6.5],
        temp: [25, 35],
        yieldPerPlant: 0.045,
        companions: [
            { name: "Kenikir", role: "refugia", type: "refugia", note: "Menarik predator kutu daun dan wereng." },
            { name: "Azolla", role: "penutup", type: "ground", note: "Menambah nitrogen pada area lembab." },
            { name: "Sereh", role: "repellent", type: "companion", note: "Bantu mengusir serangga pengisap di tepi bedeng." }
        ]
    },
    singkong: {
        name: "Singkong",
        scientific: "Manihot esculenta",
        spacing: [100, 100],
        ph: [4.5, 7.0],
        temp: [20, 30],
        yieldPerPlant: 3.2,
        companions: [
            { name: "Kedelai", role: "legume", type: "companion", note: "Tumpang sari rendah untuk menambah nitrogen." },
            { name: "Arachis pintoi", role: "cover", type: "ground", note: "Menutup tanah dan tahan naungan." },
            { name: "Marigold", role: "refugia", type: "refugia", note: "Pelindung perimeter dari nematoda akar." }
        ]
    },
    ubi: {
        name: "Ubi Jalar",
        scientific: "Ipomoea batatas",
        spacing: [30, 70],
        ph: [5.5, 6.5],
        temp: [24, 30],
        yieldPerPlant: 0.85,
        companions: [
            { name: "Buncis", role: "legume", type: "companion", note: "Mengisi nitrogen tanpa menaungi berlebihan." },
            { name: "Kenikir", role: "refugia", type: "refugia", note: "Membantu kontrol kutu daun." },
            { name: "Sereh", role: "repellent", type: "companion", note: "Aman sebagai pembatas aromatic." }
        ]
    },
    tomat: {
        name: "Tomat",
        scientific: "Solanum lycopersicum",
        spacing: [50, 70],
        ph: [6.0, 7.0],
        temp: [20, 27],
        yieldPerPlant: 2.2,
        companions: [
            { name: "Kemangi", role: "repellent", type: "companion", note: "Cocok dekat tomat untuk bantu ganggu lalat putih." },
            { name: "Marigold", role: "refugia", type: "refugia", note: "Diletakkan di perimeter untuk nematoda dan penyerbuk." },
            { name: "Selada", role: "sela", type: "ground", note: "Mengisi sela awal, toleran sedikit naungan." }
        ]
    },
    kedelai: {
        name: "Kedelai",
        scientific: "Glycine max",
        spacing: [40, 15],
        ph: [6.0, 6.5],
        temp: [25, 30],
        yieldPerPlant: 0.055,
        companions: [
            { name: "Jagung", role: "struktur", type: "companion", note: "Polikultur klasik dengan kanopi berbeda." },
            { name: "Zinnia", role: "refugia", type: "refugia", note: "Mendukung penyerbuk dan predator alami." },
            { name: "Krokot", role: "cover", type: "ground", note: "Menutup tanah panas dan akumulator mineral." }
        ]
    },
    talas: {
        name: "Talas",
        scientific: "Colocasia esculenta",
        spacing: [50, 50],
        ph: [5.5, 6.5],
        temp: [21, 27],
        yieldPerPlant: 1.8,
        companions: [
            { name: "Pegagan", role: "cover", type: "ground", note: "Suka lembab dan menutup tanah di sekitar talas." },
            { name: "Torenia", role: "refugia", type: "refugia", note: "Menarik parasitoid kecil pada area teduh." },
            { name: "Sereh", role: "repellent", type: "companion", note: "Baik sebagai pagar aroma di tepi." }
        ]
    }
};

const sensorState = {
    ph: 6.4,
    temp: 26.0,
    moisture: 64,
    lat: -6.2,
    long: 106.817
};

const state = {
    step: 0,
    selectedCompanion: 0
};

const stepTitles = [
    "Isi tanaman kamu",
    "Isi luas dan target panen",
    "Tancapkan alat",
    "Hasil kondisi lahan",
    "Rekomendasi companion tanaman",
    "Denah skala nyata"
];

const els = {};

function qs(selector) {
    return document.querySelector(selector);
}

function qsa(selector) {
    return Array.from(document.querySelectorAll(selector));
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function formatNumber(value, maxDigits = 0) {
    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: maxDigits
    }).format(value);
}

function getInputs() {
    const crop = crops[els.primaryCrop.value] || crops.tomat;
    const lengthM = clamp(Number(els.bedLength.value) || 1, 1, 60);
    const widthM = clamp(Number(els.bedWidth.value) || 0.5, 0.5, 20);
    const targetYield = clamp(Number(els.targetYield.value) || 1, 1, 5000);
    return { crop, lengthM, widthM, targetYield };
}

function calculatePlan() {
    const { crop, lengthM, widthM, targetYield } = getInputs();
    const [baseX, baseY] = crop.spacing;
    const baseCols = Math.max(1, Math.floor((widthM * 100) / baseX));
    const baseRows = Math.max(1, Math.floor((lengthM * 100) / baseY));
    const baseCount = Math.max(1, baseCols * baseRows);
    const targetPlants = Math.max(1, Math.ceil(targetYield / crop.yieldPerPlant));
    const pressure = Math.sqrt(baseCount / targetPlants);
    const spacingFactor = clamp(pressure, 0.68, 1.22);
    const actualX = Math.max(10, Math.round(baseX * spacingFactor));
    const actualY = Math.max(10, Math.round(baseY * spacingFactor));
    const cols = Math.max(1, Math.floor((widthM * 100) / actualX));
    const rows = Math.max(1, Math.floor((lengthM * 100) / actualY));
    const primaryCount = rows * cols;
    const companionCount = Math.max(4, Math.round((rows + cols) * 1.2));
    const yieldEstimate = primaryCount * crop.yieldPerPlant;

    return {
        crop,
        lengthM,
        widthM,
        targetYield,
        baseSpacing: [baseX, baseY],
        actualSpacing: [actualX, actualY],
        rows,
        cols,
        primaryCount,
        companionCount,
        yieldEstimate,
        spacingFactor
    };
}

function setStep(nextStep) {
    state.step = clamp(nextStep, 0, stepTitles.length - 1);

    qsa("[data-step-panel]").forEach((panel, index) => {
        panel.classList.toggle("active", index === state.step);
    });

    qsa(".step-tab").forEach((tab, index) => {
        tab.classList.toggle("active", index === state.step);
    });

    els.stepTitle.textContent = stepTitles[state.step];
    els.currentStepNumber.textContent = state.step + 1;
    els.progressBar.style.width = `${((state.step + 1) / stepTitles.length) * 100}%`;
    els.prevStep.disabled = state.step === 0;
    els.nextStep.innerHTML = state.step === stepTitles.length - 1
        ? 'Selesai <i class="ph ph-check"></i>'
        : 'Lanjut <i class="ph ph-arrow-right"></i>';
}

function renderCropProfile(plan) {
    const [x, y] = plan.crop.spacing;
    els.cropProfile.innerHTML = `
        <div class="profile-row"><span>Nama latin</span><strong>${plan.crop.scientific}</strong></div>
        <div class="profile-row"><span>Jarak database</span><strong>${x} x ${y} cm</strong></div>
        <div class="profile-row"><span>pH ideal</span><strong>${plan.crop.ph[0]} - ${plan.crop.ph[1]}</strong></div>
        <div class="profile-row"><span>Suhu optimal</span><strong>${plan.crop.temp[0]} - ${plan.crop.temp[1]} C</strong></div>
    `;
}

function renderSensorAndAdvice(plan) {
    els.sensorPh.textContent = sensorState.ph.toFixed(1);
    els.sensorTemp.textContent = `${sensorState.temp.toFixed(1)} C`;
    els.sensorMoisture.textContent = `${Math.round(sensorState.moisture)}%`;
    els.sensorGps.textContent = `${sensorState.lat.toFixed(3)}, ${sensorState.long.toFixed(3)}`;

    const phLow = plan.crop.ph[0];
    const phHigh = plan.crop.ph[1];
    const tempLow = plan.crop.temp[0];
    const tempHigh = plan.crop.temp[1];
    const phFit = sensorState.ph >= phLow && sensorState.ph <= phHigh;
    const tempFit = sensorState.temp >= tempLow && sensorState.temp <= tempHigh;
    const score = 70 + (phFit ? 14 : 0) + (tempFit ? 10 : 0) + (sensorState.moisture > 45 && sensorState.moisture < 82 ? 6 : 0);
    const advice = [];

    if (sensorState.ph < phLow) {
        advice.push("pH sedikit asam. Tambahkan dolomit tipis sebelum tanam.");
    } else if (sensorState.ph > phHigh) {
        advice.push("pH terlalu basa. Tambahkan bahan organik matang untuk menurunkan reaksi tanah.");
    } else {
        advice.push(`pH ${sensorState.ph.toFixed(1)} masuk rentang aman untuk ${plan.crop.name}.`);
    }

    if (!tempFit) {
        advice.push("Suhu perlu dimitigasi dengan naungan atau penyesuaian waktu tanam.");
    } else {
        advice.push("Suhu bedengan cocok untuk fase awal pertumbuhan.");
    }

    els.fitScore.textContent = `${clamp(score, 0, 99)}%`;
    els.soilAdvice.textContent = advice.join(" ");
    els.analysisSoilText.textContent = els.soilAdvice.textContent;
}

function renderCompanions(plan) {
    els.companionList.innerHTML = plan.crop.companions.map((item, index) => `
        <button class="companion-chip" type="button" data-companion="${index}" aria-pressed="${state.selectedCompanion === index}">
            <i class="ph ${item.type === "refugia" ? "ph-flower-lotus" : item.type === "ground" ? "ph-leaf" : "ph-flower"}"></i>
            <span>
                <strong>${item.name}</strong>
                <small>${item.note}</small>
            </span>
            <em>${item.role}</em>
        </button>
    `).join("");

    qsa("[data-companion]").forEach((button) => {
        const isActive = Number(button.dataset.companion) === state.selectedCompanion;
        button.style.background = isActive ? "var(--leaf-700)" : "var(--leaf-100)";
        button.style.color = isActive ? "var(--paper)" : "var(--leaf-800)";
        button.addEventListener("click", () => {
            state.selectedCompanion = Number(button.dataset.companion);
            renderAll();
        });
    });
}

function getPlotSize(plan) {
    const shell = qs(".plot-shell");
    const availableW = Math.max(260, (shell?.clientWidth || 520) - 70);
    const availableH = Math.max(260, (shell?.clientHeight || 430) - 70);
    const ratio = plan.widthM / plan.lengthM;
    let width = availableW;
    let height = width / ratio;

    if (height > availableH) {
        height = availableH;
        width = height * ratio;
    }

    return {
        width: Math.max(220, width),
        height: Math.max(220, height)
    };
}

function plantDotClass(type) {
    if (type === "refugia") return "plant-dot refugia";
    if (type === "ground") return "plant-dot ground";
    if (type === "companion") return "plant-dot companion";
    return "plant-dot primary";
}

function renderPlot(plan) {
    const companion = plan.crop.companions[state.selectedCompanion] || plan.crop.companions[0];
    const plotSize = getPlotSize(plan);
    const meterSize = plotSize.height / plan.lengthM;
    const dotSize = clamp(Math.min(plotSize.width / plan.cols, plotSize.height / plan.rows) * 0.44, 7, 18);
    const maxVisiblePrimary = 800;
    const primaryStride = Math.max(1, Math.ceil(plan.primaryCount / maxVisiblePrimary));
    let dotIndex = 0;
    const dots = [];

    els.plantingPlot.style.setProperty("--plot-w", `${plotSize.width}px`);
    els.plantingPlot.style.setProperty("--plot-h", `${plotSize.height}px`);
    els.plantingPlot.style.setProperty("--meter-size", `${meterSize}px`);
    els.plantingPlot.style.setProperty("--dot-size", `${dotSize}px`);

    for (let row = 0; row < plan.rows; row += 1) {
        for (let col = 0; col < plan.cols; col += 1) {
            dotIndex += 1;
            if (dotIndex % primaryStride !== 0) continue;

            const isEdge = row === 0 || col === 0 || row === plan.rows - 1 || col === plan.cols - 1;
            const isCompanionPocket = isEdge && (row + col) % 3 === 0;
            const isGroundPocket = !isEdge && (row + col) % 11 === 0 && companion.type === "ground";
            const type = isCompanionPocket ? companion.type : isGroundPocket ? "ground" : "primary";
            const left = plan.cols === 1 ? 50 : (col / (plan.cols - 1)) * 92 + 4;
            const top = plan.rows === 1 ? 50 : (row / (plan.rows - 1)) * 92 + 4;

            dots.push(`<span class="${plantDotClass(type)}" style="left:${left}%;top:${top}%;" title="${type === "primary" ? plan.crop.name : companion.name}"></span>`);
        }
    }

    els.plantingPlot.innerHTML = dots.join("");
    els.totalPlants.textContent = formatNumber(plan.primaryCount + plan.companionCount);
    els.actualSpacing.textContent = `${plan.actualSpacing[0]} x ${plan.actualSpacing[1]} cm`;
    els.yieldEstimate.textContent = `${formatNumber(plan.yieldEstimate, 1)} kg`;
    els.plotWidthLabel.textContent = `${plan.widthM} m`;
    els.plotLengthLabel.textContent = `${plan.lengthM} m`;
    els.scalePill.textContent = `${formatNumber(plan.widthM * plan.lengthM, 1)} m2 area`;
    els.analysisPlantText.textContent = `Jarak database ${plan.baseSpacing[0]} x ${plan.baseSpacing[1]} cm disesuaikan menjadi ${plan.actualSpacing[0]} x ${plan.actualSpacing[1]} cm untuk target ${formatNumber(plan.targetYield)} kg.`;

    els.legendRow.innerHTML = `
        <span class="legend-item"><span class="legend-swatch" style="background:var(--leaf-600)"></span>${plan.crop.name}</span>
        <span class="legend-item"><span class="legend-swatch" style="background:${companion.type === "refugia" ? "#f59fb4" : companion.type === "ground" ? "#77c78a" : "var(--sun)"}"></span>${companion.name}</span>
        <span class="legend-item">Aktual: ${plan.rows} baris x ${plan.cols} kolom</span>
    `;
}

function renderAll() {
    const plan = calculatePlan();
    renderCropProfile(plan);
    renderSensorAndAdvice(plan);
    renderCompanions(plan);
    renderPlot(plan);
}

function showSection(sectionName) {
    qsa(".content-section").forEach((section) => {
        section.hidden = section.id !== `${sectionName}Section`;
    });
    qsa(".rail-link").forEach((link) => {
        link.classList.toggle("active", link.dataset.section === sectionName);
    });
}

function setupNavigation() {
    qsa(".rail-link").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            showSection(link.dataset.section);
        });
    });

    qsa(".step-tab").forEach((tab) => {
        tab.addEventListener("click", () => setStep(Number(tab.dataset.step)));
    });

    els.prevStep.addEventListener("click", () => setStep(state.step - 1));
    els.nextStep.addEventListener("click", () => {
        if (state.step === stepTitles.length - 1) {
            qs("#plannerMapSection").scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }
        setStep(state.step + 1);
    });
    els.focusMapBtn.addEventListener("click", () => {
        qs("#plannerMapSection").scrollIntoView({ behavior: "smooth", block: "start" });
    });
}

function setupFormListeners() {
    [els.primaryCrop, els.bedLength, els.bedWidth, els.targetYield].forEach((input) => {
        input.addEventListener("input", renderAll);
        input.addEventListener("change", renderAll);
    });

    window.addEventListener("resize", () => {
        window.requestAnimationFrame(() => renderPlot(calculatePlan()));
    });
}

function setupMQTT() {
    if (typeof mqtt === "undefined") return;

    const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt", {
        clientId: `poli_polyfarm_${Math.random().toString(16).slice(2)}`,
        keepalive: 60,
        clean: true,
        reconnectPeriod: 2500,
        connectTimeout: 6000
    });

    client.on("connect", () => {
        els.mqttStatusIcon.style.background = "var(--leaf-600)";
        els.mqttStatusText.textContent = "Terhubung";
        client.subscribe("hackviet/data/sensors");
        client.subscribe("hackviet/data/gps");
    });

    client.on("error", () => {
        els.mqttStatusIcon.style.background = "#e7b949";
        els.mqttStatusText.textContent = "Mode demo";
    });

    client.on("message", (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());

            if (topic === "hackviet/data/sensors") {
                if (payload.ph_soil !== undefined) sensorState.ph = Number(payload.ph_soil);
                if (payload.temp_air !== undefined) sensorState.temp = Number(payload.temp_air);
                if (payload.hum_soil !== undefined) sensorState.moisture = Number(payload.hum_soil);
            }

            if (topic === "hackviet/data/gps") {
                if (payload.lat !== undefined) sensorState.lat = Number(payload.lat);
                if (payload.long !== undefined) sensorState.long = Number(payload.long);
            }

            renderAll();
        } catch (error) {
            console.warn("Invalid MQTT payload", error);
        }
    });
}

function cacheElements() {
    Object.assign(els, {
        primaryCrop: qs("#primaryCrop"),
        bedLength: qs("#bedLength"),
        bedWidth: qs("#bedWidth"),
        targetYield: qs("#targetYield"),
        cropProfile: qs("#cropProfile"),
        sensorPh: qs("#sensorPh"),
        sensorTemp: qs("#sensorTemp"),
        sensorMoisture: qs("#sensorMoisture"),
        sensorGps: qs("#sensorGps"),
        fitScore: qs("#fitScore"),
        soilAdvice: qs("#soilAdvice"),
        companionList: qs("#companionList"),
        plantingPlot: qs("#plantingPlot"),
        totalPlants: qs("#totalPlants"),
        actualSpacing: qs("#actualSpacing"),
        yieldEstimate: qs("#yieldEstimate"),
        plotWidthLabel: qs("#plotWidthLabel"),
        plotLengthLabel: qs("#plotLengthLabel"),
        scalePill: qs("#scalePill"),
        legendRow: qs("#legendRow"),
        stepTitle: qs("#stepTitle"),
        currentStepNumber: qs("#currentStepNumber"),
        progressBar: qs("#progressBar"),
        prevStep: qs("#prevStep"),
        nextStep: qs("#nextStep"),
        focusMapBtn: qs("#focusMapBtn"),
        mqttStatusIcon: qs("#mqttStatusIcon"),
        mqttStatusText: qs("#mqttStatusText"),
        analysisSoilText: qs("#analysisSoilText"),
        analysisPlantText: qs("#analysisPlantText")
    });
}

document.addEventListener("DOMContentLoaded", () => {
    cacheElements();
    setupNavigation();
    setupFormListeners();
    setStep(0);
    renderAll();
    setupMQTT();
});
