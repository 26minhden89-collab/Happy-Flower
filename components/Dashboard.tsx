import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Package, CheckCircle, DollarSign, Wallet, Calendar, X, ArrowRight, TrendingUp, Info, ShoppingCart } from 'lucide-react';
import { OrderStatus, Order, Transaction } from '../types';
import { useOrder } from '../contexts/OrderContext';
import { useFinance } from '../contexts/FinanceContext';

const Dashboard = () => {
  const { orders } = useOrder();
  const { transactions } = useFinance();

  // Date Filter State
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    end: new Date().toISOString().split('T')[0] // Today
  });

  // --- FILTER LOGIC ---
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  endDate.setHours(23, 59, 59, 999);

  const isDateInRange = (dateString: string) => {
    const d = new Date(dateString);
    return d >= startDate && d <= endDate;
  };

  const filteredOrders = useMemo(() => orders.filter(o => isDateInRange(o.createdAt)), [orders, dateRange]);
  const filteredTransactions = useMemo(() => transactions.filter(t => isDateInRange(t.date)), [transactions, dateRange]);

  // --- FINANCIAL METRICS (SOURCE: TRANSACTIONS ONLY) ---
  const finIncome = filteredTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const finExpense = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const finProfit = finIncome - finExpense;

  // --- OPERATIONAL METRICS (SOURCE: ORDERS ONLY) ---
  const opTotalOrders = filteredOrders.length;
  const opReconciledOrders = filteredOrders.filter(o => o.status === OrderStatus.RECONCILIATION);
  const opReconciledCount = opReconciledOrders.length;
  // Estimated Net Sales from Orders (For reference only, not Financial Report)
  const opEstimatedNet = opReconciledOrders.reduce((sum, o) => sum + (o.totalAmount - o.shippingFee), 0);
  const opShippingOrders = filteredOrders.filter(o => o.status === OrderStatus.SHIPPING || o.status === OrderStatus.PROCESSING).length;


  // Chart Data Preparation (Financial Flow)
  const chartData = useMemo(() => {
    const days = [];
    const loopStart = new Date(startDate);
    const loopEnd = new Date(endDate);
    
    for (let d = new Date(loopStart); d <= loopEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Financial Data Only
        const dayInc = transactions
            .filter(t => t.type === 'INCOME' && t.date === dateStr)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const dayExp = transactions
            .filter(t => t.type === 'EXPENSE' && t.date === dateStr)
            .reduce((sum, t) => sum + t.amount, 0);

        days.push({
            name: `${d.getDate()}/${d.getMonth()+1}`,
            income: dayInc,
            expense: dayExp,
            profit: dayInc - dayExp
        });
    }
    return days;
  }, [dateRange, transactions]);


  // --- COMPONENT HELPERS ---
  const StatCard = ({ title, value, subValue, icon: Icon, color, textColor, tooltip }: any) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group overflow-hidden`}>
      <div className={`absolute top-0 right-0 p-4 opacity-10 ${textColor}`}>
          <Icon className="w-16 h-16" />
      </div>
      <div className="relative z-10">
          <p className="text-sm text-gray-500 mb-1 flex items-center font-medium uppercase tracking-wide">
             {title}
             {tooltip && <Info className="w-3 h-3 ml-1 text-gray-400 cursor-help" title={tooltip}/>}
          </p>
          <h3 className={`text-3xl font-bold ${textColor} mb-1`}>{value}</h3>
          {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Tổng quan Báo cáo</h1>
           <p className="text-sm text-gray-500">Báo cáo được chia thành 2 phần độc lập: Tài chính & Vận hành</p>
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
      
      {/* --- BLOCK 1: FINANCIAL OVERVIEW (STRICT) --- */}
      <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center border-l-4 border-blue-500 pl-3">
              1. TỔNG QUAN TÀI CHÍNH (SỔ QUỸ)
          </h2>
          <p className="text-xs text-gray-500 italic pl-4 -mt-3 mb-2">Dữ liệu lấy trực tiếp từ Quản lý Thu - Chi (Không tính từ đơn hàng chưa thu tiền)</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="Tổng Thu Nhập" 
                value={`${(finIncome / 1000).toLocaleString('vi-VN')}k`} 
                subValue="Từ phiếu thu bán hàng & thu khác"
                icon={DollarSign} 
                color="bg-green-500"
                textColor="text-green-600"
                tooltip="Tổng tiền đã thực thu và ghi vào Sổ Quỹ"
              />
              <StatCard 
                title="Tổng Chi Phí" 
                value={`${(finExpense / 1000).toLocaleString('vi-VN')}k`} 
                subValue="Mua vật tư & Chi phí vận hành"
                icon={Wallet} 
                color="bg-red-500"
                textColor="text-red-600"
                tooltip="Tổng tiền đã chi ra và ghi vào Sổ Quỹ"
              />
              <StatCard 
                title="Lợi Nhuận Ròng" 
                value={`${(finProfit / 1000).toLocaleString('vi-VN')}k`} 
                subValue="Tổng Thu - Tổng Chi"
                icon={TrendingUp} 
                color="bg-blue-500"
                textColor={finProfit >= 0 ? 'text-blue-600' : 'text-red-600'}
                tooltip="Số tiền thực còn lại trong quỹ"
              />
          </div>
      </div>

      {/* --- CHART SECTION --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-600 mb-6 uppercase">Biểu đồ dòng tiền (Thu / Chi)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`${value.toLocaleString('vi-VN')} đ`]}
                />
                <Area type="monotone" dataKey="income" name="Thu nhập" stroke="#16a34a" strokeWidth={2} fillOpacity={0} />
                <Area type="monotone" dataKey="expense" name="Chi phí" stroke="#dc2626" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* --- BLOCK 2: OPERATIONAL STATISTICS (STRICT) --- */}
      <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 flex items-center border-l-4 border-orange-500 pl-3">
              2. THỐNG KÊ VẬN HÀNH (ĐƠN HÀNG)
          </h2>
          <p className="text-xs text-gray-500 italic pl-4 -mt-3 mb-2">Số liệu thống kê hoạt động bán hàng (Mang tính tham khảo, chưa chắc chắn đã thu tiền)</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
                  <div className="p-3 bg-blue-50 rounded-lg mr-4">
                      <Package className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Tổng đơn tạo</p>
                      <h4 className="text-xl font-bold text-gray-800">{opTotalOrders}</h4>
                  </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
                  <div className="p-3 bg-orange-50 rounded-lg mr-4">
                      <ShoppingCart className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Đang xử lý / Giao</p>
                      <h4 className="text-xl font-bold text-gray-800">{opShippingOrders}</h4>
                  </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
                  <div className="p-3 bg-purple-50 rounded-lg mr-4">
                      <CheckCircle className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Đã đối soát</p>
                      <h4 className="text-xl font-bold text-gray-800">{opReconciledCount}</h4>
                  </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
                  <div className="p-3 bg-gray-100 rounded-lg mr-4">
                      <DollarSign className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Giá trị thực nhận (Est)</p>
                      <h4 className="text-xl font-bold text-gray-600" title="Tổng COD - Ship của các đơn đối soát">
                          {(opEstimatedNet / 1000).toLocaleString('vi-VN')}k
                      </h4>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;