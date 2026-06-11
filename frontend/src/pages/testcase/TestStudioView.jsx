import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/apiClient';
import { toast } from '../../components/common/ToastContainer';
import { Save, Plus, FileText, Settings, Search } from 'lucide-react';
import './TestStudio.css';

// ─── All 300+ Actions ────────────────────────────────────────────────────────
const ALL_ACTIONS = ['AcceptCookies', 'AssertAttributeValue', 'AssertAudioComplete', 'AssertAudioData', 'AssertAudioError', 'AssertAudioIdle', 'AssertAudioLoad', 'AssertAudioMetrics', 'AssertAudioReady', 'AssertAudioRequest', 'AssertAudioResponse', 'AssertAudioState', 'AssertBluetoothComplete', 'AssertBluetoothData', 'AssertBluetoothError', 'AssertBluetoothIdle', 'AssertBluetoothLoad', 'AssertBluetoothMetrics', 'AssertBluetoothReady', 'AssertBluetoothRequest', 'AssertBluetoothResponse', 'AssertBluetoothState', 'AssertContains', 'AssertCookieComplete', 'AssertCookieData', 'AssertCookieError', 'AssertCookieIdle', 'AssertCookieLoad', 'AssertCookieMetrics', 'AssertCookieReady', 'AssertCookieRequest', 'AssertCookieResponse', 'AssertCookieState', 'AssertCryptoComplete', 'AssertCryptoData', 'AssertCryptoError', 'AssertCryptoIdle', 'AssertCryptoLoad', 'AssertCryptoMetrics', 'AssertCryptoReady', 'AssertCryptoRequest', 'AssertCryptoResponse', 'AssertCryptoState', 'AssertCSVComplete', 'AssertCSVData', 'AssertCSVError', 'AssertCSVIdle', 'AssertCSVLoad', 'AssertCSVMetrics', 'AssertCSVReady', 'AssertCSVRequest', 'AssertCSVResponse', 'AssertCSVState', 'AssertDatabaseComplete', 'AssertDatabaseData', 'AssertDatabaseError', 'AssertDatabaseIdle', 'AssertDatabaseLoad', 'AssertDatabaseMetrics', 'AssertDatabaseReady', 'AssertDatabaseRequest', 'AssertDatabaseResponse', 'AssertDatabaseState', 'AssertDisabled', 'AssertEnabled', 'AssertEquals', 'AssertExcelComplete', 'AssertExcelData', 'AssertExcelError', 'AssertExcelIdle', 'AssertExcelLoad', 'AssertExcelMetrics', 'AssertExcelReady', 'AssertExcelRequest', 'AssertExcelResponse', 'AssertExcelState', 'AssertGeoLocationComplete', 'AssertGeoLocationData', 'AssertGeoLocationError', 'AssertGeoLocationIdle', 'AssertGeoLocationLoad', 'AssertGeoLocationMetrics', 'AssertGeoLocationReady', 'AssertGeoLocationRequest', 'AssertGeoLocationResponse', 'AssertGeoLocationState', 'AssertIframeComplete', 'AssertIframeData', 'AssertIframeError', 'AssertIframeIdle', 'AssertIframeLoad', 'AssertIframeMetrics', 'AssertIframeReady', 'AssertIframeRequest', 'AssertIframeResponse', 'AssertIframeState', 'AssertLayoutComplete', 'AssertLayoutData', 'AssertLayoutError', 'AssertLayoutIdle', 'AssertLayoutLoad', 'AssertLayoutMetrics', 'AssertLayoutReady', 'AssertLayoutRequest', 'AssertLayoutResponse', 'AssertLayoutState', 'AssertMemoryComplete', 'AssertMemoryData', 'AssertMemoryError', 'AssertMemoryIdle', 'AssertMemoryLoad', 'AssertMemoryMetrics', 'AssertMemoryReady', 'AssertMemoryRequest', 'AssertMemoryResponse', 'AssertMemoryState', 'AssertMobileComplete', 'AssertMobileData', 'AssertMobileError', 'AssertMobileIdle', 'AssertMobileLoad', 'AssertMobileMetrics', 'AssertMobileReady', 'AssertMobileRequest', 'AssertMobileResponse', 'AssertMobileState', 'AssertNetworkComplete', 'AssertNetworkData', 'AssertNetworkError', 'AssertNetworkIdle', 'AssertNetworkLoad', 'AssertNetworkMetrics', 'AssertNetworkReady', 'AssertNetworkRequest', 'AssertNetworkResponse', 'AssertNetworkState', 'AssertNotVisible', 'AssertPDFComplete', 'AssertPDFData', 'AssertPDFError', 'AssertPDFIdle', 'AssertPDFLoad', 'AssertPDFMetrics', 'AssertPDFReady', 'AssertPDFRequest', 'AssertPDFResponse', 'AssertPDFState', 'AssertPerformanceComplete', 'AssertPerformanceData', 'AssertPerformanceError', 'AssertPerformanceIdle', 'AssertPerformanceLoad', 'AssertPerformanceMetrics', 'AssertPerformanceReady', 'AssertPerformanceRequest', 'AssertPerformanceResponse', 'AssertPerformanceState', 'AssertPixelComplete', 'AssertPixelData', 'AssertPixelError', 'AssertPixelIdle', 'AssertPixelLoad', 'AssertPixelMetrics', 'AssertPixelReady', 'AssertPixelRequest', 'AssertPixelResponse', 'AssertPixelState', 'AssertPopupComplete', 'AssertPopupData', 'AssertPopupError', 'AssertPopupIdle', 'AssertPopupLoad', 'AssertPopupMetrics', 'AssertPopupReady', 'AssertPopupRequest', 'AssertPopupResponse', 'AssertPopupState', 'AssertSecurityComplete', 'AssertSecurityData', 'AssertSecurityError', 'AssertSecurityIdle', 'AssertSecurityLoad', 'AssertSecurityMetrics', 'AssertSecurityReady', 'AssertSecurityRequest', 'AssertSecurityResponse', 'AssertSecurityState', 'AssertSelected', 'AssertSessionComplete', 'AssertSessionData', 'AssertSessionError', 'AssertSessionIdle', 'AssertSessionLoad', 'AssertSessionMetrics', 'AssertSessionReady', 'AssertSessionRequest', 'AssertSessionResponse', 'AssertSessionState', 'AssertShadowDOMComplete', 'AssertShadowDOMData', 'AssertShadowDOMError', 'AssertShadowDOMIdle', 'AssertShadowDOMLoad', 'AssertShadowDOMMetrics', 'AssertShadowDOMReady', 'AssertShadowDOMRequest', 'AssertShadowDOMResponse', 'AssertShadowDOMState', 'AssertSwipeComplete', 'AssertSwipeData', 'AssertSwipeError', 'AssertSwipeIdle', 'AssertSwipeLoad', 'AssertSwipeMetrics', 'AssertSwipeReady', 'AssertSwipeRequest', 'AssertSwipeResponse', 'AssertSwipeState', 'AssertTouchComplete', 'AssertTouchData', 'AssertTouchError', 'AssertTouchIdle', 'AssertTouchLoad', 'AssertTouchMetrics', 'AssertTouchReady', 'AssertTouchRequest', 'AssertTouchResponse', 'AssertTouchState', 'AssertVideoComplete', 'AssertVideoData', 'AssertVideoError', 'AssertVideoIdle', 'AssertVideoLoad', 'AssertVideoMetrics', 'AssertVideoReady', 'AssertVideoRequest', 'AssertVideoResponse', 'AssertVideoState', 'AssertVisible', 'AssertVisualComplete', 'AssertVisualData', 'AssertVisualError', 'AssertVisualIdle', 'AssertVisualLoad', 'AssertVisualMetrics', 'AssertVisualReady', 'AssertVisualRequest', 'AssertVisualResponse', 'AssertVisualState', 'ClearField', 'Click', 'ClickAlert', 'ClickAndHold', 'CloseTab', 'CopyText', 'DoubleClick', 'DragAndDrop', 'DragAndDropByOffset', 'ExecuteScript', 'ExecuteSQLQuery', 'GetAttribute', 'GetCssValue', 'GetCurrentURL', 'GetPageTitle', 'GetText', 'GoBack', 'Hover', 'KeyDown', 'KeyUp', 'MaximizeWindow', 'MinimizeWindow', 'MockNetworkResponse', 'Navigate', 'OpenNewTab', 'PasteText', 'PinchToZoom', 'PressEnter', 'PressTab', 'Refresh', 'Release', 'RightClick', 'ScrollDown', 'ScrollTo', 'ScrollToCoordinates', 'ScrollUp', 'SelectByIndex', 'SelectByValue', 'SelectDropdown', 'SendKeys', 'Set', 'SetCheckBoxStatus', 'SetWindowSize', 'SwitchDefaultContent', 'SwitchFrame', 'SwitchTab', 'TakeFullPageScreenshot', 'TouchSwipeLeft', 'UploadFile', 'VerifyAttribute', 'VerifyElementExists', 'VerifyElementHidden', 'VerifyElementVisible', 'VerifyText', 'VerifyTitle', 'VerifyUrl', 'Wait', 'WaitForTitle', 'WaitForURL', 'WaitUntilElementIsClickable', 'WaitUntilInvisible', 'WaitUntill', 'WaitUntillWithtimer', 'WaitUntilTextPresent'];

