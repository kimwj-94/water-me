// ==========================================================================
// '💧물 줘!' Core Logic & Calendar Sync System
// ==========================================================================

// 식물 도감은 로컬 파일 실행에서도 읽을 수 있도록 글로벌 변수로 참조합니다.
const basePlantDatabase = window.plantDatabase || [];
let customPlantDatabase = [];
let plantDatabase = [];

// --- 전역 상태 관리 ---
let plants = [];
let activeTab = 'dashboard';
let googleTokenClient = null;
let googleAccessToken = null;
let googleCalendarId = null;
let googleApiClientReady = false;
let googleStateEventId = null;
let googleStateUpdatedAt = null;
let cloudStateLoaded = false;
let googleWorkQueue = Promise.resolve();
let googleWorkDepth = 0;
let midnightRefreshTimer = null;

const APP_STATE_MARKER = 'WATER_ME_APP_STATE';
const APP_NAME = '💧물 줘!';
const DEFAULT_CALENDAR_NAME = '💧물 줘! 식물 관리';
const LEGACY_CALENDAR_NAME = '물 줘! 식물 관리';
const APP_STATE_SUMMARY = `${APP_NAME} 앱 데이터 (삭제 금지)`;
const APP_STATE_DATE = '2099-01-01';
const LOCAL_PLANTS_KEY = 'water_me_plants';
const LOCAL_CUSTOM_DB_KEY = 'water_me_custom_plant_database';
const LOCAL_THEME_KEY = 'water_me_theme';
const GOOGLE_BATCH_SIZE = 50;

// 구글 API 설정 정보
let googleCredentials = {
  clientId: '',
  apiKey: ''
};

