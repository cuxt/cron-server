import { msg } from "./msg";
export async function checkin (env: Env) {
  console.log('Serv00 checkin');
  const accounts = JSON.parse(env.SERV00);

  const results = [];
  for (const account of accounts) {
    const result = await login(env, account)
    results.push({ ...account, ...result })
    await delay(Math.floor(Math.random() * 8000) + 1000)
  }

  const successfulLogins = results.filter(r => r.success)
  const failedLogins = results.filter(r => !r.success)

  let content = '登录结果统计：\n'
  content += `成功登录的账号：${successfulLogins.length}\n`
  content += `登录失败的账号：${failedLogins.length}\n`

  if (failedLogins.length > 0) {
    content += '\n登录失败的账号列表：\n'
    failedLogins.forEach(({ username, type, message }) => {
      content += `- ${username} (${type}): ${message}\n`
    })
  }

  await sendMsg(env, content)
}

async function login (env: Env, account: { username: string; password: string; panel: string; }) {
  const { username, password, panel } = account
  let url = `https://panel${panel}.serv00.com/login/?next=/`

  const userAgent = generateRandomUserAgent();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
      },
    })

    const pageContent = await response.text()
    const csrfMatch = pageContent.match(/name="csrfmiddlewaretoken" value="([^"]*)"/)
    const csrfToken = csrfMatch ? csrfMatch[1] : null

    if (!csrfToken) {
      throw new Error('CSRF token not found')
    }

    const initialCookies = response.headers.get('set-cookie') || ''

    const formData = new URLSearchParams({
      'username': username,
      'password': password,
      'csrfmiddlewaretoken': csrfToken,
      'next': '/'
    })

    const loginResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': url,
        'User-Agent': userAgent,
        'Cookie': initialCookies,
      },
      body: formData.toString(),
      redirect: 'manual'
    })

    const loginResponseBody = await loginResponse.text()

    if (loginResponse.status === 302 && loginResponse.headers.get('location') === '/') {
      const loginCookies = loginResponse.headers.get('set-cookie') || ''
      const allCookies = combineCookies(initialCookies, loginCookies)

      const dashboardResponse = await fetch(url.replace('/login/', '/'), {
        headers: {
          'Cookie': allCookies,
          'User-Agent': userAgent,
        }
      })
      const dashboardContent = await dashboardResponse.text()

      if (dashboardContent.includes('href="/logout/"') || dashboardContent.includes('href="/wyloguj/"')) {
        const nowUtc = formatToISO(new Date())
        const nowBeijing = formatToISO(new Date(Date.now() + 8 * 60 * 60 * 1000))
        const content = `账号 ${username} 于北京时间 ${nowBeijing}（UTC时间 ${nowUtc}）登录成功！`
        await sendMsg(env, content)
        return { success: true, content }
      } else {
        const content = `账号 ${username} 登录后未找到登出链接，可能登录失败。`
        console.error(content)
        await sendMsg(env, content)
        return { success: false, content }
      }
    } else if (loginResponseBody.includes('Nieprawidłowy login lub hasło')) {
      const content = `账号 ${username} 登录失败：用户名或密码错误。`
      console.error(content)
      await sendMsg(env, content)
      return { success: false, content }
    } else {
      const content = `账号 ${username} 登录失败，未知原因。请检查账号和密码是否正确。`
      console.error(content)
      await sendMsg(env, content)
      return { success: false, content }
    }
  } catch (error: any) {
    const content = `账号 ${username} 登录时出现错误: ${error.message}`
    console.error(content)
    await sendMsg(env, content)
    return { success: false, content }
  }
}

async function sendMsg (env: Env, content: string) {
  const message = {
    "title": "Serv00",
    "desc": "保活",
    "content": content
  }
  await msg(env, message);
}

function generateRandomUserAgent () {
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
  const browser = browsers[Math.floor(Math.random() * browsers.length)];
  const version = Math.floor(Math.random() * 100) + 1;
  const os = ['Windows NT 10.0', 'Macintosh', 'X11'];
  const selectedOS = os[Math.floor(Math.random() * os.length)];
  const osVersion = selectedOS === 'X11' ? 'Linux x86_64' : selectedOS === 'Macintosh' ? 'Intel Mac OS X 10_15_7' : 'Win64; x64';

  return `Mozilla/5.0 (${selectedOS}; ${osVersion}) AppleWebKit/537.36 (KHTML, like Gecko) ${browser}/${version}.0.0.0 Safari/537.36`;
}

function combineCookies (cookies1: string, cookies2: string) {
  const cookieMap = new Map()

  const parseCookies = (cookieString: string) => {
    cookieString.split(',').forEach(cookie => {
      const [fullCookie] = cookie.trim().split(';')
      const [name, value] = fullCookie.split('=')
      if (name && value) {
        cookieMap.set(name.trim(), value.trim())
      }
    })
  }

  parseCookies(cookies1)
  parseCookies(cookies2)

  return Array.from(cookieMap.entries()).map(([name, value]) => `${name}=${value}`).join('; ')
}

function formatToISO (date: Date) {
  return date.toISOString().replace('T', ' ').replace('Z', '').replace(/\.\d{3}Z/, '')
}

function delay (ms: number | undefined) {
  return new Promise(resolve => setTimeout(resolve, ms))
}