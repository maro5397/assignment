import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AzureManager {
  private readonly logger = new Logger(AzureManager.name);
}
