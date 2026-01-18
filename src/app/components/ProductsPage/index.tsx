import { useState } from 'react';
import { Plus, Package, Image as ImageIcon, X } from 'lucide-react';
import { ProductList } from '../ProductList';
import type { Product } from '../ProductList';
import styles from "./styles.module.css";

export function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: '무선 이어폰',
      category: '전자기기',
      price: 89000,
      discountPrice: 79000,
      stock: 150,
      status: '판매중',
      description: '고품질 무선 이어폰입니다.',
      image: null,
      tags: ['인기', '신상'],
      createdAt: '2026-01-10',
    },
    {
      id: 2,
      name: '블루투스 스피커',
      category: '전자기기',
      price: 120000,
      discountPrice: null,
      stock: 0,
      status: '품절',
      description: '강력한 사운드의 블루투스 스피커',
      image: null,
      tags: ['인기'],
      createdAt: '2026-01-08',
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    discountPrice: '',
    stock: '',
    status: '판매중',
    description: '',
    tags: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProduct = {
      id: products.length + 1,
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
      stock: Number(formData.stock),
      status: formData.status,
      description: formData.description,
      image: null,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setProducts([newProduct, ...products]);
    setFormData({
      name: '',
      category: '',
      price: '',
      discountPrice: '',
      stock: '',
      status: '판매중',
      description: '',
      tags: '',
    });
    setShowForm(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={styles.c_1j8i8bf}>
      <div className={styles.c_xc8ak4}>
        <div>
          <h2 className={styles.c_1dlkxbt}>상품 관리</h2>
          <p className={styles.c_9ngaqo}>전체 {products.length}개의 상품</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
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
              </div>

              {/* 카테고리 */}
              <div>
                <label className={styles.c_a41skz}>
                  카테고리 <span className={styles.c_uurwux}>*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className={styles.c_mbvevs}
                >
                  <option value="">카테고리 선택</option>
                  <option value="전자기기">전자기기</option>
                  <option value="패션">패션</option>
                  <option value="식품">식품</option>
                  <option value="도서">도서</option>
                  <option value="생활용품">생활용품</option>
                  <option value="기타">기타</option>
                </select>
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
                  min="0"
                  placeholder="0"
                  className={styles.c_mbvevs}
                />
              </div>

              {/* 할인가 */}
              <div>
                <label className={styles.c_a41skz}>
                  할인가 (선택)
                </label>
                <input
                  type="number"
                  name="discountPrice"
                  value={formData.discountPrice}
                  onChange={handleChange}
                  min="0"
                  placeholder="할인가가 있으면 입력하세요"
                  className={styles.c_mbvevs}
                />
              </div>

              {/* 재고 수량 */}
              <div>
                <label className={styles.c_a41skz}>
                  재고 수량 <span className={styles.c_uurwux}>*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="0"
                  className={styles.c_mbvevs}
                />
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
                  <option value="품절">품절</option>
                  <option value="판매중지">판매중지</option>
                </select>
              </div>
            </div>

            {/* 상품 설명 */}
            <div>
              <label className={styles.c_a41skz}>
                상품 설명 <span className={styles.c_uurwux}>*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="상품에 대한 설명을 입력하세요"
                className={styles.c_1amsm21}
              />
            </div>

            {/* 태그 */}
            <div>
              <label className={styles.c_a41skz}>
                태그 (선택)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="태그를 쉼표로 구분하여 입력하세요 (예: 신상, 인기, 할인)"
                className={styles.c_mbvevs}
              />
              <p className={styles.c_d8pr7p}>쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다.</p>
            </div>

            {/* 이미지 업로드 */}
            <div>
              <label className={styles.c_a41skz}>
                상품 이미지 (선택)
              </label>
              <div className={styles.c_yj6fgb}>
                <ImageIcon className={styles.c_ftrzdr} size={48} />
                <p className={styles.c_ibg2me}>클릭하여 이미지를 업로드하세요</p>
                <p className={styles.c_d8pr7p}>JPG, PNG (최대 5MB)</p>
              </div>
            </div>

            {/* 버튼 */}
            <div className={styles.c_sm9r4r}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={styles.c_8zbzmp}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.c_b151g0}
              >
                상품 등록
              </button>
            </div>
          </form>
        </div>
      )}

      <ProductList products={products} />
    </div>
  );
}
