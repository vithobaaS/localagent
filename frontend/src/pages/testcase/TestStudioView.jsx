import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/apiClient';
import { toast } from '../../components/common/ToastContainer';
import './TestStudio.css';

// ─── 300+ Actions (same as original) ────────────────────────────────────────
const ALL_ACTIONS = ["AcceptCookies","AssertAttributeValue","AssertContains","AssertDisabled","AssertEnabled","AssertEquals","AssertNotVisible","AssertSelected","AssertVisible","ClearField","Click","ClickAlert","ClickAndHold","CloseTab","CopyText","DoubleClick","DragAndDrop","DragAndDropByOffset","ExecuteScript","ExecuteSQLQuery","GetAttribute","GetCssValue","GetCurrentURL","GetPageTitle","GetText","GoBack","Hover","KeyDown","KeyUp","MaximizeWindow","MinimizeWindow","MockNetworkResponse","Navigate","OpenNewTab","PasteText","PinchToZoom","PressEnter","PressTab","Refresh","Release","RightClick","ScrollDown","ScrollTo","ScrollToCoordinates","ScrollUp","SelectByIndex","SelectByValue","SelectDropdown","SendKeys","Set","SetCheckBoxStatus","SetWindowSize","SwitchDefaultContent","SwitchFrame","SwitchTab","TakeFullPageScreenshot","TouchSwipeLeft","UploadFile","Wait","WaitForTitle","WaitForURL","WaitUntilElementIsClickable","WaitUntilInvisible","WaitUntill","WaitUntillWithtimer","WaitUntilTextPresent","AssertAudioComplete","AssertAudioData","AssertAudioError","AssertAudioIdle","AssertAudioLoad","AssertAudioMetrics","AssertAudioReady","AssertAudioRequest","AssertAudioResponse","AssertAudioState","AssertBluetoothComplete","AssertBluetoothData","AssertBluetoothError","AssertBluetoothIdle","AssertBluetoothLoad","AssertBluetoothMetrics","AssertBluetoothReady","AssertBluetoothRequest","AssertBluetoothResponse","AssertBluetoothState","AssertCookieComplete","AssertCookieData","AssertCookieError","AssertCookieIdle","AssertCookieLoad","AssertCookieMetrics","AssertCookieReady","AssertCookieRequest","AssertCookieResponse","AssertCookieState","AssertCryptoComplete","AssertCryptoData","AssertCryptoError","AssertCryptoIdle","AssertCryptoLoad","AssertCryptoMetrics","AssertCryptoReady","AssertCryptoRequest","AssertCryptoResponse","AssertCryptoState","AssertCSVComplete","AssertCSVData","AssertCSVError","AssertCSVIdle","AssertCSVLoad","AssertCSVMetrics","AssertCSVReady","AssertCSVRequest","AssertCSVResponse","AssertCSVState","AssertDatabaseComplete","AssertDatabaseData","AssertDatabaseError","AssertDatabaseIdle","AssertDatabaseLoad","AssertDatabaseMetrics","AssertDatabaseReady","AssertDatabaseRequest","AssertDatabaseResponse","AssertDatabaseState","AssertExcelComplete","AssertExcelData","AssertExcelError","AssertExcelIdle","AssertExcelLoad","AssertExcelMetrics","AssertExcelReady","AssertExcelRequest","AssertExcelResponse","AssertExcelState","AssertGeoLocationComplete","AssertGeoLocationData","AssertGeoLocationError","AssertGeoLocationIdle","AssertGeoLocationLoad","AssertGeoLocationMetrics","AssertGeoLocationReady","AssertGeoLocationRequest","AssertGeoLocationResponse","AssertGeoLocationState","AssertIframeComplete","AssertIframeData","AssertIframeError","AssertIframeIdle","AssertIframeLoad","AssertIframeMetrics","AssertIframeReady","AssertIframeRequest","AssertIframeResponse","AssertIframeState","AssertLayoutComplete","AssertLayoutData","AssertLayoutError","AssertLayoutIdle","AssertLayoutLoad","AssertLayoutMetrics","AssertLayoutReady","AssertLayoutRequest","AssertLayoutResponse","AssertLayoutState","AssertMemoryComplete","AssertMemoryData","AssertMemoryError","AssertMemoryIdle","AssertMemoryLoad","AssertMemoryMetrics","AssertMemoryReady","AssertMemoryRequest","AssertMemoryResponse","AssertMemoryState","AssertMobileComplete","AssertMobileData","AssertMobileError","AssertMobileIdle","AssertMobileLoad","AssertMobileMetrics","AssertMobileReady","AssertMobileRequest","AssertMobileResponse","AssertMobileState","AssertNetworkComplete","AssertNetworkData","AssertNetworkError","AssertNetworkIdle","AssertNetworkLoad","AssertNetworkMetrics","AssertNetworkReady","AssertNetworkRequest","AssertNetworkResponse","AssertNetworkState","AssertPDFComplete","AssertPDFData","AssertPDFError","AssertPDFIdle","AssertPDFLoad","AssertPDFMetrics","AssertPDFReady","AssertPDFRequest","AssertPDFResponse","AssertPDFState","AssertPerformanceComplete","AssertPerformanceData","AssertPerformanceError","AssertPerformanceIdle","AssertPerformanceLoad","AssertPerformanceMetrics","AssertPerformanceReady","AssertPerformanceRequest","AssertPerformanceResponse","AssertPerformanceState","AssertPixelComplete","AssertPixelData","AssertPixelError","AssertPixelIdle","AssertPixelLoad","AssertPixelMetrics","AssertPixelReady","AssertPixelRequest","AssertPixelResponse","AssertPixelState","AssertPopupComplete","AssertPopupData","AssertPopupError","AssertPopupIdle","AssertPopupLoad","AssertPopupMetrics","AssertPopupReady","AssertPopupRequest","AssertPopupResponse","AssertPopupState","AssertSecurityComplete","AssertSecurityData","AssertSecurityError","AssertSecurityIdle","AssertSecurityLoad","AssertSecurityMetrics","AssertSecurityReady","AssertSecurityRequest","AssertSecurityResponse","AssertSecurityState","AssertSessionComplete","AssertSessionData","AssertSessionError","AssertSessionIdle","AssertSessionLoad","AssertSessionMetrics","AssertSessionReady","AssertSessionRequest","AssertSessionResponse","AssertSessionState","AssertShadowDOMComplete","AssertShadowDOMData","AssertShadowDOMError","AssertShadowDOMIdle","AssertShadowDOMLoad","AssertShadowDOMMetrics","AssertShadowDOMReady","AssertShadowDOMRequest","AssertShadowDOMResponse","AssertShadowDOMState","AssertSwipeComplete","AssertSwipeData","AssertSwipeError","AssertSwipeIdle","AssertSwipeLoad","AssertSwipeMetrics","AssertSwipeReady","AssertSwipeRequest","AssertSwipeResponse","AssertSwipeState","AssertTouchComplete","AssertTouchData","AssertTouchError","AssertTouchIdle","AssertTouchLoad","AssertTouchMetrics","AssertTouchReady","AssertTouchRequest","AssertTouchResponse","AssertTouchState","AssertVideoComplete","AssertVideoData","AssertVideoError","AssertVideoIdle","AssertVideoLoad","AssertVideoMetrics","AssertVideoReady","AssertVideoRequest","AssertVideoResponse","AssertVideoState","AssertVisualComplete","AssertVisualData","AssertVisualError","AssertVisualIdle","AssertVisualLoad","AssertVisualMetrics","AssertVisualReady","AssertVisualRequest","AssertVisualResponse","AssertVisualState"];

