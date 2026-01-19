'use client';
import { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import styles from './styles.module.css';

interface LoginPageProps {
  onLogin?: (email: string, password: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin) {
      onLogin(email, password);
    }
  };

  return (
    <div className={styles.login_container}>
      <div className={styles.login_card}>
        <div className={styles.login_header}>
          <div className={styles.icon_wrapper}>
            <Lock className={styles.lock_icon} size={32} />
          </div>
          <h1 className={styles.login_title}>관리자 로그인</h1>
          <p className={styles.login_subtitle}>
            이메일과 비밀번호를 입력하세요
          </p>
        </div>
        <div className={styles.login_content}>
          <form onSubmit={handleSubmit} className={styles.login_form}>
            <div className={styles.input_group}>
              <label htmlFor="email" className={styles.form_label}>
                이메일
              </label>
              <div className={styles.input_wrapper}>
                <Mail className={styles.input_icon} size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className={styles.input_field}
                  required
                />
              </div>
            </div>

            <div className={styles.input_group}>
              <label htmlFor="password" className={styles.form_label}>
                비밀번호
              </label>
              <div className={styles.input_wrapper}>
                <Lock className={styles.input_icon} size={20} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className={styles.input_field}
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.login_button}>
              <LogIn size={20} />
              로그인
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
