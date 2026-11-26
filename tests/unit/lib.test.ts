import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { formatBirthday, formatPostDate } from "../../src/lib/dates.ts";
import { isOwnStoragePath, mediaUrl } from "../../src/lib/media.ts";
import { cleanMusicUrl, spotifyPlaylistId } from "../../src/lib/oembed.ts";
import { safeNext } from "../../src/lib/safe-redirect.ts";

describe("safeNext (redireccions obertes)", () => {
  test("accepta rutes internes", () => {
    assert.equal(safeNext("/perfil/janaiot"), "/perfil/janaiot");
  });
  test("rebutja dominis externs i trucs", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "evil", "", null, 42]) {
      assert.equal(safeNext(bad), "/inici", String(bad));
    }
  });
});

describe("rutes de Storage", () => {
  const uid = "8a6e0804-2bd0-4672-b79d-d97027f9071a";
  const file = "0f8fad5b-d9cb-469f-a165-70867728950e";

  test("accepta fitxers de la carpeta pròpia", () => {
    assert.ok(isOwnStoragePath(`${uid}/${file}.webp`, uid));
    assert.ok(isOwnStoragePath(`${uid}/${file}-avatar.webp`, uid));
    assert.ok(isOwnStoragePath(`${uid}/${file}.gif`, uid));
  });
  test("rebutja carpetes alienes, path traversal i extensions estranyes", () => {
    const other = "11111111-1111-1111-1111-111111111111";
    assert.ok(!isOwnStoragePath(`${other}/${file}.webp`, uid));
    assert.ok(!isOwnStoragePath(`${uid}/../${other}/${file}.webp`, uid));
    assert.ok(!isOwnStoragePath(`${uid}/${file}.html`, uid));
    assert.ok(!isOwnStoragePath(`${uid}/${file}.webp/x`, uid));
  });
  test("mediaUrl", () => {
    assert.equal(mediaUrl("photos", null), null);
    assert.equal(mediaUrl("photos", `${uid}/${file}.webp`), `/media/photos/${uid}/${file}.webp`);
  });
});

describe("dates en català", () => {
  const now = new Date("2026-11-26T22:00:00Z"); // 23:00 a Barcelona

  test("relatives", () => {
    assert.equal(formatPostDate("2026-11-26T21:59:40Z", now), "ara mateix");
    assert.equal(formatPostDate("2026-11-26T21:59:00Z", now), "fa 1 minut");
    assert.equal(formatPostDate("2026-11-26T21:35:00Z", now), "fa 25 minuts");
    assert.equal(formatPostDate("2026-11-26T19:00:00Z", now), "fa 3 hores");
  });
  test("ahir i dies de la setmana, a l'hora de Barcelona", () => {
    assert.equal(formatPostDate("2026-11-25T20:30:00Z", now), "ahir a les 21:30");
    assert.match(formatPostDate("2026-11-23T08:05:00Z", now), /^dilluns a les 09:05$/);
  });
  test("aniversari sense any", () => {
    assert.equal(formatBirthday("1997-03-12"), "12 de març");
  });
});

describe("enllaços de música", () => {
  test("treu el seguiment de Spotify", () => {
    assert.equal(
      cleanMusicUrl("https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP?si=abc123"),
      "https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP",
    );
  });
  test("extreu l'id de la playlist", () => {
    assert.equal(spotifyPlaylistId("https://open.spotify.com/intl-es/playlist/37i9dQZF1DX76Wlfdnj7AP"), "37i9dQZF1DX76Wlfdnj7AP");
    assert.equal(spotifyPlaylistId("https://evil.com/playlist/x"), null);
  });
});

describe("artista de Spotify", async () => {
  const { parseSpotifyArtist } = await import("../../src/lib/oembed.ts");
  test("llegeix music:musician_description", () => {
    const html = `<head><meta property="og:title" content="Never Gonna Give You Up"/>
      <meta name="music:musician_description" content="Rick Astley"/>
      <meta property="og:description" content="Rick Astley · Whenever You Need Somebody · Song · 1987"/></head>`;
    assert.equal(parseSpotifyArtist(html), "Rick Astley");
  });
  test("diversos artistes i entitats HTML", () => {
    const html = `<meta name="music:musician_description" content="Rosal&#xED;a"><meta name="music:musician_description" content="The Weeknd &amp; Co">`;
    assert.equal(parseSpotifyArtist(html), "Rosalía, The Weeknd & Co");
  });
  test("pla B: og:description", () => {
    assert.equal(parseSpotifyArtist(`<meta property="og:description" content="Txarango · Som Riu · Song · 2016">`), "Txarango");
  });
  test("sense dades → null", () => {
    assert.equal(parseSpotifyArtist("<html></html>"), null);
  });
});
