import { useState, useCallback } from 'react';
import { CheckCircle, ExternalLink, Eye, EyeOff, Loader } from 'lucide-react';
import { sendMessage } from '../vscode';
import type { JiraUser, OnboardingStep } from '../types';

interface Props {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifiedUser, setVerifiedUser] = useState<JiraUser | null>(null);

  // Step 1 fields
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [showJiraToken, setShowJiraToken] = useState(false);

  // Step 2 fields
  const [tempoToken, setTempoToken] = useState('');
  const [showTempoToken, setShowTempoToken] = useState(false);

  const handleJiraSubmit = () => {
    setError('');
    if (!jiraUrl || !jiraEmail || !jiraToken) {
      setError('All fields are required.');
      return;
    }
    // Normalize URL
    const normalizedUrl = jiraUrl.endsWith('/') ? jiraUrl : jiraUrl + '/';
    setLoading(true);
    sendMessage('saveJiraCredentials', { jiraUrl: normalizedUrl, jiraEmail, jiraToken });
  };

  const handleTempoSubmit = () => {
    setError('');
    if (!tempoToken) {
      setError('Tempo token is required.');
      return;
    }
    setLoading(true);
    sendMessage('saveTempoCredentials', { tempoToken });
  };

  // Called from App when messages come in
  useCallback(() => {}, []);

  return (
    <div className="onboarding">
      <div className="onboarding-header">
        <h2>⏱ Tempo Logger</h2>
        <p className="subtitle">Let's get you set up</p>
      </div>

      <div className="steps-indicator">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`step-dot ${step >= s ? 'active' : ''} ${step > s ? 'done' : ''}`}>
            {step > s ? <CheckCircle size={14} /> : s}
          </div>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Step 1 — Jira */}
      {step === 1 && (
  <div className="step-panel">
    <h3>Step 1 — Jira Credentials</h3>
    <a
      className="help-link"
      href="https://id.atlassian.com/manage-profile/security/api-tokens"
      target="_blank"
      rel="noreferrer"
    >
      Generate Jira API Token <ExternalLink size={12} />
    </a>

    <div className="field">
      <label>Jira Cloud URL</label>
      <input
        type="url"
        placeholder="https://yourcompany.atlassian.net"
        value={jiraUrl}
        onChange={e => setJiraUrl(e.target.value)}
      />
    </div>

    <div className="field">
      <label>Jira Email</label>
      <input
        type="email"
        placeholder="you@company.com"
        value={jiraEmail}
        onChange={e => setJiraEmail(e.target.value)}
      />
    </div>

    <div className="field">
      <label>Jira API Token</label>
      <div className="input-with-icon">
        <input
          type={showJiraToken ? 'text' : 'password'}
          placeholder="Paste your token"
          value={jiraToken}
          onChange={e => setJiraToken(e.target.value)}
        />
        <button className="icon-btn" onClick={() => setShowJiraToken(p => !p)}>
          {showJiraToken ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>

    <button className="primary-btn" onClick={handleJiraSubmit} disabled={loading}>
      {loading ? <Loader size={14} className="spin" /> : null}
      {loading ? 'Verifying...' : 'Verify & Continue'}
    </button>
  </div>
)}

      {/* Step 2 — Tempo */}
      {step === 2 && (
        <div className="step-panel">
          <h3>Step 2 — Tempo Credentials</h3>
          <a
            className="help-link"
            href="https://app.tempo.io/settings/api-integration"
            target="_blank"
            rel="noreferrer"
          >
            Generate Tempo API Token <ExternalLink size={12} />
          </a>

          {verifiedUser && (
            <div className="success-banner">
              ✅ Jira connected as <strong>{verifiedUser.displayName}</strong>
            </div>
          )}

          <div className="field">
            <label>Tempo API Token</label>
            <div className="input-with-icon">
              <input
                type={showTempoToken ? 'text' : 'password'}
                placeholder="Paste your Tempo token"
                value={tempoToken}
                onChange={e => setTempoToken(e.target.value)}
              />
              <button className="icon-btn" onClick={() => setShowTempoToken(p => !p)}>
                {showTempoToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button className="primary-btn" onClick={handleTempoSubmit} disabled={loading}>
            {loading ? <Loader size={14} className="spin" /> : null}
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </div>
      )}

      {/* Step 3 — Done */}
      {step === 3 && (
        <div className="step-panel center">
          <CheckCircle size={48} className="success-icon" />
          <h3>All set!</h3>
          <p>Jira and Tempo are connected.<br />You're ready to log time.</p>
          <button className="primary-btn" onClick={onComplete}>
            Start Logging →
          </button>
        </div>
      )}

      {/* Expose step setter for App to call via ref */}
      <div
        id="onboarding-bridge"
        data-set-step=""
        ref={(el) => {
          if (el) {
            (el as any)._setStep = setStep;
            (el as any)._setLoading = setLoading;
            (el as any)._setError = setError;
            (el as any)._setVerifiedUser = setVerifiedUser;
          }
        }}
      />
    </div>
  );
}