'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '../../commons/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../commons/components/select';
import type { PaymentLogsFilters } from '../../commons/types/payments';
import styles from './PaymentLogsFilters.module.css';

// UUID 유효성 검사 함수
const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

interface PaymentLogsFiltersProps {
  filters: PaymentLogsFilters;
  onFiltersChange: (filters: PaymentLogsFilters) => void;
}

export function PaymentLogsFilters({ filters, onFiltersChange }: PaymentLogsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<PaymentLogsFilters>(filters);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 빈 문자열이나 공백만 있는 경우 undefined로 변환
  const normalizeValue = (value: string | undefined): string | undefined => {
    if (!value || value.trim() === '') {
      return undefined;
    }
    return value.trim();
  };

  const handleFilterChange = (key: keyof PaymentLogsFilters, value: string | undefined) => {
    const normalizedValue = normalizeValue(value);
    const newFilters = { ...localFilters, [key]: normalizedValue };
    setLocalFilters(newFilters);

    // debounce: userId, userSearch 입력 시 500ms 대기 후 API 호출
    if ((key === 'userId' || key === 'userSearch') && debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (key === 'userId') {
      debounceTimerRef.current = setTimeout(() => {
        // 유효한 UUID이거나 비어있을 때만 API 호출
        if (!normalizedValue || isValidUUID(normalizedValue)) {
          onFiltersChange(newFilters);
        }
      }, 500);
    } else if (key === 'userSearch') {
      debounceTimerRef.current = setTimeout(() => {
        onFiltersChange(newFilters);
      }, 500);
    } else {
      onFiltersChange(newFilters);
    }
  };

  const handleDateChange = (key: 'startDate' | 'endDate', value: string) => {
    const normalizedValue = normalizeValue(value);
    const newFilters = { ...localFilters, [key]: normalizedValue };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // filters prop 변경 시 localFilters 동기화
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersGrid}>
        {/* 결제 상태 필터 */}
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>결제 상태</label>
          <Select
            value={localFilters.status || 'ALL'}
            onValueChange={(value) =>
              handleFilterChange(
                'status',
                value === 'ALL'
                  ? undefined
                  : (value as 'READY' | 'PAID' | 'CANCELED' | 'FAILED' | 'ALL')
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              <SelectItem value="READY">준비</SelectItem>
              <SelectItem value="PAID">결제 완료</SelectItem>
              <SelectItem value="CANCELED">취소</SelectItem>
              <SelectItem value="FAILED">실패</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 사용자 ID 필터 */}
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>사용자 ID</label>
          <Input
            type="text"
            placeholder="사용자 ID 입력"
            value={localFilters.userId || ''}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
          />
        </div>

        {/* 사용자 검색 필터 (닉네임/이메일) */}
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>사용자 검색</label>
          <Input
            type="text"
            placeholder="닉네임 또는 이메일"
            value={localFilters.userSearch || ''}
            onChange={(e) => handleFilterChange('userSearch', e.target.value)}
          />
        </div>

        {/* 시작 날짜 필터 */}
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>시작 날짜</label>
          <Input
            type="datetime-local"
            value={
              localFilters.startDate
                ? new Date(localFilters.startDate).toISOString().slice(0, 16)
                : ''
            }
            onChange={(e) =>
              handleDateChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : '')
            }
          />
        </div>

        {/* 종료 날짜 필터 */}
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>종료 날짜</label>
          <Input
            type="datetime-local"
            value={
              localFilters.endDate
                ? new Date(localFilters.endDate).toISOString().slice(0, 16)
                : ''
            }
            onChange={(e) =>
              handleDateChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : '')
            }
          />
        </div>
      </div>
    </div>
  );
}
