// Aslı'nın Playlist Falı — belirli bir Spotify playlist'inden rastgele şarkı önerir.
// Playlist herkese açık olmadığı için kullanıcı yetkili erişim (refresh token) kullanılır.
// Gerekli ortam değişkenleri (Netlify > Site configuration > Environment variables):
//   SPOTIFY_CLIENT_ID
//   SPOTIFY_CLIENT_SECRET
//   SPOTIFY_REFRESH_TOKEN   (spotify-callback.js ile bir kez alınır)

const PLAYLIST_ID = "2Bh2IYRIViPQWdyq56kHI6";

exports.handler = async function () {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
  const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ configured: false }) };
  }
  if (!SPOTIFY_REFRESH_TOKEN) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ configured: false, needs_auth: true }) };
  }

  try {
    // 1) refresh token ile taze bir access token al (kullanıcı yetkili)
    const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: SPOTIFY_REFRESH_TOKEN,
      }),
    });
    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      return { statusCode: 200, headers: cors, body: JSON.stringify({ configured: true, error: "token_failed", detail: t }) };
    }
    const { access_token } = await tokenRes.json();

    // 2) playlist'teki toplam şarkı sayısını öğren
    const countRes = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?fields=total&limit=1`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (!countRes.ok) {
      const t = await countRes.text();
      return { statusCode: 200, headers: cors, body: JSON.stringify({ configured: true, error: "playlist_failed", detail: t }) };
    }
    const { total } = await countRes.json();
    if (!total || total < 1) {
      return { statusCode: 200, headers: cors, body: JSON.stringify({ configured: true, error: "empty_playlist" }) };
    }

    // 3) rastgele bir konumdan tek şarkı çek
    const offset = Math.floor(Math.random() * total);
    const trackRes = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?offset=${offset}&limit=1&fields=items(track(id,name,artists(name),album(name,images),external_urls,preview_url))`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const data = await trackRes.json();
    const item = data.items && data.items[0] && data.items[0].track;
    if (!item) {
      return { statusCode: 200, headers: cors, body: JSON.stringify({ configured: true, error: "track_not_found" }) };
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        configured: true,
        id: item.id,
        name: item.name,
        artist: (item.artists || []).map((a) => a.name).join(", "),
        album: item.album ? item.album.name : "",
        album_art: item.album && item.album.images && item.album.images[0] ? item.album.images[0].url : null,
        spotify_url: item.external_urls ? item.external_urls.spotify : null,
        total_tracks: total,
      }),
    };
  } catch (err) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ configured: true, error: String(err) }) };
  }
};
