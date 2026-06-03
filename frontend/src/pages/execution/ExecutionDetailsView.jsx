import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/apiClient';
import { fmt, statusBadge } from '../../utils/helpers';
import './ExecutionDetails.css';

function PageHeader({ title, crumb, actions }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1>{title}</h1>
        <div className="breadcrumbs">
          <Link to="/dashboard">Home</Link>
          <span className="sep">›</span>
          <Link to="/dashboard">Executions</Link>
          <span className="sep">›</span>
          <span>{crumb}</span>
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export default function ExecutionDetailsView() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    api(`/api/executions/${id}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const getName = (e) => {
    try { return JSON.parse(e.environmentJson || '{}').referenceId || `Run #${e.orgExecutionId || e.id}`; }
    catch { return `Run #${e.orgExecutionId || e.id}`; }
  };

  const getBrowser = (e) => {
    try { return (JSON.parse(e.environmentJson || '{}').browserTypeName || 'chrome').toLowerCase(); }
    catch { return 'chrome'; }
  };

  if (loading) {
    return (
      <div className="page-view">
        <PageHeader title="Execution Details" crumb="Loading..." />
        <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>
      </div>
    );
  }

  if (!detail || !detail.execution) {
    return (
      <div className="page-view">
        <PageHeader title="Execution Not Found" crumb="Error" />
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Execution not found</h3>
          <p>The execution you are looking for does not exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  const { execution, steps, screenshots } = detail;
  const isSuccess = execution.status?.toLowerCase() === 'success' || execution.status?.toLowerCase() === 'completed';
  const isFailed = execution.status?.toLowerCase() === 'failed';
  const isRunning = execution.status?.toLowerCase() === 'running';
  const headerIcon = isSuccess ? '✅' : isFailed ? '❌' : isRunning ? '⚡' : '⏸️';

  const durationStr = () => {
    if (!execution.createdAt || !execution.finishedAt) return '—';
    const ms = new Date(execution.finishedAt) - new Date(execution.createdAt);
    if (ms < 0) return '—';
    const s = Math.floor(ms / 1000);
    return `${s}s`;
  };

  return (
    <div className="page-view execution-details-page">
      <PageHeader 
        title={`Execution #${execution.orgExecutionId || execution.id}`} 
        crumb={getName(execution)} 
      />

      {/* Meta Bar */}
      <div className="exec-meta-bar">
        <div className="meta-left">
          <div className="meta-icon">{headerIcon}</div>
          <div className="meta-info">
            <h2>{getName(execution)}</h2>
            <div className="meta-badges">
              <span className={`badge ${statusBadge(execution.status)}`}>{execution.status}</span>
              <span className={`badge ${statusBadge(getBrowser(execution))}`}>{getBrowser(execution)}</span>
            </div>
          </div>
        </div>
        <div className="meta-right">
          <div className="meta-stat">
            <span className="stat-lbl">Started</span>
            <span className="stat-val">{fmt(execution.createdAt)}</span>
          </div>
          <div className="meta-stat">
            <span className="stat-lbl">Duration</span>
            <span className="stat-val">{durationStr()}</span>
          </div>
          <div className="meta-stat">
            <span className="stat-lbl">Steps</span>
            <span className="stat-val">{steps.length}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline-container">
        <h3>🔬 Execution Timeline</h3>
        {steps.length === 0 ? (
          <div className="empty-state">No steps recorded for this execution.</div>
        ) : (
          <div className="timeline">
            {steps.map((step, idx) => {
              const ss = screenshots.find(sc => sc.stepResultId === step.id);
              const stepFailed = step.resultStatus === 2 || step.executedStatus === 2 || (step.errorJson && step.errorJson !== '');
              const stepPassed = step.resultStatus === 1 && step.executedStatus === 1;
              const stepStatusIcon = stepFailed ? '🔴' : stepPassed ? '🟢' : '⚪';

              return (
                <div key={step.id} className={`timeline-item ${stepFailed ? 'failed' : stepPassed ? 'passed' : 'skipped'}`}>
                  <div className="timeline-connector"></div>
                  <div className="timeline-icon">{stepStatusIcon}</div>
                  <div className="timeline-content">
                    <div className="step-header">
                      <span className="step-index">Step {step.stepIndex || idx + 1}</span>
                      <span className="action-tag">{step.actionName}</span>
                      <span className="step-locator text-muted">
                        {step.locatorName && `${step.locatorName}: `} 
                        {step.objectDetail || step.testData || '—'}
                      </span>
                      {step.testData && step.testData !== step.objectDetail && (
                         <span className="step-data text-muted"> | Data: {step.testData}</span>
                      )}
                    </div>
                    
                    {/* Error Banner */}
                    {stepFailed && step.errorJson && step.errorJson.trim() !== '' && (
                      <div className="step-error-banner">
                        <strong>⚠️ Error Analysis:</strong> {step.errorJson}
                      </div>
                    )}

                    {/* Screenshot */}
                    {ss && (
                      <div className="step-screenshot" onClick={() => setLightbox(ss.storagePath)}>
                        <img src={ss.storagePath} alt={`Step ${step.stepIndex}`} />
                        <div className="screenshot-overlay">🔍 View Screenshot</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-close" onClick={() => setLightbox(null)}>✕</div>
          <img src={lightbox} className="lightbox-img" alt="Screenshot Full" />
        </div>
      )}
    </div>
  );
}