// 날짜와 사용자 입력은 앱 전체 안정성의 핵심이므로 공통 유틸로만 다룹니다.
function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateOnly(dateStr) {
  const match = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDaysToDateString(dateStr, days) {
  const date = parseDateOnly(dateStr);
  if (!date) return formatLocalDate();
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function nowStamp() {
  return new Date().toISOString();
}

function isFileProtocol() {
  return window.location.protocol === 'file:';
}

function runGoogleWork(label, task) {
  if (googleWorkDepth > 0) {
    return task();
  }

  const queuedTask = googleWorkQueue
    .catch(() => {})
    .then(async () => {
      googleWorkDepth++;
      updateSyncUiState(true, label);
      try {
        return await task();
      } finally {
        googleWorkDepth--;
        updateSyncUiState(false);
      }
    });

  googleWorkQueue = queuedTask.catch(() => {});
  return queuedTask;
}

function updateSyncUiState(isBusy, label = '') {
  if (DOM?.btnSyncCalendar) {
    DOM.btnSyncCalendar.disabled = isBusy || !isGoogleConnected();
  }

  if (isBusy && DOM?.googleSyncBox && isGoogleConnected()) {
    DOM.googleSyncBox.innerHTML = `
      <span class="status-indicator status-online"></span>
      <span class="status-text">${escapeHTML(label || '구글 캘린더 처리 중...')}</span>
    `;
  }
}

function isGoogleAuthError(err) {
  const code = err?.status || err?.result?.error?.code || err?.body?.error?.code;
  return code === 401 || code === 403;
}

function isGoogleGoneError(err) {
  const code = err?.status || err?.result?.error?.code || err?.body?.error?.code;
  return code === 404 || code === 410;
}

function requestGoogleToken(prompt = 'consent') {
  return new Promise((resolve, reject) => {
    if (!googleTokenClient || !googleApiClientReady) {
      reject(new Error('구글 API가 아직 준비되지 않았습니다.'));
      return;
    }

    googleTokenClient.callback = (response) => {
      if (response?.error) {
        reject(new Error(response.error_description || response.error));
        return;
      }
      googleAccessToken = response.access_token;
      if (gapi?.client?.setToken) {
        gapi.client.setToken({ access_token: googleAccessToken });
      }
      resolve(response);
    };

    googleTokenClient.requestAccessToken({ prompt });
  });
}

async function refreshGoogleAccessToken() {
  try {
    await requestGoogleToken('');
    return true;
  } catch (err) {
    console.warn('구글 토큰 자동 갱신 실패:', err);
    return false;
  }
}

async function executeGoogleRequest(requestFactory, options = {}) {
  const { retryAuth = true } = options;
  if (googleAccessToken && gapi?.client?.setToken) {
    gapi.client.setToken({ access_token: googleAccessToken });
  }

  try {
    return await requestFactory();
  } catch (err) {
    if (retryAuth && isGoogleAuthError(err) && await refreshGoogleAccessToken()) {
      if (googleAccessToken && gapi?.client?.setToken) {
        gapi.client.setToken({ access_token: googleAccessToken });
      }
      return requestFactory();
    }
    throw err;
  }
}

async function runGoogleBatch(requestFactories, fallbackRunner) {
  const factories = requestFactories.filter(Boolean);
  if (factories.length === 0) return [];

  if (!gapi?.client?.newBatch) {
    return fallbackRunner();
  }

  try {
    const results = [];
    for (let i = 0; i < factories.length; i += GOOGLE_BATCH_SIZE) {
      const batch = gapi.client.newBatch();
      factories.slice(i, i + GOOGLE_BATCH_SIZE).forEach((factory, index) => {
        batch.add(factory(), { id: String(i + index) });
      });
      const response = await executeGoogleRequest(() => batch);
      results.push(response);
    }
    return results;
  } catch (err) {
    console.warn('구글 배치 요청 실패, 순차 처리로 전환:', err);
    return fallbackRunner();
  }
}

function extractCreatedEventIdsFromBatchResults(batchResults) {
  const ids = [];
  batchResults.forEach((batchResponse) => {
    const result = batchResponse?.result || {};
    Object.values(result).forEach((entry) => {
      const eventId = entry?.result?.id || entry?.id;
      if (eventId) ids.push(eventId);
    });
  });
  return ids;
}

function sanitizePlantForState(plant) {
  const normalized = normalizePlant(plant);
  return {
    id: normalized.id,
    name: normalized.name,
    nickname: normalized.nickname,
    waterPeriod: normalized.waterPeriod,
    lastWatered: normalized.lastWatered,
    seasonalAdjustment: normalized.seasonalAdjustment !== false,
    updatedAt: normalized.updatedAt || nowStamp()
  };
}

function buildAppStatePayload() {
  return {
    schemaVersion: 2,
    updatedAt: nowStamp(),
    plants: plants.map(sanitizePlantForState).filter(plant => plant.name),
    customPlantDatabase: customPlantDatabase
      .map(entry => normalizePlantDbEntry(entry, 'custom'))
      .filter(entry => entry.name)
  };
}

function applyAppStatePayload(payload) {
  const state = payload && typeof payload === 'object' ? payload : {};
  plants = Array.isArray(state.plants)
    ? state.plants.map(normalizePlant).filter(plant => plant.name)
    : [];

  customPlantDatabase = Array.isArray(state.customPlantDatabase)
    ? state.customPlantDatabase
      .map(entry => normalizePlantDbEntry(entry, 'custom'))
      .filter(entry => entry.name)
    : customPlantDatabase;

  googleStateUpdatedAt = state.updatedAt || nowStamp();
  refreshPlantDatabase();
  saveCustomPlantDatabase();
  savePlantsToStorage();
}

function encodeAppStatePayload(payload) {
  return encodeURIComponent(JSON.stringify(payload));
}

function decodeAppStatePayload(description = '') {
  const match = String(description).match(/<!--WATER_ME_APP_STATE:(.*?)-->/);
  if (!match || !match[1]) return null;

  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch (err) {
    console.error('앱 데이터 이벤트 파싱 실패:', err);
    return null;
  }
}

function getKoreaSeason(dateInput = new Date()) {
  const date = typeof dateInput === 'string'
    ? parseDateOnly(dateInput) || new Date()
    : dateInput;
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function getSeasonLabel(season) {
  return {
    spring: '봄',
    summer: '여름',
    autumn: '가을',
    winter: '겨울'
  }[season] || '계절';
}

function getDefaultSeasonalWatering(name = '') {
  const lowerName = name.toLowerCase();
  const dryLovingKeywords = [
    '선인장', '다육', '스투키', '산세베리아', '문샤인', '금전수',
    '돈나무', '소철', '호야', '페페로미아', '틸란드시아'
  ];
  const moistureLovingKeywords = [
    '율마', '유칼립투스', '보스턴고사리', '피토니아', '칼라데아',
    '마란타', '스파티필름', '마리모', '로즈마리'
  ];

  if (dryLovingKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
    return { spring: 1, summer: 0.9, autumn: 1.15, winter: 2.2 };
  }

  if (moistureLovingKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
    return { spring: 0.9, summer: 0.75, autumn: 1, winter: 1.25 };
  }

  return { spring: 1, summer: 0.8, autumn: 1, winter: 1.5 };
}

function normalizeSeasonalWatering(raw, name = '') {
  const defaults = getDefaultSeasonalWatering(name);
  const profile = raw && typeof raw === 'object' ? raw : {};
  return ['spring', 'summer', 'autumn', 'winter'].reduce((acc, season) => {
    const value = Number(profile[season]);
    acc[season] = Number.isFinite(value) && value > 0 ? value : defaults[season];
    return acc;
  }, {});
}

function normalizePlant(raw) {
  const waterPeriod = parseInt(raw?.waterPeriod, 10);
  const id = String(raw?.id || Date.now());
  const name = String(raw?.name || '').trim();
  const lastWatered = parseDateOnly(raw?.lastWatered) ? raw.lastWatered : formatLocalDate();

  return {
    id,
    name,
    nickname: String(raw?.nickname || '').trim(),
    waterPeriod: Number.isFinite(waterPeriod) && waterPeriod >= 1 ? waterPeriod : 7,
    lastWatered,
    googleEventId: raw?.googleEventId || null,
    googleEventIds: Array.isArray(raw?.googleEventIds)
      ? raw.googleEventIds
      : (raw?.googleEventId ? [raw.googleEventId] : []),
    seasonalAdjustment: raw?.seasonalAdjustment !== false,
    updatedAt: raw?.updatedAt || raw?.lastModified || nowStamp()
  };
}

function normalizePlantDbEntry(raw, source = 'custom') {
  const waterPeriod = parseInt(raw?.waterPeriod, 10);
  const name = String(raw?.name || '').trim();

  return {
    id: String(raw?.id || `custom-${Date.now()}`),
    name,
    scientificName: String(raw?.scientificName || '').trim(),
    waterPeriod: Number.isFinite(waterPeriod) && waterPeriod >= 1 && waterPeriod <= 365 ? waterPeriod : 7,
    light: String(raw?.light || '반양지').trim(),
    difficulty: String(raw?.difficulty || '보통').trim(),
    tip: String(raw?.tip || '').trim(),
    seasonalWatering: normalizeSeasonalWatering(raw?.seasonalWatering, name),
    source
  };
}

function loadCustomPlantDatabase() {
  const saved = localStorage.getItem(LOCAL_CUSTOM_DB_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      customPlantDatabase = Array.isArray(parsed)
        ? parsed.map(entry => normalizePlantDbEntry(entry, 'custom')).filter(entry => entry.name)
        : [];
    } catch (e) {
      customPlantDatabase = [];
      localStorage.removeItem(LOCAL_CUSTOM_DB_KEY);
    }
  }
  refreshPlantDatabase();
}

function saveCustomPlantDatabase() {
  localStorage.setItem(LOCAL_CUSTOM_DB_KEY, JSON.stringify(customPlantDatabase));
}

function refreshPlantDatabase() {
  const baseEntries = basePlantDatabase.map((entry, index) => normalizePlantDbEntry({
    ...entry,
    id: entry.id || `base-${index}`
  }, 'base'));
  plantDatabase = [...baseEntries, ...customPlantDatabase];
}

// --- DOM 요소 참조 ---
const DOM = {
  // 내비게이션
  navButtons: document.querySelectorAll('.nav-btn'),
  tabs: document.querySelectorAll('.tab-content'),
  currentDateStr: document.getElementById('current-date-str'),
  
  // 대시보드
  countTotal: document.getElementById('count-total'),
  countToday: document.getElementById('count-today'),
  countUpcoming: document.getElementById('count-upcoming'),
  countHealthy: document.getElementById('count-healthy'),
  searchPlant: document.getElementById('search-plant'),
  filterStatus: document.getElementById('filter-status'),
  dashboardPlantGrid: document.getElementById('dashboard-plant-grid'),
  dashboardEmptyState: document.getElementById('dashboard-empty-state'),
  
  // 식물 목록
  plantTableBody: document.getElementById('plant-table-body'),
  tableEmptyState: document.getElementById('table-empty-state'),

  // 식물 도감
  plantDbSearch: document.getElementById('plant-db-search'),
  plantDbCount: document.getElementById('plant-db-count'),
  plantDbList: document.getElementById('plant-db-list'),
  plantDbForm: document.getElementById('plant-db-form'),
  dbPlantName: document.getElementById('db-plant-name'),
  dbPlantScientific: document.getElementById('db-plant-scientific'),
  dbPlantPeriod: document.getElementById('db-plant-period'),
  dbPlantDifficulty: document.getElementById('db-plant-difficulty'),
  dbPlantLight: document.getElementById('db-plant-light'),
  dbPlantTip: document.getElementById('db-plant-tip'),
  
  // 식물 등록 모달 & 폼
  plantModal: document.getElementById('plant-modal'),
  plantForm: document.getElementById('plant-form'),
  modalTitle: document.getElementById('modal-title'),
  editPlantId: document.getElementById('edit-plant-id'),
  plantNameInput: document.getElementById('plant-name-input'),
  plantNicknameInput: document.getElementById('plant-nickname-input'),
  plantPeriodInput: document.getElementById('plant-period-input'),
  plantLastWateredInput: document.getElementById('plant-last-watered-input'),
  plantSeasonalAdjustmentInput: document.getElementById('plant-seasonal-adjustment-input'),
  autocompleteList: document.getElementById('autocomplete-list'),
  dbInfoBox: document.getElementById('db-info-box'),
  infoLightText: document.getElementById('info-light-text'),
  infoDiffText: document.getElementById('info-diff-text'),
  infoTipText: document.getElementById('info-tip-text'),
  btnSearchNaver: document.getElementById('btn-search-naver'),
  btnSearchGoogle: document.getElementById('btn-search-google'),
  btnAddPlantTrigger: document.getElementById('btn-add-plant-trigger'),
  btnModalClose: document.getElementById('btn-modal-close'),
  btnModalCancel: document.getElementById('btn-modal-cancel'),
  btnModalSubmit: document.getElementById('btn-modal-submit'),
  
  // 캘린더 설정
  googleClientId: document.getElementById('google-client-id'),
  googleApiKey: document.getElementById('google-api-key'),
  googleCalendarIdInput: document.getElementById('google-calendar-id'),
  btnSaveCredentials: document.getElementById('btn-save-credentials'),
  btnGoogleLogin: document.getElementById('btn-google-login'),
  btnGoogleLogout: document.getElementById('btn-google-logout'),
  googleSyncBox: document.getElementById('google-sync-box'),
  btnSyncCalendar: document.getElementById('btn-sync-calendar'),
  btnSettingsOpen: document.getElementById('btn-settings-open'),
  btnSettingsClose: document.getElementById('btn-settings-close'),
  settingsModal: document.getElementById('settings-modal'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  linkShowGuide: document.getElementById('link-show-guide'),
  guideModal: document.getElementById('guide-modal'),
  btnGuideClose: document.getElementById('btn-guide-close'),
  
  // 토스트
  toastContainer: document.getElementById('toast-container')
};

// ==========================================================================
// 1. 초기화 & 생명주기
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // 현재 날짜 갱신
  updateCurrentDateDisplay();
  loadThemePreference();
  
  // 로컬 저장소에서 데이터 로드
  loadCustomPlantDatabase();
  loadPlantsFromStorage();
  loadCredentialsFromStorage();
  
  // 이벤트 리스너 등록
  registerEventListeners();
  
  // 화면 최초 렌더링
  renderApp();
  scheduleMidnightRefresh();
  
  // Google API 비동기 로딩 대기 후 클라이언트 초기화 시도
  let sdkLoadAttempts = 0;
  const sdkCheckInterval = setInterval(() => {
    sdkLoadAttempts++;
    if ((typeof google !== 'undefined' && typeof gapi !== 'undefined') || sdkLoadAttempts >= 30) {
      clearInterval(sdkCheckInterval);
      tryInitGoogleAPI();
    }
  }, 1000);
}

function updateCurrentDateDisplay() {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  const today = new Date();
  DOM.currentDateStr.textContent = today.toLocaleDateString('ko-KR', options);
}

function scheduleMidnightRefresh() {
  if (midnightRefreshTimer) {
    clearTimeout(midnightRefreshTimer);
  }

  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setDate(now.getDate() + 1);
  nextMidnight.setHours(0, 0, 5, 0);

  midnightRefreshTimer = setTimeout(() => {
    updateCurrentDateDisplay();
    renderApp();
    scheduleMidnightRefresh();
  }, nextMidnight.getTime() - now.getTime());
}

function applyTheme(theme) {
  const normalizedTheme = theme === 'light' ? 'light' : 'dark';
  document.body.classList.toggle('light-theme', normalizedTheme === 'light');
  document.body.classList.toggle('dark-theme', normalizedTheme !== 'light');
  if (DOM.btnThemeToggle) {
    const icon = DOM.btnThemeToggle.querySelector('.material-icons-round');
    if (icon) icon.textContent = normalizedTheme === 'light' ? 'dark_mode' : 'light_mode';
    DOM.btnThemeToggle.title = normalizedTheme === 'light' ? '다크모드로 전환' : '라이트모드로 전환';
  }
}

function loadThemePreference() {
  const savedTheme = localStorage.getItem(LOCAL_THEME_KEY);
  applyTheme(savedTheme || 'dark');
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
  localStorage.setItem(LOCAL_THEME_KEY, nextTheme);
  applyTheme(nextTheme);
}

function openSettingsModal() {
  DOM.settingsModal.classList.add('active');
  setTimeout(() => DOM.googleClientId.focus(), 0);
}

function closeSettingsModal() {
  DOM.settingsModal.classList.remove('active');
}

// ==========================================================================
// 2. 이벤트 리스너 설정
// ==========================================================================

function registerEventListeners() {
  // 탭 전환
  DOM.navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = e.currentTarget.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
  
  // 검색 및 필터링
  DOM.searchPlant.addEventListener('input', renderApp);
  DOM.filterStatus.addEventListener('change', renderApp);
  
  // 식물 추가 모달 트리거
  DOM.btnAddPlantTrigger.addEventListener('click', () => openPlantModal());
  DOM.btnModalClose.addEventListener('click', closePlantModal);
  DOM.btnModalCancel.addEventListener('click', closePlantModal);
  
  // 식물 자동완성 검색
  DOM.plantNameInput.addEventListener('input', handlePlantNameInput);
  DOM.plantNameInput.addEventListener('focus', handlePlantNameInput);
  
  // 자동완성 창 바깥 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (e.target !== DOM.plantNameInput && e.target !== DOM.autocompleteList) {
      DOM.autocompleteList.classList.add('hidden');
    }
  });
  
  // 검색 링크 연동
  DOM.btnSearchNaver.addEventListener('click', () => searchPlantOnWeb('naver'));
  DOM.btnSearchGoogle.addEventListener('click', () => searchPlantOnWeb('google'));
  
  // 식물 등록 폼 제출
  DOM.plantForm.addEventListener('submit', handlePlantFormSubmit);
  
  // 식물 도감
  DOM.plantDbSearch.addEventListener('input', renderApp);
  DOM.plantDbForm.addEventListener('submit', handlePlantDbFormSubmit);
  
  // 구글 캘린더 설정
  DOM.btnSaveCredentials.addEventListener('click', saveCredentials);
  DOM.btnGoogleLogin.addEventListener('click', handleGoogleLogin);
  DOM.btnGoogleLogout.addEventListener('click', handleGoogleLogout);
  DOM.btnSyncCalendar.addEventListener('click', () => syncAllPlantsToGoogleCalendar({ confirmFirst: false }));
  DOM.btnSettingsOpen.addEventListener('click', openSettingsModal);
  DOM.btnSettingsClose.addEventListener('click', closeSettingsModal);
  DOM.btnThemeToggle.addEventListener('click', toggleTheme);
  
  // 구글 API 가이드 모달
  DOM.linkShowGuide.addEventListener('click', (e) => {
    e.preventDefault();
    DOM.guideModal.classList.add('active');
  });
  DOM.btnGuideClose.addEventListener('click', () => {
    DOM.guideModal.classList.remove('active');
  });
  
  // 모달 외부 클릭 시 닫기
  DOM.plantModal.addEventListener('click', (e) => {
    if (e.target === DOM.plantModal) closePlantModal();
  });
  DOM.guideModal.addEventListener('click', (e) => {
    if (e.target === DOM.guideModal) DOM.guideModal.classList.remove('active');
  });
  DOM.settingsModal.addEventListener('click', (e) => {
    if (e.target === DOM.settingsModal) closeSettingsModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (DOM.plantModal.classList.contains('active')) closePlantModal();
    if (DOM.guideModal.classList.contains('active')) DOM.guideModal.classList.remove('active');
    if (DOM.settingsModal.classList.contains('active')) closeSettingsModal();
  });
}

