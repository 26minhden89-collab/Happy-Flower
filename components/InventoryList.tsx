import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, X, Save } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import { InventoryItem } from '../types';

const InventoryList = () => {
  const { inventory, addItem, updateItem, deleteItem } = useInventory();
  
  // State quản lý UI
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // State cho xác nhận xóa
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: ''
  });

  // Filter Logic
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const resetForm = () => {
    setFormData({ name: '', quantity: '', unit: '' });
    setEditingItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseInt(formData.quantity) || 0;

    if (editingItem) {
      updateItem(editingItem.id, {
        name: formData.name,
        quantity: quantity,
        unit: formData.unit
      });
    } else {
      addItem({
        name: formData.name,
        quantity: quantity,
        unit: formData.unit
      });
    }
    setIsModalOpen(false);
    resetForm();
  };

  // Mở modal xác nhận xóa
  const onRequestDelete = (id: string) => {
    setItemToDelete(id);
  };

  // Xác nhận xóa
  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete);
      setItemToDelete(null);
    }
  };

  return (
    <div className="p-6 relative animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý kho</h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi tồn kho vật tư và hoa tươi</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm vật tư
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Tìm kiếm tên vật tư..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-gray-50 focus:bg-white"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                <th className="px-6 py-4">Tên Vật Tư</th>
                <th className="px-6 py-4 text-center">Số lượng</th>
                <th className="px-6 py-4 text-center">Đơn vị</th>
                <th className="px-6 py-4">Cập nhật cuối</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 mr-3">
                         <Package className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-800">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${item.quantity < 20 ? 'text-red-500' : 'text-gray-800'}`}>
                      {item.quantity.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-600 text-sm bg-gray-100 px-2 py-1 rounded">
                      {item.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onRequestDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    Không tìm thấy vật tư nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Xóa vật tư?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa vật tư này không? <br/>Hành động này <span className="font-semibold text-red-500">không thể hoàn tác</span>.
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-lg shadow-red-200 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {editingItem ? 'Cập nhật vật tư' : 'Thêm vật tư mới'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Vật Tư <span className="text-red-500">*</span></label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  placeholder="VD: Hoa Hồng Đỏ"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng <span className="text-red-500">*</span></label>
                   <input 
                      required
                      type="number" 
                      min="0"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-center font-medium"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tính <span className="text-red-500">*</span></label>
                   <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    placeholder="VD: cành, bó"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                 <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 shadow-md transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingItem ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;