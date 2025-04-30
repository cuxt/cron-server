/**
 * KV 存储服务，用于操作任务数据
 */
import { Task, TaskLog, TaskStore, formatDate, generateId } from '../models/task';

const STORE_KEY = 'TASK_STORE';

/**
 * 初始化存储
 * @param env 环境变量
 * @returns 初始化后的存储数据
 */
export async function initializeStore(env: Env): Promise<TaskStore> {
	try {
		const storeData = await env.BINDING_NAME.get(STORE_KEY);
		if (storeData) {
			return JSON.parse(storeData) as TaskStore;
		}
	} catch (error) {
		console.error('初始化存储失败:', error);
	}

	// 如果没有数据或解析失败，则创建初始存储
	const initialStore: TaskStore = { tasks: {} };
	await saveStore(env, initialStore);
	return initialStore;
}

/**
 * 保存存储数据
 * @param env 环境变量
 * @param store 存储数据
 */
export async function saveStore(env: Env, store: TaskStore): Promise<void> {
	await env.BINDING_NAME.put(STORE_KEY, JSON.stringify(store));
}

/**
 * 获取所有任务
 * @param env 环境变量
 * @returns 所有任务
 */
export async function getAllTasks(env: Env): Promise<Record<string, Task>> {
	const store = await initializeStore(env);
	return store.tasks;
}

/**
 * 获取单个任务
 * @param env 环境变量
 * @param taskId 任务ID
 * @returns 任务，不存在则返回undefined
 */
export async function getTask(env: Env, taskId: string): Promise<Task | undefined> {
	const store = await initializeStore(env);
	return store.tasks[taskId];
}

/**
 * 创建任务
 * @param env 环境变量
 * @param task 任务数据
 * @returns 创建后的任务
 */
export async function createTask(env: Env, task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'logs'>): Promise<Task> {
	const store = await initializeStore(env);
	const now = formatDate();

	const newTask: Task = {
		...task,
		id: generateId(),
		created_at: now,
		updated_at: now,
		logs: [],
	};

	store.tasks[newTask.id] = newTask;
	await saveStore(env, store);
	return newTask;
}

/**
 * 更新任务
 * @param env 环境变量
 * @param taskId 任务ID
 * @param updates 更新的字段
 * @returns 更新后的任务，任务不存在则返回undefined
 */
export async function updateTask(
	env: Env,
	taskId: string,
	updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'logs'>>
): Promise<Task | undefined> {
	const store = await initializeStore(env);

	if (!store.tasks[taskId]) {
		return undefined;
	}

	store.tasks[taskId] = {
		...store.tasks[taskId],
		...updates,
		updated_at: formatDate(),
	};

	await saveStore(env, store);
	return store.tasks[taskId];
}

/**
 * 删除任务
 * @param env 环境变量
 * @param taskId 任务ID
 * @returns 是否删除成功
 */
export async function deleteTask(env: Env, taskId: string): Promise<boolean> {
	const store = await initializeStore(env);

	if (!store.tasks[taskId]) {
		return false;
	}

	delete store.tasks[taskId];
	await saveStore(env, store);
	return true;
}

/**
 * 记录任务执行日志
 * @param env 环境变量
 * @param taskId 任务ID
 * @param log 日志
 * @returns 更新后的任务，任务不存在则返回undefined
 */
export async function logTaskRun(env: Env, taskId: string, log: TaskLog): Promise<Task | undefined> {
	const store = await initializeStore(env);

	if (!store.tasks[taskId]) {
		return undefined;
	}

	// 限制日志数量，最多保留20条
	const logs = [log, ...store.tasks[taskId].logs].slice(0, 20);

	store.tasks[taskId] = {
		...store.tasks[taskId],
		logs,
		updated_at: formatDate(),
	};

	await saveStore(env, store);
	return store.tasks[taskId];
}

/**
 * 获取通知URL
 * @param env 环境变量
 * @returns 通知URL
 */
export async function getNotificationUrl(env: Env): Promise<string | undefined> {
	const store = await initializeStore(env);
	return store.notification_url;
}

/**
 * 设置通知URL
 * @param env 环境变量
 * @param url 通知URL
 */
export async function setNotificationUrl(env: Env, url: string): Promise<void> {
	const store = await initializeStore(env);
	store.notification_url = url;
	await saveStore(env, store);
}
