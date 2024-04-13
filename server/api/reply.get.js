import pgvector from 'pgvector/pg';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { LLMChain } from "langchain/chains"
import { PromptTemplate } from "@langchain/core/prompts";

export default defineEventHandler(async (event)=>{
    const config = useRuntimeConfig()
    const model = new ChatGoogleGenerativeAI({
        apiKey: config.googleApiKey,
        modelName: "gemini-pro",
        maxOutputTokens: 2048,
    })
    const embeddings = new GoogleGenerativeAIEmbeddings({
		apiKey: 'AIzaSyAlNAI2CqHgkXkvMrzEAzqOD0d8WIZsKko',
		modelName: "text-embedding-004", // 768 dimensions
		taskType: TaskType.RETRIEVAL_DOCUMENT,
		title: "Document title",
	});
    const promptText = `
    You are an assistant that helps answer questions from long documents. 
    Here is the document data:
    {document_data}

    Paper Title:
    {title}

    Read the above document and answer the users question below:
    {query}
`
const multiPromptTemplate = new PromptTemplate({
    inputVariables: ["document_data", "query", "title"],
    template: promptText,
    });
    const quesRes = await embeddings.embedQuery(getQuery(event).q)
    const paperData = await sql`SELECT * FROM papers where paper_id=${getQuery(event).id}
    ORDER BY body_embedding <-> ${pgvector.toSql(quesRes)}
    LIMIT 10`
	var content = []
	paperData.forEach((d)=>{console.log(d.body)
		content.push(d.body)})
	const paperChain = new LLMChain({ llm: model, prompt: multiPromptTemplate });
	const paperResponse = await paperChain.call({
		document_data: content.join('\n\n'),
		query: getQuery(event).q,
		title:  getQuery(event).title// whatever you want to searh in the document
	});
    return paperResponse.text
})