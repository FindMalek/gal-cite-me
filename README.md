# GenAI Labs - AI-Powered Research Assistant

A modern, full-stack research assistant powered by AI that enables users to ask questions about uploaded documents and get grounded, well-sourced answers.

## 🚀 Features

- **Document Upload & Processing**: Upload PDF documents with automatic chunking and embedding generation
- **AI-Powered Q&A**: Ask natural language questions and get intelligent responses
- **RAG (Retrieval-Augmented Generation)**: Context-aware responses with source citations
- **Citation Tracking**: Automatic citation formatting and usage tracking
- **Usage Analytics**: Real-time "Most Cited Articles" chart
- **Modern UI**: Beautiful, responsive interface with dark mode support
- **Authentication**: Secure user authentication and session management

## 🏗️ Architecture

```
Document Upload → PDF Processing → Chunking → Embedding → Vector Search → RAG → AI Response
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, AI SDK
- **Database**: PostgreSQL with Drizzle ORM
- **AI Provider**: Void AI (OpenAI-compatible)
- **File Storage**: Vercel Blob Storage
- **Authentication**: NextAuth.js
- **Vector Search**: Cosine similarity with PostgreSQL

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd gal-cite-me
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file:
```env
VOID_API_KEY=your_void_ai_api_key
POSTGRES_URL=your_postgres_connection_string
AUTH_SECRET=your_nextauth_secret
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

4. **Set up the database**
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

5. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🔧 Configuration

### AI Provider Setup
The application uses Void AI as the AI provider. To get your API key:
1. Visit https://api.voidai.app/
2. Sign up and get your API key
3. Add it to your `.env.local` file as `VOID_API_KEY`

### Database Setup
The application uses PostgreSQL with the following schema:
- **Users**: Authentication and user management
- **Chats**: Chat history and messages
- **Chunks**: Document chunks with embeddings and metadata

## 📖 Usage

1. **Register/Login**: Create an account or sign in
2. **Upload Documents**: Upload PDF files through the file manager
3. **Select Files**: Choose which documents to include in your query
4. **Ask Questions**: Type natural language questions
5. **View Citations**: See source citations and usage tracking

## 🎯 Key Components

- **`ai/rag-middleware.ts`**: RAG implementation with citation tracking
- **`app/(chat)/api/files/upload/route.ts`**: Document upload and processing
- **`components/chat.tsx`**: Main chat interface
- **`components/usage-chart.tsx`**: Citation usage visualization
- **`schema.ts`**: Database schema definitions

## 🔍 API Endpoints

- `POST /api/chat`: Main chat endpoint with RAG
- `POST /api/files/upload`: Document upload and processing
- `GET /api/files/list`: List uploaded files
- `DELETE /api/files/delete`: Delete uploaded files
- `POST /api/similarity_search`: Semantic search across documents

## 🎨 UI Features

- **Modern Design**: Clean, professional interface
- **Dark Mode**: Automatic theme switching
- **Responsive**: Works on desktop and mobile
- **Real-time Updates**: Live citation tracking
- **File Management**: Easy document upload and selection

## 🚀 Deployment

The application is ready for deployment on Vercel:

1. Connect your repository to Vercel
2. Set up environment variables
3. Deploy automatically on push

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

## Learn More

- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Ingestion Pipeline Design](./INGESTION_PIPELINE.md)
