import { handleSubscriptionRequest, type SubscriptionEnv } from '../../../src/server/subscriptions';

export const onRequest: PagesFunction<SubscriptionEnv> = async ({ request, env, params }) =>
  handleSubscriptionRequest(String(params.action || ''), request, env);
