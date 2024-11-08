import 'dotenv/config';
import {
    BlobSASPermissions,
    BlobServiceClient,
    generateBlobSASQueryParameters,
    StorageSharedKeyCredential
} from "@azure/storage-blob";

const storageAccountKey = process.env.STORAGE_ACCOUNT_KEY;
const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;
const uploadedContainerName = 'uploaded';
const parsedContainerName = 'parsed';
const permissionsString ='racwd'; // read, add, create, write, delete
const credential = new StorageSharedKeyCredential(
  storageAccountName,
  storageAccountKey,
);
const blobClient: BlobServiceClient = new BlobServiceClient(
  `https://${storageAccountName}.blob.core.windows.net`,
  credential,
);
export const blobService = {
  getUploadContainer: () => blobClient.getContainerClient(
    uploadedContainerName,
  ),
  getParsedContainer: () => blobClient.getContainerClient(
    parsedContainerName,
  ),
  getSasUrl: (fileName: string): string => {
    const container = blobService.getUploadContainer();
    const blobClient = container.getBlobClient(fileName);
    const expiresIn = 600000; // 10 minutes
    const expirationTime = new Date(Date.now() + expiresIn);
    const permissions = BlobSASPermissions.parse(permissionsString);
    const token = generateBlobSASQueryParameters(
      {
      containerName: uploadedContainerName,
      blobName: fileName,
      permissions,
      expiresOn: expirationTime,
    },
      credential).toString();
    return `${blobClient.url}?${token}`
  }
};
