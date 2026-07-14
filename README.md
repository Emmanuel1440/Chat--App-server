      📬   Real-Time Chat App
# 📬 Chat App - Backend (Server-Side)

The backend engine powering the real-time chat application. It manages the REST API endpoints, user sessions, database interactions, and active WebSocket connections.

## 🛠️ Tech Stack
* **Runtime**: Node.js & Express
* **Database**: PostgreSQL (persisting messages, users, and emoji reactions)
* **Real-time**: WebSocket (`ws` package)
* **Authentication**: JWT (JSON Web Tokens)
* **File Handling**: Multer (for local media storage and static serving)

---

## 🚀 Installation & Setup

### 1. Database Setup
Ensure you have a running **PostgreSQL** instance. Create a new database:
```sql
CREATE DATABASE chat_db;


Auth: JWT (JSON Web Token)

File Upload: Static file serving from backend

📦 Installation
     Clone the repo

       git clone https://github.com/Emmanuel1440/Chat--App-server.git
       cd chat-app
       
      
  Backend Setup

    cd backend
    npm install
    # Set up PostgreSQL DB and add your .env config
    npm run dev
    
   Frontend Setup

     cd frontend
     npm install
     npm start
     
🔄 WebSocket
On connection: authenticates user via token.

On message: broadcasts the message to all clients.

On reaction: updates and shares reactions in real-time.

