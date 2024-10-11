import * as RainYun from './utils/rainyun'
import * as OneAPI from './utils/oneapi'

export default {
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
			default:
				console.log("cron not match");
		}
		console.log("cron processed");
	},
};