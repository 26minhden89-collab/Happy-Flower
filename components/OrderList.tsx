import React, { useState, useEffect, useRef } from 'react';
import { Filter, MoreHorizontal, X, Plus, Save, Trash2, Truck, Edit, CheckCircle, DollarSign, FileSpreadsheet, Upload, Download, AlertCircle, User, Package, CreditCard, ChevronLeft, Boxes, LayoutGrid, MinusCircle, Calculator, Settings, Image as ImageIcon } from 'lucide-react';
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

  // --- LOGIC QUẢN LÝ PRODUCT MANAGER MODAL ---
  const openProductManager = () => {
    setEditingProduct(null); // Mode: Create
    setProductForm({ name: '', price: '', image: '', recipe: [] });
    setRecipeInvId('');
    setRecipeQty('');
    setIsProductManagerOpen(true);
  };

  const selectProductToEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      image: product.image || '',
      recipe: product.recipe || []
    });
    setRecipeInvId('');
    setRecipeQty('');
  };

  const handleAddRecipeItem = () => {
    if (!recipeInvId || !recipeQty) return;
    const qty = parseInt(recipeQty);
    if (qty <= 0) return;

    // Check if exists
    const exists = productForm.recipe.find(r => r.inventoryId === recipeInvId);
    if (exists) {
        setProductForm(prev => ({
            ...prev,
            recipe: prev.recipe.map(r => r.inventoryId === recipeInvId ? { ...r, quantity: r.quantity + qty } : r)
        }));
    } else {
        setProductForm(prev => ({
            ...prev,
            recipe: [...prev.recipe, { inventoryId: recipeInvId, quantity: qty }]
        }));
    }
    setRecipeInvId('');
    setRecipeQty('');
  };

  const handleRemoveRecipeItem = (invId: string) => {
    setProductForm(prev => ({
        ...prev,
        recipe: prev.recipe.filter(r => r.inventoryId !== invId)
    }));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    const price = parseInt(productForm.price) || 0;

    if (editingProduct) {
        updateProduct(editingProduct.id, {
            name: productForm.name,
            price: price,
            image: productForm.image,
            recipe: productForm.recipe
        });
    } else {
        addProduct({
            name: productForm.name,
            price: price,
            image: productForm.image || `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 1000)}`,
            recipe: productForm.recipe
        });
    }
    
    // Reset form to add mode after save
    setEditingProduct(null);
    setProductForm({ name: '', price: '', image: '', recipe: [] });
  };

  const handleDeleteProduct = (id: string) => {
      setProductToDelete(id);
  };
  
  const confirmDeleteProduct = () => {
      if (productToDelete) {
          deleteProduct(productToDelete);
          // Nếu đang edit sản phẩm bị xóa thì reset form
          if (editingProduct?.id === productToDelete) {
              setEditingProduct(null);
              setProductForm({ name: '', price: '', image: '', recipe: [] });
          }
          setProductToDelete(null);
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
  const formTotalAmount = formProductTotal - formShippingFee; // Tiền đơn hàng (COD)
  const formNetReceived = formTotalAmount; // Thực nhận (Giả sử bằng COD)

  // Xử lý Lưu (Tạo mới hoặc Cập nhật)
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (orderForm.items.some(i => !i.productName)) {
        alert("Vui lòng nhập tên sản phẩm cho tất cả các dòng.");
        return;
    }

    // Logic tạo mã tự động nếu để trống
    const finalOrderCode = orderForm.orderCode || 'DH' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const finalTrackingNumber = orderForm.trackingNumber || 'HFL' + Math.floor(10000000 + Math.random() * 90000000).toString();
    
    // Logic tạo mã giao hàng nếu chưa có
    let finalDeliveryCode = orderForm.deliveryCode;
    if (!finalDeliveryCode && orderForm.deliveryUnit) {
        const deliveryCodePrefix = 
          orderForm.deliveryUnit === 'Giao Hàng Nhanh' ? 'GHN' :
          orderForm.deliveryUnit === 'Giao Hàng Tiết Kiệm' ? 'GHTK' :
          orderForm.deliveryUnit === 'Viettel Post' ? 'VTP' : 'AHA';
        finalDeliveryCode = deliveryCodePrefix + Math.floor(Math.random() * 1000000).toString();
    }

    // Convert Form Items to Order Items
    const finalItems: OrderItem[] = orderForm.items.map(i => ({
        id: i.id.startsWith('init') || i.id.length < 10 ? Math.random().toString(36).substr(2, 9) : i.id,
        productName: i.productName,
        price: parseInt(i.price) || 0,
        quantity: parseInt(i.quantity) || 1,
        image: 'https://picsum.photos/100/100?random=' + Math.floor(Math.random() * 100)
    }));
    
    // --- TRỪ KHO (INVENTORY DEDUCTION) ---
    // Note: Để đơn giản cho demo, chúng ta sẽ trừ kho mỗi khi nhấn Lưu.
    if (orderForm.usedMaterials.length > 0) {
        orderForm.usedMaterials.forEach(mat => {
            const currentItem = inventory.find(i => i.id === mat.inventoryId);
            if (currentItem) {
                const newQty = Math.max(0, currentItem.quantity - mat.quantity);
                updateInventoryItem(mat.inventoryId, { quantity: newQty });
            }
        });
    }

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
        id: Math.random().toString(36).substr(2, 9),
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

  // Xử lý yêu cầu xóa (Mở Modal)
  const onRequestDelete = (orderId: string) => {
    setOrderToDelete(orderId);
    setActiveMenuId(null);
  };

  // Xác nhận xóa thật (Xử lý logic)
  const confirmDeleteOrder = () => {
    if (orderToDelete) {
      // Sử dụng hàm deleteOrder từ Context
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
          <p className="text-sm text-gray-500 mt-1">Quản lý và theo dõi trạng thái giao hàng</p>
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
                <th className="px-6 py-4">Mã Giao Hàng (Đối tác)</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Tiền Đơn Hàng</th>
                <th className="px-6 py-4">Phí ship</th>
                <th className="px-6 py-4">Tổng tiền COD</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
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
                    <div className="text-sm font-bold text-green-600">
                      {/* Thực nhận = Tiền hàng - Ship. Vì COD = Tiền hàng - Ship nên Thực nhận = COD */}
                      {order.totalAmount.toLocaleString('vi-VN')} đ
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
              ))}
              
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
           <div className="flex space-x-1">
             <button className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 bg-white opacity-50 cursor-not-allowed">Trước</button>
             <button className="px-3 py-1 border border-gray-300 rounded text-xs text-white bg-orange-500">1</button>
             <button className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 bg-white hover:bg-gray-50">2</button>
             <button className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 bg-white hover:bg-gray-50">Sau</button>
           </div>
        </div>
      </div>

      {/* Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden transform transition-all scale-100 border border-gray-100">
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
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-lg shadow-red-200 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden transform transition-all scale-100 border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Xóa mẫu sản phẩm?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa mẫu này không? <br/>Hành động này không thể hoàn tác.
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmDeleteProduct}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
               <div>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    <FileSpreadsheet className="w-5 h-5 mr-2 text-green-600" />
                    Nhập đơn hàng loạt
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Tải lên file Excel để tạo nhanh nhiều đơn hàng.</p>
               </div>
              <button onClick={() => {setIsImportModalOpen(false); setImportedData([])}} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                 <div className="flex flex-col md:flex-row gap-6 mb-8">
                     <div className="flex-1 bg-blue-50 p-5 rounded-xl border border-blue-100">
                        <div className="flex items-center mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                <Download className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-gray-800">Bước 1: Tải file mẫu</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Sử dụng file mẫu chuẩn để đảm bảo dữ liệu được nhập chính xác. Không thay đổi tên cột.
                        </p>
                        <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors shadow-sm">
                            Tải xuống Template (.xlsx)
                        </button>
                     </div>
                     <div className="flex-1 bg-gray-50 p-5 rounded-xl border border-gray-200">
                         <div className="flex items-center mb-3">
                            <div className="p-2 bg-gray-200 rounded-lg mr-3">
                                <Upload className="w-5 h-5 text-gray-700" />
                            </div>
                            <h3 className="font-bold text-gray-800">Bước 2: Tải lên file</h3>
                        </div>
                        <div className="relative">
                             <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" id="file-upload" />
                            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-white hover:border-gray-400 transition-all">
                                <span className="text-sm text-gray-500 font-medium mt-1">{importedData.length > 0 ? `Đã tải ${importedData.length} dòng dữ liệu` : 'Click để chọn file Excel'}</span>
                                <span className="text-xs text-gray-400 mt-1">Hỗ trợ .xlsx, .xls</span>
                            </label>
                        </div>
                     </div>
                 </div>
                  {importedData.length > 0 && (
                     <div className="animate-fade-in">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Xem trước dữ liệu ({importedData.length} đơn hàng)</h3>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                             <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Khách hàng</th>
                                        <th className="px-4 py-3">SĐT</th>
                                        <th className="px-4 py-3">Sản phẩm</th>
                                        <th className="px-4 py-3 text-right">Đơn giá</th>
                                        <th className="px-4 py-3 text-center">SL</th>
                                        <th className="px-4 py-3 text-right">Phí Ship</th>
                                        <th className="px-4 py-3 text-right">COD (Dự tính)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {importedData.slice(0, 5).map((row, index) => {
                                        const price = parseInt(row["Đơn giá"]) || 0;
                                        const qty = parseInt(row["Số lượng"]) || 0;
                                        const ship = parseInt(row["Phí Ship"]) || 0;
                                        const cod = (price * qty) - ship;
                                        return (
                                            <tr key={index}>
                                                <td className="px-4 py-2">{row["Tên khách hàng"]}</td>
                                                <td className="px-4 py-2">{row["Số điện thoại"]}</td>
                                                <td className="px-4 py-2 truncate max-w-[150px]">{row["Tên sản phẩm"]}</td>
                                                <td className="px-4 py-2 text-right">{price.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-center">{qty}</td>
                                                <td className="px-4 py-2 text-right">{ship.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-right font-medium text-green-600">{cod.toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                             </table>
                        </div>
                     </div>
                  )}
             </div>
             <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end space-x-3">
                 <button onClick={() => {setIsImportModalOpen(false); setImportedData([])}} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">Hủy bỏ</button>
                 <button disabled={importedData.length === 0} onClick={handleConfirmImport} className={`px-5 py-2.5 text-white rounded-lg font-medium shadow-md flex items-center ${importedData.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}><Save className="w-4 h-4 mr-2" />Xác nhận nhập {importedData.length > 0 ? importedData.length : ''} đơn</button>
             </div>
          </div>
        </div>
      )}

      {/* PRODUCT MANAGER MODAL (QUẢN LÝ SẢN PHẨM MẪU) */}
      {isProductManagerOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh]">
            {/* Sidebar List (Left) */}
            <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-gray-800">Danh sách mẫu</h3>
                    <button 
                        onClick={openProductManager}
                        className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        title="Thêm mẫu mới"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {products.map(product => (
                        <div 
                            key={product.id} 
                            onClick={() => selectProductToEdit(product)}
                            className={`p-3 rounded-lg cursor-pointer border transition-all ${editingProduct?.id === product.id ? 'bg-white border-orange-500 shadow-md' : 'bg-white border-gray-200 hover:border-orange-300'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium text-gray-800 text-sm">{product.name}</h4>
                                    <p className="text-xs text-orange-600 font-bold mt-1">{product.price.toLocaleString('vi-VN')} đ</p>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProduct(product.id);
                                    }}
                                    className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                                {product.recipe.length} loại vật tư
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor Form (Right) */}
            <div className="flex-1 flex flex-col bg-white">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">
                        {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                    </h3>
                    <button onClick={() => setIsProductManagerOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm mẫu</label>
                            <input 
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="VD: Bó hoa hồng đỏ 20 bông"
                                value={productForm.name}
                                onChange={e => setProductForm({...productForm, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá bán (VNĐ)</label>
                            <input 
                                type="number"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="0"
                                value={productForm.price}
                                onChange={e => setProductForm({...productForm, price: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Link ảnh (Tùy chọn)</label>
                            <input 
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="https://..."
                                value={productForm.image}
                                onChange={e => setProductForm({...productForm, image: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Recipe Section */}
                    <div className="bg-orange-50 rounded-xl border border-orange-100 p-5">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                            <Boxes className="w-4 h-4 mr-2 text-orange-600" />
                            Định mức vật tư (Công thức)
                        </h4>
                        <p className="text-xs text-gray-500 mb-4">Khi chọn sản phẩm này trong đơn hàng, các vật tư sau sẽ tự động được thêm vào danh sách trừ kho.</p>

                        <div className="flex gap-2 mb-3">
                            <select 
                                className="flex-1 px-3 py-2 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                value={recipeInvId}
                                onChange={e => setRecipeInvId(e.target.value)}
                            >
                                <option value="">-- Chọn vật tư --</option>
                                {inventory.map(inv => (
                                    <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                                ))}
                            </select>
                            <input 
                                type="number"
                                className="w-24 px-3 py-2 border border-orange-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="SL"
                                value={recipeQty}
                                onChange={e => setRecipeQty(e.target.value)}
                            />
                            <button 
                                onClick={handleAddRecipeItem}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 whitespace-nowrap"
                            >
                                Thêm
                            </button>
                        </div>

                        {productForm.recipe.length > 0 ? (
                            <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-orange-100 text-orange-800 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Tên vật tư</th>
                                            <th className="px-4 py-2 text-center">Số lượng</th>
                                            <th className="px-4 py-2 text-center">ĐVT</th>
                                            <th className="px-4 py-2 text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-orange-100">
                                        {productForm.recipe.map((item, idx) => {
                                            const invItem = inventory.find(i => i.id === item.inventoryId);
                                            return (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2">{invItem?.name || 'Unknown'}</td>
                                                    <td className="px-4 py-2 text-center font-bold">{item.quantity}</td>
                                                    <td className="px-4 py-2 text-center text-gray-500">{invItem?.unit}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button 
                                                            onClick={() => handleRemoveRecipeItem(item.inventoryId)}
                                                            className="text-gray-400 hover:text-red-500"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-400 text-sm border border-dashed border-gray-300 rounded-lg bg-white">
                                Chưa có định mức vật tư nào.
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                     <button 
                        onClick={() => setIsProductManagerOpen(false)}
                        className="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                     >
                        Đóng
                     </button>
                     <button 
                        onClick={handleSaveProduct}
                        className="px-5 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-md flex items-center"
                     >
                        <Save className="w-4 h-4 mr-2" />
                        {editingProduct ? 'Cập nhật mẫu' : 'Lưu mẫu mới'}
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
                                    <button 
                                        type="button"
                                        onClick={openProductManager}
                                        className="px-3 py-2 bg-white border border-orange-200 text-orange-600 rounded hover:bg-orange-100 transition-colors flex items-center whitespace-nowrap"
                                        title="Quản lý danh sách mẫu"
                                    >
                                        <Settings className="w-4 h-4 mr-1" /> Quản lý mẫu
                                    </button>
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
                                    Vật tư sử dụng (Trừ kho)
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
                                        * Lưu ý: Số lượng sẽ được trừ khỏi kho khi bạn nhấn nút "Lưu đơn" hoặc "Cập nhật".
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
                                    <div className="ml-2 w-20">
                                        <input 
                                            type="number" 
                                            className="w-full px-2 py-1 text-right text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                                            value={orderForm.shippingFee}
                                            onChange={(e) => setOrderForm({...orderForm, shippingFee: e.target.value})}
                                        />
                                    </div>
                                </span>
                                <span>- {formShippingFee.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="border-t border-orange-200 my-2"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-800">Tiền Đơn Hàng</span>
                                <span className="text-lg font-bold text-orange-600">{formTotalAmount.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-orange-200 flex justify-between items-center mt-2">
                                <span className="text-sm font-bold text-green-700">Tổng tiền COD</span>
                                <span className="text-xl font-bold text-green-700">{formNetReceived.toLocaleString('vi-VN')} đ</span>
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