// 탭 전환
function switchTab(tabId) {
  activeTab = tabId;
  
  // 내비게이션 버튼 갱신
  DOM.navButtons.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // 탭 콘텐츠 갱신
  DOM.tabs.forEach(tab => {
    if (tab.id === `tab-${tabId}`) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  renderApp();
}

// ==========================================================================
// 3. 식물 데이터 CRUD & 계산 로직
// ==========================================================================

// 식물 정보 로컬 로드
function loadPlantsFromStorage() {
  const saved = localStorage.getItem(LOCAL_PLANTS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      plants = Array.isArray(parsed)
        ? parsed.map(normalizePlant).filter(plant => plant.name)
        : [];
      savePlantsToStorage();
    } catch (e) {
      showToast('식물 데이터를 불러오는 중 오류 발생. 초기화합니다.', 'error');
      plants = [];
    }
  } else {
    plants = [];
  }
}

// 식물 정보 로컬 저장
function savePlantsToStorage() {
  localStorage.setItem(LOCAL_PLANTS_KEY, JSON.stringify(plants.map(sanitizePlantForState)));
}

function isGoogleConnected() {
  return Boolean(
    googleAccessToken &&
    googleCalendarId &&
    typeof gapi !== 'undefined' &&
    gapi?.client?.calendar
  );
}

async function persistAppState(options = {}) {
  return runGoogleWork('변경사항 저장 중...', () => persistAppStateUnsafe(options));
}

async function persistAppStateUnsafe(options = {}) {
  const { rebuildCalendar = true, quiet = false } = options;
  savePlantsToStorage();
  saveCustomPlantDatabase();
  renderApp();

  if (!isGoogleConnected()) {
    if (!quiet) {
      showToast('현재 기기에만 저장되었습니다. PC/모바일 공유는 구글 연동 후 사용할 수 있습니다.', 'warning');
    }
    return;
  }

  await saveAppStateToGoogleCalendar();

  if (rebuildCalendar) {
    await syncAllPlantsToGoogleCalendar({
      confirmFirst: false,
      saveStateFirst: false,
      quiet: true
    });
  }
}

function getPlantSeasonalProfile(plant) {
  const info = plantDatabase.find(entry => entry.name === plant.name);
  return normalizeSeasonalWatering(info?.seasonalWatering, plant.name);
}

function calculateEffectiveWaterPeriod(plant, dateStr = formatLocalDate()) {
  const basePeriod = parseInt(plant.waterPeriod, 10);
  const safeBasePeriod = Number.isFinite(basePeriod) && basePeriod > 0 ? basePeriod : 7;
  if (plant.seasonalAdjustment === false) {
    return {
      days: safeBasePeriod,
      season: getKoreaSeason(dateStr),
      multiplier: 1,
      adjusted: false
    };
  }

  const season = getKoreaSeason(dateStr);
  const profile = getPlantSeasonalProfile(plant);
  const multiplier = profile[season] || 1;
  const days = Math.max(1, Math.round(safeBasePeriod * multiplier));

  return {
    days,
    season,
    multiplier,
    adjusted: multiplier !== 1
  };
}

function calculateNextWateringFromLastWatered(plant, referenceDateStr = formatLocalDate()) {
  const seasonalAnchorDate = plant.lastWatered < referenceDateStr
    ? referenceDateStr
    : plant.lastWatered;
  const effective = calculateEffectiveWaterPeriod(plant, seasonalAnchorDate);
  return {
    nextDateStr: addDaysToDateString(plant.lastWatered, effective.days),
    effective
  };
}

// D-Day 및 날짜 계산기
function calculatePlantSchedule(plant) {
  const todayStr = formatLocalDate();
  const lastWateredDate = parseDateOnly(plant.lastWatered) || parseDateOnly(todayStr);
  const nextWatering = calculateNextWateringFromLastWatered(plant, todayStr);
  const nextWateredDateStr = nextWatering.nextDateStr;
  const nextWateredDate = parseDateOnly(nextWateredDateStr);
  const effective = nextWatering.effective;
  
  // D-Day 일수 계산 (자정 기준 정규화)
  const today = parseDateOnly(todayStr);
  const targetDate = nextWateredDate || lastWateredDate;
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    nextWateredDateStr,
    dDay: diffDays,
    effectiveWaterPeriod: effective.days,
    season: effective.season,
    seasonalMultiplier: effective.multiplier,
    seasonalAdjusted: plant.seasonalAdjustment !== false && effective.multiplier !== 1
  };
}

// 대시보드 상태 필터 조건 설정
function getPlantStatus(dDay) {
  if (dDay < 0) return 'danger';    // 이미 물주기 지남 (매우 건조)
  if (dDay === 0) return 'warning';  // 오늘이 바로 물주는 날 (건조)
  if (dDay <= 3) return 'upcoming'; // 3일 이내 줘야 함 (경고 임박)
  return 'healthy';                 // 아직 촉촉하고 건강함
}

// ==========================================================================
// 4. UI 렌더링 시스템 (대시보드 & 목록 테이블)
// ==========================================================================

function renderApp() {
  // 1. 상태 카운터 업데이트
  updateCounters();
  
  // 2. 검색 및 상태 필터링 적용
  const query = DOM.searchPlant.value.trim().toLowerCase();
  const filter = DOM.filterStatus.value;
  
  let filteredPlants = plants.map(plant => {
    const schedule = calculatePlantSchedule(plant);
    return {
      ...plant,
      nextWatered: schedule.nextWateredDateStr,
      dDay: schedule.dDay,
      status: getPlantStatus(schedule.dDay),
      effectiveWaterPeriod: schedule.effectiveWaterPeriod,
      season: schedule.season,
      seasonalAdjusted: schedule.seasonalAdjusted
    };
  });
  
  // 검색어 필터
  if (query) {
    filteredPlants = filteredPlants.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.nickname && p.nickname.toLowerCase().includes(query))
    );
  }
  
  // 상태 필터
  if (filter !== 'all') {
    if (filter === 'water-today') {
      filteredPlants = filteredPlants.filter(p => p.dDay <= 0);
    } else if (filter === 'water-upcoming') {
      filteredPlants = filteredPlants.filter(p => p.dDay > 0 && p.dDay <= 3);
    } else if (filter === 'watered') {
      filteredPlants = filteredPlants.filter(p => p.dDay > 3);
    }
  }
  
  // 정렬 (D-Day가 급한 순서로 정렬)
  filteredPlants.sort((a, b) => a.dDay - b.dDay);
  
  // 3. 현재 활성 탭에 맞춰 렌더링
  if (activeTab === 'dashboard') {
    renderDashboard(filteredPlants);
  } else if (activeTab === 'plants-list') {
    renderPlantsTable(filteredPlants);
  } else if (activeTab === 'plant-database') {
    renderPlantDatabase();
  }
}

// 상단 요약 카운터 갱신
function updateCounters() {
  const calculated = plants.map(p => calculatePlantSchedule(p));
  
  const total = plants.length;
  const today = calculated.filter(s => s.dDay <= 0).length;
  const upcoming = calculated.filter(s => s.dDay > 0 && s.dDay <= 3).length;
  const healthy = calculated.filter(s => s.dDay > 3).length;
  
  DOM.countTotal.textContent = total;
  DOM.countToday.textContent = today;
  DOM.countUpcoming.textContent = upcoming;
  DOM.countHealthy.textContent = healthy;
}

