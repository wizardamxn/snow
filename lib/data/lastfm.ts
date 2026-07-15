export type NowPlaying = {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  songUrl: string | null;
};

const FALLBACK: NowPlaying = {
  isPlaying: false,
  title: "Low Man's Lyric",
  artist: "Metallica",
  album: "Reload",
  albumArt: null,
  songUrl: null,
};

export async function getNowPlaying(): Promise<NowPlaying> {
  const { LASTFM_API_KEY, LASTFM_USERNAME } = process.env;

  if (!LASTFM_API_KEY || !LASTFM_USERNAME) return FALLBACK;

  try {
    const url = new URL("https://ws.audioscrobbler.com/2.0/");
    url.searchParams.set("method", "user.getrecenttracks");
    url.searchParams.set("user", LASTFM_USERNAME);
    url.searchParams.set("api_key", LASTFM_API_KEY);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return FALLBACK;

    const data = await res.json();
    const track = data?.recenttracks?.track?.[0];
    if (!track) return FALLBACK;

    const isPlaying = track["@attr"]?.nowplaying === "true";
    const albumArt =
      track.image?.find((img: { size: string; "#text": string }) => img.size === "extralarge")?.["#text"] ||
      track.image?.find((img: { size: string; "#text": string }) => img.size === "large")?.["#text"] ||
      null;

    return {
      isPlaying,
      title: track.name,
      artist: track.artist?.["#text"] ?? track.artist,
      album: track.album?.["#text"] ?? "",
      albumArt: albumArt && albumArt.trim() !== "" ? albumArt : null,
      songUrl: track.url ?? null,
    };
  } catch (err) {
    console.log("[lastfm] Exception:", err);
    return FALLBACK;
  }
}
