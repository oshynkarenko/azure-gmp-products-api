import { AzureFunction, Context } from '@azure/functions';
import { dataService } from '../data-service/data.service';

const serviceBusQueueTrigger: AzureFunction = async function(context: Context, message: any): Promise<void> {
    context.log('ServiceBus queue trigger function processed message', message);

    try {
        await dataService.createProduct(message, context);
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

export default serviceBusQueueTrigger;
