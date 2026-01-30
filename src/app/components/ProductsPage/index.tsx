import { useState, useEffect, useMemo } from 'react';
import { Plus, Package, X, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { ProductList } from '../ProductList';
import { createProduct, getProductById, updateProduct, deleteProduct, ProductType, type CreateProductRequest, type UpdateProductRequest, type Product } from '../../commons/apis/product';
import { handleApiErrorWithToast } from '../../commons/utils/error-handler';
import { Skeleton } from '../../commons/components/skeleton';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../commons/components/alert-dialog';
import styles from "./styles.module.css";

export function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // 상품 상세 조회 상태
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  
  // 수정 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    status: '판매중',
    description: '',
    thumbnailUrl: '',
    thumbnailFile: null as File | null,
    productType: ProductType.TIME_CAPSULE,
    mediaTypes: [] as string[],
    maxMediaCount: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editValidationErrors, setEditValidationErrors] = useState<Record<string, string>>({});
  
  // 삭제 관련 상태
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    status: '판매중',
    description: '',
    thumbnailUrl: '',
    thumbnailFile: null as File | null,
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
        thumbnail: formData.thumbnailFile || undefined,
        thumbnailUrl: !formData.thumbnailFile ? (formData.thumbnailUrl.trim() || undefined) : undefined,
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
          thumbnailFile: null,
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
    } catch (err: unknown) {
      const apiError = handleApiErrorWithToast(err, '상품 등록에 실패했습니다.');
      
      // maxMediaCount 관련 에러 메시지 파싱
      if (apiError.message.includes('maxMediaCount') || apiError.message.includes('must not be greater than 3')) {
        setValidationErrors({
          ...validationErrors,
          maxMediaCount: '최대 미디어 개수는 3을 초과할 수 없습니다.',
        });
      }
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

  // 상품 상세 조회 핸들러
  const handleProductClick = (productId: string) => {
    setSelectedProductId(productId);
    setDetailError(null);
  };

  // 상품 상세 정보 로드
  useEffect(() => {
    if (!selectedProductId) {
      setProductDetail(null);
      return;
    }

    const fetchProductDetail = async () => {
      setDetailLoading(true);
      setDetailError(null);

      try {
        const response = await getProductById(selectedProductId);
        
        if (response.success) {
          setProductDetail(response.data);
        } else {
          throw new Error('상품 정보를 불러오는데 실패했습니다.');
        }
      } catch (err: unknown) {
        const apiError = handleApiErrorWithToast(err, '상품 정보를 불러오는데 실패했습니다.');
        setDetailError(apiError.message);
        
        // 404 에러인 경우 상세 뷰 닫기
        if (apiError.isNotFound) {
          setSelectedProductId(null);
          setProductDetail(null);
        }
      } finally {
        setDetailLoading(false);
      }
    };

    fetchProductDetail();
  }, [selectedProductId]);

  const formatDate = useMemo(() => {
    return (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return dateString;
      }
    };
  }, []);

  // 수정 모드 진입 핸들러
  const handleEditClick = () => {
    if (!productDetail) return;
    
    // 기존 상품 데이터를 폼에 로드
    setEditFormData({
      name: productDetail.name,
      categoryId: productDetail.categoryId || '',
      price: productDetail.price.toString(),
      status: productDetail.isActive ? '판매중' : '판매중지',
      description: productDetail.description || '',
      thumbnailUrl: productDetail.thumbnailUrl || '',
      thumbnailFile: null,
      productType: productDetail.productType,
      mediaTypes: productDetail.mediaTypes || [],
      maxMediaCount: typeof productDetail.maxMediaCount === 'number' 
        ? productDetail.maxMediaCount.toString() 
        : '1',
    });
    setIsEditMode(true);
    setEditValidationErrors({});
  };

  // 수정 취소 핸들러
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFormData({
      name: '',
      categoryId: '',
      price: '',
      status: '판매중',
      description: '',
      thumbnailUrl: '',
      thumbnailFile: null,
      productType: ProductType.TIME_CAPSULE,
      mediaTypes: [],
      maxMediaCount: '',
    });
    setEditValidationErrors({});
  };

  // 수정 폼 검증
  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editFormData.name.trim()) {
      errors.name = '상품명을 입력해주세요.';
    }

    if (!editFormData.price || parseFloat(editFormData.price) <= 0) {
      errors.price = '가격은 0보다 큰 숫자여야 합니다.';
    }

    if (!editFormData.productType) {
      errors.productType = '상품 타입을 선택해주세요.';
    }

    if (!editFormData.mediaTypes || editFormData.mediaTypes.length === 0) {
      errors.mediaTypes = '미디어 타입을 최소 1개 이상 선택해주세요.';
    }

    if (!editFormData.maxMediaCount || parseFloat(editFormData.maxMediaCount) <= 0) {
      errors.maxMediaCount = '최대 미디어 개수는 0보다 큰 숫자여야 합니다.';
    } else if (parseFloat(editFormData.maxMediaCount) > 3) {
      errors.maxMediaCount = '최대 미디어 개수는 3을 초과할 수 없습니다.';
    }

    setEditValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 수정 폼 제출 핸들러
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId || !productDetail) return;

    if (!validateEditForm()) {
      return;
    }

    if (isUpdating) {
      return; // 중복 제출 방지
    }

    setIsUpdating(true);
    setEditValidationErrors({});

    try {
      // 변경된 필드만 추출하여 부분 업데이트
      const updateData: UpdateProductRequest = {};

      if (editFormData.name !== productDetail.name) {
        updateData.name = editFormData.name.trim();
      }
      if (parseFloat(editFormData.price) !== productDetail.price) {
        updateData.price = parseFloat(editFormData.price);
      }
      if (editFormData.description !== (productDetail.description || '')) {
        updateData.description = editFormData.description.trim() || null;
      }
      // 파일 업로드 우선, 없으면 URL 사용
      if (editFormData.thumbnailFile) {
        updateData.thumbnail = editFormData.thumbnailFile;
      } else if (editFormData.thumbnailUrl !== (productDetail.thumbnailUrl || '')) {
        updateData.thumbnailUrl = editFormData.thumbnailUrl.trim() || null;
      }
      if (editFormData.categoryId !== (productDetail.categoryId || '')) {
        updateData.categoryId = editFormData.categoryId || null;
      }
      if ((editFormData.status === '판매중') !== productDetail.isActive) {
        updateData.isActive = editFormData.status === '판매중';
      }
      if (editFormData.productType !== productDetail.productType) {
        updateData.productType = editFormData.productType;
      }
      if (JSON.stringify(editFormData.mediaTypes.sort()) !== JSON.stringify((productDetail.mediaTypes || []).sort())) {
        updateData.mediaTypes = editFormData.mediaTypes;
      }
      const currentMaxMediaCount = typeof productDetail.maxMediaCount === 'number' 
        ? productDetail.maxMediaCount 
        : 1;
      if (parseFloat(editFormData.maxMediaCount) !== currentMaxMediaCount) {
        updateData.maxMediaCount = parseFloat(editFormData.maxMediaCount);
      }

      // 변경사항이 없으면 경고
      if (Object.keys(updateData).length === 0) {
        toast.info('변경된 내용이 없습니다.');
        setIsUpdating(false);
        return;
      }

      const response = await updateProduct(selectedProductId, updateData);

      if (response.success) {
        toast.success('상품 정보가 성공적으로 수정되었습니다.');
        setIsEditMode(false);
        // 상세 정보 새로고침
        setProductDetail(response.data);
        // 목록 새로고침
        setRefreshKey((prev) => prev + 1);
      } else {
        throw new Error('상품 수정에 실패했습니다.');
      }
    } catch (err: unknown) {
      const apiError = handleApiErrorWithToast(err, '상품 수정에 실패했습니다.');
      
      // maxMediaCount 관련 에러 메시지 파싱
      if (apiError.message.includes('maxMediaCount') || apiError.message.includes('must not be greater than 3')) {
        setEditValidationErrors({
          ...editValidationErrors,
          maxMediaCount: '최대 미디어 개수는 3을 초과할 수 없습니다.',
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // 수정 폼 변경 핸들러
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'mediaType') {
      return;
    }

    setEditFormData({
      ...editFormData,
      [name]: value,
    });

    // 검증 에러 초기화
    if (editValidationErrors[name]) {
      setEditValidationErrors({
        ...editValidationErrors,
        [name]: '',
      });
    }
  };

  // 수정 폼 미디어 타입 변경 핸들러
  const handleEditMediaTypeChange = (mediaType: string, checked: boolean) => {
    setEditFormData({
      ...editFormData,
      mediaTypes: checked
        ? [...editFormData.mediaTypes, mediaType]
        : editFormData.mediaTypes.filter((type) => type !== mediaType),
    });

    // 검증 에러 초기화
    if (editValidationErrors.mediaTypes) {
      setEditValidationErrors({
        ...editValidationErrors,
        mediaTypes: '',
      });
    }
  };

  // 삭제 핸들러
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProductId) return;

    if (isDeleting) {
      return; // 중복 제출 방지
    }

    setIsDeleting(true);

    try {
      const response = await deleteProduct(selectedProductId);

      if (response.success) {
        toast.success('상품이 성공적으로 삭제되었습니다.');
        // 상세 뷰 닫기
        setSelectedProductId(null);
        setProductDetail(null);
        setDetailError(null);
        setIsEditMode(false);
        setShowDeleteDialog(false);
        // 목록 새로고침
        setRefreshKey((prev) => prev + 1);
      } else {
        throw new Error('상품 삭제에 실패했습니다.');
      }
    } catch (err: unknown) {
      const apiError = handleApiErrorWithToast(err, '상품 삭제에 실패했습니다.');
      
      // 404 에러인 경우 상세 뷰 닫기
      if (apiError.isNotFound) {
        setSelectedProductId(null);
        setProductDetail(null);
        setDetailError(null);
        setIsEditMode(false);
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
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
                  {['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'MUSIC'].map((type) => (
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

            {/* 썸네일 이미지 */}
            <div>
              <label className={styles.c_a41skz}>
                썸네일 이미지 (선택)
              </label>
              
              {!formData.thumbnailFile ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({
                        ...formData,
                        thumbnailFile: file,
                        thumbnailUrl: '', // 파일 선택 시 URL 초기화
                      });
                    }
                  }}
                  className={styles.c_mbvevs}
                />
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px',
                  backgroundColor: '#f9fafb'
                }}>
                  <span style={{ flex: 1, fontSize: '0.875rem', color: '#374151' }}>
                    📎 {formData.thumbnailFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thumbnailFile: null })}
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.875rem',
                      color: '#dc2626',
                      backgroundColor: 'white',
                      border: '1px solid #dc2626',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    삭제
                  </button>
                </div>
              )}
              
              {/* 또는 URL 입력 */}
              <div style={{ marginTop: '8px' }}>
                <label className={styles.c_a41skz} style={{ fontSize: '0.875rem' }}>
                  또는 URL 입력
                </label>
                <input
                  type="url"
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className={styles.c_mbvevs}
                  disabled={!!formData.thumbnailFile}
                />
              </div>
              
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

      <ProductList 
        onProductCountChange={setTotalProductCount} 
        refreshKey={refreshKey}
        onProductClick={handleProductClick}
      />

      {/* 상품 상세 조회 Modal */}
      {selectedProductId !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={() => {
            setSelectedProductId(null);
            setProductDetail(null);
            setDetailError(null);
            setIsEditMode(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
                  {isEditMode ? '상품 정보 수정' : '상품 상세 정보'}
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  {productDetail ? productDetail.name : '상품 정보를 불러오는 중...'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!isEditMode && productDetail && (
                  <>
                    <button
                      onClick={handleEditClick}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #3b82f6',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #dc2626',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Trash2 size={16} />
                      삭제
                    </button>
                  </>
                )}
                <button
                onClick={() => {
                  if (isEditMode) {
                    handleCancelEdit();
                  }
                  setSelectedProductId(null);
                  setProductDetail(null);
                  setDetailError(null);
                  setIsEditMode(false);
                }}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

          {detailLoading ? (
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Skeleton style={{ width: '100%', height: '24px' }} />
              <Skeleton style={{ width: '60%', height: '20px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '16px' }}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Skeleton style={{ width: '80px', height: '16px' }} />
                    <Skeleton style={{ width: '100%', height: '20px' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : detailError ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'red' }}>{detailError}</p>
            </div>
          ) : isEditMode && productDetail ? (
            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {/* 상품명 */}
                <div>
                  <label className={styles.c_a41skz}>
                    상품명 <span className={styles.c_uurwux}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    required
                    placeholder="상품명을 입력하세요"
                    className={styles.c_mbvevs}
                  />
                  {editValidationErrors.name && (
                    <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                      {editValidationErrors.name}
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
                    value={editFormData.categoryId}
                    onChange={handleEditFormChange}
                    className={styles.c_mbvevs}
                  >
                    <option value="">카테고리 선택 (선택사항)</option>
                    {/* TODO: 카테고리 목록을 API에서 가져와서 동적으로 표시 */}
                  </select>
                  {editValidationErrors.categoryId && (
                    <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                      {editValidationErrors.categoryId}
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
                    value={editFormData.price}
                    onChange={handleEditFormChange}
                    required
                    min="1"
                    step="1"
                    placeholder="0"
                    className={styles.c_mbvevs}
                  />
                  {editValidationErrors.price && (
                    <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                      {editValidationErrors.price}
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
                    value={editFormData.productType}
                    onChange={handleEditFormChange}
                    required
                    className={styles.c_mbvevs}
                  >
                    <option value={ProductType.TIME_CAPSULE}>타임캡슐</option>
                    <option value={ProductType.EASTER_EGG}>이스터에그</option>
                  </select>
                  {editValidationErrors.productType && (
                    <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                      {editValidationErrors.productType}
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
                    value={editFormData.status}
                    onChange={handleEditFormChange}
                    required
                    className={styles.c_mbvevs}
                  >
                    <option value="판매중">판매중</option>
                    <option value="판매중지">판매중지</option>
                  </select>
                  {editValidationErrors.status && (
                    <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                      {editValidationErrors.status}
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
                    value={editFormData.maxMediaCount}
                    onChange={handleEditFormChange}
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
                  {editValidationErrors.maxMediaCount && (
                    <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                      {editValidationErrors.maxMediaCount}
                    </p>
                  )}
                </div>
              </div>

              {/* 미디어 타입 */}
              <div>
                <label className={styles.c_a41skz}>
                  미디어 타입 <span className={styles.c_uurwux}>*</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'MUSIC'].map((type) => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={editFormData.mediaTypes.includes(type)}
                        onChange={(e) => handleEditMediaTypeChange(type, e.target.checked)}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
                {editValidationErrors.mediaTypes && (
                  <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                    {editValidationErrors.mediaTypes}
                  </p>
                )}
              </div>

              {/* 상품 설명 */}
              <div>
                <label className={styles.c_a41skz}>
                  상품 설명 (선택)
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  rows={4}
                  placeholder="상품에 대한 설명을 입력하세요"
                  className={styles.c_1amsm21}
                />
                {editValidationErrors.description && (
                  <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                    {editValidationErrors.description}
                  </p>
                )}
              </div>

              {/* 썸네일 이미지 */}
              <div>
                <label className={styles.c_a41skz}>
                  썸네일 이미지 (선택)
                </label>
                
                {!editFormData.thumbnailFile ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditFormData({
                          ...editFormData,
                          thumbnailFile: file,
                          thumbnailUrl: '', // 파일 선택 시 URL 초기화
                        });
                      }
                    }}
                    className={styles.c_mbvevs}
                  />
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    backgroundColor: '#f9fafb'
                  }}>
                    <span style={{ flex: 1, fontSize: '0.875rem', color: '#374151' }}>
                      📎 {editFormData.thumbnailFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, thumbnailFile: null })}
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.875rem',
                        color: '#dc2626',
                        backgroundColor: 'white',
                        border: '1px solid #dc2626',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      삭제
                    </button>
                  </div>
                )}
                
                {/* 또는 URL 입력 */}
                <div style={{ marginTop: '8px' }}>
                  <label className={styles.c_a41skz} style={{ fontSize: '0.875rem' }}>
                    또는 URL 입력
                  </label>
                  <input
                    type="url"
                    name="thumbnailUrl"
                    value={editFormData.thumbnailUrl}
                    onChange={handleEditFormChange}
                    placeholder="https://example.com/image.jpg"
                    className={styles.c_mbvevs}
                    disabled={!!editFormData.thumbnailFile}
                  />
                </div>
                
                {editValidationErrors.thumbnailUrl && (
                  <p className={styles.c_d8pr7p} style={{ color: 'red' }}>
                    {editValidationErrors.thumbnailUrl}
                  </p>
                )}
              </div>

              {/* 버튼 */}
              <div className={styles.c_sm9r4r}>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={styles.c_8zbzmp}
                  disabled={isUpdating}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={styles.c_b151g0}
                  disabled={isUpdating}
                >
                  {isUpdating ? '수정 중...' : '저장'}
                </button>
              </div>
            </form>
          ) : productDetail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 기본 정보 */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>기본 정보</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>상품명</label>
                    <p style={{ fontSize: '16px', fontWeight: '500' }}>{productDetail.name}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>가격</label>
                    <p style={{ fontSize: '16px', fontWeight: '500' }}>₩{productDetail.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>상품 타입</label>
                    <p style={{ fontSize: '16px', fontWeight: '500' }}>{productDetail.productType}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>상태</label>
                    <p style={{ fontSize: '16px', fontWeight: '500' }}>
                      {productDetail.isActive ? '판매중' : '판매중지'}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>카테고리 ID</label>
                    <p style={{ fontSize: '16px', fontWeight: '500' }}>{productDetail.categoryId || '없음'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>최대 미디어 개수</label>
                    <p style={{ fontSize: '16px', fontWeight: '500' }}>
                      {typeof productDetail.maxMediaCount === 'number' 
                        ? productDetail.maxMediaCount 
                        : JSON.stringify(productDetail.maxMediaCount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 설명 */}
              {productDetail.description && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>상품 설명</h3>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                    {productDetail.description}
                  </p>
                </div>
              )}

              {/* 미디어 타입 */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>미디어 타입</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {productDetail.mediaTypes && productDetail.mediaTypes.length > 0 ? (
                    productDetail.mediaTypes.map((type, index) => (
                      <span 
                        key={index}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#374151',
                        }}
                      >
                        {type}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#9ca3af' }}>없음</span>
                  )}
                </div>
              </div>

              {/* 썸네일 */}
              {productDetail.thumbnailUrl && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>썸네일</h3>
                  <div style={{ position: 'relative', width: '100%', maxHeight: '300px', borderRadius: '8px', overflow: 'hidden' }}>
                    <Image 
                      src={productDetail.thumbnailUrl} 
                      alt={productDetail.name}
                      width={800}
                      height={300}
                      style={{ 
                        width: '100%',
                        height: 'auto',
                        maxHeight: '300px',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 날짜 정보 */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>날짜 정보</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>등록일</label>
                    <p style={{ fontSize: '14px', color: '#374151' }}>{formatDate(productDetail.createdAt)}</p>
                  </div>
                  {productDetail.updatedAt && (
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>수정일</label>
                      <p style={{ fontSize: '14px', color: '#374151' }}>{formatDate(productDetail.updatedAt)}</p>
                    </div>
                  )}
                  {productDetail.deletedAt && (
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>삭제일</label>
                      <p style={{ fontSize: '14px', color: '#dc2626' }}>{formatDate(productDetail.deletedAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 상품 ID */}
              <div>
                <label style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>상품 ID</label>
                <p style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>{productDetail.id}</p>
              </div>
            </div>
          ) : null}
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상품 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              {productDetail && (
                <div style={{ marginTop: '8px', fontWeight: '500' }}>
                  상품명: {productDetail.name}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
              }}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
