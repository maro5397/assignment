import { Inject, Injectable, Logger } from '@nestjs/common';
import { ResourceType } from '../../common/type';
import { RESOURCE_TYPE } from '../../common/enum';
import { AwsIamFetcher } from '../fetcher/aws-iam.fetcher';
import { AwsLoadBalancingFetcher } from '../fetcher/aws-load-balancing.fetcher';

@Injectable()
export class AWSManager {
  private readonly logger = new Logger(AWSManager.name);
  private readonly ASSUME_ROLE_ACTION = 'sts:AssumeRole';

  constructor(
    @Inject() private readonly iamFetcher: AwsIamFetcher,
    @Inject() private readonly loadBalancingFetcher: AwsLoadBalancingFetcher,
  ) {}

  async getRelationships(resource: ResourceType, name: string) {
    this.logger.debug(`Getting relationships for resource: ${resource}, name: ${name}`);
    if (resource !== RESOURCE_TYPE.LOAD_BALANCER) {
      throw new Error('Only load_balancer resource type is supported');
    }

    const loadBalancers = await this.loadBalancingFetcher.describeLoadBalancers([name]);
    if (!loadBalancers) {
      this.logger.warn(`Load balancer not found: ${name}`);
      throw new Error(`Load balancer ${name} not found`);
    }

    const securityGroups = loadBalancers[0].SecurityGroups;
    const loadBalancerName = loadBalancers[0].LoadBalancerName;

    const targetGroupNames = [];
    const instanceIds = new Set();
    const targetGroupArns = await this.loadBalancingFetcher.getTargetGroupArns(loadBalancers[0].LoadBalancerArn);
    const targetGroups = await this.loadBalancingFetcher.describeTargetGroups(targetGroupArns);
    for (const targetGroup of targetGroups) {
      targetGroupNames.push(targetGroup.TargetGroupName);
      const healthDescriptions = await this.loadBalancingFetcher.describeTargetHealth(targetGroup.TargetGroupArn);
      for (const healthDescription of healthDescriptions) {
        instanceIds.add(healthDescription.Target.Id);
      }
    }

    this.logger.log(`Successfully retrieved relationships for load balancer: ${loadBalancerName}`);
    return {
      load_balancer: loadBalancerName,
      target_group: targetGroupNames,
      instances: Array.from(instanceIds),
      security_groups: securityGroups,
    };
  }

  async getPermission(user: string) {
    this.logger.debug(`Getting permissions for user: ${user}`);
    const result = [];

    const policyNames = await this.iamFetcher.listUserPolicyNames(user);
    for (const policyName of policyNames) {
      const policyDocument = await this.iamFetcher.getUserPolicyDocument(user, policyName);
      for (const statement of policyDocument.Statement) {
        if (statement.Action === this.ASSUME_ROLE_ACTION) {
          const attachedPolicies = await this.iamFetcher.listAttachedRolePolicies(statement.Resource);
          for (const attachedPolicy of attachedPolicies) {
            const policy = await this.iamFetcher.getPolicy(attachedPolicy.PolicyArn);
            const policyVersion = await this.iamFetcher.getPolicyVersion(
              attachedPolicy.PolicyArn,
              policy.DefaultVersionId,
            );
            result.push(JSON.parse(decodeURIComponent(policyVersion.Document)));
          }
        }
      }
    }

    this.logger.log(`Successfully retrieved permissions for user: ${user}`);
    return result;
  }
}
