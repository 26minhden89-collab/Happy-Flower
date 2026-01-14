import { GoogleGenAI } from "@google/genai";
import { Order } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeOrder = async (order: Order): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please configure the environment.";
  }

  const model = "gemini-3-flash-preview";
  const prompt = `
    Bạn là trợ lý AI cho hệ thống quản lý đơn hàng Happy Flower (Shop hoa tươi).
    Hãy phân tích đơn hàng sau và đưa ra một bản tóm tắt ngắn gọn cho nhân viên xử lý:
    
    Thông tin đơn hàng:
    - Mã vận đơn: ${order.trackingNumber}
    - Khách hàng: ${order.customer.name}
    - Địa chỉ: ${order.customer.address}
    - Sản phẩm: ${order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
    - Ghi chú: ${order.notes || 'Không có'}
    - Tổng tiền: ${order.totalAmount.toLocaleString('vi-VN')} VND

    Yêu cầu đầu ra:
    1. Đánh giá mức độ ưu tiên (Dựa trên giá trị đơn và ghi chú).
    2. Cảnh báo rủi ro (Hàng dễ hỏng, địa chỉ xa, ghi chú đặc biệt).
    3. Gợi ý mẫu tin nhắn SMS ngắn gọn để gửi khách xác nhận đơn hàng (Giọng điệu thân thiện, chuyên nghiệp).
    
    Hãy trả về định dạng Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "Không thể phân tích đơn hàng này.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Đã xảy ra lỗi khi kết nối với AI Assistant.";
  }
};
