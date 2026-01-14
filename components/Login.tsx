import React, { useState } from 'react';
import { Flower2, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Email hoặc mật khẩu không chính xác.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-orange-500 p-8 text-center">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
             <Flower2 className="w-10 h-10 text-orange-500" />
           </div>
           <h2 className="text-2xl font-bold text-white">Happy Flower Manager</h2>
           <p className="text-orange-100 mt-2">Đăng nhập để quản lý cửa hàng</p>
        </div>

        <div className="p-8">
           <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                    placeholder="admin@happyflower.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-600">
                  <input type="checkbox" className="mr-2 rounded text-orange-500 focus:ring-orange-500" />
                  Ghi nhớ đăng nhập
                </label>
                <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">Quên mật khẩu?</a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-orange-500 text-white rounded-lg font-bold shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : 'Đăng nhập'}
              </button>
           </form>

           <div className="mt-6 text-center text-sm text-gray-600">
             Chưa có tài khoản?{' '}
             <Link to="/register" className="text-orange-600 font-bold hover:underline">
               Đăng ký ngay
             </Link>
           </div>
           <div className="mt-6 text-center text-xs text-gray-400">
              Demo Account: admin@happyflower.com / 123
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;