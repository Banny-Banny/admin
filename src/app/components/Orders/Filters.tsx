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
import type { OrderFilters, OrderStatus, PaymentStatus } from '../../commons/types/orders';
import styles from './styles.module.css';

interface FiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

export function Filters({ filters, onFiltersChange }: FiltersProps) {
  const [localFilters, setLocalFilters] = useState<OrderFilters>(filters);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 빈 문자열이나 공백만 있는 경우 undefined로 변환
  const normalizeValue = (value: string | undefined): string | undefined => {
    if (!value || value.trim() === '') {
      return undefined;
    }
    return value.trim();
  };

  const handleFilterChange = (key: keyof OrderFilters, value: string | undefined) => {
    const normalizedValue = normalizeValue(value);
    const newFilters = { ...localFilters, [key]: normalizedValue };
    setLocalFilters(newFilters);
    
    // debounce: userSearch 입력 시 500ms 대기 후 API 호출
    if (key === 'userSearch' && debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (key === 'userSearch') {
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
        {/* 주문 상태 필터 */}
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>주문 상태</label>
          <Select
            value={localFilters.status || 'ALL'}
            onValueChange={(value) =>
              handleFilterChange('status', value === 'ALL' ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              <SelectItem value="PENDING">대기</SelectItem>
              <SelectItem value="PENDING_PAYMENT">결제 대기</SelectItem>
              <SelectItem value="PAID">결제 완료</SelectItem>
              <SelectItem value="CANCELED">취소</SelectItem>
              <SelectItem value="FAILED">실패</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 결제 상태 필터 */}
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>결제 상태</label>
          <Select
            value={localFilters.paymentStatus || 'ALL'}
            onValueChange={(value) =>
              handleFilterChange('paymentStatus', value === 'ALL' ? undefined : value)
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

        {/* 시작일 */}
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>시작일</label>
          <Input
            type="datetime-local"
            value={localFilters.startDate || ''}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
          />
        </div>

        {/* 종료일 */}
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>종료일</label>
          <Input
            type="datetime-local"
            value={localFilters.endDate || ''}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
          />
        </div>

        {/* 유저 검색 (닉네임/이메일) */}
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>유저 검색</label>
          <Input
            type="text"
            placeholder="닉네임 또는 이메일 입력"
            value={localFilters.userSearch || ''}
            onChange={(e) => handleFilterChange('userSearch', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