// 대시보드 그리드 렌더링
function renderDashboard(filteredPlants) {
  DOM.dashboardPlantGrid.innerHTML = '';
  
  if (filteredPlants.length === 0) {
    DOM.dashboardEmptyState.classList.remove('hidden');
    DOM.dashboardPlantGrid.appendChild(DOM.dashboardEmptyState);
    return;
  }
  
  DOM.dashboardEmptyState.classList.add('hidden');
  
  filteredPlants.forEach(plant => {
    const card = document.createElement('div');
    card.className = `glass-card plant-card`;
    const safePlantId = escapeHTML(plant.id);
    const safeName = escapeHTML(plant.name);
    const safeNickname = escapeHTML(plant.nickname || plant.name);
    const safeWaterPeriod = escapeHTML(plant.waterPeriod);
    const safeEffectiveWaterPeriod = escapeHTML(plant.effectiveWaterPeriod || plant.waterPeriod);
    const seasonalLabel = plant.seasonalAdjustment === false
      ? '계절 보정 꺼짐'
      : `${getSeasonLabel(plant.season)} 보정${plant.seasonalAdjusted ? ' 적용' : ' 기준'}`;
    const safeLastWatered = escapeHTML(plant.lastWatered);
    const safeNextWatered = escapeHTML(plant.nextWatered);
    
    // 상태에 따른 클래스 추가
    let statusClass = 'status-watered';
    let badgeClass = 'badge-watered';
    let dDayText = `D-${plant.dDay}`;
    
    if (plant.status === 'danger') {
      statusClass = 'status-danger';
      badgeClass = 'badge-danger';
      dDayText = `물 급함! D+${Math.abs(plant.dDay)}`;
    } else if (plant.status === 'warning') {
      statusClass = 'status-warning';
      badgeClass = 'badge-warning';
      dDayText = '오늘 줄 날!';
    } else if (plant.status === 'upcoming') {
      statusClass = 'status-warning';
      badgeClass = 'badge-warning';
      dDayText = `D-${plant.dDay}`;
    }
    
    card.classList.add(statusClass);
      
    // 구글 캘린더 연동 배지 표시
    const hasGoogleEvent = plant.googleEventId || plant.googleEventIds?.length
      ? `<span class="material-icons-round" style="font-size: 1rem; color: var(--color-primary); vertical-align: middle; margin-left: 4px;" title="구글 캘린더 동기화됨">sync</span>`
      : '';
    
    card.innerHTML = `
      <div class="card-top">
        <div class="plant-meta">
          <span class="plant-nickname">${safeNickname}</span>
          <span class="plant-typename">${safeName} ${hasGoogleEvent}</span>
        </div>
        <span class="dday-badge ${badgeClass}">${dDayText}</span>
      </div>
      
      <div class="schedule-info">
        <div class="schedule-row">
          <span>물주기 주기:</span>
          <strong>${safeEffectiveWaterPeriod}일마다</strong>
        </div>
        <div class="schedule-row">
          <span>계절 보정:</span>
          <span>${escapeHTML(seasonalLabel)}${plant.seasonalAdjusted ? ` (기본 ${safeWaterPeriod}일)` : ''}</span>
        </div>
        <div class="schedule-row">
          <span>마지막 물준 날:</span>
          <span>${safeLastWatered}</span>
        </div>
        <div class="schedule-row">
          <span>다음 물줄 날:</span>
          <span style="font-weight: 600; color: ${plant.status === 'danger' ? 'var(--color-danger)' : 'var(--text-main)'}">${safeNextWatered}</span>
        </div>
      </div>
      
      <div class="card-actions">
        <button class="btn btn-primary btn-water-action" data-id="${safePlantId}">
          <span class="material-icons-round" style="font-size: 1.1rem;">water_drop</span>
          물 줬어요!
        </button>
        <button class="btn btn-icon-only btn-edit-card" data-id="${safePlantId}" title="수정">
          <span class="material-icons-round" style="font-size: 1.1rem;">edit</span>
        </button>
        <button class="btn btn-icon-only btn-delete-card" data-id="${safePlantId}" title="삭제">
          <span class="material-icons-round" style="font-size: 1.1rem;">delete</span>
        </button>
      </div>
    `;
    
    DOM.dashboardPlantGrid.appendChild(card);
  });
  
  // 생성된 카드 내 액션 버튼 바인딩
  bindCardActionEvents();
}

// 카드 내 버튼 액션 이벤트 등록
function bindCardActionEvents() {
  document.querySelectorAll('.btn-water-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const plantId = e.currentTarget.getAttribute('data-id');
      waterPlant(plantId);
    });
  });
  
  document.querySelectorAll('.btn-edit-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const plantId = e.currentTarget.getAttribute('data-id');
      openPlantModal(plantId);
    });
  });
  
  document.querySelectorAll('.btn-delete-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const plantId = e.currentTarget.getAttribute('data-id');
      deletePlant(plantId);
    });
  });
}

