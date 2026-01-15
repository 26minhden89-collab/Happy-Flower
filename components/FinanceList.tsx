import React, { useState } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, Search, Calendar, Filter, Trash2, Save, X, Boxes, Wallet } from 'lucide-react';
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

  // Material Purchase State
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
    setSelectedMaterialId('');
    setMaterialQty('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(formData.amount) || 0;
    
    if (amount <= 0) {
        alert("Số tiền phải lớn hơn 0");
        return;
    }

    let relatedMaterials: UsedMaterial[] = [];

    // LOGIC CHI MUA VẬT TƯ: CỘNG KHO
    if (formData.category === 'MATERIAL_PURCHASE') {
        if (!selectedMaterialId || !materialQty) {
            alert("Vui lòng chọn vật tư và nhập số lượng");
            return;
        }
        const invItem = inventory.find(i => i.id === selectedMaterialId);
        if (invItem) {
            const qtyToAdd = parseInt(materialQty) || 0;
            
            // 1. Update Inventory (INCREASE STOCK)
            updateInventoryItem(invItem.id, { quantity: invItem.quantity + qtyToAdd });
            
            // 2. Add detailed info to transaction
            relatedMaterials.push({
                inventoryId: invItem.id,
                name: invItem.name,
                unit: invItem.unit,
                quantity: qtyToAdd
            });
        }
    }

    addExpense({
      date: formData.date,
      amount: amount,
      category: formData.category,
      description: formData.description,
      relatedMaterials: relatedMaterials.length > 0 ? relatedMaterials : undefined
    });

    setIsModalOpen(false);
  };

  return (
    <div className="p-6 relative animate-fade-in">
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
                                    <div className="mt-1 text-orange-600 flex items-center">
                                        <Boxes className="w-3 h-3 mr-1" />
                                        {t.relatedMaterials.map(m => `${m.name} (+${m.quantity})`).join(', ')}
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

      {/* ADD EXPENSE MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                 <div className="px-6 py-4 border-b flex justify-between items-center bg-red-50 border-red-100">
                    <h3 className="text-lg font-bold text-red-800">
                        Tạo phiếu Chi
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                 </div>
                 <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày chi</label>
                        <input 
                            type="date" 
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VNĐ)</label>
                        <input 
                            type="number" 
                            required
                            min="0"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: e.target.value})}
                        />
                    </div>
                    
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Loại chi phí</label>
                         <select 
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value as TransactionCategory})}
                         >
                             <option value="MATERIAL_PURCHASE">Chi mua vật tư (Tự động nhập kho)</option>
                             <option value="OTHER">Chi phí khác</option>
                         </select>
                    </div>

                    {/* Material Purchase Logic */}
                    {formData.category === 'MATERIAL_PURCHASE' && (
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 space-y-3">
                             <div className="text-xs text-orange-800 font-bold uppercase flex items-center">
                                 <Boxes className="w-3 h-3 mr-1" /> Nhập kho vật tư
                             </div>
                             <div>
                                <select 
                                    className="w-full px-3 py-2 border border-orange-200 rounded text-sm bg-white"
                                    value={selectedMaterialId}
                                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                                >
                                    <option value="">-- Chọn vật tư cần nhập --</option>
                                    {inventory.map(i => (
                                        <option key={i.id} value={i.id}>{i.name} (Tồn: {i.quantity})</option>
                                    ))}
                                </select>
                             </div>
                             <div>
                                <input 
                                    type="number"
                                    placeholder="Số lượng nhập thêm"
                                    className="w-full px-3 py-2 border border-orange-200 rounded text-sm"
                                    value={materialQty}
                                    onChange={(e) => setMaterialQty(e.target.value)}
                                />
                             </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả / Ghi chú</label>
                        <textarea 
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="VD: Mua thêm giấy gói, trả tiền điện..."
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit"
                            className="w-full py-2.5 text-white font-bold rounded-lg shadow-md transition-colors bg-red-600 hover:bg-red-700"
                        >
                            <Save className="w-4 h-4 inline-block mr-2" />
                            Lưu phiếu Chi
                        </button>
                    </div>
                 </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default FinanceList;