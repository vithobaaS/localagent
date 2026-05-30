import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/apiClient';
import { toast } from '../../components/common/ToastContainer';
import { PageHeader } from '../../components/common/PageComponents';

const ACTIONS = ['navigate','click','type','clear','select','wait','assert','hover','doubleClick','rightClick','scrollTo','switchFrame','switchWindow','acceptAlert','dismissAlert','screenshot','executeScript','dragAndDrop','waitForElement'];
const LOCATORS = ['id','name','xpath','css','linkText','partialLinkText','className','tagName'];

export default function TestCaseFormView() {
  const { id } = useParams(); const isEdit = !!id; const navigate = useNavigate();
  const [name, setName] = useState(''); const [desc, setDesc] = useState('');
  const [steps, setSteps] = useState([{ actionName: '', locatorType: '', locatorValue: '', testData: '', description: '' }]);
  const [saving, setSaving] = useState(false); const [loaded, setLoaded] = useState(!isEdit);

  useEffect(() => {
    if (isEdit) {
      api(`/api/test-cases/${id}`).then(r => r.json()).then(d => {
        setName(d.testCase.name); setDesc(d.testCase.description || '');
        if (d.steps && d.steps.length > 0) setSteps(d.steps.map(s => ({ actionName: s.actionName || '', locatorType: s.locatorType || '', locatorValue: s.locatorValue || '', testData: s.testData || '', description: s.description || '' })));
        setLoaded(true);
      });
    }
  }, [id, isEdit]);

  const addStep = () => setSteps(p => [...p, { actionName: '', locatorType: '', locatorValue: '', testData: '', description: '' }]);
  const removeStep = (i) => { if (steps.length > 1) setSteps(p => p.filter((_, j) => j !== i)); };
  const updateStep = (i, k, v) => setSteps(p => p.map((s, j) => j === i ? { ...s, [k]: v } : s));

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = { name, description: desc, steps: steps.map((s, i) => ({ ...s, stepOrder: i + 1 })) };
    const url = isEdit ? `/api/test-cases/${id}` : '/api/test-cases';
    const method = isEdit ? 'PUT' : 'POST';
    const r = await api(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (r.ok) { toast('success', isEdit ? 'Updated!' : 'Created!', `"${name}" with ${steps.length} step(s).`); setTimeout(() => navigate('/test-cases'), 900); }
    else { toast('error', 'Failed'); setSaving(false); }
  };

  if (!loaded) return <div className="page-view"><div className="spinner" style={{ marginTop: 80 }} /></div>;

  return (
    <div className="page-view">
      <PageHeader title={isEdit ? 'Edit Test Case' : 'Create Test Case'} actions={<Link to="/test-cases" className="btn btn-ghost">← Back</Link>} />
      <div className="card form-card-wide">
        <div className="card-header"><div><h2>📝 {isEdit ? 'Edit' : 'New'} Test Case</h2><p>Define the test scenario and its ordered steps</p></div></div>
        <form onSubmit={save}>
          <div className="form-section"><div className="form-section-title">Basic Info</div><div className="form-grid">
            <div className="form-group"><label className="form-label">Test Case Name <span className="req">*</span></label><input className="form-input" placeholder="e.g. Login with valid credentials" value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Description</label><input className="form-input" placeholder="What does this test verify?" value={desc} onChange={e => setDesc(e.target.value)} /></div>
          </div></div>

          <div className="step-builder">
            <div className="step-builder-header">
              <div className="step-builder-title">🔬 Test Steps <span className="step-count-pill">{steps.length}</span></div>
              <button type="button" className="btn btn-primary btn-sm" onClick={addStep}>➕ Add Step</button>
            </div>
            <div className="step-list">
              {steps.map((s, i) => (
                <div key={i} className="step-card">
                  <div className="step-num">{i + 1}</div>
                  <div className="step-body">
                    <div className="step-field"><span className="step-field-label">Action *</span><select value={s.actionName} onChange={e => updateStep(i, 'actionName', e.target.value)} required><option value="">Select…</option>{ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                    <div className="step-field"><span className="step-field-label">Locator</span><select value={s.locatorType} onChange={e => updateStep(i, 'locatorType', e.target.value)}><option value="">None</option>{LOCATORS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                    <div className="step-field"><span className="step-field-label">Value</span><input placeholder="#submit-btn" value={s.locatorValue} onChange={e => updateStep(i, 'locatorValue', e.target.value)} /></div>
                    <div className="step-field"><span className="step-field-label">Data</span><input placeholder="admin@test.com" value={s.testData} onChange={e => updateStep(i, 'testData', e.target.value)} /></div>
                    <div className="step-field"><span className="step-field-label">Description</span><input placeholder="Step purpose" value={s.description} onChange={e => updateStep(i, 'description', e.target.value)} /></div>
                  </div>
                  <button type="button" className="step-remove-btn" onClick={() => removeStep(i)} disabled={steps.length <= 1}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions"><Link to="/test-cases" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-success" disabled={saving}>{saving ? '⏳ Saving…' : `💾 ${isEdit ? 'Update' : 'Save'} (${steps.length} steps)`}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
