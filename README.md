      📬   Real-Time Chat App

This is a full-stack real-time chat application built with Node.js, Express, PostgreSQL, WebSockets, and a React + Bootstrap frontend. It features live messaging, emoji reactions, media uploads, and JWT-based authentication.

🚀 Features
🧑‍💬 User Authentication (JWT)

💬 Real-time chat using WebSocket

🖼️ Media message support (image uploads)

😀 Emoji reactions to messages

✏️ Edit/Delete messages

⏰ Relative timestamps

📱 Responsive design with Bootstrap


🛠️ Tech Stack
  Frontend: React, Bootstrap, Emoji Picker

  Backend: Node.js, Express, WebSocket

  Database: PostgreSQL

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

