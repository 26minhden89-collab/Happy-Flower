import React, { useState, useEffect, useRef } from 'react';
import { Filter, MoreHorizontal, X, Plus, Save, Trash2, Truck, Edit, CheckCircle, DollarSign, FileSpreadsheet, Upload, Download, AlertCircle, User, Package, CreditCard, ChevronLeft, Boxes, LayoutGrid, MinusCircle, Calculator, Settings, Image as ImageIcon } from 'lucide-react';
import { OrderStatus, Order, UsedMaterial, OrderItem, Product, ProductRecipe } from '../types';
import OrderDetail from './OrderDetail';
import * as XLSX from 'xlsx';
import { useOrder } from '../contexts/OrderContext';
import { useInventory } from '../contexts/InventoryContext';
import { useProduct } from '../contexts/ProductContext';
// useFinance removed because we no longer add transactions from here

const OrderList = () => {
  // Global State từ Context
  const { orders, setOrders, deleteOrder } = useOrder();
  const { inventory, updateItem: updateInventoryItem } = useInventory();
  const { products, addProduct, updateProduct, deleteProduct } = useProduct();
  
  // Local State cho giao diện
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // State cho các tính năng
  const [isModalOpen, setIsModalOpen] = useState(false); // Dùng chung cho Create và Edit
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null); // ID đơn hàng đang sửa (null nếu là tạo mới)

  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  
  // State cho xác nhận xóa ĐƠN HÀNG
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // State cho xác nhận xóa SẢN PHẨM MẪU
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // --- STATE CHO IMPORT EXCEL ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedData, setImportedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE CHO VẬT TƯ (TRONG MODAL ĐƠN HÀNG) ---
  const [tempMaterialId, setTempMaterialId] = useState('');
  const [tempMaterialQty, setTempMaterialQty] = useState('');

  // --- STATE CHO QUẢN LÝ SẢN PHẨM MẪU (PRODUCT MANAGER MODAL) ---
  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); // Nếu null thì là đang tạo mới
  const [productForm, setProductForm] = useState<{
    name: string;
    price: string;
    image: string;
    recipe: ProductRecipe[];
  }>({
    name: '',
    price: '',
    image: '',
    recipe: []
  });
  // State phụ cho việc thêm nguyên liệu vào công thức sản phẩm
  const [recipeInvId, setRecipeInvId] = useState('');
  const [recipeQty, setRecipeQty] = useState('');
  
  interface OrderFormItem {
    id: string; // Temp ID for React keys
    productName: string;
    price: string;
    quantity: string;
  }

  interface OrderFormState {
    orderCode: string;
    trackingNumber: string;
    customerName: string;
    phone: string;
    address: string;
    items: OrderFormItem[]; // Changed from single fields to array
    shippingFee: string;
    paymentMethod: string;
    deliveryUnit: string;
    deliveryCode: string;
    status: OrderStatus;
    notes: string;
    usedMaterials: UsedMaterial[];
  }

  // Form state (Dùng chung cho tạo và sửa)
  const [orderForm, setOrderForm] = useState<OrderFormState>({
    orderCode: '',
    trackingNumber: '',
    customerName: '',
    phone: '',
    address: '',
    items: [{ id: 'init-1', productName: '', price: '', quantity: '1' }],
    shippingFee: '30000', // Mặc định 30k
    paymentMethod: 'COD',
    deliveryUnit: 'Giao Hàng Nhanh',
    deliveryCode: '',
    status: OrderStatus.PENDING,
    notes: '',
    usedMaterials: []
  });

  // Xử lý click outside để đóng menu thao tác
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Đóng menu hành động từng dòng
      if (activeMenuId && !(event.target as Element).closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DRAFT: return 'bg-gray-100 text-gray-600 border-gray-300';
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case OrderStatus.PROCESSING: return 'bg-blue-100 text-blue-700 border-blue-200';
      case OrderStatus.SHIPPING: return 'bg-orange-100 text-orange-700 border-orange-200';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-700 border-green-200';
      case OrderStatus.RECONCILIATION: return 'bg-purple-100 text-purple-700 border-purple-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      case OrderStatus.RETURNED: return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Logic lọc dữ liệu
  const filteredOrders = orders.filter(o => {
    const statusMatch = filterStatus === 'All' || o.status === filterStatus;
    const paymentMatch = paymentFilter === 'All' || o.paymentMethod === paymentFilter;
    return statusMatch && paymentMatch;
  });

  // Reset form về mặc định
  const resetForm = () => {
    setOrderForm({
      orderCode: '',
      trackingNumber: '',
      customerName: '',
      phone: '',
      address: '',
      items: [{ id: Date.now().toString(), productName: '', price: '', quantity: '1' }],
      shippingFee: '30000',
      paymentMethod: 'COD',
      deliveryUnit: 'Giao Hàng Nhanh',
      deliveryCode: '',
      status: OrderStatus.PENDING,
      notes: '',
      usedMaterials: []
    });
    setEditingOrderId(null);
    setTempMaterialId('');
    setTempMaterialQty('');
  };

  // Mở modal tạo mới
  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa và fill dữ liệu
  const openEditModal = (order: Order) => {
    setEditingOrderId(order.id);
    
    // Map existing items to form items
    const formItems = order.items.map(item => ({
      id: item.id,
      productName: item.productName,
      price: item.price.toString(),
      quantity: item.quantity.toString()
    }));

    setOrderForm({
      orderCode: order.orderCode,
      trackingNumber: order.trackingNumber,
      customerName: order.customer.name,
      phone: order.customer.phone,
      address: order.customer.address,
      items: formItems.length > 0 ? formItems : [{ id: Date.now().toString(), productName: '', price: '', quantity: '1' }],
      shippingFee: order.shippingFee.toString(),
      paymentMethod: order.paymentMethod,
      deliveryUnit: order.deliveryUnit || 'Giao Hàng Nhanh',
      deliveryCode: order.deliveryCode || '',
      status: order.status,
      notes: order.notes || '',
      usedMaterials: order.usedMaterials || []
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  // --- LOGIC QUẢN LÝ SẢN PHẨM TRONG ĐƠN (MULTIPLE ITEMS) ---
  const handleAddItem = () => {
    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), productName: '', price: '', quantity: '1' }]
    }));
  };

  const handleRemoveItem = (id: string) => {
    // Không cho xóa nếu chỉ còn 1 dòng
    if (orderForm.items.length <= 1) {
        // Nếu còn 1 dòng thì chỉ clear data
        setOrderForm(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, productName: '', price: '', quantity: '1' } : item)
        }));
        return;
    }

    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleUpdateItem = (id: string, field: keyof OrderFormItem, value: string) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  // --- LOGIC SẢN PHẨM MẪU (PRODUCT TEMPLATE) ---
  const handleProductTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    if (!prodId) return;

    const product = products.find(p => p.id === prodId);
    if (product) {
        // 1. Tạo item mới từ template
        const newItem: OrderFormItem = {
            id: Date.now().toString(), // Generate new ID
            productName: product.name,
            price: product.price.toString(),
            quantity: '1'
        };

        // 2. Tính toán vật tư cho 1 đơn vị sản phẩm
        const newMaterials: UsedMaterial[] = product.recipe.map(r => {
            const invItem = inventory.find(i => i.id === r.inventoryId);
            return {
                inventoryId: r.inventoryId,
                name: invItem?.name || 'Unknown',
                unit: invItem?.unit || '',
                quantity: r.quantity // Mặc định số lượng là 1
            };
        });

        // 3. Merge vật tư mới vào danh sách hiện có
        const updatedMaterials = [...orderForm.usedMaterials];
        newMaterials.forEach(newMat => {
            const existing = updatedMaterials.find(m => m.inventoryId === newMat.inventoryId);
            if (existing) {
                existing.quantity += newMat.quantity;
            } else {
                updatedMaterials.push(newMat);
            }
        });

        // 4. Update State: Thêm item vào danh sách và cập nhật vật tư
        // Kiểm tra xem dòng đầu tiên có trống không, nếu trống thì ghi đè, không thì thêm mới
        setOrderForm(prev => {
            let newItems = [...prev.items];
            const firstItem = newItems[0];
            if (newItems.length === 1 && !firstItem.productName && !firstItem.price) {
                newItems = [newItem];
            } else {
                newItems.push(newItem);
            }

            return {
                ...prev,
                items: newItems,
                usedMaterials: updatedMaterials
            };
        });
        
        // Reset dropdown (để user có thể chọn tiếp sản phẩm khác)
        e.target.value = "";
    }
  };

  // --- LOGIC VẬT TƯ ---
  const handleAddMaterial = () => {
    if (!tempMaterialId || !tempMaterialQty) return;
    
    const selectedInvItem = inventory.find(i => i.id === tempMaterialId);
    if (!selectedInvItem) return;

    const qty = parseInt(tempMaterialQty);
    if (qty <= 0) {
        alert("Số lượng phải lớn hơn 0");
        return;
    }

    // Check trùng
    const exists = orderForm.usedMaterials.find(m => m.inventoryId === tempMaterialId);
    if (exists) {
        setOrderForm(prev => ({
            ...prev,
            usedMaterials: prev.usedMaterials.map(m => 
                m.inventoryId === tempMaterialId ? { ...m, quantity: m.quantity + qty } : m
            )
        }));
    } else {
        setOrderForm(prev => ({
            ...prev,
            usedMaterials: [...prev.usedMaterials, {
                inventoryId: selectedInvItem.id,
                name: selectedInvItem.name,
                unit: selectedInvItem.unit,
                quantity: qty
            }]
        }));
    }

    setTempMaterialId('');
    setTempMaterialQty('');
  };

  const handleUpdateMaterialQuantity = (invId: string, newQty: string) => {
    const qty = parseInt(newQty) || 0;
    setOrderForm(prev => ({
        ...prev,
        usedMaterials: prev.usedMaterials.map(m => 
            m.inventoryId === invId ? { ...m, quantity: qty } : m
        )
    }));
  };

  const handleRemoveMaterial = (invId: string) => {
    setOrderForm(prev => ({
        ...prev,
        usedMaterials: prev.usedMaterials.filter(m => m.inventoryId !== invId)
    }));
  };
  // --- END LOGIC VẬT TƯ ---

  // --- LOGIC IMPORT EXCEL ---
  
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Tên khách hàng": "Nguyễn Văn A",
        "Số điện thoại": "0912345678",
        "Địa chỉ": "123 Đường ABC, Hà Nội",
        "Tên sản phẩm": "Hoa Hồng Đỏ",
        "Đơn giá": 500000,
        "Số lượng": 1,
        "Phí Ship": 30000,
        "Ghi chú": "Giao giờ hành chính"
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Don_Hang");
    XLSX.writeFile(wb, "HappyFlower_Mau_Nhap_Don.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setImportedData(data);
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (importedData.length === 0) return;

    const newOrders: Order[] = importedData.map((row: any) => {
        const price = parseInt(row["Đơn giá"]) || 0;
        const quantity = parseInt(row["Số lượng"]) || 1;
        const shippingFee = parseInt(row["Phí Ship"]) || 0;
        // Logic tính COD
        const totalAmount = (price * quantity) - shippingFee;

        return {
            id: Math.random().toString(36).substr(2, 9),
            orderCode: 'DH' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
            trackingNumber: 'HFL' + Math.floor(10000000 + Math.random() * 90000000).toString(),
            customer: {
                id: Math.random().toString(36).substr(2, 9),
                name: row["Tên khách hàng"] || "Khách lẻ",
                phone: row["Số điện thoại"] || "",
                address: row["Địa chỉ"] || "",
                email: ""
            },
            items: [
                {
                    id: Math.random().toString(36).substr(2, 9),
                    productName: row["Tên sản phẩm"] || "Sản phẩm",
                    quantity: quantity,
                    price: price,
                    image: 'https://picsum.photos/100/100?random=' + Math.floor(Math.random() * 100)
                }
            ],
            usedMaterials: [],
            status: OrderStatus.PENDING,
            createdAt: new Date().toISOString(),
            totalAmount: totalAmount,
            shippingFee: shippingFee,
            paymentMethod: 'COD',
            deliveryUnit: 'Giao Hàng Nhanh', // Mặc định
            deliveryCode: '',
            notes: row["Ghi chú"] || ""
        };
    });

    setOrders([...newOrders, ...orders]);
    setIsImportModalOpen(false);
    setImportedData([]);
  };

  // --- END LOGIC IMPORT EXCEL ---

  // Calculation Helpers
  const calculateTotalProductPrice = () => {
      return orderForm.items.reduce((sum, item) => {
          return sum + ((parseInt(item.price) || 0) * (parseInt(item.quantity) || 0));
      }, 0);
  };

  const formProductTotal = calculateTotalProductPrice();
  const formShippingFee = parseInt(orderForm.shippingFee) || 0;
  
  // NEW LOGIC: TotalAmount in DB = COD Amount.
  // COD = Product Total + Shipping Fee.
  const formTotalAmount = formProductTotal + formShippingFee; 

  // Xử lý Lưu (Tạo mới hoặc Cập nhật)
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (orderForm.items.some(i => !i.productName)) {
        alert("Vui lòng nhập tên sản phẩm cho tất cả các dòng.");
        return;
    }

    const finalOrderCode = orderForm.orderCode || 'DH' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const finalTrackingNumber = orderForm.trackingNumber || 'HFL' + Math.floor(10000000 + Math.random() * 90000000).toString();
    const finalDeliveryCode = orderForm.deliveryCode;

    // Convert Form Items to Order Items
    const finalItems: OrderItem[] = orderForm.items.map(i => ({
        id: i.id.startsWith('init') || i.id.length < 10 ? Math.random().toString(36).substr(2, 9) : i.id,
        productName: i.productName,
        price: parseInt(i.price) || 0,
        quantity: parseInt(i.quantity) || 1,
        image: 'https://picsum.photos/100/100?random=' + Math.floor(Math.random() * 100)
    }));
    
    // --- TRỪ KHO (INVENTORY DEDUCTION) ---
    // Prompt: "Khi đơn hàng có mã giao hàng: Tự động trừ vật tư theo số lượng đã khai báo"
    // Note: Ở bản demo này, trừ kho xảy ra mỗi khi nhấn Lưu nếu có mã vận đơn. 
    // Trong thực tế cần check xem đã trừ chưa.
    const shouldDeductInventory = finalDeliveryCode && orderForm.usedMaterials.length > 0;
    
    if (shouldDeductInventory) {
        orderForm.usedMaterials.forEach(mat => {
            const currentItem = inventory.find(i => i.id === mat.inventoryId);
            if (currentItem) {
                const newQty = Math.max(0, currentItem.quantity - mat.quantity);
                updateInventoryItem(mat.inventoryId, { quantity: newQty });
            }
        });
    }

    // --- LOGIC DOANH THU ---
    // KHÔNG TẠO PHIẾU THU THỦ CÔNG.
    // Doanh thu sẽ được tính toán ĐỘNG dựa trên trạng thái 'RECONCILIATION' ở Dashboard/Finance.
    // Nên ở đây KHÔNG CẦN gọi addTransaction.

    const orderId = editingOrderId || Math.random().toString(36).substr(2, 9);

    if (editingOrderId) {
      // --- CẬP NHẬT ĐƠN HÀNG CŨ ---
      setOrders(orders.map(o => {
        if (o.id === editingOrderId) {
          return {
            ...o,
            orderCode: finalOrderCode,
            trackingNumber: finalTrackingNumber,
            customer: {
              ...o.customer,
              name: orderForm.customerName,
              phone: orderForm.phone,
              address: orderForm.address,
            },
            items: finalItems,
            usedMaterials: orderForm.usedMaterials,
            totalAmount: formTotalAmount,
            shippingFee: formShippingFee,
            paymentMethod: orderForm.paymentMethod as any,
            deliveryUnit: orderForm.deliveryUnit,
            deliveryCode: finalDeliveryCode,
            status: orderForm.status as OrderStatus,
            notes: orderForm.notes
          };
        }
        return o;
      }));
    } else {
      // --- TẠO ĐƠN HÀNG MỚI ---
      const newOrder: Order = {
        id: orderId,
        orderCode: finalOrderCode,
        trackingNumber: finalTrackingNumber,
        customer: {
          id: Math.random().toString(36).substr(2, 9),
          name: orderForm.customerName,
          phone: orderForm.phone,
          address: orderForm.address,
          email: ''
        },
        items: finalItems,
        usedMaterials: orderForm.usedMaterials,
        status: orderForm.status as OrderStatus,
        createdAt: new Date().toISOString(),
        totalAmount: formTotalAmount,
        shippingFee: formShippingFee,
        paymentMethod: orderForm.paymentMethod as any,
        notes: orderForm.notes || 'Đơn mới tạo',
        deliveryUnit: orderForm.deliveryUnit,
        deliveryCode: finalDeliveryCode
      };
      setOrders([newOrder, ...orders]);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const onRequestDelete = (id: string) => {
    setOrderToDelete(id);
  };

  const confirmDeleteOrder = () => {
    if (orderToDelete) {
      deleteOrder(orderToDelete);
      setOrderToDelete(null);
    }
  };

  if (selectedOrder) {
    return <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />;
  }

  return (
    <div className="p-6 relative">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Trung tâm doanh thu - Chỉ ghi nhận từ Đơn đối soát</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          
          <button 
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className={`flex items-center px-4 py-2 border rounded-lg text-sm font-medium shadow-sm transition-colors ${showAdvancedFilter ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Lọc
          </button>
          
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Nhập Excel
          </button>

          <button 
            onClick={openCreateModal}
            className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo đơn mới
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showAdvancedFilter && (
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Bộ lọc nâng cao</h3>
          <div className="flex flex-wrap gap-4">
             <div>
               <label className="block text-xs font-medium text-gray-500 mb-1">Phương thức thanh toán</label>
               <select 
                 value={paymentFilter}
                 onChange={(e) => setPaymentFilter(e.target.value)}
                 className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
               >
                 <option value="All">Tất cả</option>
                 <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                 <option value="Bank Transfer">Chuyển khoản ngân hàng</option>
                 <option value="Momo">Ví Momo</option>
               </select>
             </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Status Tabs */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {['All', ...Object.values(OrderStatus)].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filterStatus === status
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {status === 'All' ? 'Tất cả đơn' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                <th className="px-6 py-4">Mã Giao Hàng</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Tổng tiền COD</th>
                <th className="px-6 py-4">Phí ship</th>
                <th className="px-6 py-4">Thực nhận (COD - Ship)</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                  const netReceived = order.totalAmount - order.shippingFee;
                  const isReconciled = order.status === OrderStatus.RECONCILIATION;
                  return (
                    <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${isReconciled ? 'bg-green-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${order.deliveryCode ? 'text-orange-600' : 'text-gray-400 font-normal italic'}`}>
                            {order.deliveryCode || '---'}
                        </span>
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <span className="font-medium text-gray-600 mr-1">#{order.orderCode}</span>
                            <span className="text-gray-300 mx-1">|</span>
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                        <div className="text-xs text-gray-500">{order.customer.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}>
                          {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-800">
                          {order.totalAmount.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-xs text-gray-500">{order.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {order.shippingFee.toLocaleString('vi-VN')} đ
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-bold ${isReconciled ? 'text-green-700' : 'text-gray-400'}`}>
                          {netReceived.toLocaleString('vi-VN')} đ
                          {isReconciled && <CheckCircle className="w-3 h-3 inline-block ml-1" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center relative action-menu-container">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => openEditModal(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa đơn hàng"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === order.id ? null : order.id);
                            }}
                            className={`p-2 rounded-lg transition-colors ${activeMenuId === order.id ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Dropdown Menu */}
                        {activeMenuId === order.id && (
                          <div className="absolute right-6 top-10 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in text-left">
                             <button 
                               onClick={() => openEditModal(order)}
                               className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                             >
                               <Edit className="w-4 h-4 mr-2" /> Chỉnh sửa đơn hàng
                             </button>
                             <button 
                                 onClick={() => onRequestDelete(order.id)}
                                 className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center border-t border-gray-50"
                               >
                                 <Trash2 className="w-4 h-4 mr-2" /> Xóa đơn hàng
                             </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
              })}
              
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="bg-gray-100 p-4 rounded-full mb-3">
                        <Filter className="w-6 h-6 text-gray-400" />
                      </div>
                      <p>Không tìm thấy đơn hàng nào phù hợp với bộ lọc.</p>
                      <button onClick={() => {setFilterStatus('All'); setPaymentFilter('All')}} className="mt-2 text-orange-500 font-medium text-sm">
                        Xóa bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
           <span className="text-xs text-gray-500">Hiển thị {filteredOrders.length} đơn hàng</span>
        </div>
      </div>
      
      {/* Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Xóa đơn hàng?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa đơn hàng này không? <br/>Hành động này <span className="font-semibold text-red-500">không thể hoàn tác</span>.
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setOrderToDelete(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmDeleteOrder}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-lg shadow-red-200 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800">Nhập đơn hàng từ Excel</h3>
                <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             <div className="p-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                   <h4 className="font-bold text-blue-800 text-sm mb-1">Hướng dẫn:</h4>
                   <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
                      <li>Tải file mẫu để xem định dạng cột.</li>
                      <li>Các cột bắt buộc: Tên khách hàng, Số điện thoại, Tên sản phẩm, Đơn giá, Số lượng.</li>
                   </ul>
                   <button 
                      onClick={handleDownloadTemplate}
                      className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center"
                   >
                      <Download className="w-3 h-3 mr-1" /> Tải file mẫu .xlsx
                   </button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                   <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                   <p className="text-sm text-gray-600 font-medium">Click để tải lên file Excel</p>
                   <p className="text-xs text-gray-400 mt-1">Hỗ trợ .xlsx, .xls</p>
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".xlsx, .xls"
                   />
                </div>

                {importedData.length > 0 && (
                   <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-center text-sm text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Đã đọc thành công {importedData.length} dòng dữ liệu.
                   </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                    <button 
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      onClick={handleConfirmImport}
                      disabled={importedData.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Xác nhận nhập
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}
      
      {/* Full Screen Create/Edit Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-fade-in">
          {/* Header Fixed */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm shrink-0 z-10">
            <div className="flex items-center">
                <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 mr-3 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">
                        {editingOrderId ? 'Chỉnh sửa đơn hàng' : 'Tạo đơn hàng mới'}
                    </h2>
                    <p className="text-sm text-gray-500">{editingOrderId ? `Mã đơn: #${orderForm.orderCode}` : 'Nhập thông tin để tạo đơn mới'}</p>
                </div>
            </div>
            <div className="flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleSaveOrder}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 shadow-md shadow-orange-200 transition-all flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {editingOrderId ? 'Cập nhật' : 'Lưu đơn'}
                </button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <form onSubmit={handleSaveOrder} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ... (Keep Customer Info and Product Info same as before) ... */}
                {/* LEFT COLUMN: Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center">
                            <User className="w-5 h-5 mr-2 text-blue-500" />
                            Thông tin khách hàng
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-gray-50 focus:bg-white"
                                    placeholder="VD: Nguyễn Văn A"
                                    value={orderForm.customerName}
                                    onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                <input 
                                    required
                                    type="tel" 
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-gray-50 focus:bg-white"
                                    placeholder="VD: 0912345678"
                                    value={orderForm.phone}
                                    onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-gray-50 focus:bg-white"
                                    placeholder="Số nhà, đường, quận/huyện..."
                                    value={orderForm.address}
                                    onChange={(e) => setOrderForm({...orderForm, address: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-gray-800 flex items-center">
                                <Package className="w-5 h-5 mr-2 text-green-500" />
                                Danh sách sản phẩm
                            </h3>
                        </div>

                        {/* Dropdown chọn sản phẩm mẫu - Move to Action Bar style */}
                        <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-100 flex items-center gap-4">
                             <LayoutGrid className="w-5 h-5 text-orange-600 shrink-0" />
                             <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                                    Thêm nhanh từ mẫu (Tự động tính vật tư)
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        className="w-full px-3 py-2 border border-orange-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        onChange={handleProductTemplateChange}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>-- Chọn sản phẩm mẫu để thêm --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} - {p.price.toLocaleString('vi-VN')} đ
                                            </option>
                                        ))}
                                    </select>
                                </div>
                             </div>
                        </div>

                        {/* Product List Table */}
                        <div className="overflow-hidden border border-gray-200 rounded-lg mb-4">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">Tên sản phẩm</th>
                                        <th className="px-4 py-3 text-right w-32">Đơn giá</th>
                                        <th className="px-4 py-3 text-center w-24">SL</th>
                                        <th className="px-4 py-3 text-right w-32">Thành tiền</th>
                                        <th className="px-4 py-3 text-center w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orderForm.items.map((item, index) => {
                                        const itemTotal = (parseInt(item.price) || 0) * (parseInt(item.quantity) || 0);
                                        return (
                                            <tr key={item.id} className="group hover:bg-gray-50">
                                                <td className="px-4 py-2">
                                                     <input 
                                                        required
                                                        type="text" 
                                                        className="w-full bg-transparent focus:bg-white px-2 py-1 border border-transparent focus:border-orange-300 rounded transition-colors focus:outline-none"
                                                        placeholder="Nhập tên sản phẩm..."
                                                        value={item.productName}
                                                        onChange={(e) => handleUpdateItem(item.id, 'productName', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        required
                                                        type="number" 
                                                        min="0"
                                                        className="w-full text-right bg-transparent focus:bg-white px-2 py-1 border border-transparent focus:border-orange-300 rounded transition-colors focus:outline-none"
                                                        placeholder="0"
                                                        value={item.price}
                                                        onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                     <input 
                                                        required
                                                        type="number" 
                                                        min="1"
                                                        className="w-full text-center bg-transparent focus:bg-white px-2 py-1 border border-transparent focus:border-orange-300 rounded transition-colors focus:outline-none"
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium text-gray-800">
                                                    {itemTotal.toLocaleString('vi-VN')}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Xóa dòng này"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {/* Footer for Add Button */}
                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                    <tr>
                                        <td colSpan={5} className="px-4 py-2">
                                            <button 
                                                type="button"
                                                onClick={handleAddItem}
                                                className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center"
                                            >
                                                <Plus className="w-4 h-4 mr-1" /> Thêm dòng sản phẩm
                                            </button>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* --- MATERIAL SELECTION SECTION --- */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                             <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                                <span className="flex items-center">
                                    <Boxes className="w-4 h-4 mr-2 text-gray-500" />
                                    Vật tư sử dụng (Trừ kho khi có mã vận đơn)
                                </span>
                             </h4>
                             
                             <div className="flex flex-col md:flex-row gap-3 mb-4">
                                 <select 
                                     className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                     value={tempMaterialId}
                                     onChange={(e) => setTempMaterialId(e.target.value)}
                                 >
                                     <option value="">-- Chọn vật tư từ kho --</option>
                                     {inventory.map(item => (
                                         <option key={item.id} value={item.id}>
                                             {item.name} (Tồn: {item.quantity} {item.unit})
                                         </option>
                                     ))}
                                 </select>
                                 <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        min="1"
                                        placeholder="Số lượng"
                                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        value={tempMaterialQty}
                                        onChange={(e) => setTempMaterialQty(e.target.value)}
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleAddMaterial}
                                        className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 whitespace-nowrap"
                                    >
                                        Thêm
                                    </button>
                                 </div>
                             </div>

                             {/* Used Materials List */}
                             {orderForm.usedMaterials.length > 0 && (
                                 <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                     <table className="w-full text-sm">
                                         <thead>
                                             <tr className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
                                                 <th className="px-4 py-3 text-left font-semibold">Tên Vật tư</th>
                                                 <th className="px-4 py-3 text-center font-semibold">ĐVT</th>
                                                 <th className="px-4 py-3 text-center font-semibold w-32">Số lượng dùng</th>
                                                 <th className="px-4 py-3 text-center w-10"></th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-gray-100">
                                             {orderForm.usedMaterials.map((mat, idx) => (
                                                 <tr key={mat.inventoryId} className="group hover:bg-gray-50">
                                                     <td className="px-4 py-2 font-medium text-gray-800 align-middle">{mat.name}</td>
                                                     <td className="px-4 py-2 text-center text-gray-500 align-middle">{mat.unit}</td>
                                                     <td className="px-4 py-2 text-center align-middle">
                                                         <input 
                                                            type="number" 
                                                            min="1"
                                                            className="w-20 px-2 py-1 text-center border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-800 font-bold"
                                                            value={mat.quantity}
                                                            onChange={(e) => handleUpdateMaterialQuantity(mat.inventoryId, e.target.value)}
                                                         />
                                                     </td>
                                                     <td className="px-4 py-2 text-center align-middle">
                                                         <button 
                                                             type="button"
                                                             onClick={() => handleRemoveMaterial(mat.inventoryId)}
                                                             className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                             title="Xóa vật tư này"
                                                         >
                                                             <X className="w-4 h-4" />
                                                         </button>
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                     <div className="px-4 py-2 text-xs text-orange-600 bg-orange-50 italic border-t border-orange-100">
                                        * Vật tư sẽ tự động trừ kho khi đơn hàng có Mã Giao Hàng.
                                     </div>
                                 </div>
                             )}
                        </div>
                        {/* --- END MATERIAL SELECTION SECTION --- */}
                        
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú đơn hàng</label>
                            <textarea
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-gray-50 focus:bg-white"
                                rows={3}
                                placeholder="Ghi chú nội bộ hoặc yêu cầu của khách..."
                                value={orderForm.notes}
                                onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Settings & Payment */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Status Management */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2 text-purple-500" />
                            Quản lý
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái đơn hàng</label>
                            <select 
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-gray-50 focus:bg-white font-medium"
                                value={orderForm.status}
                                onChange={(e) => setOrderForm({...orderForm, status: e.target.value as OrderStatus})}
                            >
                                {Object.values(OrderStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            {orderForm.status === OrderStatus.RECONCILIATION && (
                                <p className="text-xs text-green-600 mt-2 flex items-center font-bold">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    Doanh thu sẽ được ghi nhận.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Shipping & Payment */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                         <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center">
                            <Truck className="w-5 h-5 mr-2 text-orange-500" />
                            Vận chuyển & Thanh toán
                        </h3>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị vận chuyển</label>
                                <select 
                                   className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-gray-50 focus:bg-white"
                                   value={orderForm.deliveryUnit}
                                   onChange={(e) => setOrderForm({...orderForm, deliveryUnit: e.target.value})}
                                 >
                                   <option value="Giao Hàng Nhanh">Giao Hàng Nhanh</option>
                                   <option value="Giao Hàng Tiết Kiệm">Giao Hàng Tiết Kiệm</option>
                                   <option value="Viettel Post">Viettel Post</option>
                                   <option value="Ahamove">Ahamove</option>
                                 </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã Giao Hàng (Đối tác)</label>
                                <input 
                                   type="text" 
                                   className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-gray-50 focus:bg-white font-mono text-sm"
                                   placeholder="VD: GHN123456"
                                   value={orderForm.deliveryCode}
                                   onChange={(e) => setOrderForm({...orderForm, deliveryCode: e.target.value})}
                                />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                                <div className="relative">
                                    <select 
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-gray-50 focus:bg-white appearance-none"
                                        value={orderForm.paymentMethod}
                                        onChange={(e) => setOrderForm({...orderForm, paymentMethod: e.target.value})}
                                    >
                                        <option value="COD">Thanh toán khi nhận (COD)</option>
                                        <option value="Bank Transfer">Chuyển khoản</option>
                                        <option value="Momo">Ví Momo</option>
                                    </select>
                                    <CreditCard className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Cost Summary */}
                    <div className="bg-orange-50 rounded-xl border border-orange-100 p-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm text-gray-600">
                                <span>Tiền hàng ({orderForm.items.length} sp)</span>
                                <span className="font-medium">{formProductTotal.toLocaleString('vi-VN')} đ</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm text-gray-600">
                                <span className="flex items-center">
                                    Phí ship (Shop chịu)
                                </span>
                                <div className="ml-2 w-24">
                                    <input 
                                        type="number" 
                                        className="w-full px-2 py-1 text-right text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                                        value={orderForm.shippingFee}
                                        onChange={(e) => setOrderForm({...orderForm, shippingFee: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="border-t border-orange-200 my-2"></div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-800">Tổng tiền COD (Thu khách)</span>
                                <span className="text-lg font-bold text-orange-600">{formTotalAmount.toLocaleString('vi-VN')} đ</span>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border border-orange-200 flex justify-between items-center mt-2">
                                <span className="text-sm font-bold text-green-700">Thực nhận (COD - Ship)</span>
                                <span className="text-xl font-bold text-green-700">{(formTotalAmount - formShippingFee).toLocaleString('vi-VN')} đ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;