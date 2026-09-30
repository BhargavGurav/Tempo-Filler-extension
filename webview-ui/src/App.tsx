import { useState, useEffect, useCallback } from 'react';
import { Onboarding } from './components/Onboarding';
import { MainPanel } from './components/MainPanel';
import { sendMessage } from './vscode';
import { useVSCodeMessages } from './hooks/useVSCodeMessages';
import type { AppScreen } from './types';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('loading');
  // const bridgeRef = useRef<HTMLDivElement>(null);

  // On mount, ask extension host if we're already configured
  useEffect(() => {
    sendMessage('checkAuth');
  }, []);

  const handleMessage = useCallback((message: { command: string; [key: string]: any }) => {
    const bridge = document.getElementById('onboarding-bridge') as any;

    switch (message.command) {
      case 'authStatus':
        setScreen(message.configured ? 'main' : 'onboarding');
        break;

      case 'jiraVerified':
        if (bridge) {
          bridge._setLoading(false);
          bridge._setVerifiedUser(message.user);
          bridge._setStep(2);
        }
        break;

      case 'tempoVerified':
        if (bridge) {
          bridge._setLoading(false);
          bridge._setStep(3);
        }
        break;

      case 'error':
        if (bridge) {
          bridge._setLoading(false);
          bridge._setError(message.message);
        }
        break;
    }
  }, []);

  useVSCodeMessages(handleMessage);

  if (screen === 'loading') {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (screen === 'onboarding') {
    return <Onboarding onComplete={() => setScreen('main')} />;
  }

  return <MainPanel onLogout={() => setScreen('onboarding')} />;
}