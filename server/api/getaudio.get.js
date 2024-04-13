import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

export default defineEventHandler(async (event) => {
  const params = getQuery(event);
  const isAudioData = await sql`select audio_url from paper_data where paper_id=${params.id}`
  if(isAudioData.length!=0) {
    return isAudioData[0].audio_url
  }
  const summaryData = await sql`select summary from paper_data where paper_id=${params.id}`;
  const speechConfig = sdk.SpeechConfig.fromSubscription("65e14f530f1b4617acf673f7ad733ad1", "eastus");
  const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
  const config = useRuntimeConfig();

  try {
    const result = await new Promise((resolve, reject) => {
      speechSynthesizer.speakTextAsync(
        summaryData[0].summary,
        result => {
          const { audioData } = result;
          speechSynthesizer.close();
          console.log(audioData);
          resolve(audioData);
        },
        error => {
          console.log(error);
          speechSynthesizer.close();
          reject(error);
        }
      );
    });

    const audioData = result;

    let accountName = 'protrack', accountKey = config.azureApiKey;
    const storageAccountBaseUrl = `https://${accountName}.blob.core.windows.net`;
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(storageAccountBaseUrl, sharedKeyCredential);
    const containerClient = blobServiceClient.getContainerClient('resume');
    const blockBlobClient = containerClient.getBlockBlobClient(`${params.id}_audio`);

    const uploadResponse = await blockBlobClient.uploadData(audioData, {
      blockSize: audioData.byteLength,
      blobHTTPHeaders: {
        blobContentType: 'audio/wav'
      }
    });

    console.log(uploadResponse._response.request.url);

    await sql`update paper_data set audio_url=${uploadResponse._response.request.url} where paper_id=${params.id}`
    return uploadResponse._response.request.url
  } catch (error) {
    console.error(error);
  }
});