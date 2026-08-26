# Aslı'nın Playlist Falı

Belirli bir Spotify playlist'inden ("2Bh2IYRIViPQWdyq56kHI6") her butona basışta rastgele bir şarkı öneren, tek sayfalık site.

## Nasıl çalışır
- Netlify Function (`netlify/functions/playlist-song.js`), Spotify'ın **Client Credentials** akışını kullanır — kişisel bir Spotify girişi/yetkilendirmesi GEREKMEZ, sadece bir Spotify uygulamasının Client ID/Secret bilgisi yeterli.
- Playlist herkese açık olduğu için bu şekilde çalışır. Playlist özel/gizli yapılırsa bu yöntem çalışmaz.

## Kurulum
1. Bu repoyu Netlify'a bağlayın (Build command boş, Publish directory: `.`)
2. Bir Spotify Developer App'iniz yoksa developer.spotify.com/dashboard'dan bir tane oluşturun (Redirect URI gerekmez, bu akış için gerekli değil)
3. Netlify > Site configuration > Environment variables kısmına ekleyin:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
4. Deploy'u tetikleyin
5. Siteyi açıp "Bana Bir Şarkı Öner" butonuna basın

## Playlist'i değiştirmek isterseniz
`netlify/functions/playlist-song.js` dosyasındaki `PLAYLIST_ID` sabitini yeni playlist ID'siyle değiştirin (Spotify playlist linkindeki `/playlist/` ile `?` arasındaki kısım).