// 식물 관리 리스트 렌더링
function renderPlantsTable(filteredPlants) {
  DOM.plantTableBody.innerHTML = '';
  
  if (filteredPlants.length === 0) {
    DOM.tableEmptyState.classList.remove('hidden');
    return;
  }
  
  DOM.tableEmptyState.classList.add('hidden');
  
  filteredPlants.forEach(plant => {
    const dbInfo = plantDatabase.find(d => d.name === plant.name);
    const difficulty = dbInfo ? dbInfo.difficulty : '보통';
    const safePlantId = escapeHTML(plant.id);
    const safeName = escapeHTML(plant.name);
    const safeNickname = escapeHTML(plant.nickname || '-');
    const safeWaterPeriod = escapeHTML(plant.waterPeriod);
    const safeEffectiveWaterPeriod = escapeHTML(plant.effectiveWaterPeriod || plant.waterPeriod);
    const safeLastWatered = escapeHTML(plant.lastWatered);
    const safeNextWatered = escapeHTML(plant.nextWatered);
    const safeScientificName = escapeHTML(dbInfo ? dbInfo.scientificName : '');
    const safeDifficulty = escapeHTML(difficulty);
    
    let diffClass = 'diff-medium';
    if (difficulty === '쉬움' || difficulty === '아주 쉬움') diffClass = 'diff-easy';
    if (difficulty === '어려움') diffClass = 'diff-hard';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="table-plant-info">
          <div class="table-avatar ${plant.status === 'danger' ? 'table-avatar-danger' : ''}">
            <span class="material-icons-round" style="font-size: 1.2rem;">local_florist</span>
          </div>
          <div>
            <div class="table-plant-name">${safeName}</div>
            <div class="table-plant-type">${safeScientificName}</div>
          </div>
        </div>
      </td>
      <td><strong>${safeNickname}</strong></td>
      <td>${safeEffectiveWaterPeriod}일마다</td>
      <td>${safeLastWatered}</td>
      <td>
        <span style="font-weight: bold; color: ${plant.status === 'danger' ? 'var(--color-danger)' : 'var(--text-main)'}">
          ${safeNextWatered}
        </span>
      </td>
      <td><span class="difficulty-badge ${diffClass}">${safeDifficulty}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-secondary btn-small btn-table-water" data-id="${safePlantId}">물주기</button>
          <button class="btn btn-secondary btn-small btn-table-edit" data-id="${safePlantId}">수정</button>
          <button class="btn btn-danger btn-small btn-table-delete" data-id="${safePlantId}">삭제</button>
        </div>
      </td>
    `;
    
    DOM.plantTableBody.appendChild(tr);
  });
  
  bindTableActionEvents();
}

function bindTableActionEvents() {
  document.querySelectorAll('.btn-table-water').forEach(btn => {
    btn.addEventListener('click', (e) => {
      waterPlant(e.currentTarget.getAttribute('data-id'));
    });
  });
  document.querySelectorAll('.btn-table-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      openPlantModal(e.currentTarget.getAttribute('data-id'));
    });
  });
  document.querySelectorAll('.btn-table-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      deletePlant(e.currentTarget.getAttribute('data-id'));
    });
  });
}

// ==========================================================================
// 5. 핵심 액션 (물주기, 삭제, 추가, 수정)
// ==========================================================================

async function waterPlant(id) {
  const index = plants.findIndex(p => p.id === id);
  if (index === -1) return;
  
  const todayStr = formatLocalDate();
  plants[index].lastWatered = todayStr;
  plants[index].updatedAt = nowStamp();
  
  showToast(`'${plants[index].nickname || plants[index].name}'에게 물을 주었습니다! 💧`, 'success');
  await persistAppState({ quiet: true });
}

async function deletePlant(id) {
  const index = plants.findIndex(p => p.id === id);
  if (index === -1) return;
  
  const name = plants[index].nickname || plants[index].name;
  
  if (confirm(`'${name}' 화분을 정말 삭제하시겠습니까?`)) {
    plants.splice(index, 1);
    showToast(`'${name}' 화분이 삭제되었습니다.`, 'warning');
    await persistAppState({ quiet: true });
  }
}

function openPlantModal(id = null) {
  DOM.plantForm.reset();
  DOM.dbInfoBox.classList.add('hidden');
  
  if (id) {
    const plant = plants.find(p => p.id === id);
    if (!plant) return;
    
    DOM.modalTitle.textContent = '화분 정보 수정하기';
    DOM.editPlantId.value = plant.id;
    DOM.plantNameInput.value = plant.name;
    DOM.plantNicknameInput.value = plant.nickname || '';
    DOM.plantPeriodInput.value = plant.waterPeriod;
    DOM.plantLastWateredInput.value = plant.lastWatered;
    DOM.plantSeasonalAdjustmentInput.checked = plant.seasonalAdjustment !== false;
    DOM.btnModalSubmit.textContent = '수정 완료';
    
    updatePlantDBInfoBox(plant.name);
  } else {
    DOM.modalTitle.textContent = '새 화분 등록하기';
    DOM.editPlantId.value = '';
    DOM.plantLastWateredInput.value = formatLocalDate();
    DOM.plantSeasonalAdjustmentInput.checked = true;
    DOM.btnModalSubmit.textContent = '등록하기';
  }
  
  DOM.plantModal.classList.add('active');
}

function closePlantModal() {
  DOM.plantModal.classList.remove('active');
}

async function handlePlantFormSubmit(e) {
  e.preventDefault();
  
  const id = DOM.editPlantId.value;
  const name = DOM.plantNameInput.value.trim();
  const nickname = DOM.plantNicknameInput.value.trim();
  const waterPeriod = parseInt(DOM.plantPeriodInput.value, 10);
  const lastWatered = DOM.plantLastWateredInput.value;
  const seasonalAdjustment = DOM.plantSeasonalAdjustmentInput.checked;
  
  if (!name || isNaN(waterPeriod) || !lastWatered || !parseDateOnly(lastWatered)) {
    showToast('필수 항목을 모두 올바르게 채워주세요.', 'error');
    return;
  }

  if (waterPeriod < 1 || waterPeriod > 365) {
    showToast('물주기 주기는 1일부터 365일 사이로 입력해 주세요.', 'error');
    return;
  }
  
  if (id) {
    const index = plants.findIndex(p => p.id === id);
    if (index !== -1) {
      plants[index] = {
        ...plants[index],
        name,
        nickname,
        waterPeriod,
        lastWatered,
        seasonalAdjustment,
        updatedAt: nowStamp()
      };
      
      closePlantModal();
      showToast('화분 정보가 수정되었습니다.', 'success');
      await persistAppState({ quiet: true });
    }
  } else {
    const newPlant = {
      id: Date.now().toString(),
      name,
      nickname,
      waterPeriod,
      lastWatered,
      googleEventId: null,
      googleEventIds: [],
      seasonalAdjustment,
      updatedAt: nowStamp()
    };
    
    plants.push(newPlant);
    closePlantModal();
    showToast(`새로운 화분 '${nickname || name}'가 등록되었습니다! 🌱`, 'success');
    await persistAppState({ quiet: true });
  }
}

// ==========================================================================
// 6. 식물 도감 자동완성 및 검색 링크
// ==========================================================================

function handlePlantNameInput(e) {
  const value = e.target.value.trim().toLowerCase();
  DOM.autocompleteList.innerHTML = '';
  
  if (!value) {
    renderSuggestions(plantDatabase);
    return;
  }
  
  const matches = plantDatabase.filter(plant => 
    plant.name.toLowerCase().includes(value) || 
    plant.scientificName.toLowerCase().includes(value)
  );
  
  renderSuggestions(matches);
}

function renderSuggestions(matches) {
  if (matches.length === 0) {
    DOM.autocompleteList.classList.add('hidden');
    return;
  }
  
  matches.slice(0, 10).forEach(plant => {
    const li = document.createElement('li');
    li.textContent = `${plant.name} (${plant.scientificName})`;
    li.addEventListener('click', () => {
      DOM.plantNameInput.value = plant.name;
      DOM.plantPeriodInput.value = plant.waterPeriod;
      DOM.autocompleteList.classList.add('hidden');
      updatePlantDBInfoBox(plant.name);
    });
    DOM.autocompleteList.appendChild(li);
  });
  
  DOM.autocompleteList.classList.remove('hidden');
}

function updatePlantDBInfoBox(plantName) {
  const info = plantDatabase.find(p => p.name === plantName);
  
  if (info) {
    DOM.infoLightText.textContent = info.light;
    DOM.infoDiffText.textContent = info.difficulty;
    DOM.infoTipText.textContent = info.tip;
    DOM.dbInfoBox.classList.remove('hidden');
  } else {
    DOM.dbInfoBox.classList.add('hidden');
  }
}

function renderPlantDatabase() {
  const query = DOM.plantDbSearch.value.trim().toLowerCase();
  let entries = plantDatabase;

  if (query) {
    entries = entries.filter(entry =>
      entry.name.toLowerCase().includes(query) ||
      entry.scientificName.toLowerCase().includes(query) ||
      entry.light.toLowerCase().includes(query) ||
      entry.difficulty.toLowerCase().includes(query)
    );
  }

  entries = [...entries].sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
  DOM.plantDbCount.textContent = `${entries.length}종`;
  DOM.plantDbList.innerHTML = '';

  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state plant-db-empty';
    empty.innerHTML = `
      <span class="material-icons-round empty-icon">search_off</span>
      <h3>검색 결과가 없습니다</h3>
      <p>왼쪽에서 새 도감 항목을 추가해 보세요.</p>
    `;
    DOM.plantDbList.appendChild(empty);
    return;
  }

  entries.forEach(entry => {
    const item = document.createElement('article');
    item.className = 'plant-db-item';
    const sourceBadge = entry.source === 'custom'
      ? '<span class="db-source db-source-custom">내 추가</span>'
      : '<span class="db-source db-source-base">기본</span>';
    const deleteButton = entry.source === 'custom'
      ? `<button class="btn btn-danger btn-small btn-delete-db-entry" data-id="${escapeHTML(entry.id)}">삭제</button>`
      : '';

    item.innerHTML = `
      <div class="plant-db-item-head">
        <div>
          <h4>${escapeHTML(entry.name)}</h4>
          <p>${escapeHTML(entry.scientificName || '학명 정보 없음')}</p>
        </div>
        ${sourceBadge}
      </div>
      <div class="plant-db-tags">
        <span class="info-tag tag-light"><span class="material-icons-round">water_drop</span>${escapeHTML(entry.waterPeriod)}일</span>
        <span class="info-tag tag-light"><span class="material-icons-round">wb_sunny</span>${escapeHTML(entry.light)}</span>
        <span class="info-tag tag-difficulty"><span class="material-icons-round">construction</span>${escapeHTML(entry.difficulty)}</span>
      </div>
      <p class="plant-db-tip">${escapeHTML(entry.tip || '관리 팁이 아직 없습니다.')}</p>
      <div class="plant-db-actions">
        <button class="btn btn-secondary btn-small btn-use-db-entry" data-name="${escapeHTML(entry.name)}">
          화분 등록에 사용
        </button>
        ${deleteButton}
      </div>
    `;

    DOM.plantDbList.appendChild(item);
  });

  bindPlantDatabaseEvents();
}

function bindPlantDatabaseEvents() {
  document.querySelectorAll('.btn-use-db-entry').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const name = e.currentTarget.getAttribute('data-name');
      switchTab('dashboard');
      openPlantModal();
      DOM.plantNameInput.value = name;
      const entry = plantDatabase.find(item => item.name === name);
      if (entry) {
        DOM.plantPeriodInput.value = entry.waterPeriod;
        updatePlantDBInfoBox(entry.name);
      }
    });
  });

  document.querySelectorAll('.btn-delete-db-entry').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      deleteCustomPlantDbEntry(id);
    });
  });
}

async function handlePlantDbFormSubmit(e) {
  e.preventDefault();

  const entry = normalizePlantDbEntry({
    id: `custom-${Date.now()}`,
    name: DOM.dbPlantName.value,
    scientificName: DOM.dbPlantScientific.value,
    waterPeriod: DOM.dbPlantPeriod.value,
    difficulty: DOM.dbPlantDifficulty.value,
    light: DOM.dbPlantLight.value,
    tip: DOM.dbPlantTip.value
  }, 'custom');

  if (!entry.name) {
    showToast('식물 이름을 입력해 주세요.', 'warning');
    return;
  }

  const duplicate = plantDatabase.find(item => item.name.toLowerCase() === entry.name.toLowerCase());
  if (duplicate && !confirm(`'${entry.name}' 항목이 이미 있습니다. 그래도 내 도감에 추가할까요?`)) {
    return;
  }

  customPlantDatabase.push(entry);
  refreshPlantDatabase();
  DOM.plantDbForm.reset();
  DOM.dbPlantDifficulty.value = '보통';
  renderPlantDatabase();
  showToast(`'${entry.name}' 도감 항목을 추가했습니다.`, 'success');
  await persistAppState({ rebuildCalendar: false, quiet: true });
}

async function deleteCustomPlantDbEntry(id) {
  const entry = customPlantDatabase.find(item => item.id === id);
  if (!entry) return;
  if (!confirm(`'${entry.name}' 도감 항목을 삭제할까요?`)) return;

  customPlantDatabase = customPlantDatabase.filter(item => item.id !== id);
  refreshPlantDatabase();
  renderPlantDatabase();
  showToast(`'${entry.name}' 도감 항목을 삭제했습니다.`, 'warning');
  await persistAppState({ rebuildCalendar: false, quiet: true });
}

function searchPlantOnWeb(platform) {
  const name = DOM.plantNameInput.value.trim();
  if (!name) {
    showToast('검색할 식물 이름을 먼저 입력해 주세요.', 'warning');
    return;
  }
  
  const query = encodeURIComponent(`${name} 물주기 주기 방법`);
  let url = '';
  
  if (platform === 'naver') {
    url = `https://search.naver.com/search.naver?query=${query}`;
  } else {
    url = `https://www.google.com/search?q=${query}`;
  }
  
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ==========================================================================
// 7. Google Calendar API 연동 및 OAuth 인증 (캘린더 중앙 데이터)
// ==========================================================================

function loadCredentialsFromStorage() {
  const saved = localStorage.getItem('water_me_google_credentials');
  const defaultConfig = window.waterMeGoogleConfig || {};
  DOM.btnGoogleLogin.disabled = false;
  if (saved) {
    try {
      const creds = JSON.parse(saved);
      googleCredentials = creds;
      DOM.googleClientId.value = creds.clientId || '';
      DOM.googleApiKey.value = creds.apiKey || '';
      DOM.googleCalendarIdInput.value = creds.calendarId || localStorage.getItem('water_me_google_calendar_id') || '';
      
      if (creds.clientId && creds.apiKey && !isFileProtocol()) {
        DOM.btnGoogleLogin.disabled = false;
      }
    } catch (e) {
      localStorage.removeItem('water_me_google_credentials');
    }
  } else if (defaultConfig.clientId && defaultConfig.apiKey) {
    googleCredentials = {
      clientId: defaultConfig.clientId,
      apiKey: defaultConfig.apiKey,
      calendarId: defaultConfig.calendarId || ''
    };
    DOM.googleClientId.value = googleCredentials.clientId;
    DOM.googleApiKey.value = googleCredentials.apiKey;
    DOM.googleCalendarIdInput.value = googleCredentials.calendarId;
    if (!isFileProtocol()) {
      DOM.btnGoogleLogin.disabled = false;
    }
  }
  googleCalendarId = DOM.googleCalendarIdInput.value.trim() || localStorage.getItem('water_me_google_calendar_id');
}

function saveCredentials() {
  const clientId = DOM.googleClientId.value.trim();
  const apiKey = DOM.googleApiKey.value.trim();
  const calendarId = DOM.googleCalendarIdInput.value.trim();
  
  if (!clientId || !apiKey) {
    showToast('Client ID와 API Key를 모두 입력해 주세요.', 'warning');
    return;
  }
  
  googleCredentials = { clientId, apiKey, calendarId };
  localStorage.setItem('water_me_google_credentials', JSON.stringify(googleCredentials));
  if (calendarId) {
    googleCalendarId = calendarId;
    localStorage.setItem('water_me_google_calendar_id', calendarId);
  } else {
    googleCalendarId = null;
    localStorage.removeItem('water_me_google_calendar_id');
  }
  
  DOM.btnGoogleLogin.disabled = isFileProtocol();
  if (isFileProtocol()) {
    showToast('설정은 저장했습니다. 구글 연동은 localhost나 배포 주소에서 실행할 때 사용할 수 있습니다.', 'warning');
  } else {
    closeSettingsModal();
    showToast('API 설정이 저장되었습니다. 이제 구글 로그인만 누르면 됩니다.', 'success');
  }
  tryInitGoogleAPI();
}

function tryInitGoogleAPI() {
  if (!googleCredentials.clientId || !googleCredentials.apiKey) {
    DOM.btnGoogleLogin.disabled = false;
    DOM.googleSyncBox.innerHTML = `
      <span class="status-indicator status-offline"></span>
      <span class="status-text">처음 한 번 구글 API 설정이 필요합니다</span>
    `;
    return;
  }
  googleApiClientReady = false;
  DOM.btnGoogleLogin.disabled = true;
  if (isFileProtocol()) {
    DOM.btnGoogleLogin.disabled = true;
    DOM.googleSyncBox.innerHTML = `
      <span class="status-indicator status-offline"></span>
      <span class="status-text">구글 연동은 localhost 또는 배포 주소에서 사용 가능</span>
    `;
    return;
  }
  if (typeof google === 'undefined' || typeof gapi === 'undefined') {
    DOM.googleSyncBox.innerHTML = `
      <span class="status-indicator status-offline"></span>
      <span class="status-text">구글 API 로딩 대기 중</span>
    `;
    return;
  }
  
  try {
    googleTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: googleCredentials.clientId,
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.calendarlist.readonly'
      ].join(' '),
      callback: (response) => {
        if (response.error !== undefined) {
          showToast(`구글 인증 실패: ${response.error}`, 'error');
          return;
        }
        googleAccessToken = response.access_token;
        onGoogleAuthSuccess();
      },
    });
    
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: googleCredentials.apiKey,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        });
        googleApiClientReady = true;
        DOM.btnGoogleLogin.disabled = false;
        DOM.googleSyncBox.innerHTML = `
          <span class="status-indicator status-offline"></span>
          <span class="status-text">구글 API 준비 완료. 계정 연동을 눌러 주세요.</span>
        `;
      } catch (err) {
        console.error('GAPI 초기화 에러:', err);
        googleApiClientReady = false;
        DOM.btnGoogleLogin.disabled = true;
        showToast('구글 API 초기화에 실패했습니다. API Key와 승인된 주소를 확인해 주세요.', 'error');
      }
    });
  } catch (err) {
    console.error('Google API SDK 초기화 중 예외 발생:', err);
    googleApiClientReady = false;
    DOM.btnGoogleLogin.disabled = true;
  }
}

