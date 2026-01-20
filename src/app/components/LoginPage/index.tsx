'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../commons/hooks/use-auth';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return; // 중복 요청 방지
    
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      toast.success('로그인 성공');
      router.push('/');
      // 페이지 리로드를 통해 인증 상태 반영
      router.refresh();
    } catch (err) {
      // 네트워크 오류와 인증 오류를 구분하여 메시지 표시
      let errorMessage = '로그인에 실패했습니다';
      if (err instanceof Error) {
        if (err.message.includes('Network') || err.message.includes('fetch')) {
          errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
        } else {
          errorMessage = err.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = authLoading || isSubmitting;

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
          <form onSubmit={handleSubmit(onSubmit)} className={styles.login_form}>
            <div className={styles.input_group}>
              <label htmlFor="email" className={styles.form_label}>
                이메일
              </label>
              <div className={styles.input_wrapper}>
                <Mail className={styles.input_icon} size={20} />
                <input
                  id="email"
                  type="email"
                  {...register('email', {
                    required: '이메일을 입력해주세요',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: '유효한 이메일 주소를 입력해주세요',
                    },
                  })}
                  placeholder="admin@example.com"
                  className={styles.input_field}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className={styles.error_message}>{errors.email.message}</p>
              )}
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
                  {...register('password', {
                    required: '비밀번호를 입력해주세요',
                  })}
                  placeholder="비밀번호를 입력하세요"
                  className={styles.input_field}
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className={styles.error_message}>{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              className={styles.login_button}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  로그인 중...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  로그인
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
