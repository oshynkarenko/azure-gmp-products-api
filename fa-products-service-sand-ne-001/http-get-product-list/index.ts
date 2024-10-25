import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import {dataService} from '../data-service/data.service';
import {Product} from '../dtos/product.dto';
import {FeedResponse} from '@azure/cosmos';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed GET request for product list.', req);

    try {
      let products: Array<Product>;
      await dataService
        .getProducts()
          .then(([productsData, stocksData]: [FeedResponse<Product>, FeedResponse<Stock>]): void => {
            products = productsData.resources.map((product: Product): Product => {
              const { id, title, description, price, image } = product;
              return ({
                  id,
                  title,
                  description,
                  price,
                  image,
                  stock: stocksData.resources.find((stock: Stock): boolean => stock.product_id === product.id)?.count
              })
            });
          });

      context.res = {
        body: JSON.stringify(products),
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