const LOCATORS = ['id','name','xpath','css','linkText','partialLinkText','className','tagName','accessibilityId','iosClassChain','androidUIAutomator'];

// ─── Action Categorisation ───────────────────────────────────────────────────
const ACTION_CATEGORIES = [
  {
    label: 'Navigation',
    color: 'icon-navigate',
    emoji: '🔗',
    tag: 'NAV',
    tagStyle: { background:'rgba(59,130,246,0.2)', color:'#60a5fa' },
    actions: ['Navigate','GoBack','Refresh','GetCurrentURL','GetPageTitle','OpenNewTab','CloseTab','SwitchTab']
  },
  {
    label: 'Interaction',
    color: 'icon-click',
    emoji: '🖱️',
    tag: 'ACT',
    tagStyle: { background:'rgba(16,185,129,0.2)', color:'#34d399' },
    actions: ['Click','DoubleClick','RightClick','ClickAndHold','Hover','DragAndDrop','DragAndDropByOffset','Release','ClickAlert','PinchToZoom','TouchSwipeLeft']
  },
  {
    label: 'Input',
    color: 'icon-input',
    emoji: '⌨️',
    tag: 'INP',
    tagStyle: { background:'rgba(245,158,11,0.2)', color:'#fbbf24' },
    actions: ['Set','SendKeys','ClearField','PasteText','CopyText','PressEnter','PressTab','KeyDown','KeyUp','SelectDropdown','SelectByIndex','SelectByValue','SetCheckBoxStatus','UploadFile']
  },
  {
    label: 'Assertions',
    color: 'icon-assert',
    emoji: '✅',
    tag: 'CHK',
    tagStyle: { background:'rgba(239,68,68,0.2)', color:'#f87171' },
    actions: ['AssertEquals','AssertContains','AssertVisible','AssertNotVisible','AssertEnabled','AssertDisabled','AssertSelected','AssertAttributeValue']
  },
  {
    label: 'Scroll',
    color: 'icon-scroll',
    emoji: '↕️',
    tag: 'SCR',
    tagStyle: { background:'rgba(6,182,212,0.2)', color:'#22d3ee' },
    actions: ['ScrollDown','ScrollUp','ScrollTo','ScrollToCoordinates']
  },
  {
    label: 'Wait',
    color: 'icon-wait',
    emoji: '⏳',
    tag: 'WAIT',
    tagStyle: { background:'rgba(124,58,237,0.2)', color:'#a78bfa' },
    actions: ['Wait','WaitUntill','WaitUntillWithtimer','WaitUntilElementIsClickable','WaitUntilInvisible','WaitUntilTextPresent','WaitForURL','WaitForTitle']
  },
  {
    label: 'Data & Script',
    color: 'icon-key',
    emoji: '⚙️',
    tag: 'ADV',
    tagStyle: { background:'rgba(236,72,153,0.2)', color:'#f472b6' },
    actions: ['ExecuteScript','ExecuteSQLQuery','GetAttribute','GetText','GetCssValue','MockNetworkResponse','TakeFullPageScreenshot','SwitchFrame','SwitchDefaultContent','SetWindowSize','MaximizeWindow','MinimizeWindow','AcceptCookies','UploadFile']
  }
];

