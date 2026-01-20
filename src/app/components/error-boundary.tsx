'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 문의하기 관련 컴포넌트를 위한 Error Boundary
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="mb-4 text-red-500" size={48} />
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            오류가 발생했습니다
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            문의하기 기능을 불러오는 중 문제가 발생했습니다.
          </p>
          {this.state.error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                오류 상세 정보
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-gray-100 p-4 text-xs">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            페이지 새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}