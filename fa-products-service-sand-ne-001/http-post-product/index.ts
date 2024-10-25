import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import {dataService} from "../data-service/data.service";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a product creation request', req);
    const data = (req.body);

    const { title, description, price, count } = data!;

    if (!title || !description || !price || !count) {
      context.res = {
        status: 400,
        body: JSON.stringify({ message: 'Please provide valid data' }),
      };
      return;
    }

    try {
        await dataService.createProduct(data, context);

        context.res = {
            status: 201,
            body: JSON.stringify({ message: 'Created' }),
        };
    } catch (error: any) {
        context.log(error);
        context.res = {
            status: 500,
            body: JSON.stringify({ message: error.message }),
        };
    }
};

export default httpTrigger;