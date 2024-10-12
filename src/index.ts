import * as RainYun from './utils/rainyun'
import * as OneAPI from './utils/oneapi'
import * as Serv00 from './utils/serv00'

export default {
	async fetch (request: Request, env: Env, ctx: ExecutionContext) {
		return new Response('This is a scheduled worker, no fetch handler defined.');
	},
	async scheduled (
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	) {
		switch (controller.cron) {
			case "0 1 * * *":
				// 上海时间：9：00
				await RainYun.checkin(env);
				break;
			case "*/20 1-13 * * *":
				// 上海时间：9:00 - 21:00 每20分钟执行一次
				await OneAPI.keep(env);
				break;
			case "0 0 * * 1":
				// 每周一的0点执行一次
				await Serv00.checkin(env)
				break;
			default:
				console.log("cron not match");
		}
		console.log("cron processed");
	},
};