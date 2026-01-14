import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Package, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { CHART_DATA } from '../services/mockData';
import { OrderStatus } from '../types';
import { useOrder } from '../contexts/OrderContext';

const Dashboard = () => {
  const { orders } = useOrder();

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
  // Tính toán tỷ lệ hoàn hàng dựa trên dữ liệu thực tế (nếu có đơn RETURNED)
  const returnedOrders = orders.filter(o => o.status === OrderStatus.RETURNED).length;
  const returnRate = totalOrders > 0 ? ((returnedOrders / totalOrders) * 100).toFixed(1) : '0';

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        {trend > 0 ? (
          <span className="text-green-500 flex items-center font-medium">
            <ArrowUpRight className="w-4 h-4 mr-1" /> +{trend}%
          </span>
        ) : (
          <span className="text-red-500 flex items-center font-medium">
            <ArrowDownRight className="w-4 h-4 mr-1" /> {trend}%
          </span>
        )}
        <span className="text-gray-400 ml-2">so với hôm qua</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Tổng quan kinh doanh</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng đơn hàng" 
          value={totalOrders} 
          icon={Package} 
          trend={12.5} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Doanh thu" 
          value={`${(totalRevenue / 1000000).toFixed(1)} Tr`} 
          icon={CheckCircle} 
          trend={8.2} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Đang xử lý" 
          value={pendingOrders} 
          icon={Truck} 
          trend={-2.4} 
          color="bg-orange-500" 
        />
        <StatCard 
          title="Tỷ lệ hoàn hàng" 
          value={`${returnRate}%`} 
          icon={AlertCircle} 
          trend={-1.1} 
          color="bg-red-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Biểu đồ doanh thu tuần qua</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} tickFormatter={(value) => `${value/1000000}Tr`} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`${value.toLocaleString('vi-VN')} đ`, 'Doanh thu']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Trạng thái đơn hàng</h3>
          <div className="space-y-4">
            {[
              { label: 'Chờ lấy hàng', count: orders.filter(o => o.status === OrderStatus.PENDING).length, color: 'bg-yellow-500' },
              { label: 'Đang giao hàng', count: orders.filter(o => o.status === OrderStatus.SHIPPING).length, color: 'bg-orange-500' },
              { label: 'Đã giao hàng', count: orders.filter(o => o.status === OrderStatus.DELIVERED).length, color: 'bg-green-500' },
              { label: 'Đã hủy', count: orders.filter(o => o.status === OrderStatus.CANCELLED).length, color: 'bg-red-500' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full ${item.color} mr-3`}></span>
                  <span className="text-gray-600 font-medium">{item.label}</span>
                </div>
                <span className="text-gray-800 font-bold">{item.count}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-100">
            <h4 className="font-semibold text-orange-800 mb-2">Mẹo bán hàng</h4>
            <p className="text-sm text-orange-700">
              Đơn hàng hoa tươi dịp 20/11 đang tăng cao. Hãy chuẩn bị nguồn hàng và nhân sự giao hàng để đảm bảo tiến độ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;