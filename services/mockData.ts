import { Order, OrderStatus, InventoryItem, Product } from '../types';

const generateTrackingNumber = () => {
  return 'HFL' + Math.floor(10000000 + Math.random() * 90000000).toString();
};

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'inv1', name: 'Hoa Hồng Đỏ Đà Lạt', quantity: 150, unit: 'cành', updatedAt: '2023-10-27T10:00:00Z' },
  { id: 'inv2', name: 'Giấy Gói Kraft Hàn Quốc', quantity: 50, unit: 'tờ', updatedAt: '2023-10-26T14:30:00Z' },
  { id: 'inv3', name: 'Ruy Băng Lụa 2cm', quantity: 200, unit: 'mét', updatedAt: '2023-10-25T09:00:00Z' },
  { id: 'inv4', name: 'Xốp Cắm Hoa Oasis', quantity: 40, unit: 'viên', updatedAt: '2023-10-27T08:00:00Z' },
  { id: 'inv5', name: 'Hoa Baby Trắng', quantity: 30, unit: 'bó', updatedAt: '2023-10-27T11:00:00Z' },
  { id: 'inv6', name: 'Giỏ Mây Size M', quantity: 15, unit: 'cái', updatedAt: '2023-10-24T16:00:00Z' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod1',
    name: 'Bó Hoa Hồng Đỏ (Red Passion)',
    price: 500000,
    recipe: [
      { inventoryId: 'inv1', quantity: 12 }, // 12 bông hồng
      { inventoryId: 'inv2', quantity: 2 },  // 2 tờ giấy
      { inventoryId: 'inv3', quantity: 1 }   // 1m ruy băng
    ]
  },
  {
    id: 'prod2',
    name: 'Lẵng Hoa Hồng & Baby',
    price: 850000,
    recipe: [
      { inventoryId: 'inv1', quantity: 20 },
      { inventoryId: 'inv5', quantity: 3 }, // 3 bó baby
      { inventoryId: 'inv4', quantity: 1 }, // 1 cục xốp
      { inventoryId: 'inv6', quantity: 1 }  // 1 giỏ mây
    ]
  },
  {
    id: 'prod3',
    name: 'Bó Hoa Baby Trắng Tinh Khôi',
    price: 350000,
    recipe: [
      { inventoryId: 'inv5', quantity: 5 },
      { inventoryId: 'inv2', quantity: 3 },
      { inventoryId: 'inv3', quantity: 2 }
    ]
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderCode: 'DH001',
    trackingNumber: generateTrackingNumber(),
    customer: {
      id: 'c1',
      name: 'Nguyễn Văn An',
      phone: '0901234567',
      address: '123 Lê Lợi, Q.1, TP.HCM',
      email: 'an.nguyen@example.com'
    },
    items: [
      { id: 'p1', productName: 'Bó Hoa Hồng Đỏ (Red Passion)', quantity: 1, price: 500000, image: 'https://picsum.photos/100/100?random=1' },
      { id: 'p2', productName: 'Thiệp Chúc Mừng', quantity: 1, price: 20000, image: 'https://picsum.photos/100/100?random=2' }
    ],
    usedMaterials: [
       { inventoryId: 'inv1', name: 'Hoa Hồng Đỏ Đà Lạt', quantity: 12, unit: 'cành' },
       { inventoryId: 'inv2', name: 'Giấy Gói Kraft Hàn Quốc', quantity: 2, unit: 'tờ' },
       { inventoryId: 'inv3', name: 'Ruy Băng Lụa 2cm', quantity: 1, unit: 'mét' }
    ],
    status: OrderStatus.SHIPPING,
    createdAt: '2023-10-25T08:30:00Z',
    totalAmount: 490000, // (500k + 20k) - 30k ship
    shippingFee: 30000,
    shippingPayer: 'SHOP',
    paymentMethod: 'COD',
    notes: 'Giao giờ hành chính, gọi trước khi giao.',
    deliveryUnit: 'Giao Hàng Nhanh',
    deliveryCode: 'GHN827361'
  },
  {
    id: '2',
    orderCode: 'DH002',
    trackingNumber: generateTrackingNumber(),
    customer: {
      id: 'c2',
      name: 'Trần Thị Bích',
      phone: '0912345678',
      address: '456 Nguyễn Huệ, Q.1, TP.HCM',
      email: 'bich.tran@example.com'
    },
    items: [
      { id: 'p3', productName: 'Lẵng Hoa Hướng Dương (Sunshine Basket)', quantity: 1, price: 850000, image: 'https://picsum.photos/100/100?random=3' }
    ],
    usedMaterials: [],
    status: OrderStatus.PENDING,
    createdAt: '2023-10-26T09:15:00Z',
    totalAmount: 820000, // 850k - 30k ship
    shippingFee: 30000,
    shippingPayer: 'SHOP',
    paymentMethod: 'Bank Transfer',
    notes: 'Tặng sinh nhật, ghi thiệp: Chúc mừng sinh nhật em.',
    deliveryUnit: 'Giao Hàng Tiết Kiệm',
    deliveryCode: 'GHTK19283'
  },
  {
    id: '3',
    orderCode: 'DH003',
    trackingNumber: generateTrackingNumber(),
    customer: {
      id: 'c3',
      name: 'Lê Văn Cường',
      phone: '0987654321',
      address: '789 Võ Văn Kiệt, Q.5, TP.HCM',
      email: 'cuong.le@example.com'
    },
    items: [
      { id: 'p4', productName: 'Bó Hoa Baby Trắng', quantity: 2, price: 300000, image: 'https://picsum.photos/100/100?random=4' }
    ],
    usedMaterials: [],
    status: OrderStatus.DELIVERED,
    createdAt: '2023-10-24T14:20:00Z',
    totalAmount: 575000, // 600k - 25k ship
    shippingFee: 25000,
    shippingPayer: 'SHOP',
    paymentMethod: 'Momo',
    deliveryUnit: 'Ahamove',
    deliveryCode: 'AHA998811'
  },
  {
    id: '4',
    orderCode: 'DH004',
    trackingNumber: generateTrackingNumber(),
    customer: {
      id: 'c4',
      name: 'Phạm Minh',
      phone: '0933333333',
      address: '12 Thảo Điền, Q.2, TP.HCM',
      email: 'minh.pham@example.com'
    },
    items: [
        { id: 'p5', productName: 'Bó Hoa Hồng Đỏ (Red Passion)', quantity: 1, price: 500000, image: 'https://picsum.photos/100/100?random=5' }
    ],
    usedMaterials: [],
    status: OrderStatus.PROCESSING,
    createdAt: '2023-10-27T10:00:00Z',
    totalAmount: 500000,
    shippingFee: 0,
    shippingPayer: 'SHOP',
    paymentMethod: 'COD',
    notes: 'Giao nhanh',
    deliveryUnit: 'Viettel Post',
    deliveryCode: 'VTP123456'
  }
];

export const CHART_DATA = [
  { name: 'T2', revenue: 4000000 },
  { name: 'T3', revenue: 3000000 },
  { name: 'T4', revenue: 2000000 },
  { name: 'T5', revenue: 2780000 },
  { name: 'T6', revenue: 1890000 },
  { name: 'T7', revenue: 2390000 },
  { name: 'CN', revenue: 3490000 },
];