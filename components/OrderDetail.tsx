import React, { useState } from 'react';
import { ArrowLeft, Printer, MessageSquare, MapPin, Phone, Mail, Package, Sparkles, Truck, Edit, CheckCircle } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { analyzeOrder } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { useOrder } from '../contexts/OrderContext';

interface OrderDetailProps {
  order: Order;
  onBack: () => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ order, onBack }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { orders, setOrders } = useOrder();

  const handleAIAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeOrder(order);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    const updatedOrders = orders.map(o => o.id === order.id ? {...o, status: newStatus} : o);
    setOrders(updatedOrders);
  };

  // Logic mới: TotalAmount (COD) = Tiền hàng - Ship
  // Do đó, Tiền hàng = TotalAmount + Ship
  const productTotal = order.totalAmount + order.shippingFee; 
  // Thực nhận = Tiền hàng - Ship = TotalAmount (COD)
  const netReceived = order.totalAmount; 
  
  const isReconciled = order.status === OrderStatus.RECONCILIATION;

  return (
    <div className="p-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">
                {order.orderCode}
              </h1>
              <span className="text-gray-400">|</span>
              <span className="text-lg text-gray-600">{order.trackingNumber}</span>
              <div className="ml-2 relative">
                  <select 
                      value={order.status}
                      onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                      className={`appearance-none pl-3 pr-8 py-1 text-sm font-semibold rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${isReconciled ? 'bg-purple-100 text-purple-700 border-purple-200 focus:ring-purple-500' : 'bg-orange-100 text-orange-700 border-orange-200 focus:ring-orange-500'}`}
                  >
                      {Object.values(OrderStatus).map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                  </select>
                  <Edit className="w-3 h-3 absolute right-3 top-2 pointer-events-none opacity-50" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Ngày tạo: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
           <button 
            onClick={handleAIAnalyze}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-700 shadow-sm transition-all"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
               <Sparkles className="w-4 h-4 mr-2" />
            )}
            AI Phân tích
          </button>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm">
            <Printer className="w-4 h-4 mr-2" />
            In vận đơn
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {/* AI Analysis Result */}
           {aiAnalysis && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
              <div className="flex items-center mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-bold text-indigo-900">AI Assistant - Đánh giá đơn hàng</h3>
              </div>
              <div className="prose prose-sm prose-indigo max-w-none text-gray-700">
                 <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            </div>
          )}
          
          {isReconciled && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center shadow-sm">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                      <h4 className="font-bold text-green-800">Đơn hàng đã Đối soát Doanh thu</h4>
                      <p className="text-sm text-green-700">Doanh thu <b>{(netReceived - order.shippingFee).toLocaleString('vi-VN')} đ</b> đã được ghi nhận vào báo cáo.</p>
                  </div>
              </div>
          )}

          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-gray-500" />
              Thông tin sản phẩm
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-500 font-semibold">
                    <th className="pb-3 pl-2">Sản phẩm</th>
                    <th className="pb-3 text-center">SL</th>
                    <th className="pb-3 text-right">Đơn giá</th>
                    <th className="pb-3 text-right pr-2">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 pl-2">
                        <div className="flex items-center">
                          <img src={item.image} alt={item.productName} className="w-10 h-10 rounded-lg object-cover mr-3 bg-gray-100" />
                          <span className="text-sm font-medium text-gray-800">{item.productName}</span>
                        </div>
                      </td>
                      <td className="py-4 text-center text-sm text-gray-600">{item.quantity}</td>
                      <td className="py-4 text-right text-sm text-gray-600">{item.price.toLocaleString('vi-VN')} đ</td>
                      <td className="py-4 text-right pr-2 text-sm font-bold text-gray-800">
                        {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-4 text-right text-sm text-gray-500">Tổng tiền hàng:</td>
                    <td className="pt-4 text-right pr-2 text-sm font-medium text-gray-800">{productTotal.toLocaleString('vi-VN')} đ</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="pt-2 text-right text-sm text-gray-500">Phí vận chuyển (Shop chịu):</td>
                    <td className="pt-2 text-right pr-2 text-sm font-medium text-red-500">-{order.shippingFee.toLocaleString('vi-VN')} đ</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="pt-2 text-right text-base font-bold text-gray-800">Tổng thu khách (COD):</td>
                    <td className="pt-2 text-right pr-2 text-base font-bold text-orange-600">
                      {order.totalAmount.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                  <tr className="bg-green-50">
                    <td colSpan={3} className="pt-2 pb-2 text-right text-sm font-bold text-green-700">Thực nhận (COD - Ship):</td>
                    <td className="pt-2 pb-2 text-right pr-2 text-sm font-bold text-green-700">
                      {(order.totalAmount - order.shippingFee).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <h3 className="text-lg font-bold text-gray-800 mb-4">Hành trình đơn hàng</h3>
             <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
                <div className="relative">
                   <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                   <p className="text-sm font-bold text-gray-800">Đơn hàng đã được tạo</p>
                   <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                {order.status !== 'Chưa lên đơn' && (
                   <div className="relative">
                     <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                     <p className="text-sm font-bold text-gray-800">Trạng thái hiện tại: {order.status}</p>
                     <p className="text-xs text-gray-500">Cập nhật mới nhất</p>
                   </div>
                )}
             </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Shipping Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
               <Truck className="w-5 h-5 mr-2 text-gray-500" />
               Thông tin vận chuyển
            </h3>
            <div className="space-y-3">
               <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Đơn vị vận chuyển</span>
                  <span className="text-sm font-semibold text-gray-800">{order.deliveryUnit || 'Chưa cập nhật'}</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Mã giao hàng</span>
                  <span className="text-sm font-mono text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">{order.deliveryCode || 'N/A'}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Phương thức thanh toán</span>
                  <span className="text-sm font-medium text-gray-800">{order.paymentMethod}</span>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Khách hàng</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-3 flex-shrink-0">
                  <span className="font-bold">{order.customer.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{order.customer.name}</p>
                  <p className="text-xs text-gray-500">Khách hàng</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-50 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" />
                  {order.customer.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  {order.customer.email}
                </div>
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                  {order.customer.address}
                </div>
              </div>

              <div className="pt-4 flex space-x-2">
                <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Gọi điện
                </button>
                <button className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Nhắn tin
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Ghi chú</h3>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800">
               {order.notes ? order.notes : 'Không có ghi chú nào.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;