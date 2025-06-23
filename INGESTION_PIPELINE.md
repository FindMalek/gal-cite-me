# Ingestion Pipeline Design

## 1. System Architecture Overview

The ingestion pipeline is designed to automatically process newly uploaded journal files and make them searchable through a vector database. Here's the high-level architecture:

```
Journal Files → Detection → Chunking → Embedding → Vector DB → Search API
```

## 2. Pipeline Components (Pseudocode)

### 2.1 File Detection System

```pseudo
FUNCTION detectNewFiles():
    // Monitor designated upload directory
    watchedDirectories = ["/uploads/journals", "/incoming/documents"]
    
    FOR EACH directory IN watchedDirectories:
        newFiles = getFilesModifiedSince(lastProcessedTimestamp)
        
        FOR EACH file IN newFiles:
            IF file.extension IN [".pdf", ".txt", ".docx"]:
                IF NOT isProcessed(file.checksum):
                    addToProcessingQueue(file)
                    
    // Alternative: Event-driven approach
    // Listen for S3/blob storage events, database triggers, or filesystem events
END FUNCTION

FUNCTION scheduleDetection():
    // Run every 15 minutes
    SCHEDULE detectNewFiles() EVERY "0 */15 * * * *"
END FUNCTION
```

### 2.2 Content Chunking System

```pseudo
FUNCTION processDocument(file):
    TRY:
        // Extract text content
        rawText = extractTextContent(file)
        
        // Extract metadata from filename, headers, or embedded metadata
        metadata = extractMetadata(file)
        
        // Intelligent chunking strategy
        chunks = createSmartChunks(rawText, metadata)
        
        // Generate chunk IDs and attach metadata
        processedChunks = []
        FOR EACH chunk IN chunks:
            chunkData = {
                id: generateChunkId(file.id, chunk.index),
                source_doc_id: file.name,
                chunk_index: chunk.index,
                section_heading: detectSectionHeading(chunk.text),
                doi: metadata.doi OR "TBD_DOI",
                journal: metadata.journal OR inferJournal(file.name),
                publish_year: metadata.year OR extractYearFromContent(chunk.text),
                usage_count: 0,
                attributes: extractAttributes(chunk.text),
                link: generatePublicLink(file),
                text: chunk.text
            }
            processedChunks.append(chunkData)
            
        RETURN processedChunks
        
    CATCH Exception as e:
        logError("Failed to process " + file.name + ": " + e.message)
        markAsFailedProcessing(file)
        RETURN []
END FUNCTION

FUNCTION createSmartChunks(text, metadata):
    // Hybrid chunking approach
    IF metadata.hasStructuredSections:
        // Section-based chunking for academic papers
        chunks = chunkBySections(text, maxSize=1500, overlap=200)
    ELSE:
        // Semantic chunking for general documents
        chunks = semanticChunking(text, maxSize=1500, overlap=200)
    
    // Post-process chunks
    FOR EACH chunk IN chunks:
        chunk.text = cleanAndNormalize(chunk.text)
        chunk.section_heading = extractSectionTitle(chunk.text)
        
    RETURN chunks
END FUNCTION
```

### 2.3 Embedding Generation

```pseudo
FUNCTION generateEmbeddings(chunks):
    // Batch processing for efficiency
    batchSize = 100
    embeddedChunks = []
    
    FOR batch IN createBatches(chunks, batchSize):
        texts = [chunk.text FOR chunk IN batch]
        
        // Generate embeddings using OpenAI's text-embedding-3-small
        embeddings = await generateEmbeddingsAPI(texts)
        
        FOR i IN range(len(batch)):
            batch[i].embedding = embeddings[i]
            embeddedChunks.append(batch[i])
            
    RETURN embeddedChunks
END FUNCTION
```

### 2.4 Vector Database Storage