function handleGoogleLogin() {
  if (!googleCredentials.clientId || !googleCredentials.apiKey) {
    openSettingsModal();
    showToast('처음 한 번만 구글 API 설정을 저장해 주세요.', 'warning');
    return;
  }
  if (!googleTokenClient || !googleApiClientReady) {
    showToast('구글 API가 아직 준비되지 않았습니다. 잠시 후 다시 누르거나 API 설정을 확인해 주세요.', 'error');
    return;
  }
  requestGoogleToken('consent')
    .then(onGoogleAuthSuccess)
    .catch((err) => {
      console.error('Google OAuth Error:', err);
      showToast('구글 인증에 실패했습니다. 계정 권한과 승인된 주소를 확인해 주세요.', 'error');
    });
}

function handleGoogleLogout() {
  if (googleAccessToken) {
    const clearGoogleState = () => {
      googleAccessToken = null;
      googleApiClientReady = typeof gapi !== 'undefined' && Boolean(gapi?.client?.calendar);
      DOM.googleSyncBox.innerHTML = `
        <span class="status-indicator status-offline"></span>
        <span class="status-text">구글 연동 해제됨</span>
      `;
      DOM.btnGoogleLogin.classList.remove('hidden');
      DOM.btnGoogleLogout.classList.add('hidden');
      DOM.btnSyncCalendar.disabled = true;
      showToast('구글 계정이 안전하게 연동 해제되었습니다.', 'warning');
    };

    if (typeof google !== 'undefined' && google?.accounts?.oauth2?.revoke) {
      google.accounts.oauth2.revoke(googleAccessToken, clearGoogleState);
    } else {
      clearGoogleState();
    }
  }
}

async function onGoogleAuthSuccess() {
  DOM.btnGoogleLogin.classList.add('hidden');
  DOM.btnGoogleLogout.classList.remove('hidden');
  DOM.btnSyncCalendar.disabled = false;
  
  DOM.googleSyncBox.innerHTML = `
    <span class="status-indicator status-online"></span>
    <span class="status-text">구글 서비스 연결 성공! 🟢</span>
  `;
  showToast('구글 계정이 성공적으로 연동되었습니다!', 'success');
  
  try {
    await setupWaterMeCalendar();

    await loadAppStateFromGoogleCalendar();
    await syncAllPlantsToGoogleCalendar({
      confirmFirst: false,
      saveStateFirst: false,
      quiet: true
    });
  } catch (err) {
    console.error('전용 캘린더 및 데이터 동기화 실패:', err);
    showToast(err.message || '전용 캘린더 및 데이터 동기화에 실패했습니다.', 'error');
  }
}

async function setupWaterMeCalendar() {
  if (!googleAccessToken) return;
  if (!gapi?.client?.calendar) return;
  gapi.client.setToken({ access_token: googleAccessToken });
  
  try {
    const preferredCalendarId = DOM.googleCalendarIdInput.value.trim() || googleCredentials.calendarId || googleCalendarId;
    if (preferredCalendarId) {
      try {
        const calendarEntry = await executeGoogleRequest(() => gapi.client.calendar.calendarList.get({
          calendarId: preferredCalendarId
        }));
        googleCalendarId = preferredCalendarId;
        googleCredentials.calendarId = preferredCalendarId;
        DOM.googleCalendarIdInput.value = preferredCalendarId;
        localStorage.setItem('water_me_google_calendar_id', preferredCalendarId);
        localStorage.setItem('water_me_google_credentials', JSON.stringify(googleCredentials));
        showToast(`고정 캘린더 '${calendarEntry.result.summary || preferredCalendarId}'를 사용합니다.`, 'success');
        return;
      } catch (err) {
        console.error('고정 캘린더 확인 실패:', err);
        throw new Error('저장된 캘린더 ID에 접근할 수 없습니다. 로그인 계정 권한과 캘린더 ID를 확인해 주세요.');
      }
    }

    const calendarList = await executeGoogleRequest(() => gapi.client.calendar.calendarList.list());
    const existing = calendarList.result.items.find(cal =>
      cal.summary === DEFAULT_CALENDAR_NAME ||
      cal.summary === LEGACY_CALENDAR_NAME
    );
    
    if (existing) {
      googleCalendarId = existing.id;
      localStorage.setItem('water_me_google_calendar_id', googleCalendarId);
    } else {
      throw new Error(`식물관리 캘린더 ID가 필요합니다. Google Calendar에서 '${DEFAULT_CALENDAR_NAME}' 캘린더를 만든 뒤 캘린더 ID를 설정에 저장해 주세요.`);
    }
  } catch (err) {
    console.error('캘린더 셋업 에러:', err);
    throw err;
  }
}

// --------------------------------------------------------------------------
// 구글 캘린더 기반 앱 데이터 저장소
// --------------------------------------------------------------------------

