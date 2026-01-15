import React, { useState, useEffect, useRef } from 'react';
import { Filter, MoreHorizontal, X, Plus, Save, Trash2, Truck, Edit, CheckCircle, DollarSign, FileSpreadsheet, Upload, Download, AlertCircle, User, Package, CreditCard, ChevronLeft, Boxes, LayoutGrid, MinusCircle, Calculator, Settings, Image as ImageIcon, Lock } from 'lucide-react';
import { OrderStatus, Order, UsedMaterial, OrderItem, Product, ProductRecipe } from '../types';
import OrderDetail from './OrderDetail';
import * as XLSX from 'xlsx';
import { useOrder } from '../contexts/OrderContext';
import { useInventory } from '../contexts/InventoryContext';
import { useProduct } from '../contexts/ProductContext';

const OrderList = () => {
  // Global State từ Context
  const { orders, setOrders, deleteOrder } = useOrder();
  const { inventory, updateItem: updateInventoryItem } = useInventory();
  const { products } = useProduct();
  
  // Local State cho giao diện
  // CHANGE: Use ID instead of object to ensure live updates
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // State cho các tính năng
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState({
      startDate: '',
      endDate: new Date().toISOString().split('T')[0],
      status: 'All'
  });

  const [importedData, setImportedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tempMaterialId, setTempMaterialId] = useState('');
  const [tempMaterialQty, setTempMaterialQty] = useState('');

  interface OrderFormItem {
    id: string;
    productId?: string; // Link to Product
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
    items: OrderFormItem[];
    shippingFee: string;
    shippingPayer: 'SHOP' | 'CUSTOMER';
    paymentMethod: string;
    deliveryUnit: string;
    deliveryCode: string;
    status: OrderStatus;
    notes: string;
    usedMaterials: UsedMaterial[];
  }

  const [orderForm, setOrderForm] = useState<OrderFormState>({
    orderCode: '',
    trackingNumber: '',
    customerName: '',
    phone: '',
    address: '',
    items: [{ id: 'init-1', productName: '', price: '', quantity: '1' }],
    shippingFee: '30000',
    shippingPayer: 'SHOP',
    paymentMethod: 'COD',
    deliveryUnit: 'Giao Hàng Nhanh',
    deliveryCode: '',
    status: OrderStatus.PENDING,
    notes: '',
    usedMaterials: []
  });

  // AUTO CALCULATE MATERIALS EFFECT
  useEffect(() => {
    // Only run this logic if we have items with linked products
    const linkedItems = orderForm.items.filter(item => item.productId);
    
    if (linkedItems.length > 0) {
        const calculatedMaterials: UsedMaterial[] = [];
        
        linkedItems.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            const qty = parseInt(item.quantity) || 0;
            
            if (product && product.recipe && qty > 0) {
                product.recipe.forEach(ing => {
                    const invItem = inventory.find(i => i.id === ing.inventoryId);
                    if (invItem) {
                        const neededQty = ing.quantity * qty;
                        const existingMatIndex = calculatedMaterials.findIndex(m => m.inventoryId === ing.inventoryId);
                        
                        if (existingMatIndex >= 0) {
                            calculatedMaterials[existingMatIndex].quantity += neededQty;
                        } else {
                            calculatedMaterials.push({
                                inventoryId: invItem.id,
                                name: invItem.name,
                                quantity: neededQty,
                                unit: invItem.unit
                            });
                        }
                    }
                });
            }
        });
        
        // Update usedMaterials state automatically
        setOrderForm(prev => ({
            ...prev,
            usedMaterials: calculatedMaterials
        }));
    }
  }, [orderForm.items, products, inventory]);

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

  const filteredOrders = orders.filter(o => {
    const statusMatch = filterStatus === 'All' || o.status === filterStatus;
    const paymentMatch = paymentFilter === 'All' || o.paymentMethod === paymentFilter;
    return statusMatch && paymentMatch;
  });

  const resetForm = () => {
    setOrderForm({
      orderCode: '',
      trackingNumber: '',
      customerName: '',
      phone: '',
      address: '',
      items: [{ id: Date.now().toString(), productName: '', price: '', quantity: '1' }],
      shippingFee: '30000',
      shippingPayer: 'SHOP',
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

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (order: Order) => {
    setEditingOrderId(order.id);
    const formItems = order.items.map(item => ({
      id: item.id,
      productId: item.productId,
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
      shippingPayer: order.shippingPayer || 'SHOP',
      paymentMethod: order.paymentMethod,
      deliveryUnit: order.deliveryUnit || 'Giao Hàng Nhanh',
      deliveryCode: order.deliveryCode || '',
      status: order.status,
      notes: order.notes || '',
      usedMaterials: order.usedMaterials || []
    });
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), productName: '', price: '', quantity: '1' }]
    }));
  };

  const handleRemoveItem = (id: string) => {
    if (orderForm.items.length <= 1) {
        setOrderForm(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, productId: undefined, productName: '', price: '', quantity: '1' } : item)
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

  const handleProductSelection = (itemId: string, productId: string) => {
      const product = products.find(p => p.id === productId);
      if (product) {
          setOrderForm(prev => ({
              ...prev,
              items: prev.items.map(item => item.id === itemId ? {
                  ...item,
                  productId: product.id,
                  productName: product.name,
                  price: product.price.toString(),
                  quantity: '1'
              } : item)
          }));
      }
  };

  // Legacy manual add material - Disabled if products are selected
  const handleAddMaterial = () => {
    // Should verify if this action is allowed
    const hasLinkedProducts = orderForm.items.some(i => i.productId);
    if (hasLinkedProducts) {
        alert("Không thể thêm vật tư thủ công khi đã chọn Sản phẩm mẫu. Hệ thống đang tự động tính toán.");
        return;
    }

    if (!tempMaterialId || !tempMaterialQty) return;
    const selectedInvItem = inventory.find(i => i.id === tempMaterialId);
    if (!selectedInvItem) return;

    const qty = parseInt(tempMaterialQty);
    if (qty <= 0) return;

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

  const calculateTotalProductPrice = () => {
      return orderForm.items.reduce((sum, item) => {
          return sum + ((parseInt(item.price) || 0) * (parseInt(item.quantity) || 0));
      }, 0);
  };

  // --- CALCULATION LOGIC ---
  const formProductTotal = calculateTotalProductPrice();
  const formShippingFee = parseInt(orderForm.shippingFee) || 0;
  
  // Logic tính COD và Thực nhận dựa trên ai trả ship
  let formTotalCOD = 0;
  let formNetReceived = 0;

  if (orderForm.shippingPayer === 'SHOP') {
      // Shop trả ship -> Thu khách đúng bằng tiền hàng
      formTotalCOD = formProductTotal; 
      // Thực nhận = Tiền hàng - Ship
      formNetReceived = formProductTotal - formShippingFee;
  } else {
      // Khách trả ship -> Thu khách = Tiền hàng + Ship
      formTotalCOD = formProductTotal + formShippingFee;
      // Thực nhận = Tiền hàng (Ship thu hộ trả cho bên vận chuyển)
      formNetReceived = formProductTotal;
  }

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderForm.items.some(i => !i.productName)) {
        alert("Vui lòng nhập tên sản phẩm cho tất cả các dòng.");
        return;
    }

    const finalOrderCode = orderForm.orderCode || 'DH' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const finalTrackingNumber = orderForm.trackingNumber || 'HFL' + Math.floor(10000000 + Math.random() * 90000000).toString();
    const finalDeliveryCode = orderForm.deliveryCode;

    const finalItems: OrderItem[] = orderForm.items.map(i => ({
        id: i.id.startsWith('init') || i.id.length < 10 ? Math.random().toString(36).substr(2, 9) : i.id,
        productId: i.productId,
        productName: i.productName,
        price: parseInt(i.price) || 0,
        quantity: parseInt(i.quantity) || 1,
        image: 'https://picsum.photos/100/100?random=' + Math.floor(Math.random() * 100)
    }));
    
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

    const orderId = editingOrderId || Math.random().toString(36).substr(2, 9);

    const orderPayload = {
        orderCode: finalOrderCode,
        trackingNumber: finalTrackingNumber,
        customer: {
          id: Math.random().toString(36).substr(2, 9), // Should ideally preserve ID if editing
          name: orderForm.customerName,
          phone: orderForm.phone,
          address: orderForm.address,
          email: ''
        },
        items: finalItems,
        usedMaterials: orderForm.usedMaterials,
        totalAmount: formTotalCOD, // COD
        shippingFee: formShippingFee,
        shippingPayer: orderForm.shippingPayer,
        paymentMethod: orderForm.paymentMethod as any,
        deliveryUnit: orderForm.deliveryUnit,
        deliveryCode: finalDeliveryCode,
        status: orderForm.status as OrderStatus,
        notes: orderForm.notes
    };

    if (editingOrderId) {
      setOrders(orders.map(o => {
        if (o.id === editingOrderId) {
          return {
            ...o,
            ...orderPayload,
            customer: { ...o.customer, name: orderForm.customerName, phone: orderForm.phone, address: orderForm.address }
          };
        }
        return o;
      }));
    } else {
      const newOrder: Order = {
        id: orderId,
        ...orderPayload,
        customer: {
            id: Math.random().toString(36).substr(2, 9),
            name: orderForm.customerName,
            phone: orderForm.phone,
            address: orderForm.address,
            email: ''
        },
        createdAt: new Date().toISOString(),
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
      const order = orders.find(o => o.id === orderToDelete);
      
      // LOGIC: Nếu đơn đã có mã giao hàng (tức là đã trừ kho), thì cần HOÀN LẠI VẬT TƯ vào kho
      if (order && order.deliveryCode && order.usedMaterials && order.usedMaterials.length > 0) {
          order.usedMaterials.forEach(mat => {
              const invItem = inventory.find(i => i.id === mat.inventoryId);
              if (invItem) {
                  // Hoàn lại kho: số lượng hiện tại + số lượng đã dùng
                  updateInventoryItem(mat.inventoryId, { quantity: invItem.quantity + mat.quantity });
              }
          });
      }

      deleteOrder(orderToDelete);
      setOrderToDelete(null);
    }
  };

  const handleExportExcel = () => {
      // 1. Filter Data based on Config
      let dataToExport = orders;
      
      if (exportConfig.startDate) {
          dataToExport = dataToExport.filter(o => o.createdAt >= exportConfig.startDate);
      }
      
      if (exportConfig.endDate) {
          // Add end of day to endDate
          const end = new Date(exportConfig.endDate);
          end.setHours(23, 59, 59, 999);
          dataToExport = dataToExport.filter(o => new Date(o.createdAt) <= end);
      }

      if (exportConfig.status !== 'All') {
          dataToExport = dataToExport.filter(o => o.status === exportConfig.status);
      }

      if (dataToExport.length === 0) {
          alert('Không có dữ liệu nào phù hợp để xuất.');
          return;
      }

      // 2. Map Data to Excel Rows
      const rows = dataToExport.map(order => {
          const isShopPayer = order.shippingPayer === 'SHOP';
          // Calculate Product Total correctly:
          // If Shop Pays: COD (totalAmount) is exactly Product Price.
          // If Customer Pays: COD (totalAmount) is Product Price + Ship. So Product Price = COD - Ship.
          const productTotal = isShopPayer ? order.totalAmount : (order.totalAmount - order.shippingFee);
          const netReceived = order.totalAmount - order.shippingFee;

          return {
              "Mã đơn": order.orderCode,
              "Họ tên khách hàng": order.customer.name,
              "Số điện thoại": order.customer.phone,
              "Địa chỉ": order.customer.address,
              "Danh sách sản phẩm": order.items.map(i => `${i.quantity}x ${i.productName}`).join(', '),
              "Tổng tiền sản phẩm": productTotal,
              "Phí ship": order.shippingFee,
              "Người chịu ship": isShopPayer ? "Shop" : "Khách",
              "Thực nhận": netReceived,
              "Trạng thái": order.status,
              "Ngày tạo": new Date(order.createdAt).toLocaleDateString('vi-VN')
          };
      });

      // 3. Create Workbook and Write File
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "KhachHang");
      
      const fileName = `Danh_sach_khach_hang_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      setIsExportModalOpen(false);
  };

  if (selectedOrderId && selectedOrder) {
    return <OrderDetail order={selectedOrder} onBack={() => setSelectedOrderId(null)} />;
  } else if (selectedOrderId && !selectedOrder) {
      setSelectedOrderId(null);
  }

  // Check if we are in "Auto Mode" (Products selected)
  const isAutoMaterialMode = orderForm.items.some(i => i.productId);

  return (
    <div className="p-6 relative">
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
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                <th className="px-6 py-4">Thực nhận</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                  let netReceived = 0;
                  if (order.shippingPayer === 'CUSTOMER') {
                      netReceived = order.totalAmount - order.shippingFee; 
                  } else {
                      netReceived = order.totalAmount - order.shippingFee; 
                  }
                  
                  const isReconciled = order.status === OrderStatus.RECONCILIATION;
                  return (
                    <tr 
                        key={order.id} 
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${isReconciled ? 'bg-green-50/50' : ''}`}
                    >
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
                        <div className="text-[10px] text-gray-400 italic">
                            {order.shippingPayer === 'CUSTOMER' ? '(Khách trả)' : '(Shop chịu)'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-bold ${isReconciled ? 'text-green-700' : 'text-gray-400'}`}>
                          {(order.totalAmount - order.shippingFee).toLocaleString('vi-VN')} đ
                          {isReconciled && <CheckCircle className="w-3 h-3 inline-block ml-1" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center relative action-menu-container" onClick={(e) => e.stopPropagation()}>
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
                                onRequestDelete(order.id);
                            }}
                            className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            title="Xóa đơn hàng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
           <span className="text-xs text-gray-500">Hiển thị {filteredOrders.length} đơn hàng</span>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Xóa đơn hàng?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa đơn hàng này không? <br/>
                <span className="text-xs text-orange-600 block mt-2">Lưu ý: Nếu đơn hàng đã có mã vận đơn, vật tư sẽ được hoàn lại kho.</span>
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

      {/* EXPORT EXCEL MODAL */}
      {isExportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="text-lg font-bold text-gray-800">Xuất dữ liệu Excel</h3>
                      <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Từ ngày</label>
                              <input 
                                  type="date" 
                                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  value={exportConfig.startDate}
                                  onChange={e => setExportConfig({...exportConfig, startDate: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Đến ngày</label>
                              <input 
                                  type="date" 
                                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  value={exportConfig.endDate}
                                  onChange={e => setExportConfig({...exportConfig, endDate: e.target.value})}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Trạng thái đơn hàng</label>
                          <select 
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                              value={exportConfig.status}
                              onChange={e => setExportConfig({...exportConfig, status: e.target.value})}
                          >
                              <option value="All">Tất cả trạng thái</option>
                              {Object.values(OrderStatus).map(s => (
                                  <option key={s} value={s}>{s}</option>
                              ))}
                          </select>
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                          <button 
                              onClick={() => setIsExportModalOpen(false)}
                              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                          >
                              Hủy
                          </button>
                          <button 
                              onClick={handleExportExcel}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition-colors text-sm flex items-center"
                          >
                              <Download className="w-4 h-4 mr-2" />
                              Xuất file
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Import Modal */}
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
                   {/* handleDownloadTemplate not defined in this snippet but implied */}
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                   <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                   <p className="text-sm text-gray-600 font-medium">Click để tải lên file Excel</p>
                   <p className="text-xs text-gray-400 mt-1">Hỗ trợ .xlsx, .xls</p>
                   {/* handleFileUpload needs to be here */}
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".xlsx, .xls"
                   />
                </div>
             </div>
          </div>
        </div>
      )}
      
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

                        {/* Product List Table */}
                        <div className="overflow-hidden border border-gray-200 rounded-lg mb-4">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">Chọn Sản phẩm (Mẫu)</th>
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
                                                     <div className="flex flex-col gap-1">
                                                        <select 
                                                            className="w-full bg-transparent focus:bg-white px-2 py-1 border border-transparent focus:border-orange-300 rounded transition-colors focus:outline-none font-medium text-gray-800"
                                                            value={item.productId || ''}
                                                            onChange={(e) => handleProductSelection(item.id, e.target.value)}
                                                        >
                                                            <option value="">-- Tùy chỉnh (Nhập tay) --</option>
                                                            {products.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                        {!item.productId && (
                                                            <input 
                                                                type="text" 
                                                                className="w-full bg-transparent focus:bg-white px-2 py-1 border border-gray-100 rounded text-xs text-gray-600"
                                                                placeholder="Nhập tên SP tùy chỉnh..."
                                                                value={item.productName}
                                                                onChange={(e) => handleUpdateItem(item.id, 'productName', e.target.value)}
                                                            />
                                                        )}
                                                     </div>
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
                        <div className="mt-8 pt-6 border-t border-gray-100 relative">
                             {isAutoMaterialMode && (
                                 <div className="absolute top-0 right-0 left-0 bottom-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-lg border border-orange-100">
                                     <div className="bg-orange-50 px-4 py-2 rounded-full shadow-sm border border-orange-200 flex items-center text-sm font-bold text-orange-700">
                                         <Lock className="w-4 h-4 mr-2" />
                                         Vật tư được tính tự động theo sản phẩm
                                     </div>
                                 </div>
                             )}

                             <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                                <span className="flex items-center">
                                    <Boxes className="w-4 h-4 mr-2 text-gray-500" />
                                    Vật tư sử dụng
                                </span>
                             </h4>
                             
                             <div className={`flex flex-col md:flex-row gap-3 mb-4 ${isAutoMaterialMode ? 'opacity-50 pointer-events-none' : ''}`}>
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
                                                 {!isAutoMaterialMode && <th className="px-4 py-3 text-center w-10"></th>}
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-gray-100">
                                             {orderForm.usedMaterials.map((mat, idx) => (
                                                 <tr key={mat.inventoryId} className="group hover:bg-gray-50">
                                                     <td className="px-4 py-2 font-medium text-gray-800 align-middle">{mat.name}</td>
                                                     <td className="px-4 py-2 text-center text-gray-500 align-middle">{mat.unit}</td>
                                                     <td className="px-4 py-2 text-center align-middle font-bold">
                                                         {mat.quantity}
                                                     </td>
                                                     {!isAutoMaterialMode && (
                                                         <td className="px-4 py-2 text-center align-middle">
                                                             <button 
                                                                 type="button"
                                                                 onClick={() => {
                                                                     // Manual remove logic
                                                                     setOrderForm(prev => ({...prev, usedMaterials: prev.usedMaterials.filter(m => m.inventoryId !== mat.inventoryId)}));
                                                                 }}
                                                                 className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                             >
                                                                 <X className="w-4 h-4" />
                                                             </button>
                                                         </td>
                                                     )}
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
                                    Phí ship
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

                            {/* Shipping Payer Selection */}
                            <div className="flex gap-2 text-xs">
                                <label className={`flex-1 flex items-center justify-center p-2 rounded border cursor-pointer transition-colors ${orderForm.shippingPayer === 'SHOP' ? 'bg-orange-100 border-orange-300 text-orange-800 font-bold' : 'bg-white border-gray-200 text-gray-500'}`}>
                                    <input 
                                        type="radio" 
                                        className="hidden" 
                                        checked={orderForm.shippingPayer === 'SHOP'} 
                                        onChange={() => setOrderForm({...orderForm, shippingPayer: 'SHOP'})}
                                    />
                                    Shop chịu
                                </label>
                                <label className={`flex-1 flex items-center justify-center p-2 rounded border cursor-pointer transition-colors ${orderForm.shippingPayer === 'CUSTOMER' ? 'bg-blue-100 border-blue-300 text-blue-800 font-bold' : 'bg-white border-gray-200 text-gray-500'}`}>
                                    <input 
                                        type="radio" 
                                        className="hidden" 
                                        checked={orderForm.shippingPayer === 'CUSTOMER'} 
                                        onChange={() => setOrderForm({...orderForm, shippingPayer: 'CUSTOMER'})}
                                    />
                                    Khách trả
                                </label>
                            </div>

                            <div className="border-t border-orange-200 my-2"></div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-800">Tổng tiền COD (Thu khách)</span>
                                <span className="text-lg font-bold text-orange-600">{formTotalCOD.toLocaleString('vi-VN')} đ</span>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border border-orange-200 flex justify-between items-center mt-2">
                                <span className="text-sm font-bold text-green-700">Thực nhận</span>
                                <span className="text-xl font-bold text-green-700">{formNetReceived.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="text-[10px] text-gray-500 text-right italic">
                                {orderForm.shippingPayer === 'SHOP' ? '(Tiền hàng - Ship)' : '(Tiền hàng)'}
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