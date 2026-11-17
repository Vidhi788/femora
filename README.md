# 🌸 Femora – Your Health, Understood

<p align="center">
  <strong>A Full-Stack Women's Wellness Platform</strong>
</p>

<p align="center">
  <a href="https://femora-virid.vercel.app/">Live Demo</a> •
  <a href="https://github.com/Vidhi788/femora">GitHub Repository</a>
</p>

## 💗 About Femora

**Femora** is a women's wellness platform designed to make health information and wellness resources more accessible.

It brings together a user-friendly React interface, a Spring Boot backend, and a Python-based machine learning service to provide wellness features, symptom assessment, and personalized experiences.

The goal is to create a supportive digital space where women can better understand their health and access useful wellness resources.

## ✨ Key Features

- **Wellness Dashboard:** A centralized interface for accessing women's wellness features.
- **Symptom Checker:** An ML-assisted symptom assessment system that processes selected symptoms and provides categorized results.
- **Symptom History:** Access previously submitted symptom assessments.
- **Yoga & Wellness:** Guided yoga content and routines, including period-related yoga.
- **User Authentication:** Registration, login, and OTP-based email functionality.
- **Email Reminders:** Email-based reminder functionality for wellness-related activities.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, CSS |
| Backend | Java, Spring Boot |
| Database | PostgreSQL |
| Machine Learning Service | Python, FastAPI |
| API Communication | REST APIs |
| Frontend Deployment | Vercel |

## 🏗️ System Architecture

Femora follows a modular architecture in which the frontend, backend, and ML service operate as separate components.

```text
             USER
               |
               v
       React Frontend
               |
               v
       Spring Boot Backend
          /          \
         v            v
    PostgreSQL     FastAPI ML Service
                       |
                       v
                ML Prediction
                       |
                       v
                Assessment Result
                       |
                       v
                 React Frontend
```

### How It Works

1. Users interact with the React frontend.
2. The frontend communicates with Spring Boot through REST APIs.
3. Spring Boot handles authentication, business logic, and database operations.
4. For symptom assessment, Spring Boot communicates with the separate FastAPI service.
5. The ML service processes the input and returns its prediction.
6. The backend sends the response to the frontend for display.

## 📂 Project Structure

```text
Femora/
│
├── frontend/
│   └── React application
│
├── backend/
│   └── backend/
│       └── Spring Boot application
│
├── ml-services/
│   └── ml-service/
│       ├── main.py
│       ├── general_model.pkl
│       ├── general_symptoms.pkl
│       └── general_meta.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- Java JDK
- Python 3
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Vidhi788/femora.git
cd femora
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Start the Backend

Navigate to the Spring Boot project directory:

```bash
cd backend/backend
```

Configure your database connection and required environment variables, then run:

```bash
./mvnw spring-boot:run
```

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

### 4. Start the ML Service

Navigate to the ML service directory:

```bash
cd ml-services/ml-service
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI application:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8002
```

The ML service will be available at:

`http://127.0.0.1:8002`

## 🔌 Important API Endpoints

The following are some of the symptom assessment endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/symptom-check/general/symptoms` | Retrieve available symptoms |
| POST | `/api/symptom-check/general` | Submit a symptom assessment |
| GET | `/api/symptom-check/history?userId={id}` | Retrieve assessment history |

## 🔐 Security & Privacy

- Authentication is handled by the Spring Boot backend.
- User-specific functionality is protected through backend authorization.
- Database access is managed through the backend.
- Sensitive configuration values should be stored in environment variables and not committed to GitHub.

## ⚠️ Medical Disclaimer

Femora is designed for wellness support and educational purposes. Its symptom assessment functionality is not a substitute for professional medical advice, diagnosis, or treatment.

Always consult a qualified healthcare professional regarding medical concerns.

## 🔮 Future Enhancements

- Enhanced wellness analytics and visualizations.
- Expanded personalized wellness recommendations.
- Nearby hospital and healthcare resource discovery.
- Improved reminder and notification capabilities.
- Additional ML-assisted wellness features.

## 👩‍💻 Author

**Vidhi Ruparel**

B.Tech Information Technology

[GitHub](https://github.com/Vidhi788)

---

<p align="center">
  <strong>Femora – Your health, understood. 💗</strong>
</p>
