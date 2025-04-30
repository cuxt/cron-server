/**
 * Task 模型和接口定义
 */

// 执行日志接口
export interface TaskLog {
	ok: boolean;
	message: string;
	run_at: string;
	duration?: number; // 执行时间，单位毫秒
	status?: number; // HTTP状态码
}

// 任务类型：普通URL或CURL命令
export enum TaskType {
	URL = 'url',
	CURL = 'curl',
}

// 任务接口
export interface Task {
	id: string;
	name: string;
	type: TaskType;
	url: string; // 如果是URL类型，则为URL；如果是CURL类型，则为完整的CURL命令
	interval: number; // 间隔分钟数
	active: boolean; // 是否激活
	logs: TaskLog[]; // 执行日志，最多保留20条
	created_at: string;
	updated_at: string;
	headers?: Record<string, string>; // 自定义请求头
	method?: string; // 请求方法，默认GET
	body?: string; // 请求体
	timeout?: number; // 超时时间，默认30秒
	retry?: number; // 重试次数，默认0
	failure_notification?: boolean; // 失败是否通知，默认true
}

// KV存储结构
export interface TaskStore {
	tasks: Record<string, Task>;
	notification_url?: string; // 通知URL
}

// 解析CURL命令的结果
export interface CurlOptions {
	url: string;
	method: string;
	headers: Record<string, string>;
	body?: string;
}

/**
 * 解析CURL命令为fetch选项
 * @param curlCommand CURL命令
 * @returns 解析后的fetch选项
 */
export function parseCurlCommand(curlCommand: string): CurlOptions {
	// 简单的CURL命令解析
	const urlMatch = curlCommand.match(/curl\s+['"]?([^'"]+)['"]?/i);
	const url = urlMatch ? urlMatch[1] : '';

	// 解析方法
	const methodMatch = curlCommand.match(/-X\s+(['"]?)(\w+)\1/i);
	const method = methodMatch ? methodMatch[2] : 'GET';

	// 解析头部
	const headerMatches = curlCommand.matchAll(/-H\s+(['"])([^'"]+)\1/gi);
	const headers: Record<string, string> = {};

	for (const match of headerMatches) {
		const headerLine = match[2];
		const [key, ...valueParts] = headerLine.split(':');
		const value = valueParts.join(':').trim();
		headers[key.trim()] = value;
	}

	// 解析请求体
	const bodyMatch = curlCommand.match(/-d\s+(['"])([^'"]+)\1/i);
	const body = bodyMatch ? bodyMatch[2] : undefined;

	return {
		url,
		method,
		headers,
		body,
	};
}

/**
 * 确定任务是否应该运行
 * @param task 任务
 * @returns 是否应该运行
 */
export function shouldRunTask(task: Task): boolean {
	if (!task.active) return false;

	// 如果没有日志，或者日志为空，则应该运行
	if (!task.logs || task.logs.length === 0) return true;

	// 获取最后一次执行时间
	const lastLog = task.logs[0];
	const lastRunAt = new Date(lastLog.run_at).getTime();
	const now = Date.now();

	// 计算间隔分钟数
	const diffMinutes = (now - lastRunAt) / (60 * 1000);

	// 如果已经超过间隔时间，则应该运行
	return diffMinutes >= task.interval;
}

/**
 * 获取所有应该运行的任务
 * @param tasks 任务列表
 * @returns 应该运行的任务
 */
export function getTasksToRun(tasks: Record<string, Task>): Task[] {
	return Object.values(tasks).filter(shouldRunTask);
}

/**
 * 格式化日期为 ISO 字符串，去掉毫秒
 * @returns 格式化的日期字符串
 */
export function formatDate(date: Date = new Date()): string {
	return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * 生成唯一ID
 * @returns 唯一ID
 */
export function generateId(): string {
	return Math.random().toString(36).substring(2, 9);
}
