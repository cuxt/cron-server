import { msg } from "./msg";

export async function checkin (env: Env) {
  console.log("Rainyun checkin");
  const apikey = env.RAINYUN_API;
  const baseurl = 'https://api.v2.rainyun.com/user'

  const headers = {
    'x-api-key': apikey,
    'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
    'Content-Type': 'application/json'
  }

  // 获取用户信息
  const userInfo = await fetch(baseurl, {
    headers
  })
  const userInfoJson = await userInfo.json() as any;

  // 签到
  const payload = {
    'task_name': '每日签到'
  }
  const checkin = await fetch(baseurl + '/reward/tasks', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })
  const checkinJson = await checkin.json() as any;

  // 再次获取用户信息
  const userInfo2 = await fetch(baseurl, {
    headers
  })
  const userInfoJson2 = await userInfo2.json() as any

  let content = `用户ID：${userInfoJson.data.ID}\n用户名：${userInfoJson.data.Name}\n积分：${userInfoJson2.data.Points}\n`
  if (checkinJson.code === 200) {
    content += `签到成功，获得 ${userInfoJson2.data.Points - userInfoJson.data.Points} 积分`
  } else {
    content += `签到失败，${checkinJson.message}`
  }

  const message = {
    title: "Rainyun",
    desc: "签到",
    content: content
  }

  await msg(env, message)
}