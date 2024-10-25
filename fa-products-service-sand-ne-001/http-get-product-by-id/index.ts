import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { Product } from '../dtos/product.dto';
import {dataService} from "../data-service/data.service";
import {FeedResponse, Item, ItemResponse} from "@azure/cosmos";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed GET request for single product with id', req.params.id);

  try {
    let product: Product;
    let respBody: string;
    const [productData, stockData] = await dataService.getProductById(req.params.id);
    const status = productData && stockData ? 200 : 404;

    if (productData && stockData) {
      const { id, title, description, price, image } = productData.resource;
      const { count } = stockData.resources[0];
      product = { id, title, description, price, image, stock: count };
      respBody = JSON.stringify(product);
    } else {
      respBody = JSON.stringify({ message: 'Not found' });
    }

    context.res = {
      status,
      body: respBody,
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
