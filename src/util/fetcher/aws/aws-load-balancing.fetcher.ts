import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsLoadBalancingFetcher {
  private readonly elbClient: ElasticLoadBalancingV2Client;

  constructor(private readonly configService: ConfigService) {
    this.elbClient = new ElasticLoadBalancingV2Client({
      region: configService.get('AWS_REGION'),
      credentials: fromTemporaryCredentials({
        clientConfig: { region: configService.get('AWS_REGION') },
        params: {
          RoleArn: configService.get('AWS_ROLE_ARN'),
          RoleSessionName: configService.get('AWS_ROLE_SESSION_NAME'),
        },
      }),
    });
  }

  async describeLoadBalancers(names: string[]) {
    const describeLoadBalancersCommand = new DescribeLoadBalancersCommand({ Names: names });
    const describeLoadBalancersResponse = await this.elbClient.send(describeLoadBalancersCommand);
    return describeLoadBalancersResponse.LoadBalancers;
  }

  async getTargetGroupArns(loadBalancerArn: string) {
    const listenersCommand = new DescribeListenersCommand({ LoadBalancerArn: loadBalancerArn });
    const describeListenersResponse = await this.elbClient.send(listenersCommand);
    return this.getTargetGroupArnsFromListeners(describeListenersResponse.Listeners);
  }

  async describeTargetGroups(targetGroups: string[]) {
    const targetGroupsCommand = new DescribeTargetGroupsCommand({ TargetGroupArns: targetGroups });
    const targetGroupsResponse = await this.elbClient.send(targetGroupsCommand);
    return targetGroupsResponse.TargetGroups;
  }

  async describeTargetHealth(targetGroupArn: string) {
    const targetHealthCommand = new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn });
    const targetHealthResponse = await this.elbClient.send(targetHealthCommand);
    return targetHealthResponse.TargetHealthDescriptions;
  }

  private getTargetGroupArnsFromListeners(listeners) {
    const targetGroups = [];
    for (const listener of listeners) {
      if (listener.DefaultActions) {
        for (const action of listener.DefaultActions) {
          if (action.TargetGroupArn) {
            targetGroups.push(action.TargetGroupArn);
          }
        }
      }
    }
    return targetGroups;
  }
}
