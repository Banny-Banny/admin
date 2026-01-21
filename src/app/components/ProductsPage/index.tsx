import { useState } from 'react';
import { Plus, Package, Image as ImageIcon, X } from 'lucide-react';
import { ProductList } from '../ProductList';
import { createProduct, ProductType, type CreateProductRequest } from '../../commons/apis/product';
import { toast } from 'sonner';
import styles from "./styles.module.css";

export function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    status: '판매중',
    description: '',
    thumbnailUrl: '',
    productType: ProductType.TIME_CAPSULE,
    mediaTypes: [] as string[],
    maxMediaCount: '',
  });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = '상품명을 입력해주세요.';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = '가격은 0보다 큰 숫자여야 합니다.';
    }

    if (!formData.productType) {
      errors.productType = '상품 타입을 선택해주세요.';
    }

    if (!formData.mediaTypes || formData.mediaTypes.length === 0) {
      errors.mediaTypes = '미디어 타입을 최소 1개 이상 선택해주세요.';
    }

    if (!formData.maxMediaCount || parseFloat(formData.maxMediaCount) <= 0) {
      errors.maxMediaCount = '최대 미디어 개수는 0보다 큰 숫자여야 합니다.';
    } else if (parseFloat(formData.maxMediaCount) > 3) {
      errors.maxMediaCount = '최대 미디어 개수는 3을 초과할 수 없습니다.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isSubmitting) {
      return; // 중복 제출 방지
    }

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // 폼 데이터를 API 요청 형식으로 변환
      const requestData: CreateProductRequest = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim() || undefined,
        thumbnailUrl: formData.thumbnailUrl.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        isActive: formData.status === '판매중',
        productType: formData.productType,
        mediaTypes: formData.mediaTypes,
        maxMediaCount: parseFloat(formData.maxMediaCount),
      };

      const response = await createProduct(requestData);

      if (response.success) {
        toast.success('상품이 성공적으로 등록되었습니다.');
        // 폼 리셋
        setFormData({
          name: '',
          categoryId: '',
          price: '',
          status: '판매중',
          description: '',
          thumbnailUrl: '',
          productType: ProductType.TIME_CAPSULE,
          mediaTypes: [],
          maxMediaCount: '',
        });
        setShowForm(false);
        // 목록 새로고침
        setRefreshKey((prev) => prev + 1);
      } else {
        throw new Error('상품 등록에 실패했습니다.');
      }
    } catch (err: any) {
      let errorMessage = '상품 등록에 실패했습니다.';
      
      // Axios 에러 응답에서 메시지 추출
      if (err?.response?.data) {
        const errorData = err.response.data;
        
        // maxMediaCount 관련 에러 메시지 파싱
        if (errorData.message) {
          const messages = Array.isArray(errorData.message) ? errorData.message : [errorData.message];
          const maxMediaCountError = messages.find((msg: string) => 
            typeof msg === 'string' && (msg.includes('maxMediaCount') || msg.includes('must not be greater than 3'))
          );
          
          if (maxMediaCountError) {
            errorMessage = '최대 미디어 개수는 3을 초과할 수 없습니다.';
            // 폼의 maxMediaCount 필드에 에러 표시
            setValidationErrors({
              ...validationErrors,
              maxMediaCount: '최대 미디어 개수는 3을 초과할 수 없습니다.',
            });
          } else {
            errorMessage = messages.join(', ') || errorData.message || errorMessage;
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 미디어 타입은 체크박스로 처리하므로 별도 핸들러 필요
    if (name === 'mediaType') {
      // 체크박스는 별도 핸들러에서 처리
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    // 검증 에러 초기화
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: '',
      });
    }
  };

  const handleMediaTypeChange = (mediaType: string, checked: boolean) => {
    setFormData({
      ...formData,
      mediaTypes: checked
        ? [...formData.mediaTypes, mediaType]
        : formData.mediaTypes.filter((type) => type !== mediaType),
    });

    // 검증 에러 초기화
    if (validationErrors.mediaTypes) {
      setValidationErrors({
        ...validationErrors,
        mediaTypes: '',
      });
    }
  };

  return (
    <div className={styles.c_1j8i8bf}>
      <div className={styles.c_xc8ak4}>
        <div>
          <h2 className={styles.c_1dlkxbt}>상품 관리</h2>
          <p className={styles.c_9ngaqo}>전체 {totalProductCount}개의 상품</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              // 폼 닫을 때 검증 에러 초기화
              setValidationErrors({});
            }
          }}
          className={styles.c_1kx26xi}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? '취소' : '상품 등록'}
        </button>
      </div>

      {showForm && (
        <div className={styles.c_6422n}>
          <div className={styles.c_5znanu}>
            <Package className={styles.c_12qcbxf} size={24} />
            <h3 className={styles.c_y1t0l}>새 상품 등록</h3>
          </div>

          <form onSubmit={handleSubmit} className={styles.c_1j8i8bf}>
            <div className={styles.c_45f187}>
              {/* 상품명 */}
              <div>
                <label className={styles.c_a41skz}>
                  상품명 <span className={styles.c_uurwux}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="상품명을 입력하세요"
                  className={styles.c_mbvevs}
                />
                {validationErrors.name && (
                  <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                    {validationErrors.name}
                  </p>
                )}
              </div>

              {/* 카테고리 */}
              <div>
                <label className={styles.c_a41skz}>
                  카테고리 (선택)
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className={styles.c_mbvevs}
                >
                  <option value="">카테고리 선택 (선택사항)</option>
                  {/* TODO: 카테고리 목록을 API에서 가져와서 동적으로 표시 */}
                </select>
                {validationErrors.categoryId && (
                  <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                    {validationErrors.categoryId}
                  </p>
                )}
              </div>

              {/* 가격 */}
              <div>
                <label className={styles.c_a41skz}>
                  가격 <span className={styles.c_uurwux}>*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="1"
                  step="1"
                  placeholder="0"
                  className={styles.c_mbvevs}
                />
                {validationErrors.price && (
                  <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                    {validationErrors.price}
                  </p>
                )}
              </div>

              {/* 상품 타입 */}
              <div>
                <label className={styles.c_a41skz}>
                  상품 타입 <span className={styles.c_uurwux}>*</span>
                </label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleChange}
                  required
                  className={styles.c_mbvevs}
                >
                  <option value={ProductType.TIME_CAPSULE}>타임캡슐</option>
                  <option value={ProductType.EASTER_EGG}>이스터에그</option>
                </select>
                {validationErrors.productType && (
                  <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                    {validationErrors.productType}
                  </p>
                )}
              </div>

              {/* 미디어 타입 */}
              <div>
                <label className={styles.c_a41skz}>
                  미디어 타입 <span className={styles.c_uurwux}>*</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'].map((type) => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={formData.mediaTypes.includes(type)}
                        onChange={(e) => handleMediaTypeChange(type, e.target.checked)}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
                {validationErrors.mediaTypes && (
                  <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                    {validationErrors.mediaTypes}
                  </p>
                )}
              </div>

              {/* 최대 미디어 개수 */}
              <div>
                <label className={styles.c_a41skz}>
                  최대 미디어 개수 <span className={styles.c_uurwux}>*</span>
                </label>
                <input
                  type="number"
                  name="maxMediaCount"
                  value={formData.maxMediaCount}
                  onChange={handleChange}
                  required
                  min="1"
                  max="3"
                  step="1"
                  placeholder="1"
                  className={styles.c_mbvevs}
                />
                <p className={styles.c_d8pr7p} style={{ fontSize: '0.875rem', color: '#666' }}>
                  최대 3개까지 입력 가능합니다.
                </p>
                {validationErrors.maxMediaCount && (
                  <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                    {validationErrors.maxMediaCount}
                  </p>
                )}
              </div>

              {/* 상태 */}
              <div>
                <label className={styles.c_a41skz}>
                  상태 <span className={styles.c_uurwux}>*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className={styles.c_mbvevs}
                >
                  <option value="판매중">판매중</option>
                  <option value="판매중지">판매중지</option>
                </select>
                {validationErrors.status && (
                  <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                    {validationErrors.status}
                  </p>
                )}
              </div>
            </div>

            {/* 상품 설명 */}
            <div>
              <label className={styles.c_a41skz}>
                상품 설명 (선택)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="상품에 대한 설명을 입력하세요"
                className={styles.c_1amsm21}
              />
              {validationErrors.description && (
                <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                  {validationErrors.description}
                </p>
              )}
            </div>

            {/* 썸네일 URL */}
            <div>
              <label className={styles.c_a41skz}>
                썸네일 URL (선택)
              </label>
              <input
                type="url"
                name="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className={styles.c_mbvevs}
              />
              {validationErrors.thumbnailUrl && (
                <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                  {validationErrors.thumbnailUrl}
                </p>
              )}
            </div>

            {/* 버튼 */}
            <div className={styles.c_sm9r4r}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setValidationErrors({});
                }}
                className={styles.c_8zbzmp}
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.c_b151g0}
                disabled={isSubmitting}
              >
                {isSubmitting ? '등록 중...' : '상품 등록'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ProductList onProductCountChange={setTotalProductCount} refreshKey={refreshKey} />
    </div>
  );
}
