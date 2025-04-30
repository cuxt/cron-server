/**
 * 任务执行服务，用于执行定时任务
 */
import { Task, TaskLog, TaskType, parseCurlCommand, getTasksToRun, formatDate } from '../models/task';
import * as KVService from './kv.service';

/**
 * 执行单个任务
 * @param task 任务
 * @returns 执行结果
 */
export async function executeTask(task: Task): Promise<TaskLog> {
	const startTime = Date.now();
	let response: Response | null = null;
	let errorMessage: string | null = null;

	try {
		let requestUrl = task.url;
		let requestInit: RequestInit = {
			method: task.method || 'GET',
			headers: task.headers || {},
			body: task.body,
		};

		// 如果是 CURL 命令，解析为 fetch 选项
		if (task.type === TaskType.CURL) {
			const curlOptions = parseCurlCommand(task.url);
			requestUrl = curlOptions.url;
			requestInit = {
				method: curlOptions.method,
				headers: curlOptions.headers,
				body: curlOptions.body,
			};
		}

		// 设置超时
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), (task.timeout || 30) * 1000);
		requestInit.signal = controller.signal;

		// 执行请求
		response = await fetch(requestUrl, requestInit);
		clearTimeout(timeoutId);

		// 判断是否成功（2xx 状态码）
		const ok = response.ok;

		return {
			ok,
			message: ok ? 'success' : `HTTP error: ${response.status} ${response.statusText}`,
			run_at: formatDate(),
			duration: Date.now() - startTime,
			status: response.status,
		};
	} catch (error: any) {
		errorMessage = error.message || 'Unknown error';

		return {
			ok: false,
			message: `Error: ${errorMessage}`,
			run_at: formatDate(),
			duration: Date.now() - startTime,
		};
	}
}

/**
 * 执行所有需要运行的任务
 * @param env 环境变量
 * @returns 执行结果
 */
export async function executeScheduledTasks(env: Env): Promise<Record<string, TaskLog>> {
	// 获取所有任务
	const tasks = await KVService.getAllTasks(env);

	// 获取需要执行的任务
	const tasksToRun = getTasksToRun(tasks);

	if (tasksToRun.length === 0) {
		console.log('No tasks to run');
		return {};
	}

	console.log(`Running ${tasksToRun.length} tasks`);

	// 执行所有任务
	const results: Record<string, TaskLog> = {};
	const executionPromises = tasksToRun.map(async (task) => {
		try {
			const result = await executeTask(task);
			results[task.id] = result;

			// 记录执行结果
			console.log(`Task ${task.id} executed with result:`, result);
			await KVService.logTaskRun(env, task.id, result);
			// 如果执行失败且任务配置了失败通知，发送通知
			if (!result.ok) {
				console.log(`Task ${task.id} failed, sending notification`);
				await sendNotification(env, task, result);
			}
		} catch (error) {
			console.error(`Error executing task ${task.id}:`, error);
		}
	});

	// 等待所有任务执行完成
	await Promise.allSettled(executionPromises);

	return results;
}

/**
 * 发送任务失败通知
 * @param env 环境变量
 * @param task 失败的任务
 * @param result 执行结果
 */
/**
 * 发送任务失败通知
 * @param env 环境变量
 * @param task 失败的任务
 * @param result 执行结果
 */
export async function sendNotification(env: Env, task: Task, result: TaskLog): Promise<void> {
	try {
		// 获取通知 URL
		const notificationUrl = await KVService.getNotificationUrl(env);

		if (!notificationUrl) {
			console.log('No notification URL configured');
			return;
		}

		// 构建通知消息
		const content = `Task '${task.name}' (${task.id}) failed: ${result.message}`;

		// 添加超时控制
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

		try {
			// 发送通知
			const response = await fetch(notificationUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					title: 'Cron Server',
					content,
				}),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				console.error('Failed to send notification:', response.status, response.statusText);
				return;
			}
			const responseBody = await response.json();
			console.log('Notification sent successfully:', responseBody);
		} catch (error: any) {
			clearTimeout(timeoutId);

			// 区分超时错误和其他错误
			if (error.name === 'AbortError') {
				console.warn(`Notification request timed out after 10s: ${notificationUrl}`);
			} else {
				// 其他类型的错误才记录为错误
				console.error('Error while sending notification:', error.message);
			}
			// 不再抛出错误，避免外层再次捕获并记录
		}
	} catch (error) {
		console.error('Failed to prepare notification:', error);
	}
}
