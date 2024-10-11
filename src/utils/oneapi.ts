import { msg } from "./msg";

export async function keep (env: Env) {
  console.log("Keep OneAPI alive")
  const url = 'https://oneapi.bxin.top'

  try {
    const response = await fetch(url);

    const message = {
      "title": "OneAPI",
      "desc": "Success",
      "content": `${response.status} ${response.statusText}`
    };
    await msg(env, message);
    console.log(response);
  } catch (error) {
    console.log(error)

    const message = {
      "title": "OneAPI",
      "desc": 'Failed',
      "content": `${error}`
    };
    await msg(env, message);
  }
}