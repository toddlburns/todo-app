import { useState } from 'react';
import useTodoStore from '../../stores/todoStore';
import styles from './PasswordGate.module.css';

// Simple SHA-256 hash function
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function PasswordGate({ children }) {
  const { settings, setAuthenticated, setPasswordHash, isAuthenticated } = useTodoStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(!settings.passwordHash);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const hash = await hashPassword(password);
    setPasswordHash(hash);
    setAuthenticated(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const hash = await hashPassword(password);
    if (hash === settings.passwordHash) {
      setAuthenticated(true);
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Todo App</h1>

        {isSettingUp ? (
          <form onSubmit={handleSetPassword} className={styles.form}>
            <p className={styles.subtitle}>Set up your password</p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={styles.input}
              autoFocus
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className={styles.input}
            />

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.button}>
              Set Password
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className={styles.form}>
            <p className={styles.subtitle}>Enter your password</p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={styles.input}
              autoFocus
            />

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.button}>
              Unlock
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