function buildAppStateEventResource(payload) {
  const encoded = encodeAppStatePayload(payload);

  return {
    summary: APP_STATE_SUMMARY,
    description: [
      `${APP_NAME} 앱의 중앙 데이터입니다.`,
      'PC와 모바일 동기화를 위해 필요하므로 삭제하지 마세요.',
      '',
      `<!--${APP_STATE_MARKER}:${encoded}-->`
    ].join('\n'),
    start: {
      date: APP_STATE_DATE,
      timeZone: 'Asia/Seoul'
    },
    end: {
      date: addDaysToDateString(APP_STATE_DATE, 1),
      timeZone: 'Asia/Seoul'
    },
    transparency: 'transparent',
    visibility: 'private',
    extendedProperties: {
      private: {
        waterMeState: 'true'
      }
    },
    reminders: {
      useDefault: false
    }
  };
}

function parseAppStateEvent(event) {
  const payload = decodeAppStatePayload(event?.description || '');
  if (!payload) return null;

  return {
    event,
    payload,
    updatedAt: payload.updatedAt || event.updated || ''
  };
}

function isWaterMeStateEvent(event) {
  const privateProps = event?.extendedProperties?.private || {};
  return privateProps.waterMeState === 'true' ||
    (event?.description || '').includes(APP_STATE_MARKER) ||
    event?.summary === APP_STATE_SUMMARY;
}

async function findAppStateEvents() {
  if (!isGoogleConnected()) return [];

  const byId = new Map();
  const queries = [
    { privateExtendedProperty: 'waterMeState=true' },
    { q: APP_STATE_MARKER },
    { q: APP_STATE_SUMMARY }
  ];

  for (const query of queries) {
    try {
      const events = await listGoogleCalendarEvents(query);
      events
        .filter(isWaterMeStateEvent)
        .forEach(event => byId.set(event.id, event));
    } catch (err) {
      console.error('앱 데이터 이벤트 조회 실패:', err);
    }
  }

  return Array.from(byId.values());
}

async function loadAppStateFromGoogleCalendar() {
  if (!isGoogleConnected()) return;

  gapi.client.setToken({ access_token: googleAccessToken });
  showToast('구글 캘린더에서 앱 데이터를 불러오는 중...', 'info');

  const stateEvents = await findAppStateEvents();
  const parsedStates = stateEvents
    .map(parseAppStateEvent)
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || ''));

  if (parsedStates.length > 0) {
    const latest = parsedStates[0];
    googleStateEventId = latest.event.id;
    applyAppStatePayload(latest.payload);
    cloudStateLoaded = true;
    renderApp();
    showToast('구글 캘린더의 중앙 데이터를 불러왔습니다.', 'success');

    for (const staleState of parsedStates.slice(1)) {
      await deleteGoogleCalendarEvent(staleState.event.id);
    }
    return;
  }

  if (plants.length === 0) {
    const legacyEvents = await fetchWaterMeCalendarEvents();
    const legacyPlantsById = new Map();
    legacyEvents.forEach(({ plant }) => {
      if (plant?.id && !legacyPlantsById.has(plant.id)) {
        legacyPlantsById.set(plant.id, sanitizePlantForState(plant));
      }
    });

    if (legacyPlantsById.size > 0) {
      plants = Array.from(legacyPlantsById.values());
      savePlantsToStorage();
      renderApp();
      showToast('기존 캘린더 일정에서 화분 데이터를 복구했습니다.', 'success');
    }
  }

  cloudStateLoaded = true;
  await saveAppStateToGoogleCalendar();
  showToast('현재 기기의 데이터를 구글 캘린더 중앙 데이터로 저장했습니다.', 'success');
}

async function saveAppStateToGoogleCalendar() {
  if (!isGoogleConnected()) return;

  gapi.client.setToken({ access_token: googleAccessToken });

  const payload = buildAppStatePayload();
  const resource = buildAppStateEventResource(payload);

  try {
    if (!googleStateEventId) {
      const existingStates = await findAppStateEvents();
      const parsed = existingStates.map(parseAppStateEvent).filter(Boolean);
      if (parsed.length > 0) {
        parsed.sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || ''));
        googleStateEventId = parsed[0].event.id;
      }
    }

    if (googleStateEventId) {
      try {
        await executeGoogleRequest(() => gapi.client.calendar.events.update({
          calendarId: googleCalendarId,
          eventId: googleStateEventId,
          resource
        }));
      } catch (err) {
        if (!isGoogleGoneError(err)) throw err;
        googleStateEventId = null;
      }
    }

    if (!googleStateEventId) {
      const created = await executeGoogleRequest(() => gapi.client.calendar.events.insert({
        calendarId: googleCalendarId,
        resource
      }));
      googleStateEventId = created.result.id;
    }

    googleStateUpdatedAt = payload.updatedAt;
    cloudStateLoaded = true;
    savePlantsToStorage();
    saveCustomPlantDatabase();
  } catch (err) {
    console.error('앱 데이터 이벤트 저장 실패:', err);
    showToast('구글 캘린더 중앙 데이터 저장에 실패했습니다.', 'error');
    throw err;
  }
}

// --------------------------------------------------------------------------
// 구글 일정 메타데이터 기반 알림 일정 생성
// --------------------------------------------------------------------------

function extractPlantFromGoogleEvent(event) {
  const description = event.description || '';
  const match = description.match(/<!--WATER_ME_METADATA:(.*?)-->/);
  if (!match || !match[1]) return null;

  try {
    const plantData = JSON.parse(decodeURIComponent(match[1]));
    return normalizePlant({
      ...plantData,
      googleEventId: event.recurringEventId || event.id,
      googleEventIds: [event.recurringEventId || event.id]
    });
  } catch (e) {
    console.warn('이벤트 메타데이터 파싱 실패:', e);
    return null;
  }
}

async function fetchWaterMeCalendarEvents() {
  if (!googleAccessToken || !googleCalendarId) return [];
  if (!gapi?.client?.calendar) return [];

  gapi.client.setToken({ access_token: googleAccessToken });

  const eventsResponse = await executeGoogleRequest(() => gapi.client.calendar.events.list({
    calendarId: googleCalendarId,
    maxResults: 2500,
    showDeleted: false,
    singleEvents: false
  }));

  return (eventsResponse.result.items || [])
    .map(event => ({
      event,
      plant: extractPlantFromGoogleEvent(event)
    }))
    .filter(item => item.plant);
}

async function syncPlantsFromGoogleCalendar() {
  if (!googleAccessToken || !googleCalendarId) return;
  if (!gapi?.client?.calendar) return;
  
  await loadAppStateFromGoogleCalendar();
}

function buildGoogleCalendarEventResource(plant, eventDateStr) {
  const eventName = `[${APP_NAME}] ${plant.nickname || plant.name}`;
  const startDateTime = `${eventDateStr}T08:00:00+09:00`;
  const endDateTime = `${eventDateStr}T09:00:00+09:00`;
  const effective = calculateEffectiveWaterPeriod(plant, eventDateStr);
  const seasonText = plant.seasonalAdjustment === false
    ? '계절 보정 꺼짐'
    : `${getSeasonLabel(effective.season)} 계절 보정 기준 ${effective.days}일 주기`;
  
  const descriptionText = [
    `'${plant.nickname || plant.name}' (${plant.name}) 화분에 물을 주는 날입니다.`,
    seasonText,
    `물주기 완료 후 ${APP_NAME} 앱에서 [물 줬어요!] 버튼을 누르면 다음 일정으로 자동 갱신됩니다.`
  ].join('\n');

  return {
    summary: eventName,
    description: descriptionText,
    start: {
      dateTime: startDateTime,
      timeZone: 'Asia/Seoul'
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Asia/Seoul'
    },
    extendedProperties: {
      private: {
        waterMePlantId: plant.id,
        waterMeGenerated: 'true'
      }
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 0 },
        { method: 'popup', minutes: 30 }
      ]
    }
  };
}

function buildFutureWateringDates(plant, monthsAhead = 6) {
  const todayStr = formatLocalDate();
  const endDate = parseDateOnly(todayStr);
  endDate.setMonth(endDate.getMonth() + monthsAhead);
  const endDateStr = formatLocalDate(endDate);

  const dates = [];
  const firstWatering = calculateNextWateringFromLastWatered(plant, todayStr);
  let nextDateStr = firstWatering.nextDateStr < todayStr ? todayStr : firstWatering.nextDateStr;
  let guard = 0;

  while (nextDateStr <= endDateStr && guard < 80) {
    dates.push(nextDateStr);
    const effective = calculateEffectiveWaterPeriod(plant, nextDateStr);
    nextDateStr = addDaysToDateString(nextDateStr, effective.days);
    guard++;
  }

  return dates;
}

