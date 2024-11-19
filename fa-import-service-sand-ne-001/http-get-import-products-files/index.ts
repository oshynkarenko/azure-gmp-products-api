import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { blobService } from "../blob-service/blob.service";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed a request.', req);
  const fileName = (req.query.name);

  if (!fileName) {
    context.log('File name missing');

    context.res = {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'File name was not provided' }),
    }
    return;
  }

  try {
    const url = blobService.getSasUrl(fileName);
    context.res = {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(url),
    }
  } catch (error: any) {
    context.log(error);
    context.res = {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: error.message }),
    };
  }
};

export default httpTrigger;