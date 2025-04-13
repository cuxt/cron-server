import * as RainYun from './utils/rainyun';
import * as NewAPI from './utils/newapi';
import * as Serv00 from './utils/serv00';

// 导入HTML文件
import indexHtml from '../public/index.html';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		// 使用外部HTML文件的内容
		return new Response(indexHtml, {
			headers: {
				'Content-Type': 'text/html; charset=UTF-8',
			},
		});
	},
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
		switch (controller.cron) {
			case '0 1 * * *':
				// 上海时间：9：00
				break;
			case '*/20 1-13 * * *':
				// 上海时间：9:00 - 21:00 每20分钟执行一次
				await NewAPI.keep(env);
				break;
			case '0 0 * * 1':
				// 每周一的0点执行一次
				await Serv00.checkin(env);
				break;
			default:
				console.log('cron not match');
		}
		console.log('cron processed');
	},
};
