import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import {Product} from "../dtos/product.dto";
import {dataService} from "../data-service/data.service";
import {FeedResponse} from "@azure/cosmos";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a GET request for total products info.');

    try {
      const [productsData, stocksData] = await dataService.getTotalsData();

      const productsCount = productsData.resources[0];
      const productsTotalAmount = stocksData.resources[0].totalCount;

      context.res = {
        body: JSON.stringify({ productsCount, productsTotalAmount }),
      }
    } catch (error: any) {
        context.log(error);
        context.res = {
            status: 500,
            body: JSON.stringify({ message: error.message }),
        };
    }
};

export default httpTrigger;