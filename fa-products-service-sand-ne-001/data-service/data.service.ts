import 'dotenv/config';
import {CosmosClient, FeedResponse, Item, ItemDefinition, ItemResponse} from '@azure/cosmos';
import { Product } from '../dtos/product.dto';
import { DEFAULT_IMAGE } from "../constants/defaults";

const dbKey = process.env.DB_KEY;
const dbUrl = process.env.DB_URL;
const dbName = process.env.DB_NAME;
const productsContainerName = 'products';
const stocksContainerName = 'stocks';
const dbClient = new CosmosClient({ endpoint: dbUrl, key: dbKey });
const database = dbClient.database(dbName);
const productsContainer = database.container(productsContainerName);
const stocksContainer = database.container(stocksContainerName);

export const dataService = {
  getProducts: (): Promise<[FeedResponse<Product>, FeedResponse<Stock>]> => Promise.all([
    dataService.getProductData(),
    dataService.getStocksData(),
  ]),
  getProductById: (id: string): Promise<[ItemResponse<Product>, FeedResponse<Stock>]> => Promise.all([
    dataService.getProductDataById(id),
    dataService.getStockDataById(id),
  ]),
  createProduct: (product: Product, context): Promise<ItemDefinition> => {
    const { title, description, price, image, stock } = product;
    const productData: Product = { title, description, price, image: DEFAULT_IMAGE };

    return dataService.createProductData(productData)
      .then((result: ItemDefinition): Promise<ItemDefinition> => {
      const stockData = {
        product_id: result.resource.id,
        count: stock
      };
      return dataService.createStockData(stockData);
    });
  },
  getTotalsData: (): Promise<[FeedResponse<number>, FeedResponse<{ totalCount: number }>]> => Promise.all([dataService.getProductTotals(), dataService.getStocksTotals()]),
  getProductData: (): Promise<FeedResponse<Product>> => productsContainer.items.readAll<Product>().fetchAll(),
  getStocksData: (): Promise<FeedResponse<Stock>> => stocksContainer.items.readAll<Stock>().fetchAll(),
  getProductDataById: (id: string): Promise<ItemResponse<Product>> => productsContainer.item(id, id).read<Product>(),
  getStockDataById: (id: string): Promise<FeedResponse<Stock>> => {
    const querySpec = {
      query: `SELECT * FROM ${stocksContainerName} s WHERE  s.product_id = @productId`,
      parameters: [{
        name: "@productId",
        value: id,
      }],
    };
    return stocksContainer.items.query(querySpec).fetchAll();
  },
  createProductData: (product: Product): Promise<ItemDefinition> => productsContainer.items.upsert(product),
  createStockData: (stock: Stock): Promise<ItemDefinition> => stocksContainer.items.upsert(stock),
  getProductTotals: (): Promise<FeedResponse<number>> => {
    const querySpec = {
      query: `SELECT VALUE COUNT(1) FROM ${productsContainerName}`,
    };
    return productsContainer.items.query(querySpec).fetchAll();
  },
  getStocksTotals: (): Promise<FeedResponse<{ totalCount: number }>> => {
    const querySpec = {
      query: `SELECT SUM(s.count) AS totalCount FROM ${stocksContainerName} s`,
    };
    return stocksContainer.items.query(querySpec).fetchAll();
  }
};
