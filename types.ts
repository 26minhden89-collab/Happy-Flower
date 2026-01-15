export enum OrderStatus {
  DRAFT = 'Chưa lên đơn',
  PENDING = 'Chờ lấy hàng',
  PROCESSING = 'Đang xử lý',
  SHIPPING = 'Đang giao',
  DELIVERED = 'Đã giao',
  RECONCILIATION = 'Đối soát',
  CANCELLED = 'Đã hủy',
  RETURNED = 'Trả hàng'
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email: string;
}

export interface InventoryItem {
  id: string;
  name: string;       // Tên vật tư
  quantity: number;   // Số lượng tồn kho
  unit: string;       // Đơn vị tính (cái, mét, bó, kg...)
  importPrice?: number; // Giá nhập (tùy chọn)
  updatedAt: string;
}

export interface UsedMaterial {
  inventoryId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface ProductRecipe {
  inventoryId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  recipe: ProductRecipe[]; // Danh sách vật tư cấu thành sản phẩm
}

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  orderCode: string; // Internal Shop Order Code (e.g., DH001)
  trackingNumber: string; // GHN style tracking code
  customer: Customer;
  items: OrderItem[];
  usedMaterials?: UsedMaterial[]; // Vật tư sử dụng cho đơn hàng này
  status: OrderStatus;
  createdAt: string;
  totalAmount: number; // Đây là tổng tiền COD (Tiền hàng + tiền khách trả ship nếu có)
  shippingFee: number; // Phí ship shop phải trả cho bên vận chuyển
  paymentMethod: 'COD' | 'Bank Transfer' | 'Momo';
  notes?: string;
  deliveryUnit?: string;
  deliveryCode?: string;
}

// --- FINANCE TYPES (EXPENSE ONLY) ---

export type TransactionType = 'EXPENSE'; // Income is calculated from Orders
export type TransactionCategory = 'MATERIAL_PURCHASE' | 'OTHER';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  relatedMaterials?: UsedMaterial[]; // Liên kết vật tư (nếu là chi mua vật tư)
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  avatar?: string;
}