import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, LayoutGrid, X, Save, Boxes, Info } from 'lucide-react';
import { useProduct } from '../contexts/ProductContext';
import { useInventory } from '../contexts/InventoryContext';
import { Product, ProductRecipe } from '../types';

const ProductList = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProduct();
  const { inventory } = useInventory();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    notes: '',
    recipe: [] as ProductRecipe[]
  });

  // State for Recipe Builder
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [materialQty, setMaterialQty] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ name: '', price: '', notes: '', recipe: [] });
    setEditingProduct(null);
    setSelectedMaterialId('');
    setMaterialQty('');
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      notes: product.notes || '',
      recipe: product.recipe || []
    });
    setIsModalOpen(true);
  };

  // Recipe Handlers
  const handleAddMaterialToRecipe = () => {
      if (!selectedMaterialId || !materialQty) return;
      const qty = parseInt(materialQty);
      if (qty <= 0) return;

      const existingIndex = formData.recipe.findIndex(r => r.inventoryId === selectedMaterialId);
      if (existingIndex >= 0) {
          const updated = [...formData.recipe];
          updated[existingIndex].quantity = qty; // Update new quantity
          setFormData({...formData, recipe: updated});
      } else {
          setFormData({...formData, recipe: [...formData.recipe, { inventoryId: selectedMaterialId, quantity: qty }]});
      }
      setSelectedMaterialId('');
      setMaterialQty('');
  };

  const handleRemoveMaterialFromRecipe = (invId: string) => {
      setFormData({...formData, recipe: formData.recipe.filter(r => r.inventoryId !== invId)});
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseInt(formData.price) || 0;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        price: price,
        notes: formData.notes,
        recipe: formData.recipe
      });
    } else {
      addProduct({
        name: formData.name,
        price: price,
        notes: formData.notes,
        recipe: formData.recipe
      });
    }
    setIsModalOpen(false);
    resetForm();
  };

  const confirmDelete = () => {
      if (productToDelete) {
          deleteProduct(productToDelete);
          setProductToDelete(null);
      }
  };

  return (
    <div className="p-6 relative animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">Định nghĩa sản phẩm & Định mức vật tư (Recipe)</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm sản phẩm
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Tìm kiếm tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-gray-50 focus:bg-white"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                             <LayoutGrid className="w-6 h-6" />
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditModal(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                  <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => setProductToDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{product.name}</h3>
                      <p className="text-orange-600 font-bold mb-3">{product.price.toLocaleString('vi-VN')} đ</p>
                      
                      {product.notes && (
                          <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">{product.notes}</p>
                      )}

                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="flex items-center text-xs font-bold text-gray-500 mb-2 uppercase">
                              <Boxes className="w-3 h-3 mr-1" /> Định mức vật tư ({product.recipe.length})
                          </div>
                          <div className="space-y-1">
                              {product.recipe.slice(0, 3).map(r => {
                                  const inv = inventory.find(i => i.id === r.inventoryId);
                                  return (
                                      <div key={r.inventoryId} className="flex justify-between text-xs text-gray-700">
                                          <span>{inv?.name || 'Vật tư đã xóa'}</span>
                                          <span className="font-medium text-gray-900">{r.quantity} {inv?.unit}</span>
                                      </div>
                                  )
                              })}
                              {product.recipe.length > 3 && (
                                  <div className="text-xs text-gray-400 italic pt-1">+ {product.recipe.length - 3} vật tư khác...</div>
                              )}
                              {product.recipe.length === 0 && (
                                  <div className="text-xs text-gray-400 italic">Chưa cấu hình vật tư</div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {/* Delete Confirmation */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
             <h3 className="text-lg font-bold text-gray-800 mb-2">Xóa sản phẩm?</h3>
             <p className="text-gray-500 text-sm mb-6">Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác.</p>
             <div className="flex gap-3">
                 <button onClick={() => setProductToDelete(null)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                 <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Xóa</button>
             </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form id="productForm" onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên Sản Phẩm <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="VD: Bó Hoa Hồng Đỏ"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá Bán (VNĐ) <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-600"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  rows={2}
                  placeholder="Mô tả thêm..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              {/* RECIPE BUILDER */}
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <h4 className="font-bold text-orange-800 text-sm mb-2 flex items-center">
                      <Boxes className="w-4 h-4 mr-2" />
                      Cấu hình Định mức Vật tư (Recipe)
                  </h4>
                  <p className="text-xs text-orange-600 mb-4">Khi tạo đơn có sản phẩm này, hệ thống sẽ tự động trừ kho các vật tư bên dưới.</p>

                  <div className="flex gap-2 mb-4">
                      <select 
                          className="flex-1 px-3 py-2 border border-orange-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          value={selectedMaterialId}
                          onChange={(e) => setSelectedMaterialId(e.target.value)}
                      >
                          <option value="">-- Chọn vật tư thành phần --</option>
                          {inventory.map(i => (
                              <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                          ))}
                      </select>
                      <input 
                          type="number"
                          className="w-24 px-3 py-2 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Số lượng"
                          value={materialQty}
                          onChange={(e) => setMaterialQty(e.target.value)}
                      />
                      <button 
                          type="button"
                          onClick={handleAddMaterialToRecipe}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600"
                      >
                          Thêm
                      </button>
                  </div>

                  <div className="bg-white rounded-lg border border-orange-100 overflow-hidden">
                      <table className="w-full text-sm">
                          <thead className="bg-orange-50 text-orange-800 text-xs uppercase font-semibold">
                              <tr>
                                  <th className="px-4 py-2 text-left">Vật tư</th>
                                  <th className="px-4 py-2 text-center">Số lượng</th>
                                  <th className="px-4 py-2 text-center w-10"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-orange-100">
                              {formData.recipe.map(r => {
                                  const inv = inventory.find(i => i.id === r.inventoryId);
                                  return (
                                      <tr key={r.inventoryId}>
                                          <td className="px-4 py-2">{inv?.name}</td>
                                          <td className="px-4 py-2 text-center font-bold">{r.quantity} {inv?.unit}</td>
                                          <td className="px-4 py-2 text-center">
                                              <button type="button" onClick={() => handleRemoveMaterialFromRecipe(r.inventoryId)} className="text-gray-400 hover:text-red-500">
                                                  <X className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  );
                              })}
                              {formData.recipe.length === 0 && (
                                  <tr>
                                      <td colSpan={3} className="px-4 py-6 text-center text-gray-400 italic text-xs">Chưa có vật tư nào.</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

            </form>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                 <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  form="productForm"
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 shadow-md transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingProduct ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;