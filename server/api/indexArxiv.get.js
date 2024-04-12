import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { WebPDFLoader } from "langchain/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import pgvector from 'pgvector/pg';
export default defineEventHandler(async (event)=>{
    const arxivID = getQuery(event).id 
    const arxivTitle = getQuery(event).title
    const arxivUrl = "http://arxiv.org/pdf/" + arxivID + ".pdf"
	let blob = await fetch(arxivUrl).then(r => r.blob())
	const loader = new WebPDFLoader(blob)
	const docs = await loader.load()
	const textSplitter = new RecursiveCharacterTextSplitter({
		chunkSize: 1000,
		chunkOverlap: 200,
	})
	const splitDocs = await textSplitter.splitDocuments(docs);
	console.log({ splitDocs });
	const embeddings = new GoogleGenerativeAIEmbeddings({
		apiKey: 'AIzaSyAlNAI2CqHgkXkvMrzEAzqOD0d8WIZsKko',
		modelName: "text-embedding-004", // 768 dimensions
		taskType: TaskType.RETRIEVAL_DOCUMENT,
		title: "Document title",
	});
	var data = []
	splitDocs.forEach((s)=>{
		data.push(s.pageContent)
	})
	const res = await embeddings.embedDocuments(data)
    const titleEmbedding = await embeddings.embedQuery(arxivTitle)
    var results = []
	for (let index = 0; index < res.length; index++) {
		results = await sql`insert into papers(title, title_embedding, body, body_embedding) values(${arxivTitle}, ${pgvector.toSql(titleEmbedding)}, ${data[index]}, ${pgvector.toSql(res[index])}) returning id`
	}
	console.log('done uploading')
    return results
})