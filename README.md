# Eduverse.ai

[![Eduverse.ai Logo](https://res.cloudinary.com/srvraj311/image/upload/c_scale,w_346/v1743788747/Group_4_n7afsr.png)](https://eduverse-backend-lqj5.onrender.com/)

**Eduverse.ai** is an AI-powered platform designed to generate personalized learning paths based on user preferences, such as age group, language, and learning duration. The application leverages **LLaMA 3 70B** via the **Groq API**, with a **React frontend** and a **FastAPI backend** for seamless learning path generation.

## 📌 Features

✅ AI-powered structured learning paths  
✅ User preferences (age, language, duration) for tailored learning  
✅ Interactive chat-based UI  
✅ Dynamic content generation with LLaMA 3 70B  
✅ MongoDB database for storing user learning goals  
✅ Responsive UI for a smooth user experience  
✅ Future expansion to more AI models  

---

## 🛠 Tech Stack

| Component  | Technology  |
|------------|------------|
| **Frontend** | React.js |
| **Backend** | FastAPI (Python) |
| **Database** | MongoDB |
| **AI Model** | LLaMA 3 70B (Groq API) |
| **Deployment** | Vercel (Frontend) & Render/Fly.io (Backend) |

---

## 🔥 Architecture Diagram

![Eduverse.ai Architecture](assets/architecture.png)

1️⃣ **User Query:** Users ask a question like _"I want to learn Python"_.  
2️⃣ **Backend Processing:** FastAPI processes the query and fetches user data from MongoDB.  
3️⃣ **AI Model Interaction:** The query is enhanced and sent to LLaMA 3 70B via Groq API.  
4️⃣ **Response Handling:** If short, the response is shown in chat. If detailed, a structured learning path JSON is generated.  
5️⃣ **Frontend Display:** The learning path is mapped into an intuitive UI that users can save.  

---

## 🔄 API Flow

### 1️⃣ User Query Submission
```json
POST api/chat/
{
  "query": "I want to learn Python",
  "preferences": {
    "ageGroup": "Under 10",
    "language": "English",
    "duration": 15
  }
}
```

### 2️⃣ Backend Processing & AI Response
```json
{
  "response": "To learn Python, start with the basics: variables, loops, and functions. Here’s a structured plan: ...",
  "type": "learning_path"
}
```

### 3️⃣ Learning Path JSON Structure
```json
{
  "learning_goals": [
    {
      "name": "Python Basics",
      "duration": "2 weeks",
      "study_plans": [
        { "name": "Introduction", "links": ["https://example.com"] },
        { "name": "Data Types", "links": ["https://example.com"] }
      ]
    }
  ]
}
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB instance (local or cloud)

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/your-repo/eduverse-ai.git
cd eduverse-ai
```

### 2️⃣ Backend Setup (FastAPI)
```sh
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3️⃣ Frontend Setup (React)
```sh
cd frontend
npm install
npm start
```

---

## 📌 Usage Guide

1. Visit `http://localhost:5173`
2. Enter a learning query (e.g., "I want to learn Python") select learning path toggle
3. Select your preferences (Age, Language, Duration)
4. Receive a structured learning path
5. Save or modify your plan

---

## 🌟 Future Enhancements

🔹 Support for multiple AI models (GPT-4, Claude)  
🔹 More language options  
🔹 AI-generated quizzes  
🔹 Mobile app development  

---

## 📜 License
MIT License

---

## 🤝 Contributing
We welcome contributions! Please open an issue or submit a pull request.

---

## 📩 Contact
📧 Email: sourabhraj311@gmail.com   
🌐 Website: [Eduverse.ai](https://https://eduverse-backend-lqj5.onrender.com/)  
