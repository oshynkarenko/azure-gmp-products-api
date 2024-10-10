import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { PRODUCT_DATA } from '../constants/product-data.const';
import { Product } from '../http-get-product-list/dtos/product.dto';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed a request.');

  const product = PRODUCT_DATA.find((product: Product): boolean => product.id === req.params.id)
  const status = product ? 200 : 404;
  const respBody = product || 'Not found';

  context.res = {
    status,
    body: JSON.stringify(respBody),
  };
};

export default httpTrigger;