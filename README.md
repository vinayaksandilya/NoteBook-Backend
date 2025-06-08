
# 🧠 Notebook — PDF to Course Builder (Backend)

> Transform structured PDFs into full-blown courses with modules, summaries, and key takeaways using AI models like GPT-4, Claude 3.7, and Gemini 2.5 Pro.



## 🌐 Live Links

- 🛠 **Backend API**: [https://notebook-backend.bhoral.com](https://notebook-backend.bhoral.com)  
- 🎨 **Frontend App**: [https://notebook.bhoral.com](https://notebook.bhoral.com)  
- 📘 **Frontend Repository**: [Notebook Frontend GitHub](https://github.com/vinayaksandilya/NoteBook-Front-End)  
- 📖 **API Documentation (Theneo)**: [View Full Docs](https://app.theneo.io/vinayak/notebook/)

---

## 🧩 What It Does

Notebook lets users convert a single PDF into a full learning course by:

- 📄 Uploading a structured or scanned PDF  
- 🧠 Selecting an AI model and PDF parsing engine  
- 🧱 Generating:
  - A title and course description
  - Multiple learning modules
  - Summaries and key takeaways for each module  
- 📤 Exporting the result in Markdown  
- 🔐 Accessing and managing via secure login (JWT-based)

---

## ⚙️ Tech Stack

- **Backend**: Node.js, Express.js  
- **Database**: MySQL (via Sequelize ORM)  
- **Authentication**: JWT, bcrypt  
- **AI Processing**: OpenRouter (Claude, GPT-4, Gemini support)  
- **PDF Parsing**: Text and OCR engines (e.g., Mistral OCR)  
- **Storage**: AWS S3-compatible bucket  
- **Frontend**: NextJS ([Repo](https://github.com/vinayaksandilya/NoteBook-Front-End))

---

## 🔐 Authentication API

| Method | Endpoint              | Description             |
|--------|-----------------------|-------------------------|
| POST   | `/api/users/register` | Register a new user     |
| POST   | `/api/users/login`    | Authenticate user (JWT) |
| GET    | `/api/users/profile`  | Fetch user profile      |
| PATCH  | `/api/users/profile`  | Update user details     |

> 🔒 All course-related endpoints require a Bearer token (JWT).

---

## 📚 Course API Endpoints

| Method | Endpoint                            | Description                                 |
|--------|-------------------------------------|---------------------------------------------|
| GET    | `/api/courses/my-courses`           | Fetch all of a user's created courses       |
| POST   | `/api/courses/create-from-file`     | Upload a PDF and generate a course          |
| GET    | `/api/courses/:id`                  | Get details of a single course              |
| GET    | `/api/courses/:id/export/markdown`  | Export course as a Markdown file            |
| PUT    | `/api/courses/:id`                  | Edit/update a course                        |

---

## 🧠 AI & PDF Engine Options

| Method | Endpoint                              | Description                                  |
|--------|---------------------------------------|----------------------------------------------|
| GET    | `/api/courses/available-models`       | Returns all supported AI models              |
| GET    | `/api/courses/available-engines`      | Lists available PDF parsing engines (OCR etc.)|

---

## 🧪 Sample Course Output (JSON)

```json
{
  "heading": "Data Ethics and Responsible Engineering",
  "summary": "This module explores the ethical dimensions of data use, privacy-preserving machine learning, and responsible AI development.",
  "key_takeaways": [
    "Ethical data practices build user trust.",
    "Federated learning protects sensitive data.",
    "Integrity in innovation ensures societal impact."
  ]
}
````

---

## 🚀 Quickstart (Local Setup)

```bash
git clone https://github.com/vinayaksandilya/NoteBook-Backend.git
cd NoteBook-Backend
npm install
```

### Create `.env` file

```env
# Database Config
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=notebook

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=XXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXX
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=XXXXXX

# AI Key
OPEN_ROUTER_KEY=XXXXXXXXX

# Server Port
PORT=3000
```

### Start the development server

```bash
npm run dev
```

Backend is now available at `http://localhost:3000`

---

## 📤 PDF Upload & Generation

To generate a course from a PDF:

```http
POST /api/courses/create-from-file
Authorization: Bearer <JWT>

{
  "fileId": "<uploaded_file_id>",
  "options": {
    "pdfEngine": "pdf-text",
    "aiModel": "anthropic/claude-3.7-sonnet"
  }
}
```

---

## 📦 Export Course

```http
GET /api/courses/:id/export/markdown
Authorization: Bearer <JWT>
```

Returns a downloadable `.md` file of your full course.

---

## 🛠 Deployment Notes

* 🐳 Docker-ready for containerization
* ⚙️ Nginx recommended as reverse proxy
* ☁️ File uploads handled via AWS S3
* 🔐 Secrets should be managed securely in production environments

---

## 🤝 Contributing

Pull requests, feature suggestions, and feedback are welcome!

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push and open a PR

---

## 📝 License

MIT License — use, fork, build freely.

---

## 🚧 Roadmap

* [ ] Admin dashboard for course management
* [ ] Quiz and test generation from modules
* [ ] Collaborative course editing
* [ ] Support for multilingual courses
* [ ] LMS integrations (Teachable, Moodle)
* [ ] Course analytics & tracking

---

## 🧠 Built With Love

Created by [Vinayak Sandilya](https://github.com/vinayaksandilya) to make knowledge creation easier and smarter.




```
