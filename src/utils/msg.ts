export async function msg (env: Env, message: any) {
  const baseurl = env.URL;
  const url = baseurl + '/msg/admin/corp';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  const data = await res.json();
  console.log(data);

}