const LOCATORS = ['id','name','xpath','css','linkText','partialLinkText','className','tagName','accessibilityId','iosClassChain','androidUIAutomator'];

const ACTION_CATEGORIES = [
  { label:'Navigation',  color:'icon-navigate', emoji:'🔗', tag:'NAV',  tagStyle:{background:'#dbeafe',color:'#1d4ed8'}, actions:['Navigate','GoBack','Refresh','GetCurrentURL','GetPageTitle','OpenNewTab','CloseTab','SwitchTab'] },
  { label:'Interaction', color:'icon-click',    emoji:'🖱️', tag:'ACT',  tagStyle:{background:'#d1fae5',color:'#065f46'}, actions:['Click','DoubleClick','RightClick','ClickAndHold','Hover','DragAndDrop','DragAndDropByOffset','Release','ClickAlert','PinchToZoom','TouchSwipeLeft'] },
  { label:'Input',       color:'icon-input',    emoji:'⌨️', tag:'INP',  tagStyle:{background:'#fef3c7',color:'#92400e'}, actions:['Set','SendKeys','ClearField','PasteText','CopyText','PressEnter','PressTab','KeyDown','KeyUp','SelectDropdown','SelectByIndex','SelectByValue','SetCheckBoxStatus','UploadFile'] },
  { label:'Assertions',  color:'icon-assert',   emoji:'✅', tag:'CHK',  tagStyle:{background:'#fee2e2',color:'#991b1b'}, actions:['VerifyText','VerifyURL','VerifyElementExists','VerifyElementVisible','VerifyElementHidden','VerifyAttribute','VerifyTitle','AssertEquals','AssertContains','AssertVisible','AssertNotVisible','AssertEnabled','AssertDisabled','AssertSelected','AssertAttributeValue'] },
  { label:'Scroll',      color:'icon-scroll',   emoji:'↕️', tag:'SCR',  tagStyle:{background:'#cffafe',color:'#155e75'}, actions:['ScrollDown','ScrollUp','ScrollTo','ScrollToCoordinates'] },
  { label:'Wait',        color:'icon-wait',     emoji:'⏳', tag:'WAIT', tagStyle:{background:'#ede9fe',color:'#5b21b6'}, actions:['Wait','WaitUntill','WaitUntillWithtimer','WaitUntilElementIsClickable','WaitUntilInvisible','WaitUntilTextPresent','WaitForURL','WaitForTitle'] },
  { label:'Data & Script',color:'icon-key',     emoji:'⚙️', tag:'ADV',  tagStyle:{background:'#fce7f3',color:'#9d174d'}, actions:['ExecuteScript','ExecuteSQLQuery','GetAttribute','GetText','GetCssValue','MockNetworkResponse','TakeFullPageScreenshot','SwitchFrame','SwitchDefaultContent','SetWindowSize','MaximizeWindow','MinimizeWindow','AcceptCookies'] },
];

