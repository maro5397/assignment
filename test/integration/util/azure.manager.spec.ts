import { AzureManager } from '../../../src/util/manager/azure.manager';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

describe('AZURE Manager Test', () => {
  const azureManager = new AzureManager();

  beforeAll(async () => {
    await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true })],
    }).compile();
  });

  it('azure manager usage test', async () => {});
});
