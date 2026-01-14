import React, { useState, useEffect } from 'react';
import { Flower2, Loader2, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
  
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!emailFromUrl) {
        navigate('/login');
    }
  }, [emailFromUrl, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await verifyEmail(emailFromUrl, code);
    
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
          navigate('/login');
      }, 2000);
    } else {
      setError(result.message || 'Mã xác thực không hợp lệ.');
    }
    setIsSubmitting(false);
  };

  if (isSuccess) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác thực thành công!</h2>
                <p className="text-gray-600 mb-6">Tài khoản của bạn đã được kích hoạt. Đang chuyển hướng đến trang đăng nhập...</p>
                <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
            </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-orange-500 p-8 text-center">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
             <Mail className="w-8 h-8 text-orange-500" />
           </div>
           <h2 className="text-2xl font-bold text-white">Xác thực Email</h2>
           <p className="text-orange-100 mt-2">Vui lòng nhập mã xác thực đã được gửi đến: <br/><span className="font-bold">{emailFromUrl}</span></p>
        </div>

        <div className="p-8">
           <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-4">
                  <p>Mã kiểm thử (Demo): <b>123456</b></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Mã xác thực (6 số)</label>
                <input
                    type="text"
                    required
                    maxLength={6}
                    className="w-full text-center text-3xl tracking-[0.5em] font-bold py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                    placeholder="______"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || code.length < 6}
                className="w-full py-3 bg-orange-500 text-white rounded-lg font-bold shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Đang kiểm tra...
                  </>
                ) : 'Xác nhận'}
              </button>
           </form>

           <div className="mt-6 text-center text-sm text-gray-600">
             Không nhận được mã?{' '}
             <button className="text-orange-600 font-bold hover:underline">
               Gửi lại
             </button>
           </div>
           <div className="mt-4 text-center text-sm">
               <Link to="/login" className="text-gray-500 hover:text-gray-700">Quay lại đăng nhập</Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;