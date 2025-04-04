import { Module } from '@nestjs/common';
import { CloudController } from './controller/cloud.controller';
import { CloudServiceImpl } from './service/impl/cloud.service.impl';
import { AWSManager } from './util/manager/aws.manager';
import { GCPManager } from './util/manager/gcp.manager';
import { AzureManager } from './util/manager/azure.manager';
import { ConfigModule } from '@nestjs/config';
import { AwsIamFetcher } from './util/fetcher/aws/aws-iam.fetcher';
import { AwsLoadBalancingFetcher } from './util/fetcher/aws/aws-load-balancing.fetcher';
import { AzureNetworkManagementFetcher } from './util/fetcher/azure/azure-network-management.fetcher';
import { AzureAuthorizationManagementFetcher } from './util/fetcher/azure/azure-authorization-management.fetcher';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [CloudController],
  providers: [
    CloudServiceImpl,
    AWSManager,
    GCPManager,
    AzureManager,
    AwsIamFetcher,
    AwsLoadBalancingFetcher,
    AzureNetworkManagementFetcher,
    AzureAuthorizationManagementFetcher,
  ],
})
export class AppModule {}
