const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const fs = require('fs'); // Thêm thư viện đọc file
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Hàm đọc dữ liệu từ file mockdata
function getLocalMovies() {
    try {
        const data = fs.readFileSync('./mockdata.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Không đọc được file mockdata:", err);
        return [];
    }
}

app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const movies = getLocalMovies();

        // Kỹ thuật RAG: Nhúng dữ liệu vào ngữ cảnh (Context)
        // Chúng ta biến danh sách phim thành một chuỗi văn bản để AI đọc
        const movieContext = movies.map(m => `- ${m.title} (${m.genre}): ${m.desc}`).join('\n');

        const prompt = `
            BẠN LÀ CHUYÊN GIA PHIM ẢNH. 
            DƯỚI ĐÂY LÀ DANH SÁCH PHIM TRONG KHO DỮ LIỆU CỦA CHÚNG TÔI:
            ${movieContext}

            YÊU CẦU CỦA NGƯỜI DÙNG: "${message}"

            NHIỆM VỤ:
            1. Nếu có phim trong danh sách trên phù hợp, hãy ưu tiên gợi ý phim đó.
            2. Nếu không có phim phù hợp trong danh sách, bạn có thể gợi ý phim nổi tiếng khác bên ngoài.
            3. Trả lời ngắn gọn, thân thiện.
        `;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error("Lỗi:", error.message);
        res.status(500).json({ reply: "Lỗi hệ thống: " + error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server RAG đang chạy tại http://localhost:${PORT}`));