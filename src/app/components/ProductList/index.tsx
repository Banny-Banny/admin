import { Search, Filter, MoreVertical, Package } from 'lucide-react';
import { useState } from 'react';
import styles from "./styles.module.css";

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  status: string;
  description: string;
  image: string | null;
  tags: string[];
  createdAt: string;
}

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case '판매중':
        return styles.statusActive;
      case '품절':
        return styles.statusSoldOut;
      case '판매중지':
        return styles.statusInactive;
      default:
        return styles.statusDefault;
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
              <option value="all">모든 카테고리</option>
              <option value="전자기기">전자기기</option>
              <option value="패션">패션</option>
              <option value="식품">식품</option>
              <option value="도서">도서</option>
              <option value="생활용품">생활용품</option>
              <option value="기타">기타</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.c_1fl6ab8}
            >
              <option value="all">모든 상태</option>
              <option value="판매중">판매중</option>
              <option value="품절">품절</option>
              <option value="판매중지">판매중지</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.c_1bb8j67}>
        <table className={styles.c_1l2zdph}>
          <thead className={styles.c_z838al}>
            <tr>
              <th className={styles.c_wiarv4}>상품</th>
              <th className={styles.c_wiarv4}>카테고리</th>
              <th className={styles.c_wiarv4}>가격</th>
              <th className={styles.c_wiarv4}>재고</th>
              <th className={styles.c_wiarv4}>상태</th>
              <th className={styles.c_wiarv4}>태그</th>
              <th className={styles.c_wiarv4}>등록일</th>
              <th className={styles.c_947h7t}>작업</th>
            </tr>
          </thead>
          <tbody className={styles.c_fyf4x}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id} className={styles.c_x2lcqj}>
                  <td className={styles.c_g43mv3}>
                    <div className={styles.c_2ca09x}>
                      <div className={styles.c_1ci45al}>
                        <Package className={styles.c_1cnln56} size={24} />
                      </div>
                      <div>
                        <p className={styles.c_1my21gc}>{product.name}</p>
                        <p className={styles.c_3t1c8w}>{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className={styles.c_g43mv3}>
                    <span className={styles.c_146yb2l}>
                      {product.category}
                    </span>
                  </td>
                  <td className={styles.c_g43mv3}>
                    <div>
                      {product.discountPrice ? (
                        <>
                          <p className={styles.c_1my21gc}>₩{product.discountPrice.toLocaleString()}</p>
                          <p className={styles.c_12lnfqe}>₩{product.price.toLocaleString()}</p>
                        </>
                      ) : (
                        <p className={styles.c_1my21gc}>₩{product.price.toLocaleString()}</p>
                      )}
                    </div>
                  </td>
                  <td className={styles.c_g43mv3}>
                    <p className={`${styles.stockText} ${
                      product.stock === 0 ? styles.stockEmpty : styles.stockNormal
                    }`}>
                      {product.stock}개
                    </p>
                  </td>
                  <td className={styles.c_g43mv3}>
                    <span className={`${styles.tagBase} ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className={styles.c_g43mv3}>
                    <div className={styles.c_1sdudap}>
                      {product.tags.map((tag, index) => (
                        <span key={index} className={styles.c_13einte}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={styles.c_tp84h0}>{product.createdAt}</td>
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
                  등록된 상품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