```pseudo
FUNCTION storeInVectorDB(embeddedChunks):
    // Batch upsert to vector database
    TRY:
        vectorDB.upsert(
            vectors=embeddedChunks,
            namespace="journal_documents",
            batch_size=200
        )
        
        // Update processing status
        FOR chunk IN embeddedChunks:
            markAsProcessed(chunk.source_doc_id)
            
    CATCH Exception as e:
        logError("Failed to store chunks: " + e.message)
        markAsFailedProcessing(embeddedChunks)
END FUNCTION
```

### 2.5 Main Pipeline Orchestration

```pseudo
FUNCTION runIngestionPipeline():
    // Get files to process
    filesToProcess = detectNewFiles()
    
    IF filesToProcess.isEmpty():
        log("No new files to process")
        RETURN
        
    log("Processing " + filesToProcess.length + " files")
    
    FOR EACH file IN filesToProcess:
        TRY:
            // Process document
            chunks = processDocument(file)
            
            IF chunks.length > 0:
                // Generate embeddings
                embeddedChunks = generateEmbeddings(chunks)
                
                // Store in vector database
                storeInVectorDB(embeddedChunks)
                
                log("Successfully processed: " + file.name)
            ELSE:
                log("No chunks generated for: " + file.name)
                
        CATCH Exception as e:
            logError("Pipeline failed for " + file.name + ": " + e.message)
            
    // Cleanup and reporting
    generateProcessingReport()
END FUNCTION
```

## 3. Vector Database Choice: Pinecone

**Selected Vector Database: Pinecone**

### Why Pinecone?

1. **Managed Service**: No infrastructure management overhead
2. **Scalability**: Handles millions of vectors with consistent performance
3. **Real-time Updates**: Supports real-time upserts and queries
4. **Metadata Filtering**: Rich filtering capabilities for journal, year, attributes
5. **High Availability**: Built-in redundancy and reliability
6. **Simple Integration**: Excellent SDKs and REST API

### Alternative Considerations:

- **Weaviate**: Good for complex semantic search but requires more setup
- **Chroma**: Great for development/prototyping but less proven for production scale
- **Qdrant**: Excellent performance but newer ecosystem
- **pgvector**: Good for existing PostgreSQL infrastructure but limited advanced features

### Pinecone Implementation Details:

```pseudo
// Index configuration
INDEX_CONFIG = {
    name: "journal-knowledge-base",
    dimension: 1536,  // text-embedding-3-small dimensions
    metric: "cosine",
    pods: 1,
    replicas: 1,
    shards: 1,
    metadata_config: {
        indexed: ["journal", "publish_year", "attributes", "source_doc_id"]
    }
}

// Query example
FUNCTION semanticSearch(query, filters={}):
    queryEmbedding = generateEmbedding(query)
    
    results = pinecone.query(
        vector=queryEmbedding,
        filter=filters,
        top_k=10,
        include_metadata=true
    )
    
    RETURN results
END FUNCTION
```

## 4. Monitoring and Error Handling

### 4.1 Monitoring Metrics
- Files processed per hour
- Processing success/failure rates
- Average processing time per document
- Vector database query latency
- Storage costs and usage

### 4.2 Error Handling Strategy
- Retry failed operations with exponential backoff
- Dead letter queue for persistently failing documents
- Alerting for processing failures
- Comprehensive logging for debugging

### 4.3 Data Quality Assurance
- Validate chunk metadata completeness
- Check embedding quality and dimensionality
- Monitor for duplicate content
- Verify DOI and citation format consistency

## 5. Performance Optimization

### 5.1 Parallel Processing
- Process multiple documents concurrently
- Batch embedding generation
- Async vector database operations

### 5.2 Caching Strategy
- Cache frequently accessed embeddings
- Pre-compute common query results
- Cache document metadata

### 5.3 Incremental Processing
- Track processing checkpoints
- Resume from failure points
- Skip already-processed documents

This pipeline design ensures robust, scalable, and maintainable ingestion of journal documents with comprehensive error handling and monitoring capabilities. 