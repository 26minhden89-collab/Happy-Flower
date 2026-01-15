import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Package, CheckCircle, DollarSign, Wallet, Calendar, X, ArrowRight, TrendingUp } from 'lucide-react';
import { OrderStatus, Order, Transaction } from '../types';
import { useOrder } from '../contexts/OrderContext';
import { useFinance } from '../contexts/FinanceContext';
import { useInventory } from '../contexts/InventoryContext';

const Dashboard = () => {
  const { orders } = useOrder();
  const { transactions } = useFinance();
  const { inventory } = useInventory();

  // Date Filter State
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    end: new Date().toISOString().split('T')[0] // Today
  });

  // Drill-down View State
  const [activeView, setActiveView] = useState<'OVERVIEW' | 'REVENUE_DETAILS' | 'EXPENSE_DETAILS' | 'PROFIT_DETAILS'>('OVERVIEW');

  // --- FILTER LOGIC ---
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  // Adjust end date to include the full day
  endDate.setHours(23, 59, 59, 999);

  const isDateInRange = (dateString: string) => {
    const d = new Date(dateString);
    return d >= startDate && d <= endDate;
  };

  const filteredOrders = useMemo(() => orders.filter(o => isDateInRange(o.createdAt)), [orders, dateRange]);
  const filteredTransactions = useMemo(() => transactions.filter(t => isDateInRange(t.date)), [transactions, dateRange]);

  // --- CALCULATIONS ---
  const totalOrdersCount = filteredOrders.length;
  
  // Reconciled Orders (Doanh thu)
  const reconciledOrders = filteredOrders.filter(o => o.status === OrderStatus.RECONCILIATION);
  const reconciledCount = reconciledOrders.length;
  const totalRevenue = reconciledOrders.reduce((sum, o) => sum + (o.totalAmount - o.shippingFee), 0);

  // Expenses (Chi)
  const totalExpenses = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

  // Profit
  const totalProfit = totalRevenue - totalExpenses;

  // Chart Data Preparation (Daily within range)
  const chartData = useMemo(() => {
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Revenue for day
        const dayRev = orders
            .filter(o => o.status === OrderStatus.RECONCILIATION && o.createdAt.startsWith(dateStr))
            .reduce((sum, o) => sum + (o.totalAmount - o.shippingFee), 0);
        
        // Expense for day
        const dayExp = transactions
            .filter(t => t.type === 'EXPENSE' && t.date === dateStr)
            .reduce((sum, t) => sum + t.amount, 0);

        days.push({
            name: `${d.getDate()}/${d.getMonth()+1}`,
            revenue: dayRev,
            expense: dayExp,
            profit: dayRev - dayExp
        });
    }
    return days;
  }, [dateRange, orders, transactions]);


  // --- VIEW COMPONENTS ---

  const StatCard = ({ title, value, subValue, icon: Icon, color, onClick, active }: any) => (
    <div 
        onClick={onClick}
        className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all duration-200 hover:shadow-md ${active ? `ring-2 ring-${color.split('-')[1]}-500 border-${color.split('-')[1]}-500` : 'border-gray-100'}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className={`text-2xl font-bold text-gray-800`}>{value}</h3>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
         Xem chi tiết <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );

  const DetailTable = ({ title, columns, children, onClose }: any) => (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mt-6 animate-fade-in overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
              </button>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-semibold sticky top-0 z-10">
                      <tr>
                          {columns.map((col: string, idx: number) => (
                              <th key={idx} className="px-6 py-3">{col}</th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {children}
                  </tbody>
              </table>
          </div>
      </div>
  );

  return (
    <div className="p-6 space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Tổng quan Báo cáo</h1>
           <p className="text-sm text-gray-500">Dữ liệu được tổng hợp tự động từ Đơn hàng và Khoản chi</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <Calendar className="w-5 h-5 text-gray-400 mr-2 ml-1" />
            <input 
                type="date" 
                className="text-sm border-none focus:ring-0 text-gray-700"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <span className="mx-2 text-gray-400">-</span>
            <input 
                type="date" 
                className="text-sm border-none focus:ring-0 text-gray-700"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Đơn hàng" 
          value={totalOrdersCount} 
          subValue={`${reconciledCount} đơn đã đối soát`}
          icon={Package} 
          color="bg-blue-500"
          active={activeView === 'OVERVIEW'} // Just generic
          onClick={() => setActiveView('OVERVIEW')} 
        />
        <StatCard 
          title="Doanh Thu" 
          value={`${(totalRevenue / 1000).toLocaleString('vi-VN')}k`} 
          subValue="Thực nhận từ đơn đối soát"
          icon={CheckCircle} 
          color="bg-green-500" 
          active={activeView === 'REVENUE_DETAILS'}
          onClick={() => setActiveView('REVENUE_DETAILS')}
        />
        <StatCard 
          title="Tổng Chi" 
          value={`${(totalExpenses / 1000).toLocaleString('vi-VN')}k`} 
          subValue="Chi mua hàng & khác"
          icon={Wallet} 
          color="bg-red-500" 
          active={activeView === 'EXPENSE_DETAILS'}
          onClick={() => setActiveView('EXPENSE_DETAILS')}
        />
        <StatCard 
          title="Lợi Nhuận" 
          value={`${(totalProfit / 1000).toLocaleString('vi-VN')}k`} 
          subValue="Doanh thu - Chi phí"
          icon={TrendingUp} 
          color="bg-orange-500" 
          active={activeView === 'PROFIT_DETAILS'}
          onClick={() => setActiveView('PROFIT_DETAILS')}
        />
      </div>

      {/* DRILL DOWN VIEWS */}
      
      {activeView === 'REVENUE_DETAILS' && (
          <DetailTable 
            title={`Chi tiết Doanh Thu (${reconciledCount} đơn đối soát)`} 
            columns={['Mã Đơn', 'Khách hàng', 'Ngày tạo', 'COD', 'Phí Ship', 'Thực Nhận']}
            onClose={() => setActiveView('OVERVIEW')}
          >
              {reconciledOrders.map(o => (
                  <tr key={o.id} className="hover:bg-green-50">
                      <td className="px-6 py-4 font-medium text-blue-600">{o.orderCode}</td>
                      <td className="px-6 py-4">{o.customer.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4">{o.totalAmount.toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-gray-500">{o.shippingFee.toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 font-bold text-green-700">{(o.totalAmount - o.shippingFee).toLocaleString('vi-VN')}</td>
                  </tr>
              ))}
              {reconciledOrders.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Không có đơn hàng nào được đối soát trong khoảng thời gian này.</td></tr>
              )}
          </DetailTable>
      )}

      {activeView === 'EXPENSE_DETAILS' && (
          <DetailTable 
            title="Chi tiết Khoản Chi" 
            columns={['Ngày chi', 'Loại chi', 'Mô tả', 'Số tiền']}
            onClose={() => setActiveView('OVERVIEW')}
          >
              {filteredTransactions.filter(t => t.type === 'EXPENSE').map(t => (
                  <tr key={t.id} className="hover:bg-red-50">
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(t.date).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-xs font-medium">
                              {t.category === 'MATERIAL_PURCHASE' ? 'Mua vật tư' : 'Chi khác'}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{t.description}</td>
                      <td className="px-6 py-4 font-bold text-red-600">-{t.amount.toLocaleString('vi-VN')}</td>
                  </tr>
              ))}
              {filteredTransactions.filter(t => t.type === 'EXPENSE').length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Không có khoản chi nào trong khoảng thời gian này.</td></tr>
              )}
          </DetailTable>
      )}

      {activeView === 'PROFIT_DETAILS' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mt-6 animate-fade-in p-8">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Bảng đối chiếu Lợi Nhuận</h3>
                  <button onClick={() => setActiveView('OVERVIEW')} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="p-6 bg-green-50 rounded-xl border border-green-100 text-center">
                       <p className="text-gray-600 mb-2 font-medium">Tổng Doanh Thu</p>
                       <h2 className="text-3xl font-bold text-green-600">{totalRevenue.toLocaleString('vi-VN')} đ</h2>
                       <p className="text-xs text-green-700 mt-2">Từ {reconciledCount} đơn đối soát</p>
                   </div>
                   <div className="flex justify-center items-center">
                       <div className="bg-gray-100 rounded-full p-2">
                           <span className="text-2xl font-bold text-gray-400">-</span>
                       </div>
                   </div>
                   <div className="p-6 bg-red-50 rounded-xl border border-red-100 text-center">
                       <p className="text-gray-600 mb-2 font-medium">Tổng Chi Phí</p>
                       <h2 className="text-3xl font-bold text-red-600">{totalExpenses.toLocaleString('vi-VN')} đ</h2>
                       <p className="text-xs text-red-700 mt-2">{filteredTransactions.length} phiếu chi</p>
                   </div>
               </div>
               <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                   <p className="text-gray-500 mb-2 text-lg">Lợi Nhuận Ròng</p>
                   <h1 className={`text-5xl font-bold ${totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                       {totalProfit.toLocaleString('vi-VN')} đ
                   </h1>
               </div>
          </div>
      )}

      {/* CHART SECTION */}
      {activeView === 'OVERVIEW' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Biểu đồ Lợi nhuận theo ngày</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`${value.toLocaleString('vi-VN')} đ`]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Doanh thu"
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fillOpacity={0} 
                  fill="url(#colorProfit)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  name="Chi phí"
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fillOpacity={0} 
                />
                 <Area 
                  type="monotone" 
                  dataKey="profit" 
                  name="Lợi nhuận"
                  stroke="#f97316" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;