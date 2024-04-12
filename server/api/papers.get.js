import { xmlToJsonUtil } from 'xml-to-json-util'
import {GoogleGenerativeAIEmbeddings} from '@langchain/google-genai'
import pgvector from 'pgvector/pg';
import { TaskType } from "@google/generative-ai";

export default defineEventHandler(async (event)=>{
    const searchTerm  = getQuery(event).q
    const embeddings = new GoogleGenerativeAIEmbeddings({
		apiKey: 'AIzaSyAlNAI2CqHgkXkvMrzEAzqOD0d8WIZsKko',
		modelName: "text-embedding-004", // 768 dimensions
		taskType: TaskType.RETRIEVAL_DOCUMENT,
		title: "Document title",
	});
  console.log(searchTerm, event.context.params)
    var data = await fetch(`https://export.arxiv.org/api/query?search_query=all:${searchTerm}&max_results=10`)
    data = await data.arrayBuffer()
    const uint8Array = new Uint8Array(data)
    const decoder = new TextDecoder('utf-8')
    const xmlString = decoder.decode(uint8Array)
    
    const parsedXml = xmlToJsonUtil(xmlString);
    console.log(parsedXml.feed.entry[0])
    const searchArray = []
    parsedXml.feed.entry.forEach(element => {
    
        // console.log(`${element.title}`, element.id.replace("/abs/", "/pdf/")+".pdf");
        searchArray.push({
            type: "arxiv",
            id: element.id,
            title: element.title,
            image_url: ""
        })
    });
  //   const res = await embeddings.embedQuery(`${searchTerm}`)
  //   const dataFromDATABASE = await sql`
  //   SELECT DISTINCT ON (id) id, image_url, title, similarity_score
  //   FROM (
  //     SELECT
  //       id,
  //       image_url,
  //       title,
  //       title_embedding <-> ${pgvector.toSql(res)} AS similarity_score
  //     FROM
  //       papers
  //     ORDER BY
  //       id, similarity_score ASC
  //     LIMIT 10
  //   ) AS subquery
  //   ORDER BY
  //     id, similarity_score ASC
  
  // `
  //   dataFromDATABASE.forEach((k)=>{
  //       searchArray.push({
  //           type: "indexed",
  //           id: k.id,
  //           title: k.title,
  //           image_url: k.image_url
  //       })
  //   })
    return searchArray

})