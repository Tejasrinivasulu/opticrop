(() => {
  const TOTAL_STEPS = 3;
  let currentStep = 1;
  let predictionResult = null;
  let validationPassed = false;
  let preprocessDone = false;
  let uploadedFileName = "";
  let soilData = { N: "", P: "", K: "", ph: "" };
  let selectedLocation = null;
  let searchTimer = null;
  let weatherReady = false;
  let weatherFetchToken = 0;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const alertBox = $("#wizardAlert");
  const btnNext = $("#btnNext");
  const btnBack = $("#btnBack");

  function showAlert(msg) {
    alertBox.textContent = msg;
    alertBox.classList.remove("d-none");
  }

  function hideAlert() {
    alertBox.classList.add("d-none");
  }

  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function getLocation() {
    return {
      village: $("#village").value.trim(),
      city: $("#city").value.trim(),
      district: $("#district").value.trim(),
      state: $("#state").value.trim(),
      lat: $("#lat").value,
      lon: $("#lon").value,
      label: selectedLocation?.label || "",
    };
  }

  function getPayload() {
    return {
      N: String(soilData.N),
      P: String(soilData.P),
      K: String(soilData.K),
      ph: String(soilData.ph),
      temperature: $("#temperature").value,
      humidity: $("#humidity").value,
      rainfall: $("#rainfall").value,
    };
  }

  function setStep1Ready(ready) {
    weatherReady = ready;
    $("#step1Ready").classList.toggle("d-none", !ready);
    if (currentStep === 1) {
      btnNext.disabled = !ready;
      btnNext.innerHTML = ready
        ? 'Next <i class="bi bi-arrow-right"></i>'
        : 'Waiting for weather…';
    }
  }

  function setStep3Ready(ready) {
    $("#step3Ready").classList.toggle("d-none", !ready);
    if (currentStep === 3) {
      btnNext.disabled = !ready;
      btnNext.innerHTML = ready
        ? 'Submit <i class="bi bi-send-fill"></i>'
        : 'Preprocessing… <span class="spinner-border spinner-border-sm"></span>';
    }
  }

  function updateNav() {
    btnBack.disabled = currentStep === 1;
    if (currentStep === 1) {
      btnNext.innerHTML = weatherReady
        ? 'Next <i class="bi bi-arrow-right"></i>'
        : 'Select location first';
      btnNext.disabled = !weatherReady;
    } else if (currentStep === 3) {
      btnNext.innerHTML = preprocessDone
        ? 'Submit <i class="bi bi-send-fill"></i>'
        : 'Preprocessing… <span class="spinner-border spinner-border-sm"></span>';
      btnNext.disabled = !preprocessDone;
    } else {
      btnNext.innerHTML = 'Next <i class="bi bi-arrow-right"></i>';
      btnNext.disabled = false;
    }
  }

  function showWizard() {
    const page = document.querySelector(".wizard-page");
    $("#wizardShell").classList.remove("d-none");
    $("#resultsPage").classList.add("d-none");
    page?.classList.remove("results-mode", "container-fluid");
    page?.classList.add("container");
  }

  function showResultsView() {
    const page = document.querySelector(".wizard-page");
    page?.classList.remove("container");
    page?.classList.add("container-fluid", "results-mode", "px-3", "px-lg-5");
    $("#wizardShell").classList.add("d-none");
    $("#resultsPage").classList.remove("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function hideDropdown() {
    $("#locationDropdown").classList.add("d-none");
  }

  function showDropdown(items) {
    const dropdown = $("#locationDropdown");
    if (!items.length) {
      dropdown.classList.add("d-none");
      return;
    }
    dropdown.innerHTML = items
      .map(
        (loc, i) => `
      <li>
        <button type="button" class="location-option" data-index="${i}">
          <i class="bi bi-geo-alt text-success"></i>
          <span>${loc.label}</span>
        </button>
      </li>`
      )
      .join("");
    dropdown.classList.remove("d-none");

    dropdown.querySelectorAll(".location-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectLocation(items[Number(btn.dataset.index)]);
      });
    });
  }

  async function searchLocations(query) {
    const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
    return res.json();
  }

  async function fetchLiveWeather(loc) {
    const token = ++weatherFetchToken;
    setStep1Ready(false);
    $("#weatherLoading").classList.remove("d-none");
    $("#weatherBox").classList.add("d-none");
    hideAlert();

    try {
      const res = await fetch("/api/weather/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: loc.lat,
          lon: loc.lon,
          label: loc.label,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Weather fetch failed.");
      if (token !== weatherFetchToken) return;

      $("#temperature").value = data.temperature;
      $("#humidity").value = data.humidity;
      $("#rainfall").value = data.rainfall;
      $("#weatherSource").textContent = `${data.source}${data.updated ? ` · Updated ${data.updated}` : ""}`;
      $("#weatherBox").classList.remove("d-none");
      setStep1Ready(true);
    } catch (err) {
      if (token !== weatherFetchToken) return;
      setStep1Ready(false);
      showAlert(err.message);
    } finally {
      if (token === weatherFetchToken) {
        $("#weatherLoading").classList.add("d-none");
      }
    }
  }

  async function selectLocation(loc) {
    selectedLocation = loc;
    $("#locationSearch").value = loc.label;
    $("#village").value = loc.village || "";
    $("#city").value = loc.city || "";
    $("#district").value = loc.district || "";
    $("#state").value = loc.state || "";
    $("#lat").value = loc.lat;
    $("#lon").value = loc.lon;

    $("#selectedLocationLabel").textContent = loc.label;
    $("#selectedLocationBox").classList.remove("d-none");
    hideDropdown();
    await fetchLiveWeather(loc);
  }

  let soilSource = "";

  async function uploadSoilFile(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload-soil", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed.");

    soilData = { N: data.N, P: data.P, K: data.K, ph: data.ph };
    soilSource = data.source || "File analysis";
    uploadedFileName = file.name;
    $("#uploadStatus").textContent = `✔ File uploaded: ${file.name}`;
    $("#uploadStatus").classList.remove("d-none");
    $("#extractedSoil").textContent = `${soilSource} — N: ${soilData.N}, P: ${soilData.P}, K: ${soilData.K}, pH: ${soilData.ph}. Final crop ranking will use this soil data + live weather (temperature, humidity, rainfall).`;
    $("#extractedSoil").classList.remove("d-none");
    return data;
  }

  async function handleFileInput(file) {
    if (!file) return;
    hideAlert();
    validationPassed = false;
    $("#validationBlock").classList.add("d-none");

    try {
      btnNext.disabled = true;
      btnNext.innerHTML = 'Analyzing… <span class="spinner-border spinner-border-sm"></span>';
      await uploadSoilFile(file);
    } catch (err) {
      soilData = { N: "", P: "", K: "", ph: "" };
      uploadedFileName = "";
      showAlert(err.message);
      $("#uploadStatus").classList.add("d-none");
      $("#extractedSoil").classList.add("d-none");
    } finally {
      updateNav();
    }
  }

  async function runValidationUI() {
    validationPassed = false;
    $("#validationBlock").classList.remove("d-none");
    $$("#validationList li").forEach((li) => {
      li.classList.remove("pass", "fail");
      li.querySelector("i").className = "bi bi-circle";
    });

    const p = getPayload();
    let allPass = true;

    async function setCheck(key, pass) {
      const li = document.querySelector(`#validationList li[data-check="${key}"]`);
      await delay(120);
      if (pass) {
        li.classList.add("pass");
        li.querySelector("i").className = "bi bi-check-circle-fill";
      } else {
        li.classList.add("fail");
        li.querySelector("i").className = "bi bi-x-circle-fill";
        allPass = false;
      }
    }

    await setCheck("file", !!uploadedFileName);
    await setCheck("format", /\.[a-z0-9]{1,10}$/i.test(uploadedFileName));

    const extracted = p.N && p.P && p.K && p.ph;
    await setCheck("extract", !!extracted);

    const numeric = [p.N, p.P, p.K, p.ph].every((v) => v !== "" && !isNaN(parseFloat(v)));
    await setCheck("numeric", numeric);

    let rangeOk = false;
    if (numeric && p.temperature && p.humidity && p.rainfall) {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      rangeOk = res.ok;
      if (!res.ok) {
        const err = await res.json();
        showAlert(err.error || "Values are out of acceptable range.");
      }
    } else if (!numeric) {
      showAlert("Could not extract valid soil values from the file.");
    }
    await setCheck("range", rangeOk);

    const noMissing = p.N && p.P && p.K && p.ph && p.temperature && p.humidity && p.rainfall;
    await setCheck("missing", !!noMissing);

    validationPassed = allPass && rangeOk && !!noMissing;
    if (!validationPassed && !alertBox.textContent) {
      showAlert("Validation failed. Please upload a valid soil report or CSV.");
    }
    return validationPassed;
  }

  async function showStep(n) {
    currentStep = n;
    $$(".wizard-step").forEach((el) => {
      el.classList.toggle("active", Number(el.dataset.step) === n);
    });
    $$(".wizard-progress-step").forEach((el) => {
      const s = Number(el.dataset.step);
      el.classList.toggle("done", s < n);
      el.classList.toggle("active", s === n);
    });
    hideAlert();
    updateNav();

    if (n === 3) await runPreprocessUI();

    updateNav();
  }

  function validateStep1() {
    if (!selectedLocation || !$("#lat").value || !$("#lon").value) {
      showAlert("Please search and select a location from the dropdown.");
      return false;
    }
    if (!weatherReady) {
      showAlert("Please wait until live weather is loaded.");
      return false;
    }
    return true;
  }

  async function validateStep2() {
    if (!uploadedFileName) {
      showAlert("Please upload a soil file (PDF, image, or CSV).");
      return false;
    }
    if (!soilData.N || !soilData.P || !soilData.K || !soilData.ph) {
      showAlert("Waiting for soil data extraction. Please re-upload your file.");
      return false;
    }
    return runValidationUI();
  }

  async function runPreprocessUI() {
    preprocessDone = false;
    setStep3Ready(false);
    const bar = $("#preprocessBar");
    const barInner = bar.querySelector(".progress-bar");
    const items = $$("#preprocessList li");
    bar.classList.remove("d-none");
    barInner.style.width = "0%";
    items.forEach((li) => {
      li.classList.remove("done");
      li.querySelector("i").className = "bi bi-circle";
    });

    for (let i = 0; i < items.length; i++) {
      await delay(50);
      items[i].classList.add("done");
      items[i].querySelector("i").className = "bi bi-check-circle-fill";
      barInner.style.width = `${((i + 1) / items.length) * 100}%`;
    }

    preprocessDone = true;
    setStep3Ready(true);
    updateNav();
  }

  const CROP_EMOJI = {
    rice: "🍚", maize: "🌽", chickpea: "🫘", kidneybeans: "🫘",
    pigeonpeas: "🫘", mothbeans: "🫘", mungbean: "🫘", blackgram: "🫘",
    lentil: "🫘", pomegranate: "🍎", banana: "🍌", mango: "🥭",
    grapes: "🍇", watermelon: "🍉", muskmelon: "🍈", apple: "🍎",
    orange: "🍊", papaya: "🍈", coconut: "🥥", cotton: "☁️",
    jute: "🌿", coffee: "☕",
  };

  function cropEmoji(key) {
    return CROP_EMOJI[(key || "").toLowerCase()] || "🌾";
  }

  function statusClass(status) {
    if (status === "Optimal") return "status-optimal";
    if (status === "Low") return "status-low";
    return "status-high";
  }

  async function showResultsPage() {
    showResultsView();
    predictionResult = null;
    $("#resultsContent").classList.add("d-none");
    $("#resultsContent").innerHTML = "";
    $("#resultsLoading").classList.remove("d-none");

    if (!window.OPTICROP_MODEL_READY) {
      $("#resultsLoading").classList.add("d-none");
      $("#resultsContent").classList.remove("d-none");
      $("#resultsContent").innerHTML = `
        <div class="results-error-banner">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <div>
            <strong>Model not ready</strong>
            <p class="mb-0">Run <code>python train_model.py</code> then try again.</p>
          </div>
          <button type="button" class="btn btn-outline-success rounded-pill" id="btnRetryWizard">← Back to form</button>
        </div>`;
      $("#btnRetryWizard").addEventListener("click", () => showWizard());
      return;
    }

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Prediction failed.");
      }

      predictionResult = await res.json();
      predictionResult.location = getLocation();
      renderFullResults(predictionResult);
    } catch (err) {
      $("#resultsLoading").classList.add("d-none");
      $("#resultsContent").classList.remove("d-none");
      $("#resultsContent").innerHTML = `
        <div class="results-error-banner">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <div>
            <strong>Prediction failed</strong>
            <p class="mb-0">${err.message}</p>
          </div>
          <button type="button" class="btn btn-outline-success rounded-pill" id="btnRetryWizard">← Back to form</button>
        </div>`;
      $("#btnRetryWizard").addEventListener("click", () => showWizard());
      return;
    }

    $("#resultsLoading").classList.add("d-none");
    $("#resultsContent").classList.remove("d-none");
  }

  function renderFullResults(r) {
    const loc = r.location || {};
    const locStr = loc.label || [loc.village, loc.city, loc.district, loc.state].filter(Boolean).join(", ");
    const modelLabel = (r.model_name || "Random Forest").replace("Classifier", " Classifier");
    const accuracy = r.model_accuracy ? `${r.model_accuracy}%` : "—";
    const crops = r.suitable_crops || [];
    const inputs = r.inputs || getPayload();
    const primary = crops.find((c) => c.is_primary) || crops[0];

    const analysisHtml = (r.analysis || [])
      .map(
        (a) => `
        <div class="results-analysis-item">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-semibold">${a.label}</span>
            <span class="text-muted small">${a.display || a.value}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="results-status-pill ${statusClass(a.status)}">${a.status}</span>
            <span class="small fw-semibold">${a.pct}% fit</span>
          </div>
          <div class="results-analysis-bar">
            <div class="results-analysis-fill" style="width:${a.pct}%"></div>
          </div>
        </div>`
      )
      .join("");

    const cropsHtml = crops
      .map(
        (c, i) => `
        <article class="results-crop-card ${c.is_primary ? "is-top-pick" : ""}">
          <div class="results-crop-card-head">
            <span class="results-crop-emoji">${cropEmoji(c.crop_key)}</span>
            <div class="flex-grow-1">
              <div class="d-flex flex-wrap align-items-center gap-2">
                <span class="results-crop-rank">#${c.rank || i + 1}</span>
                ${c.is_primary ? '<span class="results-top-badge">Best Match</span>' : ""}
              </div>
              <h3 class="results-crop-name">${c.crop}</h3>
            </div>
            <div class="results-crop-score">
              <span class="results-crop-score-val">${c.combined_score || c.confidence}%</span>
              <span class="results-crop-score-lbl">overall</span>
            </div>
          </div>
          <div class="results-crop-confidence">
            <div class="results-crop-confidence-fill" style="width:${c.combined_score || c.confidence}%"></div>
          </div>
          <dl class="results-crop-meta">
            <div><dt>Best season</dt><dd>${c.suitable_season || c.season}</dd></div>
            <div><dt>Climate fit</dt><dd>${c.season_fit || "—"}% · ${c.climate_season || r.climate_season || "—"}</dd></div>
            <div><dt>ML match</dt><dd>${c.confidence}%</dd></div>
            <div><dt>Water</dt><dd>${c.water}</dd></div>
            <div><dt>Soil</dt><dd>${c.soil}</dd></div>
            <div><dt>Yield</dt><dd>${c.expected_yield}</dd></div>
          </dl>
          <p class="results-crop-desc">${c.description}</p>
        </article>`
      )
      .join("");

    $("#resultsContent").innerHTML = `
      <div class="results-hero">
        <div class="results-hero-inner">
          <p class="results-hero-eyebrow"><i class="bi bi-stars"></i> AI Crop Recommendation</p>
          <div class="results-hero-crop">
            <span class="results-hero-emoji">${cropEmoji(primary?.crop_key || r.crop_key)}</span>
            <div>
              <p class="results-hero-label">Best crop for your field</p>
              <h1 class="results-hero-title">${r.crop}</h1>
              <p class="results-hero-confidence">${r.confidence}% ML confidence · ${r.recommended_season || r.season}</p>
            </div>
          </div>
          <div class="results-hero-meta">
            <span><i class="bi bi-geo-alt-fill"></i> ${locStr || "Your location"}</span>
            <span><i class="bi bi-cpu-fill"></i> ${modelLabel} · ${accuracy} accuracy</span>
            <span><i class="bi bi-lightning-fill"></i> ${r.prediction_time_ms} ms</span>
          </div>
        </div>
      </div>

      <div class="results-summary-grid">
        <div class="results-summary-card">
          <div class="results-summary-icon"><i class="bi bi-geo-alt"></i></div>
          <h4>Location</h4>
          <p>${locStr || "—"}</p>
        </div>
        <div class="results-summary-card">
          <div class="results-summary-icon"><i class="bi bi-cloud-sun"></i></div>
          <h4>Climate</h4>
          <p>${inputs.temperature}°C temp · ${inputs.humidity}% humidity · ${inputs.rainfall} mm rain</p>
        </div>
        <div class="results-summary-card">
          <div class="results-summary-icon"><i class="bi bi-moisture"></i></div>
          <h4>Soil Nutrients</h4>
          <p>N ${inputs.N} · P ${inputs.P} · K ${inputs.K} · pH ${inputs.ph}</p>
        </div>
        <div class="results-summary-card">
          <div class="results-summary-icon"><i class="bi bi-calendar3"></i></div>
          <h4>Suitable Season</h4>
          <p>${r.climate_season || "—"} for your current weather</p>
        </div>
        <div class="results-summary-card">
          <div class="results-summary-icon"><i class="bi bi-graph-up-arrow"></i></div>
          <h4>ML Model</h4>
          <p>${modelLabel} with ${r.model_estimators || 200} trees · trained on 2,200 samples</p>
        </div>
      </div>

      <p class="results-input-note text-muted small mb-4">
        <i class="bi bi-fingerprint"></i>
        Prediction uses your unique inputs: N=${inputs.N}, P=${inputs.P}, K=${inputs.K}, pH=${inputs.ph},
        ${inputs.temperature}°C, ${inputs.humidity}% humidity, ${inputs.rainfall} mm rainfall.
      </p>

      <div class="results-metrics-row">
        <div class="results-metric">
          <span class="results-metric-value">${r.suitability_score}%</span>
          <span class="results-metric-label">Soil Fertility Score</span>
        </div>
        <div class="results-metric">
          <span class="results-metric-value">${r.confidence}%</span>
          <span class="results-metric-label">Top Crop Confidence</span>
        </div>
        <div class="results-metric">
          <span class="results-metric-value">${crops.length}</span>
          <span class="results-metric-label">Suitable Crops Found</span>
        </div>
      </div>

      <section class="results-section">
        <h2 class="results-section-title"><i class="bi bi-bar-chart-fill text-success"></i> Soil &amp; Climate Analysis</h2>
        <p class="results-section-sub">How well your field conditions support crop growth</p>
        <div class="results-analysis-grid">${analysisHtml}</div>
      </section>

      <section class="results-section">
        <h2 class="results-section-title"><i class="bi bi-grid-3x3-gap-fill text-success"></i> All Suitable Crops</h2>
        <p class="results-section-sub">${crops.length} crops ranked for your soil, weather, and season — not a generic list</p>
        <div class="results-crops-grid">${cropsHtml}</div>
      </section>

      <section class="results-tips-card">
        <div class="results-tips-icon">🌱</div>
        <div>
          <h3>Growing Tips for ${r.crop}</h3>
          <p>${r.growing_tips || "Maintain soil moisture, use balanced fertilizers, and monitor pests regularly."}</p>
        </div>
      </section>

      <div class="results-actions">
        <button type="button" class="btn btn-outline-success rounded-pill px-4" id="btnDownloadPdf">
          <i class="bi bi-file-earmark-pdf-fill"></i> Download PDF
        </button>
        <button type="button" class="btn btn-outline-success rounded-pill px-4" id="btnNewPrediction">
          <i class="bi bi-arrow-repeat"></i> New Prediction
        </button>
        <a href="/" class="btn btn-hero-primary rounded-pill px-4">
          <i class="bi bi-house-fill"></i> Back to Dashboard
        </a>
      </div>
    `;

    $("#btnNewPrediction").addEventListener("click", () => {
      showWizard();
      showStep(1);
    });

    $("#btnDownloadPdf").addEventListener("click", async () => {
      try {
        const res = await fetch("/api/predict/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(r),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Could not generate PDF.");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Crop_recommendations.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        showAlert(err.message || "Failed to download crop recommendations PDF.");
      }
    });
  }

  btnNext.addEventListener("click", async () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2) {
      const ok = await validateStep2();
      if (!ok) return;
    }
    if (currentStep === 3) {
      if (!preprocessDone) return;
      await showResultsPage();
      return;
    }

    await showStep(currentStep + 1);
  });

  btnBack.addEventListener("click", () => {
    if (currentStep > 1) showStep(currentStep - 1);
  });

  $("#locationSearch").addEventListener("input", (e) => {
    selectedLocation = null;
    weatherReady = false;
    $("#step1Ready").classList.add("d-none");
    $("#selectedLocationBox").classList.add("d-none");
    $("#weatherBox").classList.add("d-none");
    $("#temperature").value = "";
    $("#humidity").value = "";
    $("#rainfall").value = "";
    updateNav();

    const query = e.target.value.trim();
    clearTimeout(searchTimer);
    if (query.length < 2) {
      hideDropdown();
      return;
    }
    searchTimer = setTimeout(async () => {
      const results = await searchLocations(query);
      showDropdown(results);
    }, 200);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".location-search-wrap")) hideDropdown();
  });

  $("#soilFile").addEventListener("change", (e) => {
    handleFileInput(e.target.files[0]);
  });

  showStep(1);
  setStep1Ready(false);
  updateNav();
})();
