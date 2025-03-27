import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GCPManager {
  private readonly logger = new Logger(GCPManager.name);
}
