import { Search, Filter, MoreVertical, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getProducts, type Product, ProductStatus } from '../../commons/apis/product';
import { useDebounce } from '../../commons/hooks/use-debounce';
import { toast } from 'sonner';
import styles from "./styles.module.css";

interface ProductListProps {
  onProductCountChange?: (count: number) => void;
}

export function ProductList({ onProductCountChange }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus>(ProductStatus.ALL);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Debounce search term to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: {
          search?: string;
          categoryId?: string;
          status?: ProductStatus;
          limit?: number;
          offset?: number;
        } = {
          limit: 100, // Large limit for now, pagination can be added later
          offset: 0,
        };

        if (debouncedSearchTerm) {
          params.search = debouncedSearchTerm;
        }

        if (categoryFilter) {
          params.categoryId = categoryFilter;
        }

        if (statusFilter !== ProductStatus.ALL) {
          params.status = statusFilter;
        }

        const response = await getProducts(params);
        
        if (response.success) {
          setProducts(response.data.items);
          setTotal(response.data.total);
          onProductCountChange?.(response.data.total);
        } else {
          throw new Error('상품 목록을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '상품 목록을 불러오는데 실패했습니다.';
        setError(errorMessage);
        toast.error(errorMessage);
        setProducts([]);
        setTotal(0);
        onProductCountChange?.(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, categoryFilter, statusFilter]);

  const getStatusColor = (isActive: boolean) => {
    return isActive ? styles.statusActive : styles.statusInactive;
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? '판매중' : '판매중지';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={styles.c_4rnbt2}>
      <div className={styles.c_65x7hk}>
        <h3 className={styles.c_1l693jk}>등록된 상품</h3>
        <div className={styles.c_8s05pk}>
          <div className={styles.c_14sfe4c}>
            <Search className={styles.c_1y94mk} size={20} />
            <input
              type="text"
              placeholder="상품명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.c_lwq1hq}
            />
          </div>
          <div className={styles.c_2ca09w}>
            <Filter size={16} className={styles.c_1cnlnvv} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.c_1fl6ab8}
            >
              <option value="">모든 카테고리</option>
              {/* TODO: 카테고리 목록을 API에서 가져와서 동적으로 표시 */}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProductStatus)}
              className={styles.c_1fl6ab8}
            >
              <option value={ProductStatus.ALL}>모든 상태</option>
              <option value={ProductStatus.ACTIVE}>판매중</option>
              <option value={ProductStatus.INACTIVE}>판매중지</option>
              <option value={ProductStatus.DELETED}>삭제됨</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.c_1bb8j67}>
        {loading ? (
          <div className={styles.c_13nmcpi}>
            <p>상품 목록을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className={styles.c_13nmcpi}>
            <p>{error}</p>
          </div>
        ) : (
          <table className={styles.c_1l2zdph}>
            <thead className={styles.c_z838al}>
              <tr>
                <th className={styles.c_wiarv4}>상품</th>
                <th className={styles.c_wiarv4}>카테고리</th>
                <th className={styles.c_wiarv4}>가격</th>
                <th className={styles.c_wiarv4}>상태</th>
                <th className={styles.c_wiarv4}>타입</th>
                <th className={styles.c_wiarv4}>미디어 타입</th>
                <th className={styles.c_wiarv4}>등록일</th>
                <th className={styles.c_947h7t}>작업</th>
              </tr>
            </thead>
            <tbody className={styles.c_fyf4x}>
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className={styles.c_x2lcqj}>
                    <td className={styles.c_g43mv3}>
                      <div className={styles.c_2ca09x}>
                        <div className={styles.c_1ci45al}>
                          <Package className={styles.c_1cnln56} size={24} />
                        </div>
                        <div>
                          <p className={styles.c_1my21gc}>{product.name}</p>
                          <p className={styles.c_3t1c8w}>{product.description || '설명 없음'}</p>
                        </div>
                      </div>
                    </td>
                    <td className={styles.c_g43mv3}>
                      <span className={styles.c_146yb2l}>
                        {product.categoryId || '카테고리 없음'}
                      </span>
                    </td>
                    <td className={styles.c_g43mv3}>
                      <p className={styles.c_1my21gc}>₩{product.price.toLocaleString()}</p>
                    </td>
                    <td className={styles.c_g43mv3}>
                      <span className={`${styles.tagBase} ${getStatusColor(product.isActive)}`}>
                        {getStatusText(product.isActive)}
                      </span>
                    </td>
                    <td className={styles.c_g43mv3}>
                      <span className={styles.c_146yb2l}>
                        {product.productType}
                      </span>
                    </td>
                    <td className={styles.c_g43mv3}>
                      <div className={styles.c_1sdudap}>
                        {product.mediaTypes && product.mediaTypes.length > 0 ? (
                          product.mediaTypes.map((type, index) => (
                            <span key={index} className={styles.c_13einte}>
                              #{type}
                            </span>
                          ))
                        ) : (
                          <span className={styles.c_13einte}>없음</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.c_tp84h0}>{formatDate(product.createdAt)}</td>
                    <td className={styles.c_1ouo88t}>
                      <button className={styles.c_1us4dfh}>
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className={styles.c_13nmcpi}>
                    {searchTerm || categoryFilter || statusFilter !== ProductStatus.ALL
                      ? '검색 결과가 없습니다.'
                      : '등록된 상품이 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
