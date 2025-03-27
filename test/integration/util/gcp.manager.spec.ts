import { GCPManager } from '../../../src/util/manager/gcp.manager';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

describe('GCP Manager Test', () => {
  const gcpManager = new GCPManager();

  beforeAll(async () => {
    await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true })],
    }).compile();
  });

  it('gcp manager usage test', async () => {});
});
