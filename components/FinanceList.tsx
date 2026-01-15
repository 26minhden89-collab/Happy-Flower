import React, { useState } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, Search, Calendar, Filter, Trash2, Save, X, Boxes, Wallet, ShoppingBag } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useInventory } from '../contexts/InventoryContext';
import { useOrder } from '../contexts/OrderContext';
import { TransactionCategory, UsedMaterial, OrderStatus } from '../types';

const FinanceList = () => {
  const { transactions, addExpense, deleteTransaction, getTotalExpenses } = useFinance();
  const { inventory, updateItem: updateInventoryItem } = useInventory();
  const { orders } = useOrder();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'MATERIAL_PURCHASE' as TransactionCategory,
    description: '',
  });

  // Material Purchase State (List mode)
  const [draftMaterials, setDraftMaterials] = useState<UsedMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [materialQty, setMaterialQty] = useState('');

  // 1. CALCULATE REVENUE DYNAMICALLY FROM ORDERS
  const totalRevenue = orders
    .filter(o => o.status === OrderStatus.RECONCILIATION)
    .reduce((sum, o) => sum + (o.totalAmount - o.shippingFee), 0);

  // 2. GET TOTAL EXPENSES
  const totalExpense = getTotalExpenses();

  // 3. CALCULATE PROFIT
  const profit = totalRevenue - totalExpense;

  const handleOpenModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: 'MATERIAL_PURCHASE',
      description: ''
    });
    setDraftMaterials([]);
    setSelectedMaterialId('');
    setMaterialQty('');
    setIsModalOpen(true);
  };

  const handleAddMaterialToDraft = () => {
      if (!selectedMaterialId || !materialQty) return;
      const invItem = inventory.find(i => i.id === selectedMaterialId);
      const qty = parseInt(materialQty);
      
      if (invItem && qty > 0) {
          // Check if already in draft
          const existingIndex = draftMaterials.findIndex(m => m.inventoryId === selectedMaterialId);
          if (existingIndex >= 0) {
              const updated = [...draftMaterials];
              updated[existingIndex].quantity += qty;
              setDraftMaterials(updated);
          } else {
              setDraftMaterials([...draftMaterials, {
                  inventoryId: invItem.id,
                  name: invItem.name,
                  unit: invItem.unit,
                  quantity: qty
              }]);
          }
          // Reset inputs
          setSelectedMaterialId('');
          setMaterialQty('');
      }
  };

  const handleRemoveMaterialFromDraft = (invId: string) => {
      setDraftMaterials(draftMaterials.filter(m => m.inventoryId !== invId));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(formData.amount) || 0;
    
    if (amount <= 0) {
        alert("Số tiền phải lớn hơn 0");
        return;
    }

    if (formData.category === 'MATERIAL_PURCHASE' && draftMaterials.length === 0) {
        alert("Vui lòng thêm ít nhất một vật tư vào danh sách");
        return;
    }

    // LOGIC CHI MUA VẬT TƯ: CỘNG KHO
    if (formData.category === 'MATERIAL_PURCHASE') {
        draftMaterials.forEach(draftItem => {
            const invItem = inventory.find(i => i.id === draftItem.inventoryId);
            if (invItem) {
                // UPDATE INVENTORY
                updateInventoryItem(invItem.id, { quantity: invItem.quantity + draftItem.quantity });
            }
        });
    }

    addExpense({
      date: formData.date,
      amount: amount,
      category: formData.category,
      description: formData.description,
      relatedMaterials: draftMaterials.length > 0 ? draftMaterials : undefined
    });

    setIsModalOpen(false);
  };

  return (
    <div className="p-6 relative animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Chi tiêu</h1>
          <p className="text-sm text-gray-500 mt-1">Kiểm soát dòng tiền. Doanh thu được tự động tính từ Đơn hàng.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleOpenModal}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo phiếu Chi
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1">Tổng Doanh Thu</p>
                <div className="text-xs text-gray-400 mb-1">(Đơn hàng đã đối soát)</div>
                <h3 className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString('vi-VN')} đ</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
                <ArrowUpCircle className="w-8 h-8 text-green-500" />
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1">Tổng Chi Phí</p>
                <div className="text-xs text-gray-400 mb-1">(Phiếu chi thủ công)</div>
                <h3 className="text-2xl font-bold text-red-600">{totalExpense.toLocaleString('vi-VN')} đ</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
                <ArrowDownCircle className="w-8 h-8 text-red-500" />
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1">Lợi Nhuận</p>
                <div className="text-xs text-gray-400 mb-1">(Doanh thu - Chi phí)</div>
                <h3 className={`text-2xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                    {profit.toLocaleString('vi-VN')} đ
                </h3>
            </div>
            <div className={`p-3 rounded-full ${profit >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                <Wallet className={`w-8 h-8 ${profit >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
            </div>
         </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="font-bold text-gray-700">Lịch sử Chi tiêu</h3>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                 <tr>
                    <th className="px-6 py-4">Ngày chi</th>
                    <th className="px-6 py-4">Loại chi</th>
                    <th className="px-6 py-4">Mô tả / Ghi chú</th>
                    <th className="px-6 py-4 text-right">Số tiền</th>
                    <th className="px-6 py-4 text-center">Thao tác</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {transactions.filter(t => t.type === 'EXPENSE').map(t => (
                     <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(t.date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4">
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <ArrowDownCircle className="w-3 h-3 mr-1" /> Chi tiêu
                             </span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-800">{t.description}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                {t.category === 'MATERIAL_PURCHASE' ? 'Mua vật tư nhập kho' : 'Chi phí khác'}
                                {t.relatedMaterials && (
                                    <div className="mt-1 text-orange-600 flex items-center flex-wrap gap-1">
                                        <Boxes className="w-3 h-3 mr-1" />
                                        {t.relatedMaterials.map((m, idx) => (
                                            <span key={idx} className="bg-orange-50 text-orange-700 px-1.5 rounded text-[10px] border border-orange-100">
                                                {m.name} (+{m.quantity})
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-sm text-red-600">
                            -{t.amount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-6 py-4 text-center">
                            <button 
                                onClick={() => deleteTransaction(t.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </td>
                     </tr>
                 ))}
                 {transactions.filter(t => t.type === 'EXPENSE').length === 0 && (
                     <tr>
                         <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                             Chưa có khoản chi nào.
                         </td>
                     </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL - UPDATED UI */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl w-full max-w-[550px] shadow-2xl flex flex-col max-h-[90vh]">
                 {/* Header - Fixed */}
                 <div className="px-6 py-4 border-b flex justify-between items-center bg-red-50 border-red-100 rounded-t-xl shrink-0">
                    <h3 className="text-lg font-bold text-red-800 flex items-center">
                        <Wallet className="w-5 h-5 mr-2" />
                        Tạo phiếu Chi mới
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                 </div>

                 {/* Scrollable Content */}
                 <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                     <form id="expenseForm" onSubmit={handleSave} className="space-y-4">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ngày chi</label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                />
                            </div>
                            <div>
                                 <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Loại chi phí</label>
                                 <select 
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value as TransactionCategory})}
                                 >
                                     <option value="MATERIAL_PURCHASE">Mua vật tư (Nhập kho)</option>
                                     <option value="OTHER">Chi phí khác</option>
                                 </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Số tiền (VNĐ)</label>
                            <input 
                                type="number" 
                                required
                                min="0"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-lg text-red-600"
                                placeholder="0"
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                            />
                        </div>

                        {/* Material Purchase Logic - List Mode */}
                        {formData.category === 'MATERIAL_PURCHASE' && (
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-3">
                                 <div className="flex items-center justify-between">
                                     <div className="text-xs text-orange-800 font-bold uppercase flex items-center">
                                         <Boxes className="w-3 h-3 mr-1" /> Nhập kho vật tư
                                     </div>
                                     <span className="text-[10px] text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                         Tự động cộng kho
                                     </span>
                                 </div>
                                 
                                 {/* Add Material Input Row */}
                                 <div className="flex flex-col sm:flex-row gap-2">
                                    <select 
                                        className="flex-1 px-3 py-2 border border-orange-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-orange-500 outline-none"
                                        value={selectedMaterialId}
                                        onChange={(e) => setSelectedMaterialId(e.target.value)}
                                    >
                                        <option value="">-- Chọn vật tư --</option>
                                        {inventory.map(i => (
                                            <option key={i.id} value={i.id}>{i.name} (Tồn: {i.quantity} {i.unit})</option>
                                        ))}
                                    </select>
                                    <div className="flex gap-2">
                                        <input 
                                            type="number"
                                            placeholder="SL"
                                            className="w-20 px-3 py-2 border border-orange-200 rounded-lg text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                                            value={materialQty}
                                            onChange={(e) => setMaterialQty(e.target.value)}
                                        />
                                        <button 
                                            type="button"
                                            onClick={handleAddMaterialToDraft}
                                            className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                 </div>

                                 {/* Draft List */}
                                 {draftMaterials.length > 0 && (
                                     <div className="mt-2 bg-white rounded-lg border border-orange-100 overflow-hidden max-h-32 overflow-y-auto custom-scrollbar">
                                         <table className="w-full text-sm text-left">
                                             <tbody className="divide-y divide-orange-50">
                                                 {draftMaterials.map((item) => (
                                                     <tr key={item.inventoryId} className="hover:bg-orange-50/50">
                                                         <td className="px-3 py-2 text-gray-700 text-xs">{item.name}</td>
                                                         <td className="px-3 py-2 text-gray-700 font-medium text-xs text-right">+{item.quantity} {item.unit}</td>
                                                         <td className="px-2 py-2 text-right w-8">
                                                             <button 
                                                                type="button"
                                                                onClick={() => handleRemoveMaterialFromDraft(item.inventoryId)}
                                                                className="text-gray-400 hover:text-red-500"
                                                             >
                                                                 <X className="w-3 h-3" />
                                                             </button>
                                                         </td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 )}
                                 {draftMaterials.length === 0 && (
                                     <div className="text-center text-xs text-orange-300 italic py-2">
                                         Chưa có vật tư nào được chọn.
                                     </div>
                                 )}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ghi chú</label>
                            <textarea 
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                placeholder="VD: Mua thêm giấy gói, trả tiền điện..."
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                     </form>
                 </div>

                 {/* Footer - Fixed */}
                 <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3 shrink-0">
                    <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors text-sm"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        type="submit"
                        form="expenseForm"
                        className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition-colors text-sm flex items-center"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Lưu phiếu
                    </button>
                 </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default FinanceList;