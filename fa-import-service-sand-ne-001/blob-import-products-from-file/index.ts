import { AzureFunction, Context } from "@azure/functions"
import { BlobClient, ContainerClient } from "@azure/storage-blob";
import { parse, Parser } from 'csv-parse';
import { blobService } from '../blob-service/blob.service';

const blobTrigger: AzureFunction = async function (context: Context, blob: any): Promise<void> {
  context.log("Blob trigger function processed blob \n Name:", context.bindingData.name, "\n Blob Size:", blob.length, "Bytes");

  const fileName = context.bindingData.name;
  const fileContent = blob.toString('utf8');

  try {
    context.log('Parsing data...');
    const parser: Parser = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    for await (const item of parser) {
      context.log(item);
    }

    const parsedContainer: ContainerClient = blobService.getParsedContainer();
    const uploadedContainer: ContainerClient = blobService.getUploadContainer();
    const uploadBlobClient: BlobClient = uploadedContainer.getBlobClient(fileName);
    const parsedBlobClient: BlobClient = parsedContainer.getBlobClient(fileName);

    const blobSasUrl = blobService.getSasUrl(fileName);
    await parsedBlobClient.beginCopyFromURL(blobSasUrl);
    await uploadBlobClient.delete();
    context.log('CSV file successfully processed and moved to parsed container');
  } catch (error) {
    context.log('Error while processing file:', error);
  }
};

export default blobTrigger;
