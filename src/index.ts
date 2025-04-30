import * as KVService from './services/kv.service';
import * as TaskService from './services/task.service';
import * as AuthAPI from './api/auth';
import { Task, TaskType } from './models/task';

// 导入HTML文件
import indexHtml from './pages/index.html';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		const path = url.pathname;

		// API 路由处理
		if (path.startsWith('/api/')) {
			// 认证相关 API 不需要验证 token
			if (path === '/api/auth/login') {
				return AuthAPI.handleLoginRequest(request, env);
			}

			return handleApiRequest(request, env, ctx);
		}

		// 默认返回 HTML 页面
		return new Response(indexHtml, {
			headers: {
				'Content-Type': 'text/html; charset=UTF-8',
			},
		});
	},

	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
		console.log(`Running scheduled task: ${controller.cron}`);
		// 每分钟执行一次的通用任务调度
		if (controller.cron === '* * * * *') {
			try {
				const results = await TaskService.executeScheduledTasks(env);
				const taskCount = Object.keys(results).length;
				if (taskCount > 0) {
					console.log(`Executed ${taskCount} tasks`);
				}
			} catch (error) {
				console.error('Error executing scheduled tasks:', error);
			}
		}
	},
};

/**
 * 处理 API 请求
 */
async function handleApiRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const url = new URL(request.url);
	const path = url.pathname.replace('/api', '');
	const method = request.method;

	// 共通错误处理
	try {
		// 任务管理 API
		if (path === '/tasks') {
			// 获取所有任务
			if (method === 'GET') {
				const tasks = await KVService.getAllTasks(env);
				return jsonResponse(tasks);
			}

			// 创建任务
			if (method === 'POST') {
				const data = (await request.json()) as Partial<Task>;

				// 验证必要字段
				if (!data.name || !data.url || !data.interval || !data.type) {
					return jsonResponse({ error: 'Missing required fields' }, 400);
				}

				// 创建任务
				const task = await KVService.createTask(env, {
					name: data.name,
					url: data.url,
					interval: data.interval,
					type: data.type || TaskType.URL,
					active: data.active ?? true,
					headers: data.headers,
					method: data.method,
					body: data.body,
					timeout: data.timeout,
					retry: data.retry,
					failure_notification: data.failure_notification,
				});

				return jsonResponse(task, 201);
			}

			return jsonResponse({ error: 'Method not allowed' }, 405);
		}

		// 单个任务管理
		const taskIdMatch = path.match(/^\/tasks\/([^/]+)$/);
		if (taskIdMatch) {
			const taskId = taskIdMatch[1];

			// 获取单个任务
			if (method === 'GET') {
				const task = await KVService.getTask(env, taskId);

				if (!task) {
					return jsonResponse({ error: 'Task not found' }, 404);
				}

				return jsonResponse(task);
			}

			// 更新任务
			if (method === 'PUT' || method === 'PATCH') {
				const updates = (await request.json()) as Partial<Task>;
				const updatedTask = await KVService.updateTask(env, taskId, updates);

				if (!updatedTask) {
					return jsonResponse({ error: 'Task not found' }, 404);
				}

				return jsonResponse(updatedTask);
			}

			// 删除任务
			if (method === 'DELETE') {
				const deleted = await KVService.deleteTask(env, taskId);

				if (!deleted) {
					return jsonResponse({ error: 'Task not found' }, 404);
				}

				return jsonResponse({ success: true });
			}

			return jsonResponse({ error: 'Method not allowed' }, 405);
		}

		// 手动执行任务
		const executeMatch = path.match(/^\/tasks\/([^/]+)\/execute$/);
		if (executeMatch && method === 'POST') {
			const taskId = executeMatch[1];
			const task = await KVService.getTask(env, taskId);

			if (!task) {
				return jsonResponse({ error: 'Task not found' }, 404);
			}

			// 执行任务
			const result = await TaskService.executeTask(task);

			// 记录结果
			await KVService.logTaskRun(env, taskId, result);
			if (!result.ok) {
				console.log(`Task ${task.id} failed, sending notification`);
				await TaskService.sendNotification(env, task, result);
			}

			return jsonResponse(result);
		}

		// 获取/设置通知 URL
		if (path === '/notification') {
			// 获取通知 URL
			if (method === 'GET') {
				const url = await KVService.getNotificationUrl(env);
				return jsonResponse({ url });
			}

			// 设置通知 URL
			if (method === 'POST') {
				const data = (await request.json()) as { url: string };

				if (!data.url) {
					return jsonResponse({ error: 'URL is required' }, 400);
				}

				await KVService.setNotificationUrl(env, data.url);
				return jsonResponse({ success: true });
			}

			return jsonResponse({ error: 'Method not allowed' }, 405);
		}

		// API 路由不存在
		return jsonResponse({ error: 'Not found' }, 404);
	} catch (error: any) {
		console.error('API error:', error);
		return jsonResponse({ error: error.message || 'Internal server error' }, 500);
	}
}

/**
 * 创建 JSON 响应
 */
function jsonResponse(data: any, status: number = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
