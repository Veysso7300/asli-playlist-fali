// Aslı'nın Playlist Falı — Spotify yetkilendirme geri dönüş adresi (BİR KEZ kullanılır).
// Playlist herkese açık olmadığı için, playlist'i görebilen bir hesabın izin vermesi gerekiyor.
// Amaç: Spotify'ın verdiği "code"u refresh_token'a çevirip ekranda göstermek.

exports.handler = async function (event) {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
  const code = event.queryStringParameters && event.queryStringParameters.code;
  const siteUrl = `https://${event.headers.host}`;
  const redirectUri = `${siteUrl}/.netlify/functions/spotify-callback`;

  const html = (title, body) => ({
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `<!doctype html><html lang="tr"><head><meta charset="utf-8">
      <title>${title}</title>
      <style>
        body{font-family:system-ui,sans-serif;background:#241220;color:#fbeee6;padding:40px 20px;line-height:1.6}
        .box{max-width:560px;margin:0 auto;background:#3b1f3d;border-radius:16px;padding:28px}
        code{background:#241220;padding:10px 14px;border-radius:8px;display:block;margin:14px 0;word-break:break-all;color:#d9a441;font-size:13px}
        h1{font-size:20px}
      </style></head><body><div class="box"><h1>${title}</h1>${body}</div></body></html>`,
  });

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return html("Eksik ayar", "<p>SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET ortam değişkenleri tanımlı değil.</p>");
  }

  if (!code) {
    const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "playlist-read-private playlist-read-collaborative",
    })}`;
    return { statusCode: 302, headers: { Location: authUrl }, body: "" };
  }

  try {
    const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      return html("Hata", `<p>Token alınamadı:</p><code>${JSON.stringify(data)}</code>`);
    }

    return html(
      "Başarılı ✅ — Bu değeri kopyalayın",
      `<p>Aşağıdaki <b>refresh_token</b> değerini kopyalayıp Netlify > Site configuration > Environment variables kısmına
       <code>SPOTIFY_REFRESH_TOKEN</code> adıyla ekleyin.</p>
       <code>${data.refresh_token}</code>
       <p>Ekledikten sonra bu <code>spotify-callback.js</code> dosyasını silebilirsiniz.</p>`
    );
  } catch (err) {
    return html("Hata", `<p>${String(err)}</p>`);
  }
};
