import { useState, useEffect } from 'react';
import { api } from '../../api/apiClient';
import { fmt, statusBadge } from '../../utils/helpers';

export function ExecutionReportModal({ execId, onClose, onLightbox }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/api/executions/${execId}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [execId]);

  const getName = (e) => {
    try { return JSON.parse(e.environmentJson || '{}').referenceId || `Run #${e.orgExecutionId || e.id}`; }
    catch { return `Run #${e.orgExecutionId || e.id}`; }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <h3>{loading ? 'Loading…' : `📊 Report — ${getName(detail.execution)}`}</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {loading ? <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div> : detail && (<>
            <div className="exec-meta">
              {[{ l: 'ID', v: `#${detail.execution.id}` }, { l: 'Status', v: <span className={`badge ${statusBadge(detail.execution.status)}`}>{detail.execution.status}</span> }, { l: 'Started', v: fmt(detail.execution.createdAt) }, { l: 'Finished', v: detail.execution.finishedAt ? fmt(detail.execution.finishedAt) : '⏳ In progress' }]
                .map(m => <div key={m.l} className="exec-meta-item"><div className="exec-meta-label">{m.l}</div><div className="exec-meta-val">{m.v}</div></div>)}
            </div>
            <div className="steps-section"><h4>🔬 Steps ({detail.steps.length})</h4>
              <div className="nested-table"><table className="data-table"><thead><tr><th>#</th><th>Action</th><th>Executed</th><th>Result</th><th>Error</th><th>Screenshot</th></tr></thead>
                <tbody>{detail.steps.length === 0 ? <tr className="row-empty"><td colSpan={6}>No steps.</td></tr> : detail.steps.map(step => {
                  const ss = detail.screenshots.find(sc => sc.stepResultId === step.id);
                  return (<tr key={step.id}><td className="cell-bold">{step.stepIndex}</td><td><span className="action-tag">{step.actionName}</span></td>
                    <td>{step.executedStatus === 1 ? <span className="badge badge-success">Yes</span> : <span className="badge badge-neutral">No</span>}</td>
                    <td>{step.executedStatus === 1 ? step.resultStatus === 1 ? <span className="badge badge-success">PASS</span> : <span className="badge badge-danger">FAIL</span> : '—'}</td>
                    <td className="text-sm text-muted">{step.errorJson || '—'}</td>
                    <td>{ss ? <img src={ss.storagePath} className="screenshot-thumb" alt="ss" onClick={() => onLightbox(ss.storagePath)} /> : '—'}</td></tr>);
                })}</tbody></table></div>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}