function getActionMeta(actionName) {
  for (const cat of ACTION_CATEGORIES) {
    if (cat.actions.includes(actionName)) return cat;
  }
  return { color:'icon-default', emoji:'⚡', tag:'', tagStyle:{} };
}

function makeStep(actionName = '') {
  return { _id: Math.random().toString(36).slice(2), actionName, stepType: 'ACTION', locatorType:'', locatorValue:'', testData:'', expectedValue:'', description:'' };
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function ActionSidebar({ onAdd }) {
  const [search, setSearch] = useState('');

  const groups = search.trim()
    ? [{ 
        label: 'Search Results', color: 'icon-default', emoji: '🔍', tag: '', tagStyle: {}, 
        actions: ALL_ACTIONS
          .filter(a => a.toLowerCase().includes(search.toLowerCase()))
          .sort((a, b) => {
            const searchLower = search.toLowerCase();
            const aStarts = a.toLowerCase().startsWith(searchLower);
            const bStarts = b.toLowerCase().startsWith(searchLower);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return a.localeCompare(b);
          })
      }]
    : ACTION_CATEGORIES;

  return (
    <div className="ts-sidebar">
      <div className="ts-sidebar-search-wrap">
        <span className="ts-sidebar-search-icon">🔍</span>
        <input
          className="ts-sidebar-search"
          placeholder="Search 300+ actions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="ts-sidebar-scroll">
        {groups.map(cat => cat.actions.length === 0 ? null : (
          <div key={cat.label} className="ts-category">
            <div className="ts-category-label">{cat.label}</div>
            {cat.actions.slice(0, search ? 60 : undefined).map(action => (
              <ActionBlock
                key={action}
                action={action}
                cat={cat}
                onAdd={onAdd}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Single Action Block ──────────────────────────────────────────────────────
// Separate component so event closures are fresh each render
function ActionBlock({ action, cat, onAdd }) {
  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', action);
    e.dataTransfer.setData('actionName', action);
  };

  const handleClick = () => {
    onAdd(action);
  };

  return (
    <div
      className="ts-action-block"
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
    >
      <span className="ts-action-grip" title="Drag to canvas">⠿</span>
      <div className={`ts-action-icon ${cat.color}`}>{cat.emoji}</div>
      <span className="ts-action-name">{action}</span>
      {cat.tag && <span className="ts-action-tag" style={cat.tagStyle}>{cat.tag}</span>}
    </div>
  );
}

// ─── Step Card ───────────────────────────────────────────────────────────────
function StepCard({ step, index, selected, onSelect, onDelete, dragHandlers }) {
  const meta = getActionMeta(step.actionName);
  const detail = [step.locatorType, step.locatorValue, step.testData].filter(Boolean).join(' › ');
  const isVerify = step.stepType === 'VERIFY';

  return (
    <div
      className={`ts-step-card${selected ? ' selected' : ''}${dragHandlers.isDragOver ? ' drag-over' : ''}`}
      onClick={() => onSelect(step._id)}
      draggable
      onDragStart={e => dragHandlers.onDragStart(e, index)}
      onDragEnd={dragHandlers.onDragEnd}
      onDragOver={e => { e.preventDefault(); dragHandlers.onDragOver(index); }}
      onDrop={e => dragHandlers.onDrop(e, index)}
    >
      <span className="ts-step-grip">⠿</span>
      <div className="ts-step-num">{index + 1}</div>
      <div className={`ts-step-icon ${meta.color}`}>{meta.emoji}</div>
      <div className="ts-step-info">
        <div className="ts-step-action">
          {isVerify && <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#d1fae5', color: '#065f46', marginRight: 6 }}>VERIFY</span>}
          {step.actionName || <em style={{color:'#9ca3af'}}>No action</em>}
        </div>
        {detail && <div className="ts-step-detail">{detail}</div>}
        {isVerify && step.expectedValue && <div className="ts-step-detail" style={{ color: '#10b981' }}>Expected: {step.expectedValue}</div>}
      </div>
      <button className="ts-step-delete" onClick={e => { e.stopPropagation(); onDelete(step._id); }} title="Delete">✕</button>
    </div>
  );
}

// ─── Right Panel ─────────────────────────────────────────────────────────────
function Configurator({ step, onChange }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSearch(step?.actionName || ''); }, [step?._id, step?.actionName]);

  if (!step) return (
    <div className="ts-config">
      <div className="ts-config-header">
        <div className="ts-config-label">Step Configurator</div>
        <div className="ts-config-title" style={{color:'#9ca3af'}}>No step selected</div>
      </div>
      <div className="ts-config-empty">
        <div style={{marginBottom:8, color:'var(--txt-muted)'}}><Settings size={32} /></div>
        <div style={{color:'var(--txt-muted)',fontSize:'0.84rem',lineHeight:1.6}}>Click any step<br/>on the canvas to configure it here</div>
      </div>
    </div>
  );

  const filtered = ALL_ACTIONS.filter(a => a.toLowerCase().includes(search.toLowerCase()));
  const meta = getActionMeta(step.actionName);

  return (
    <div className="ts-config">
      <div className="ts-config-header">
        <div className="ts-config-label">⚙️ Step Configurator</div>
        <div className="ts-config-title">{meta.emoji} {step.actionName || 'New Step'}</div>
      </div>
      <div className="ts-config-body">

        {/* Step Type Toggle */}
        <div className="ts-field">
          <label className="ts-field-label">Step Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['ACTION', 'VERIFY'].map(t => (
              <button key={t} onClick={() => onChange('stepType', t)}
                style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.15s',
                  background: step.stepType === t ? (t === 'VERIFY' ? '#d1fae5' : 'var(--brand)') : 'transparent',
                  color: step.stepType === t ? (t === 'VERIFY' ? '#065f46' : '#fff') : 'var(--txt-muted)',
                  borderColor: step.stepType === t ? (t === 'VERIFY' ? '#10b981' : 'var(--brand)') : 'var(--border)' }}>
                {t === 'ACTION' ? '⚡ ACTION' : '✅ VERIFY'}
              </button>
            ))}
          </div>
        </div>

        <div className="ts-field">
          <label className="ts-field-label">Action *</label>
          <div style={{position:'relative'}}>
            <input className="ts-input" value={search}
              onChange={e => { setSearch(e.target.value); onChange('actionName', e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Search action…"
            />
            {open && filtered.length > 0 && (
              <div className="ts-dropdown">
                {filtered.slice(0,40).map(a => (
                  <div key={a} className="ts-dropdown-item" onMouseDown={() => { onChange('actionName',a); setSearch(a); setOpen(false); }}>{a}</div>
                ))}
                {filtered.length > 40 && <div className="ts-dropdown-more">…and {filtered.length-40} more</div>}
              </div>
            )}
          </div>
        </div>

        <hr className="ts-divider" />

        <div className="ts-field">
          <label className="ts-field-label">Locator Type</label>
          <select className="ts-input" value={step.locatorType} onChange={e => onChange('locatorType', e.target.value)}>
            <option value="">— None —</option>
            {LOCATORS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="ts-field">
          <label className="ts-field-label">Locator Value</label>
          <input className="ts-input" value={step.locatorValue} onChange={e => onChange('locatorValue', e.target.value)} placeholder="#submit-btn" />
        </div>

        <hr className="ts-divider" />

        {step.stepType !== 'VERIFY' && (
          <div className="ts-field">
            <label className="ts-field-label">Test Data</label>
            <input className="ts-input" value={step.testData} onChange={e => onChange('testData', e.target.value)} placeholder="admin@test.com" />
          </div>
        )}
        {step.stepType === 'VERIFY' && (
          <div className="ts-field">
            <label className="ts-field-label" style={{ color: '#10b981' }}>✅ Expected Value *</label>
            <input className="ts-input" style={{ borderColor: '#10b981', outline: 'none' }}
              value={step.expectedValue || ''}
              onChange={e => onChange('expectedValue', e.target.value)}
              placeholder="Expected text, URL fragment, or title..."
            />
            <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>The agent will compare the actual value against this at runtime.</div>
          </div>
        )}

        <div className="ts-field">
          <label className="ts-field-label">Description</label>
          <input className="ts-input" value={step.description} onChange={e => onChange('description', e.target.value)} placeholder="What does this step do?" />
        </div>

      </div>
    </div>
  );
}

// ─── Main Studio ─────────────────────────────────────────────────────────────
export default function TestStudioView() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [name, setName]           = useState('');
  const [desc, setDesc]           = useState('');
  const [steps, setSteps]         = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [loaded, setLoaded]       = useState(!isEdit);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const dragFromIdx = useRef(null);

  // Load existing test case
  useEffect(() => {
    if (!isEdit) return;
    api(`/api/test-cases/${id}`).then(r => r.json()).then(d => {
      setName(d.testCase.name);
      setDesc(d.testCase.description || '');
      if (d.steps?.length) {
        setSteps(d.steps.map(s => ({
          _id: Math.random().toString(36).slice(2),
          actionName: s.actionName || '',
          stepType: s.stepType || 'ACTION',
          locatorType: s.locatorType || '',
          locatorValue: s.locatorValue || '',
          testData: s.testData || '',
          expectedValue: s.expectedValue || '',
          description: s.description || '',
        })));
      }
      setLoaded(true);
    });
  }, [id, isEdit]);

  // Add step (called by click or drop)
  const addStep = (actionName = '') => {
    const step = makeStep(actionName);
    setSteps(prev => [...prev, step]);
    setSelectedId(step._id);
  };

  const deleteStep = (sid) => {
    setSteps(prev => prev.filter(s => s._id !== sid));
    if (selectedId === sid) setSelectedId(null);
  };

  const updateStep = (key, val) => {
    setSteps(prev => prev.map(s => s._id === selectedId ? { ...s, [key]: val } : s));
  };

  // Canvas drag from sidebar
  const onCanvasDragOver = e => { e.preventDefault(); setIsDragOver(true); };
  const onCanvasDragLeave = () => setIsDragOver(false);
  const onCanvasDrop = e => {
    e.preventDefault();
    setIsDragOver(false);
    const action = e.dataTransfer.getData('actionName') || e.dataTransfer.getData('text/plain');
    if (action && !e.dataTransfer.getData('reorder')) addStep(action);
  };

  // Card reorder drag
  const onCardDragStart = (e, idx) => {
    dragFromIdx.current = idx;
    e.dataTransfer.setData('reorder', 'true');
    e.dataTransfer.setData('actionName', '');
    e.dataTransfer.effectAllowed = 'move';
  };
  const onCardDragEnd = () => { dragFromIdx.current = null; setDragOverIdx(null); };
  const onCardDragOver = idx => setDragOverIdx(idx);
  const onCardDrop = (e, toIdx) => {
    e.stopPropagation();
    setDragOverIdx(null);
    const isReorder = e.dataTransfer.getData('reorder') === 'true';
    if (!isReorder) {
      const action = e.dataTransfer.getData('actionName') || e.dataTransfer.getData('text/plain');
      if (action) { addStep(action); return; }
    }
    const fromIdx = dragFromIdx.current;
    if (fromIdx === null || fromIdx === toIdx) return;
    setSteps(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
    dragFromIdx.current = null;
  };

  // Save
  const save = async () => {
    if (!name.trim()) { toast('error', 'Validation', 'Test Case name is required.'); return; }
    setSaving(true);
    const payload = { name, description: desc, steps: steps.map((s,i) => ({ ...s, stepOrder: i+1, stepType: s.stepType || 'ACTION', expectedValue: s.expectedValue || null })) };
    const r = await api(isEdit ? `/api/test-cases/${id}` : '/api/test-cases', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.ok) { toast('success', isEdit ? 'Updated!' : 'Created!', `"${name}" — ${steps.length} steps`); setTimeout(() => navigate('/test-cases'), 900); }
    else { toast('error', 'Save Failed'); setSaving(false); }
  };

  if (!loaded) return <div className="ts-root"><div style={{margin:'auto',color:'#6b7280'}}>Loading…</div></div>;

  const selectedStep = steps.find(s => s._id === selectedId) || null;

  return (
    <div className="ts-root">

      {/* ── Topbar ── */}
      <div className="ts-topbar">
        <div className="ts-logo">
          <div className="ts-logo-icon">
            <img src="/logo.png" alt="AutoPilot Logo" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
          <span className="ts-logo-text">Auto<span style={{color:'var(--txt-h)'}}>Pilot</span></span>
        </div>
        <span className="ts-badge">Test Studio</span>
        <Link to="/test-cases" className="ts-exit-btn">← Exit</Link>
        <input className="ts-name-input" placeholder="Test Case Name *" value={name} onChange={e => setName(e.target.value)} />
        <input className="ts-desc-input" placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
        <div className="ts-step-counter">{steps.length} step{steps.length !== 1 ? 's' : ''}</div>
        <button className="ts-save-btn" onClick={save} disabled={saving} style={{display:'flex',alignItems:'center',gap:'6px'}}>
          {saving ? '⏳ Saving…' : <><Save size={16}/> Save</>}
        </button>
      </div>

      {/* ── Three columns ── */}
      <div className="ts-body">

        {/* Left: Sidebar */}
        <ActionSidebar onAdd={addStep} />

        {/* Center: Canvas */}
        <div className="ts-canvas">
          <div className="ts-canvas-toolbar">
            <span className="ts-canvas-title">Canvas</span>
            <span className="ts-canvas-count">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
            <button className="ts-add-btn" onClick={() => addStep()} style={{display:'flex',alignItems:'center',gap:'6px'}}><Plus size={16}/> Add Step</button>
          </div>

          <div
            className={`ts-canvas-body${isDragOver ? ' drag-active' : ''}`}
            onDragOver={onCanvasDragOver}
            onDragLeave={onCanvasDragLeave}
            onDrop={onCanvasDrop}
          >
            {steps.length === 0 ? (
              <div className="ts-empty-canvas">
                <div className="ts-empty-icon"><FileText size={40} /></div>
                <div className="ts-empty-title">Canvas is empty</div>
                <div className="ts-empty-sub">Click or drag any action from the left panel</div>
              </div>
            ) : (
              <>
                {steps.map((step, index) => (
                  <StepCard
                    key={step._id}
                    step={step}
                    index={index}
                    selected={selectedId === step._id}
                    onSelect={setSelectedId}
                    onDelete={deleteStep}
                    dragHandlers={{
                      isDragOver: dragOverIdx === index,
                      onDragStart: onCardDragStart,
                      onDragEnd: onCardDragEnd,
                      onDragOver: onCardDragOver,
                      onDrop: onCardDrop,
                    }}
                  />
                ))}
                <div
                  className={`ts-drop-more${isDragOver ? ' drag-active' : ''}`}
                  onDragOver={onCanvasDragOver}
                  onDrop={onCanvasDrop}
                >
                  Drop here to add more steps
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Configurator */}
        <Configurator step={selectedStep} onChange={updateStep} />

      </div>
    </div>
  );
}
