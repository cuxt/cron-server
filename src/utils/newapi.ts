import { msg } from "./msg";

export async function keep (env: Env) {
  console.log("Keep NewAPI alive")
  const url = 'https://llm.bxin.top'

  try {
    const response = await fetch(url);

    // const message = {
    //   "title": "OneAPI",
    //   "desc": "Success",
    //   "content": `${response.status} ${response.statusText}`
    // };
    // await msg(env, message);
    console.log(response);
  } catch (error) {
    console.log(error)

    const message = {
      "title": "NewAPI",
      "desc": 'Keep alive failed',
      "content": `${error}`
    };
    await msg(env, message, 'low');
  }
}

export async function signing (env: Env) {
  console.log("Signing NewAPI")
  const siteList = JSON.parse(env.NEWAPI);

  const message = {
    "title": "NewAPI",
    "desc": "Signing",
    "content": ""
  };

  for (const site of siteList) {
    console.log(site);
    const url = site.url;
    const token = site.token;
    const id = site.id;
    const channel: string = site.channel;

    message.content += `\n---\n${url}`;

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set(channel, id);

    const payload = {
      'id': id
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json() as {
        message: string,
        success: boolean
      };
      message.content += `\n${data.message}`;
    } catch (error) {
      console.log(error)
      message.content += `\n${error}`;
      await msg(env, message);
    }
  }
  await msg(env, message);
}