// 구글 캘린더에 계절 보정이 반영된 미래 개별 일정을 등록합니다.
async function createGoogleCalendarEvent(plant, options = {}) {
  if (!googleAccessToken || !googleCalendarId) return;
  if (!gapi?.client?.calendar) return;
  
  gapi.client.setToken({ access_token: googleAccessToken });
  
  try {
    if (!options.skipDelete) {
      await deleteGoogleCalendarEventsForPlant(plant, { quiet: true });
    }
    const futureDates = buildFutureWateringDates(plant, 6);
    const createRequestFactories = futureDates.map((eventDateStr) => () =>
      gapi.client.calendar.events.insert({
        calendarId: googleCalendarId,
        resource: buildGoogleCalendarEventResource(plant, eventDateStr)
      })
    );
    const sequentialCreate = async () => {
      const ids = [];
      for (const factory of createRequestFactories) {
        const event = await executeGoogleRequest(factory);
        if (event?.result?.id) ids.push(event.result.id);
      }
      return ids;
    };

    let eventIds = [];
    const batchResults = await runGoogleBatch(createRequestFactories, sequentialCreate);
    if (Array.isArray(batchResults) && batchResults.every(item => typeof item === 'string')) {
      eventIds = batchResults;
    } else {
      eventIds = extractCreatedEventIdsFromBatchResults(batchResults);
    }

    if (eventIds.length === 0 && futureDates.length > 0) {
      const createdEvents = await findGoogleCalendarEventsForPlant(plant.id);
      eventIds = createdEvents.map(event => event.id);
    }
    
    const index = plants.findIndex(p => p.id === plant.id);
    if (index !== -1) {
      plants[index].googleEventIds = eventIds;
      plants[index].googleEventId = eventIds[0] || null;
      savePlantsToStorage();
      renderApp();
    }
  } catch (err) {
    console.error('구글 이벤트 생성 실패:', err);
    showToast('구글 캘린더 일정 생성에 실패했습니다.', 'error');
  }
}

// 구글 캘린더 일정 수정/갱신
async function updateGoogleCalendarEvent(plant) {
  if (!googleAccessToken || !googleCalendarId) return;
  if (!gapi?.client?.calendar) return;
  
  gapi.client.setToken({ access_token: googleAccessToken });
  await createGoogleCalendarEvent(plant);
}

// 구글 캘린더 일정 삭제
async function deleteGoogleCalendarEvent(eventId) {
  if (!googleAccessToken || !googleCalendarId || !eventId) return;
  if (!gapi?.client?.calendar) return;
  
  gapi.client.setToken({ access_token: googleAccessToken });
  
  try {
    await executeGoogleRequest(() => gapi.client.calendar.events.delete({
      calendarId: googleCalendarId,
      eventId: eventId
    }));
    return true;
  } catch (err) {
    if (isGoogleGoneError(err)) {
      return true;
    }
    console.error('이벤트 삭제 실패:', err);
    return false;
  }
}

async function findGoogleCalendarEventsForPlant(plantId) {
  if (!googleAccessToken || !googleCalendarId || !plantId) return [];
  if (!gapi?.client?.calendar) return [];

  gapi.client.setToken({ access_token: googleAccessToken });

  try {
    const futureInstancesResponse = await executeGoogleRequest(() => gapi.client.calendar.events.list({
      calendarId: googleCalendarId,
      maxResults: 2500,
      showDeleted: false,
      singleEvents: true,
      timeMin: `${formatLocalDate()}T00:00:00+09:00`,
      privateExtendedProperty: `waterMePlantId=${plantId}`
    }));

    const masterAndSingleResponse = await executeGoogleRequest(() => gapi.client.calendar.events.list({
      calendarId: googleCalendarId,
      maxResults: 2500,
      showDeleted: false,
      singleEvents: false,
      privateExtendedProperty: `waterMePlantId=${plantId}`
    }));

    const byId = new Map();
    [...(futureInstancesResponse.result.items || []), ...(masterAndSingleResponse.result.items || [])]
      .forEach(event => byId.set(event.id, event));

    return Array.from(byId.values());
  } catch (err) {
    console.error('식물별 구글 이벤트 조회 실패:', err);
    return [];
  }
}

function isWaterMeEvent(event) {
  if (isWaterMeStateEvent(event)) return false;

  const privateProps = event?.extendedProperties?.private || {};
  const description = event?.description || '';
  const summary = event?.summary || '';

  return privateProps.waterMeGenerated === 'true' ||
    Boolean(privateProps.waterMePlantId) ||
    description.includes('WATER_ME_METADATA') ||
    summary.includes(`[${APP_NAME}]`) ||
    summary.includes('[물주기]');
}

async function listGoogleCalendarEvents(params = {}) {
  if (!googleAccessToken || !googleCalendarId) return [];
  if (!gapi?.client?.calendar) return [];

  gapi.client.setToken({ access_token: googleAccessToken });

  const events = [];
  let pageToken = null;

  do {
    const response = await executeGoogleRequest(() => gapi.client.calendar.events.list({
      calendarId: googleCalendarId,
      maxResults: 2500,
      showDeleted: false,
      singleEvents: false,
      ...params,
      pageToken
    }));

    events.push(...(response.result.items || []));
    pageToken = response.result.nextPageToken || null;
  } while (pageToken);

  return events;
}

async function findAllWaterMeCalendarEvents() {
  if (!googleAccessToken || !googleCalendarId) return [];
  if (!gapi?.client?.calendar) return [];

  const byId = new Map();
  const queries = [
    { privateExtendedProperty: 'waterMeGenerated=true' },
    { q: 'WATER_ME_METADATA' },
    { q: `[${APP_NAME}]` },
    { q: '[물주기]' },
    { q: '물주기' }
  ];

  for (const query of queries) {
    try {
      const events = await listGoogleCalendarEvents(query);
      events
        .filter(isWaterMeEvent)
        .forEach(event => byId.set(event.id, event));
    } catch (err) {
      console.error('물 줘 일정 검색 실패:', err);
    }
  }

  return Array.from(byId.values());
}

async function deleteAllWaterMeCalendarEvents() {
  if (!googleAccessToken || !googleCalendarId) return false;
  if (!gapi?.client?.calendar) return false;

  const events = await findAllWaterMeCalendarEvents();
  const deleteRequestFactories = events.map((event) => () =>
    gapi.client.calendar.events.delete({
      calendarId: googleCalendarId,
      eventId: event.id
    })
  );

  let success = true;
  await runGoogleBatch(deleteRequestFactories, async () => {
    for (const event of events) {
      const deleted = await deleteGoogleCalendarEvent(event.id);
      if (deleted === false) success = false;
    }
    return success;
  });

  return success;
}

async function deleteGoogleCalendarEventsForPlant(plant, options = {}) {
  if (!googleAccessToken || !googleCalendarId || !plant) return false;

  const knownIds = new Set([
    ...(plant.googleEventIds || []),
    ...(plant.googleEventId ? [plant.googleEventId] : [])
  ]);

  const foundEvents = await findGoogleCalendarEventsForPlant(plant.id);
  foundEvents.forEach(event => knownIds.add(event.id));

  const ids = Array.from(knownIds);
  let success = true;
  const deleteRequestFactories = ids.map((eventId) => () =>
    gapi.client.calendar.events.delete({
      calendarId: googleCalendarId,
      eventId
    })
  );

  await runGoogleBatch(deleteRequestFactories, async () => {
    for (const eventId of ids) {
      const deleted = await deleteGoogleCalendarEvent(eventId);
      if (deleted === false) success = false;
    }
    return success;
  });

  if (!options.quiet) {
    const index = plants.findIndex(p => p.id === plant.id);
    if (index !== -1) {
      plants[index].googleEventIds = [];
      plants[index].googleEventId = null;
      savePlantsToStorage();
      renderApp();
    }
  }

  return success;
}

// 구글 캘린더에 전체 식물 즉시 동기화
async function syncAllPlantsToGoogleCalendar(options = {}) {
  return runGoogleWork('구글 캘린더 일정 재생성 중...', () => syncAllPlantsToGoogleCalendarUnsafe(options));
}

async function syncAllPlantsToGoogleCalendarUnsafe(options = {}) {
  const {
    confirmFirst = true,
    saveStateFirst = true,
    quiet = false
  } = options;
  if (!googleAccessToken || !googleCalendarId) {
    showToast('구글 계정이 연동되지 않았습니다.', 'warning');
    return;
  }
  if (!gapi?.client?.calendar) {
    showToast('구글 API 서비스가 활성화되지 않았습니다.', 'error');
    return;
  }
  if (confirmFirst && !confirm('중앙 데이터를 저장하고, 기존 물주기 알림 일정을 모두 삭제한 뒤 다시 만들까요?')) {
    return;
  }
  
  DOM.btnSyncCalendar.disabled = true;
  if (!quiet) {
    showToast('기존 물주기 일정을 정리하고 새 일정으로 재생성하는 중...', 'info');
  }
  
  try {
    if (saveStateFirst) {
      await saveAppStateToGoogleCalendar();
    }

    const deleted = await deleteAllWaterMeCalendarEvents();
    if (!deleted) {
      showToast('일부 기존 일정 삭제에 실패했습니다. 권한 또는 캘린더 ID를 확인해 주세요.', 'warning');
    }

    plants = plants.map(plant => ({
      ...plant,
      googleEventId: null,
      googleEventIds: []
    }));
    savePlantsToStorage();

    for (const plant of plants) {
      await createGoogleCalendarEvent(plant, { skipDelete: true });
    }
    if (!quiet) {
      showToast('앱의 현재 화분 목록 기준으로 구글 캘린더 일정을 새로 만들었습니다.', 'success');
    }
  } catch (err) {
    console.error('전체 재동기화 실패:', err);
    showToast('동기화 처리 도중 에러가 발생했습니다.', 'error');
  } finally {
    DOM.btnSyncCalendar.disabled = !isGoogleConnected();
  }
}

// ==========================================================================
// 9. Toast 시스템
// ==========================================================================

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'check_circle';
  if (type === 'error') icon = 'error';
  if (type === 'warning') icon = 'warning';
  if (type === 'info') icon = 'info';
  
  const iconEl = document.createElement('span');
  iconEl.className = 'material-icons-round toast-icon';
  iconEl.textContent = icon;

  const messageEl = document.createElement('span');
  messageEl.className = 'toast-message';
  messageEl.textContent = message;

  toast.appendChild(iconEl);
  toast.appendChild(messageEl);
  
  DOM.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      DOM.toastContainer.removeChild(toast);
    }, 300);
  }, 3500);
}
