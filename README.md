# GenAI.Labs Research Assistant

A full-stack research assistant powered by generative AI that enables users to ask plain-English questions and get grounded, well-sourced answers from a private archive of technical documents.

## Features

✅ **Journal Document Upload & Processing**: Upload and process journal articles with automatic chunking and embedding generation  
✅ **Semantic Search**: Advanced similarity search across document chunks with configurable parameters  
✅ **AI-Powered Q&A**: Natural language question answering with proper citation and source attribution  
✅ **Citation Display**: Automatic citation formatting with clickable links to source documents  
✅ **Usage Tracking**: Real-time "Most Cited Articles" chart showing document usage in current session  
✅ **Authentication**: Secure user authentication and session management  

## System Architecture

```
Journal Files → Upload API → Chunking → Embedding → Vector DB → Search API → Chat Interface
```

## Quick Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd gal-cite-me
npm install
```

2. **Environment setup**
Create a `.env` file with:
```bash
OPENAI_API_KEY=your_openai_api_key
POSTGRES_URL=your_postgres_connection_string
AUTH_SECRET=your_nextauth_secret
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

3. **Database setup**
```bash
# Generate and run migrations
npx drizzle-kit generate
npx drizzle-kit migrate
```

4. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## API Endpoints

### `PUT /api/upload`
Upload journal chunks with metadata and generate embeddings.

**Request body:**
```json
{
  "chunks": [
    {
      "id": "unique_chunk_id",
      "source_doc_id": "document.pdf",
      "chunk_index": 1,
      "section_heading": "Introduction",
      "doi": "10.1000/journal.doi",
      "journal": "Journal Name",
      "publish_year": 2023,
      "usage_count": 0,
      "attributes": ["keyword1", "keyword2"],
      "link": "https://example.com/document.pdf",
      "text": "Chunk content text..."
    }
  ],
  "schema_version": "1.0"
}
```

**Response:** `202 Accepted`

### `POST /api/similarity_search`
Perform semantic search across document chunks.

**Request body:**
```json
{
  "query": "What are the benefits of sustainable agriculture?",
  "k": 10,
  "min_score": 0.25
}
```

**Response:**
```json
{
  "query": "What are the benefits of sustainable agriculture?",
  "results": [
    {
      "id": "chunk_id",
      "source_doc_id": "document.pdf",
      "section_heading": "Benefits Section",
      "journal": "Agricultural Systems",
      "publish_year": 2023,
      "usage_count": 5,
      "attributes": ["sustainability", "benefits"],
      "link": "https://example.com/document.pdf",
      "text": "Content text...",
      "similarity": 0.85
    }
  ],
  "total_found": 1
}
```

## Usage

### 1. Upload Sample Data
Test the system using the provided sample data:

```bash
curl -X PUT http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -d @sample-journal-chunks.json
```

### 2. Test Similarity Search
```bash
curl -X POST http://localhost:3000/api/similarity_search \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the benefits of velvet bean?", "k": 5}'
```

### 3. Chat Interface
1. Register/login to the application
2. Ask questions in natural language
3. View citations and source references
4. Monitor usage statistics in the sidebar chart

## Key Components

- **`schema.ts`**: Database schema with journal-specific fields
- **`ai/rag-middleware.ts`**: RAG implementation with citation tracking
- **`app/(chat)/api/upload/route.ts`**: Journal upload endpoint
- **`app/(chat)/api/similarity_search/route.ts`**: Semantic search endpoint
- **`components/usage-chart.tsx`**: Citation tracking visualization
- **`components/chat.tsx`**: Main chat interface with citation display

## Vector Database Choice: Pinecone

**Selected: Pinecone** for production deployment due to:
- Managed service with no infrastructure overhead
- Excellent scalability and performance
- Rich metadata filtering capabilities
- Simple integration and reliable API

For development, the current implementation uses PostgreSQL with cosine similarity calculations in-memory. See `INGESTION_PIPELINE.md` for detailed architectural decisions.

## Time Tracking

Development progress is tracked in `time_estimates.csv` with estimated vs. actual time for each task component.

## Learn More

- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Ingestion Pipeline Design](./INGESTION_PIPELINE.md)
