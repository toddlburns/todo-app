import { useState } from 'react';
import useTodoStore from '../stores/todoStore';
import githubStorage from '../services/githubStorage';
import audioService from '../services/audioService';
import styles from './Settings.module.css';

export default function Settings({ onClose }) {
  const { settings, updateSettings, setAuthenticated, setPasswordHash } = useTodoStore();

  const [githubToken, setGithubToken] = useState(settings.githubToken || '');
  const [githubRepo, setGithubRepo] = useState(settings.githubRepo || '');
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [soundVolume, setSoundVolume] = useState(settings.soundVolume);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    if (!githubToken || !githubRepo) {
      setTestResult({ success: false, message: 'Please fill in both fields' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    githubStorage.configure(githubToken, githubRepo);

    try {
      await githubStorage.testConnection();
      setTestResult({ success: true, message: 'Connection successful!' });
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    updateSettings({
      githubToken,
      githubRepo,
      soundEnabled,
      soundVolume,
    });

    audioService.setEnabled(soundEnabled);
    audioService.setVolume(soundVolume);

    if (githubToken && githubRepo) {
      githubStorage.configure(githubToken, githubRepo);
    }

    onClose();
  };

  const handleTestSound = () => {
    audioService.setVolume(soundVolume);
    audioService.setEnabled(true);
    audioService.playCompletionSound();
  };

  const handleLogout = () => {
    setAuthenticated(false);
  };

  const handleResetPassword = () => {
    if (confirm('Are you sure you want to reset your password? You will need to set a new one.')) {
      setPasswordHash(null);
      setAuthenticated(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>Settings</h2>

        {/* GitHub Storage Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>GitHub Storage</h3>
          <p className={styles.sectionDesc}>
            Store your tasks in a private GitHub repository for backup and sync.
          </p>

          <div className={styles.field}>
            <label>Personal Access Token</label>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
            />
            <span className={styles.hint}>
              Create at GitHub → Settings → Developer settings → Personal access tokens
            </span>
          </div>

          <div className={styles.field}>
            <label>Repository</label>
            <input
              type="text"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="username/repo-name"
            />
            <span className={styles.hint}>
              Use a private repository for security
            </span>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testing}
            className={styles.testBtn}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          {testResult && (
            <p className={testResult.success ? styles.success : styles.error}>
              {testResult.message}
            </p>
          )}
        </section>

        {/* Sound Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Sound</h3>

          <div className={styles.fieldRow}>
            <label>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
              Enable completion sound
            </label>
          </div>

          <div className={styles.field}>
            <label>Volume</label>
            <div className={styles.volumeRow}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                className={styles.slider}
              />
              <span className={styles.volumeValue}>
                {Math.round(soundVolume * 100)}%
              </span>
              <button onClick={handleTestSound} className={styles.testSoundBtn}>
                Test
              </button>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Account</h3>

          <div className={styles.accountActions}>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Lock App
            </button>
            <button onClick={handleResetPassword} className={styles.resetBtn}>
              Reset Password
            </button>
          </div>
        </section>

        {/* Actions */}
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.saveBtn}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