// Helper: get category info for an action
function getActionMeta(actionName) {
  for (const cat of ACTION_CATEGORIES) {
    if (cat.actions.includes(actionName)) return cat;
  }
  return { color:'icon-default', emoji:'⚡', tag:'', tagStyle:{} };
}

function newStep(actionName = '') {
  return { actionName, locatorType: '', locatorValue: '', testData: '', description: '', _id: crypto.randomUUID() };
}

// ─── Action Sidebar ──────────────────────────────────────────────────────────
function ActionSidebar({ onAddStep }) {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? [{ label: 'Results', color: 'icon-default', emoji: '🔍', tag: '', tagStyle: {}, actions: ALL_ACTIONS.filter(a => a.toLowerCase().includes(search.toLowerCase())) }]
    : ACTION_CATEGORIES;

  const handleDragStart = (e, actionName) => {
    e.dataTransfer.setData('actionName', actionName);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="studio-sidebar">
      <div className="sidebar-search-wrap">
        <span className="sidebar-search-icon">🔍</span>
        <input
          className="sidebar-search"
          placeholder="Search 300+ actions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.map(cat => (
        cat.actions.length === 0 ? null :
        <div className="sidebar-category" key={cat.label}>
          <div className="sidebar-category-label">{cat.label}</div>
          {cat.actions.slice(0, search ? 50 : undefined).map(action => (
            <div key={action} className="action-block">
              <span
                className="action-block-drag-handle"
                draggable
                onDragStart={e => handleDragStart(e, action)}
                title="Drag onto canvas"
              >⠿</span>
              <div
                className="action-block-body"
                onPointerDown={() => onAddStep(action)}
                title={`Click to add "${action}"`}
              >
                <div className={`action-block-icon ${cat.color}`}>{cat.emoji}</div>
                <span className="action-block-name">{action}</span>
                {cat.tag && (
                  <span className="action-block-tag" style={cat.tagStyle}>{cat.tag}</span>
                )}
              </div>
            </div>
          ))}
          {search && cat.actions.length > 50 && (
            <div style={{ padding:'4px 12px 8px', fontSize:'0.72rem', color:'#adb5bd' }}>
              +{cat.actions.length - 50} more. Refine your search.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step Card ───────────────────────────────────────────────────────────────
function StepCard({ step, index, selected, onSelect, onDelete, onDragStart, onDragEnd, onDragOver, onDrop, isDragOver }) {
  const meta = getActionMeta(step.actionName);
  const detail = [step.locatorType, step.locatorValue, step.testData].filter(Boolean).join(' › ');

  return (
    <div
      className={`studio-step-card ${selected ? 'selected' : ''} ${isDragOver ? 'drag-over-card' : ''}`}
      onClick={() => onSelect(step._id)}
      draggable
      onDragStart={e => onDragStart(e, index)}
      onDragOver={e => { e.preventDefault(); onDragOver(index); }}
      onDrop={e => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <span className="step-drag-handle" title="Drag to reorder">⠿</span>
      <div className="step-order-badge">{index + 1}</div>
      <div className={`step-action-icon ${meta.color}`}>{meta.emoji}</div>
      <div className="step-info">
        <div className="step-action-name">{step.actionName || <em style={{color:'#44445a'}}>No action set</em>}</div>
        {detail && <div className="step-action-detail">{detail}</div>}
      </div>
      <button
        className="step-delete-btn"
        onClick={e => { e.stopPropagation(); onDelete(step._id); }}
        title="Delete step"
      >✕</button>
    </div>
  );
}

// ─── Right Configurator ──────────────────────────────────────────────────────
function StepConfigurator({ step, onChange }) {
  const [actionSearch, setActionSearch] = useState(step?.actionName || '');
  const [dropOpen, setDropOpen] = useState(false);

  useEffect(() => {
    setActionSearch(step?.actionName || '');
  }, [step?._id, step?.actionName]);

  if (!step) {
    return (
      <div className="studio-configurator">
        <div className="configurator-header">
          <div className="configurator-header-title">Step Configurator</div>
          <div className="configurator-step-name" style={{ color: '#33334a' }}>No step selected</div>
        </div>
        <div className="configurator-body">
          <div className="config-empty">
            <div className="config-empty-icon">⚙️</div>
            <div className="config-empty-text">Click any step on the canvas to configure it here.</div>
          </div>
        </div>
      </div>
    );
  }

  const filteredActions = ALL_ACTIONS.filter(a => a.toLowerCase().includes(actionSearch.toLowerCase()));
  const meta = getActionMeta(step.actionName);

  return (
    <div className="studio-configurator">
      <div className="configurator-header">
        <div className="configurator-header-title">⚙️ Step Configurator</div>
        <div className="configurator-step-name">
          <span style={{ marginRight: 8 }}>{meta.emoji}</span>
          {step.actionName || 'New Step'}
        </div>
      </div>
      <div className="configurator-body">

        {/* Action */}
        <div className="config-field">
          <label className="config-label">Action *</label>
          <div className="config-action-search">
            <input
              className="config-input"
              value={actionSearch}
              onChange={e => { setActionSearch(e.target.value); onChange('actionName', e.target.value); setDropOpen(true); }}
              onFocus={() => setDropOpen(true)}
              onBlur={() => setTimeout(() => setDropOpen(false), 180)}
              placeholder="Type to search actions…"
            />
            {dropOpen && filteredActions.length > 0 && (
              <div className="config-action-dropdown">
                {filteredActions.slice(0, 40).map(a => (
                  <div
                    key={a}
                    className="config-action-option"
                    onMouseDown={() => { onChange('actionName', a); setActionSearch(a); setDropOpen(false); }}
                  >{a}</div>
                ))}
                {filteredActions.length > 40 && (
                  <div style={{ padding:'8px 12px', color:'#44445a', fontSize:'0.75rem' }}>
                    …and {filteredActions.length - 40} more. Keep typing.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="config-divider" />

        {/* Locator Type */}
        <div className="config-field">
          <label className="config-label">Locator Type</label>
          <select
            className="config-select"
            value={step.locatorType}
            onChange={e => onChange('locatorType', e.target.value)}
          >
            <option value="">— None —</option>
            {LOCATORS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Locator Value */}
        <div className="config-field">
          <label className="config-label">Locator Value</label>
          <input
            className="config-input"
            value={step.locatorValue}
            onChange={e => onChange('locatorValue', e.target.value)}
            placeholder="e.g. #submit-btn or //button[@id='login']"
          />
        </div>

        <div className="config-divider" />

        {/* Test Data */}
        <div className="config-field">
          <label className="config-label">Test Data / Value</label>
          <input
            className="config-input"
            value={step.testData}
            onChange={e => onChange('testData', e.target.value)}
            placeholder="e.g. admin@test.com or John Doe"
          />
        </div>

        {/* Description */}
        <div className="config-field">
          <label className="config-label">Step Description</label>
          <input
            className="config-input"
            value={step.description}
            onChange={e => onChange('description', e.target.value)}
            placeholder="What does this step do?"
          />
        </div>

      </div>
    </div>
  );
}

// ─── Main Test Studio View ───────────────────────────────────────────────────
export default function TestStudioView() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [steps, setSteps] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEdit);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragCardIndex = useRef(null);

  // Load existing test case
  useEffect(() => {
    if (isEdit) {
      api(`/api/test-cases/${id}`).then(r => r.json()).then(d => {
        setName(d.testCase.name);
        setDesc(d.testCase.description || '');
        if (d.steps?.length > 0) {
          setSteps(d.steps.map(s => ({
            _id: crypto.randomUUID(),
            actionName: s.actionName || '',
            locatorType: s.locatorType || '',
            locatorValue: s.locatorValue || '',
            testData: s.testData || '',
            description: s.description || ''
          })));
        }
        setLoaded(true);
      });
    }
  }, [id, isEdit]);

  const addStep = (actionName = '') => {
    const step = newStep(actionName);
    setSteps(p => [...p, step]);
    setSelectedId(step._id);
  };

  const deleteStep = (stepId) => {
    setSteps(p => p.filter(s => s._id !== stepId));
    if (selectedId === stepId) setSelectedId(null);
  };

  const updateSelectedStep = (key, val) => {
    setSteps(p => p.map(s => s._id === selectedId ? { ...s, [key]: val } : s));
  };

  // ── Drag from sidebar ──────────────────────────────────────────────────────
  const handleCanvasDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleCanvasDragLeave = () => { setIsDragOver(false); };
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const actionName = e.dataTransfer.getData('actionName');
    if (actionName) addStep(actionName);
  };

  // ── Drag to reorder cards ─────────────────────────────────────────────────
  const handleCardDragStart = (e, fromIndex) => {
    dragCardIndex.current = fromIndex;
    e.dataTransfer.effectAllowed = 'move';
    // Use a special marker so canvas drop can distinguish from sidebar drags
    e.dataTransfer.setData('reorder', 'true');
    e.dataTransfer.setData('actionName', '');
  };

  const handleCardDragEnd = () => {
    dragCardIndex.current = null;
    setDragOverIndex(null);
  };

  const handleCardDragOver = (toIndex) => setDragOverIndex(toIndex);

  const handleCardDrop = (e, toIndex) => {
    e.stopPropagation();
    setDragOverIndex(null);

    // If dragged from the sidebar, add a new step (don't reorder)
    const actionName = e.dataTransfer.getData('actionName');
    const isReorder = e.dataTransfer.getData('reorder') === 'true';
    if (actionName && !isReorder) {
      addStep(actionName);
      setIsDragOver(false);
      return;
    }

    // Reorder existing cards
    const fromIndex = dragCardIndex.current;
    if (fromIndex === null || fromIndex === toIndex) return;
    setSteps(p => {
      const arr = [...p];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return arr;
    });
    dragCardIndex.current = null;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast('error', 'Validation', 'Test Case name is required.'); return; }
    setSaving(true);
    const payload = {
      name,
      description: desc,
      steps: steps.map((s, i) => ({ actionName: s.actionName, locatorType: s.locatorType, locatorValue: s.locatorValue, testData: s.testData, description: s.description, stepOrder: i + 1 }))
    };
    const url = isEdit ? `/api/test-cases/${id}` : '/api/test-cases';
    const method = isEdit ? 'PUT' : 'POST';
    const r = await api(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (r.ok) {
      toast('success', isEdit ? 'Updated!' : 'Created!', `"${name}" with ${steps.length} step(s).`);
      setTimeout(() => navigate('/test-cases'), 900);
    } else {
      toast('error', 'Save Failed', 'Please check your inputs.');
      setSaving(false);
    }
  };

  const selectedStep = steps.find(s => s._id === selectedId) || null;

  if (!loaded) {
    return (
      <div className="studio-layout" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ color:'#555570', fontSize:'0.9rem' }}>Loading test case…</div>
      </div>
    );
  }

  return (
    <div className="studio-layout">

      {/* ── Top Bar ── */}
      <div className="studio-topbar">
        <div className="studio-topbar-logo">
          <div className="studio-topbar-logo-icon">⚡</div>
          <span className="studio-topbar-logo-text">Autopropel</span>
        </div>
        <span className="studio-mode-badge">Test Studio</span>
        <Link to="/test-cases" className="studio-back-btn">← Exit Studio</Link>
        <input
          className="studio-topbar-name"
          placeholder="Test Case Name *"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          className="studio-topbar-desc"
          placeholder="Description (optional)"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        <button className="studio-save-btn" onClick={save} disabled={saving}>
          {saving ? '⏳ Saving…' : `💾 Save (${steps.length} steps)`}
        </button>
      </div>

      {/* ── Left: Action Sidebar ── */}
      <ActionSidebar onAddStep={addStep} />

      {/* ── Center: Canvas ── */}
      <div className="studio-canvas">
        <div className="canvas-toolbar">
          <div className="canvas-toolbar-left">
            <span className="canvas-title">Test Steps</span>
            <span className="step-count-badge">{steps.length}</span>
          </div>
          <button className="canvas-add-btn" onClick={() => addStep()}>
            ➕ Add Step
          </button>
        </div>

        <div
          className="canvas-body"
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
        >
          {steps.length === 0 ? (
            <div className={`canvas-drop-zone ${isDragOver ? 'drag-over' : ''}`}>
              <div className="canvas-drop-zone-icon">📋</div>
              <div className="canvas-drop-zone-text">Drag actions here to build your test</div>
              <div className="canvas-drop-zone-hint">Or click any action in the left sidebar to add it instantly</div>
            </div>
          ) : (
            <div className="step-cards-list">
              {steps.map((step, index) => (
                <StepCard
                  key={step._id}
                  step={step}
                  index={index}
                  selected={selectedId === step._id}
                  isDragOver={dragOverIndex === index}
                  onSelect={setSelectedId}
                  onDelete={deleteStep}
                  onDragStart={handleCardDragStart}
                  onDragEnd={handleCardDragEnd}
                  onDragOver={handleCardDragOver}
                  onDrop={handleCardDrop}
                />
              ))}
              {/* Drop zone at the end */}
              <div
                className={`canvas-drop-zone ${isDragOver ? 'drag-over' : ''}`}
                style={{ minHeight: 80, padding: 20 }}
                onDragOver={handleCanvasDragOver}
                onDrop={handleCanvasDrop}
              >
                <div className="canvas-drop-zone-text" style={{fontSize:'0.8rem'}}>Drop here to add more steps</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Configurator ── */}
      <StepConfigurator
        step={selectedStep}
        onChange={updateSelectedStep}
      />

    </div>
  );
}
