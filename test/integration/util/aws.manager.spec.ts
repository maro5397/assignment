import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import * as process from 'node:process';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetPolicyCommand,
  GetPolicyVersionCommand,
  GetUserPolicyCommand,
  ListAttachedRolePoliciesCommand,
  ListUserPoliciesCommand,
  IAMClient,
} from '@aws-sdk/client-iam';

describe('AWS Manager Test', () => {
  beforeAll(async () => {
    await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true })],
    }).compile();
  });

  it('aws load balancer command', async () => {
    const name = 'test-lb';
    const config = {
      region: process.env.AWS_REGION,
      credentials: fromTemporaryCredentials({
        clientConfig: { region: process.env.AWS_REGION },
        params: {
          RoleArn: process.env.AWS_ROLE_ARN,
          RoleSessionName: process.env.AWS_ROLE_SESSION_NAME,
        },
      }),
    };
    const elbClient = new ElasticLoadBalancingV2Client(config);
    const describeLoadBalancersCommand = new DescribeLoadBalancersCommand({ Names: [name] });
    const describeLoadBalancersResponse = await elbClient.send(describeLoadBalancersCommand);

    const listenersCommand = new DescribeListenersCommand({
      LoadBalancerArn: describeLoadBalancersResponse.LoadBalancers[0].LoadBalancerArn,
    });
    const describeListenersResponse = await elbClient.send(listenersCommand);
    const targetGroups = [];
    for (const listener of describeListenersResponse.Listeners) {
      if (listener.DefaultActions) {
        for (const action of listener.DefaultActions) {
          if (action.TargetGroupArn) {
            targetGroups.push(action.TargetGroupArn);
          }
        }
      }
    }

    const targetGroupsCommand = new DescribeTargetGroupsCommand({
      TargetGroupArns: targetGroups,
    });
    const targetGroupsResponse = await elbClient.send(targetGroupsCommand);
    const targetGroupNames = [];
    const instanceIds = new Set();
    for (const targetGroup of targetGroupsResponse.TargetGroups) {
      targetGroupNames.push(targetGroup.TargetGroupName);
      const targetHealthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroup.TargetGroupArn,
      });
      const targetHealthResponse = await elbClient.send(targetHealthCommand);
      for (const targetHealthDescriptions of targetHealthResponse.TargetHealthDescriptions) {
        instanceIds.add(targetHealthDescriptions.Target.Id);
      }
      expect(targetHealthResponse.$metadata.httpStatusCode).toEqual(200);
    }

    expect(describeLoadBalancersResponse.$metadata.httpStatusCode).toEqual(200);
    expect(describeListenersResponse.$metadata.httpStatusCode).toEqual(200);
    expect(targetGroupsResponse.$metadata.httpStatusCode).toEqual(200);

    console.log(describeLoadBalancersResponse.LoadBalancers[0].LoadBalancerName);
    console.log(targetGroupNames);
    console.log(Array.from(instanceIds));
    console.log(describeLoadBalancersResponse.LoadBalancers[0].SecurityGroups);
  });

  it('aws authorization command', async () => {
    const username: string = 'tatum';

    const iamClient = new IAMClient({
      region: process.env.AWS_REGION,
      credentials: fromTemporaryCredentials({
        clientConfig: { region: process.env.AWS_REGION },
        params: {
          RoleArn: process.env.AWS_ROLE_ARN,
          RoleSessionName: process.env.AWS_ROLE_SESSION_NAME,
        },
      }),
    });

    const listUserPoliciesCommand = new ListUserPoliciesCommand({ UserName: username });
    const listUserPoliciesResponse = await iamClient.send(listUserPoliciesCommand);
    console.log('listUserPoliciesResponse:', listUserPoliciesResponse);

    for (const policyName of listUserPoliciesResponse.PolicyNames) {
      const getUserPolicyCommand = new GetUserPolicyCommand({
        UserName: username,
        PolicyName: policyName,
      });
      const getUserPolicyResponse = await iamClient.send(getUserPolicyCommand);
      const policyDocument = JSON.parse(decodeURIComponent(getUserPolicyResponse.PolicyDocument));
      console.log('policyDocument:', policyDocument);
      for (const statement of policyDocument.Statement) {
        if (statement.Action === 'sts:AssumeRole') {
          const parts = statement.Resource.split('/');
          const roleName = parts[parts.length - 1];

          const listAttachedRolePoliciesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
          const listAttachedRolePoliciesResponse = await iamClient.send(listAttachedRolePoliciesCommand);
          console.log(
            'listAttachedRolePoliciesResponse.AttachedPolicies:',
            listAttachedRolePoliciesResponse.AttachedPolicies,
          );
          for (const attachedPolicy of listAttachedRolePoliciesResponse.AttachedPolicies) {
            const getPolicyCommand = new GetPolicyCommand({ PolicyArn: attachedPolicy.PolicyArn });
            const getPolicyResponse = await iamClient.send(getPolicyCommand);

            const getPolicyVersionCommand = new GetPolicyVersionCommand({
              PolicyArn: attachedPolicy.PolicyArn,
              VersionId: getPolicyResponse.Policy.DefaultVersionId,
            });
            const getPolicyVersionResponse = await iamClient.send(getPolicyVersionCommand);
            console.log(
              `getPolicyVersionResponse.PolicyVersion.Document(${attachedPolicy.PolicyArn}):`,
              JSON.parse(decodeURIComponent(getPolicyVersionResponse.PolicyVersion.Document)),
            );
          }
        }
      }
    }
  });
});
