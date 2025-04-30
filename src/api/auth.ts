/**
 * 验证用户登录
 */
export async function login(env: Env, password: string): Promise<boolean> {
	// 从环境变量获取密码
	const validPassword = env.AUTH;

	// 如果未设置环境变量密码，拒绝所有登录请求
	if (!validPassword) {
		console.error('系统未设置密码，请在环境变量中设置 AUTH');
		return false;
	}

	return password === validPassword;
}

/**
 * 处理登录请求
 */
export async function handleLoginRequest(request: Request, env: Env): Promise<Response> {
	try {
		const { password } = (await request.json()) as { password: string };

		if (!password) {
			return new Response(JSON.stringify({ error: '密码不能为空' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
		}

		const isValid = await login(env, password);

		if (isValid) {
			const token = crypto.randomUUID();

			return new Response(JSON.stringify({ token }), { status: 200, headers: { 'Content-Type': 'application/json' } });
		} else {
			return new Response(JSON.stringify({ error: '密码错误' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
		}
	} catch (error) {
		console.error('登录请求处理错误:', error);
		return new Response(JSON.stringify({ error: '登录失败，请重试' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
	}
}
