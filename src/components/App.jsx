import { useState, useEffect } from 'react';
import useTodoStore from '../stores/todoStore';
import githubStorage from '../services/githubStorage';
import audioService from '../services/audioService';
import PasswordGate from './Auth/PasswordGate';
import TodoList from './Todo/TodoList';
import BulkActions from './Controls/BulkActions';
import TodoistImport from './Import/TodoistImport';
import Settings from './Settings';
import styles from './App.module.css';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error

  const { settings, todos, exportData, loadData } = useTodoStore();

  // Initialize audio service with settings
  useEffect(() => {
    audioService.setEnabled(settings.soundEnabled);
    audioService.setVolume(settings.soundVolume);
  }, [settings.soundEnabled, settings.soundVolume]);

  // Configure GitHub storage with settings
  useEffect(() => {
    if (settings.githubToken && settings.githubRepo) {
      githubStorage.configure(settings.githubToken, settings.githubRepo);
    }
  }, [settings.githubToken, settings.githubRepo]);

  // Load data from GitHub on mount
  useEffect(() => {
    async function loadFromGitHub() {
      if (!githubStorage.isConfigured()) return;

      setSyncStatus('syncing');
      try {
        const data = await githubStorage.load();
        if (data) {
          loadData(data);
        }
        setSyncStatus('synced');
      } catch (err) {
        console.error('Failed to load from GitHub:', err);
        setSyncStatus('error');
      }
    }

    loadFromGitHub();
  }, [settings.githubToken, settings.githubRepo]);

  // Auto-save to GitHub when todos change
  useEffect(() => {
    if (!githubStorage.isConfigured()) return;

    const data = exportData();
    setSyncStatus('syncing');

    githubStorage.debouncedSave(data)
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('error'));
  }, [todos]);

  const handleManualSync = async () => {
    if (!githubStorage.isConfigured()) {
      setShowSettings(true);
      return;
    }

    setSyncStatus('syncing');
    try {
      const data = exportData();
      await githubStorage.save(data);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus('error');
    }
  };

  return (
    <PasswordGate>
      <div className={styles.app}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.logo}>Todo</h1>

          <div className={styles.headerRight}>
            <button
              className={styles.syncBtn}
              onClick={handleManualSync}
              title={
                syncStatus === 'syncing' ? 'Syncing...' :
                syncStatus === 'synced' ? 'Synced' :
                syncStatus === 'error' ? 'Sync error - click to retry' :
                'Sync to GitHub'
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={syncStatus === 'syncing' ? styles.spinning : ''}
              >
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
              </svg>
              {syncStatus === 'synced' && <span className={styles.syncDot} />}
              {syncStatus === 'error' && <span className={styles.syncError} />}
            </button>

            <button
              className={styles.iconBtn}
              onClick={() => setShowImport(true)}
              title="Import from Todoist"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
            </button>

            <button
              className={styles.iconBtn}
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className={styles.main}>
          <TodoList />
        </main>

        {/* Bulk Actions Bar */}
        <BulkActions />

        {/* Settings Modal */}
        {showSettings && (
          <Settings onClose={() => setShowSettings(false)} />
        )}

        {/* Import Modal */}
        {showImport && (
          <TodoistImport onClose={() => setShowImport(false)} />
        )}
      </div>
    </PasswordGate>
  );
}
