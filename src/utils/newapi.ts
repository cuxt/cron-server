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

export async function getData (env: Env) {
  console.log("Getting NewAPI data")
  const url = env.NEWAPI_URL;
  // 起始时间 2024-11-1 00:00:00
  const startDate = new Date(2024, 10, 1, 0, 0, 0);
  const endDate = new Date();
  const starttimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  const message = {
    "title": "模型调用次数",
    "desc": "",
    "content": ""
  };
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${env.NEWAPI_KEY}`);
  headers.set('new-api-user', env.NEWAPAI_USER);

  try {
    const response = await fetch(`${url}/api/data/?username=&start_timestamp=${starttimestamp}&end_timestamp=${endTimestamp}&default_time=hour`,
      { headers }
    );
    const data = await response.json() as {
      data: {
        count: number,
        created_at: number,
        id: number,
        model_name: string,
        quota: number,
        token_used: number,
        user_id: number,
        username: string
      }[]
    }

    const modelCounts = new Map<string, number>();
    let totalCount = 0;

    data.data.forEach(item => {
      totalCount += item.count;
      if (modelCounts.has(item.model_name)) {
        modelCounts.set(item.model_name, modelCounts.get(item.model_name)! + item.count);
      } else {
        modelCounts.set(item.model_name, item.count);
      }
    });

    const sortedEntries = Array.from(modelCounts.entries()).sort((a, b) => b[1] - a[1]);

    message.desc = `总计: ${totalCount}`;
    sortedEntries.slice(0, 5).forEach(([model_name, count]) => {
      message.content += `\n${model_name}: ${count}`;
    });
    await msg(env, message);
  } catch (error) {
    console.log(error)
    message.content += `\n${error}`;
    await msg(env, message);
  }
}