import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import {PRODUCT_DATA} from "../constants/product-data.const";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');

    context.res = {
        body: JSON.stringify(PRODUCT_DATA),
    };
};

export default httpTrigger;