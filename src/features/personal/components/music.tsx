"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Label, Notice, Textarea } from "@/components/ui/form";
import { discardUploads, uploadImage } from "@/lib/images";
import { mediaUrl } from "@/lib/media";
import type { Playlist, Song } from "../queries";
import { addPlaylist, addSong, deletePlaylist, deleteSong, previewMusicLink } from "../actions";
import { ImageInput } from "./image-input";

type Props = {
  songs: Song[];
  playlists: Playlist[];
  isMe: boolean;
  canModerate: boolean;
  userId: string;
  firstName: string;
};

export function Music({ songs, playlists, isMe, canModerate, userId, firstName }: Props) {
  const [addingSong, setAddingSong] = useState(false);
  const [addingPlaylist, setAddingPlaylist] = useState(false);
  const canDelete = isMe || canModerate;

  return (
    <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
      {/* A) Música actual */}
      <Card>
        <CardHeader
          title="🎧 Música actual"
          action={isMe && !addingSong ? <Button size="sm" onClick={() => setAddingSong(true)}>Afegeix una cançó</Button> : null}
        />
        <CardBody className="space-y-2">
          {addingSong ? <SongForm userId={userId} onDone={() => setAddingSong(false)} /> : null}
          {songs.length === 0 && !addingSong ? (
            <p className="py-4 text-center text-tinta-suau">
              {isMe ? "Què escoltes últimament?" : `${firstName} encara no ha compartit cap cançó.`}
            </p>
          ) : (
            <ul className="divide-y divide-linia-suau">
              {songs.map((s) => (
                <SongRow key={s.id} song={s} canDelete={canDelete} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* B) Playlists de Spotify */}
      <Card>
        <CardHeader
          title="🎶 Playlists de Spotify"
          action={isMe && !addingPlaylist ? <Button size="sm" onClick={() => setAddingPlaylist(true)}>Afegeix una playlist</Button> : null}
        />
        <CardBody className="space-y-3">
          {addingPlaylist ? <PlaylistForm onDone={() => setAddingPlaylist(false)} /> : null}
          {playlists.length === 0 && !addingPlaylist ? (
            <p className="py-4 text-center text-tinta-suau">
              {isMe ? "Comparteix les teves playlists de Spotify." : `${firstName} encara no ha compartit cap playlist.`}
            </p>
          ) : (
            <ul className="space-y-3">
              {playlists.map((p) => (
                <PlaylistCard key={p.id} playlist={p} canDelete={canDelete} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ─── Cançons ───────────────────────────────────────────────────
function Cover({ src, size, emoji }: { src: string | null; size: string; emoji: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden border border-linia bg-sorli-50 ${size}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- portada externa (Spotify/YouTube) o privada
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" />
      ) : (
        <span className="text-xl">{emoji}</span>
      )}
    </span>
  );
}

function useDelete(fn: (id: string) => Promise<{ ok: boolean; error?: string }>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return {
    pending,
    remove: (id: string, question: string) => {
      if (!window.confirm(question)) return;
      startTransition(async () => {
        const res = await fn(id);
        if (!res.ok) window.alert(res.error);
        router.refresh();
      });
    },
  };
}

function SongRow({ song, canDelete }: { song: Song; canDelete: boolean }) {
  const { pending, remove } = useDelete(deleteSong);
  const cover = mediaUrl("photos", song.cover_path) ?? song.cover_url;
  return (
    <li className={`flex items-center gap-2.5 py-2 ${pending ? "opacity-50" : ""}`}>
      <Cover src={cover} size="size-12" emoji="🎵" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{song.title}</p>
        <p className="truncate text-sm text-tinta-suau">{song.artist}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end text-xs">
        <a href={song.url} target="_blank" rel="noopener noreferrer">
          Escolta ↗
        </a>
        {canDelete ? (
          <button type="button" className="text-tinta-suau hover:text-perill" onClick={() => remove(song.id, `Vols treure «${song.title}»?`)}>
            Elimina
          </button>
        ) : null}
      </div>
    </li>
  );
}

function SongForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [autoCover, setAutoCover] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function lookup() {
    if (!/^https:\/\//.test(url.trim())) return;
    setLooking(true);
    const res = await previewMusicLink(url);
    setLooking(false);
    if (res.ok && res.data) {
      // Spotify només dona el títol; YouTube, títol i canal.
      if (!title && res.data.title) setTitle(res.data.title);
      if (!artist && res.data.author && res.data.provider === "youtube") setArtist(res.data.author);
      setAutoCover(res.data.thumbnail);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      let uploaded: string | null = null;
      try {
        if (file) uploaded = await uploadImage(file, { bucket: "photos", userId, maxSide: 500, suffix: "cover" });
        const res = await addSong({ url, title, artist, coverPath: uploaded });
        if (!res.ok) throw new Error(res.error);
        router.refresh();
        onDone();
      } catch (err) {
        if (uploaded) await discardUploads("photos", [uploaded]);
        setError(err instanceof Error ? err.message : "No s'ha pogut afegir.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2 border border-linia-suau bg-fons p-2.5" noValidate>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field
        label="Enllaç (Spotify, YouTube…)"
        name="url"
        type="url"
        inputMode="url"
        placeholder="https://open.spotify.com/track/…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={lookup}
        required
        autoFocus
      />
      {looking ? <p className="text-xs text-tinta-suau">Buscant la informació de l&apos;enllaç…</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Cançó" name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required />
        <Field label="Artista" name="artist" value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={150} required />
      </div>
      <ImageInput
        label={autoCover ? "Canvia la portada" : "Portada (opcional)"}
        preview={preview ?? autoCover}
        disabled={pending}
        onPick={(f) => {
          setFile(f);
          setPreview(URL.createObjectURL(f));
        }}
        onClear={() => {
          setFile(null);
          setPreview(null);
          setAutoCover(null);
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !url || !title.trim() || !artist.trim()}>
          {pending ? "Afegint…" : "Afegeix"}
        </Button>
        <Button variant="secundari" disabled={pending} onClick={onDone}>
          Cancel·la
        </Button>
      </div>
    </form>
  );
}

// ─── Playlists ─────────────────────────────────────────────────
function PlaylistCard({ playlist, canDelete }: { playlist: Playlist; canDelete: boolean }) {
  const { pending, remove } = useDelete(deletePlaylist);
  const [listening, setListening] = useState(false);
  const id = playlist.spotify_url.match(/playlist\/([A-Za-z0-9]+)/)?.[1];

  return (
    <li className={`border border-linia-suau ${pending ? "opacity-50" : ""}`}>
      <div className="flex gap-2.5 p-2">
        <Cover src={playlist.cover_url} size="size-20" emoji="🎶" />
        <div className="min-w-0 flex-1">
          <p className="font-bold break-words">{playlist.title}</p>
          {playlist.description ? <p className="text-sm break-words text-tinta-suau">{playlist.description}</p> : null}
          <p className="mt-1 flex flex-wrap gap-x-2 text-xs">
            {id ? (
              <button type="button" className="text-sorli-700 hover:underline" onClick={() => setListening((l) => !l)}>
                {listening ? "Amaga el reproductor" : "▶ Escolta aquí"}
              </button>
            ) : null}
            <a href={playlist.spotify_url} target="_blank" rel="noopener noreferrer">
              Obre a Spotify ↗
            </a>
            {canDelete ? (
              <button type="button" className="text-tinta-suau hover:text-perill" onClick={() => remove(playlist.id, `Vols treure «${playlist.title}»?`)}>
                Elimina
              </button>
            ) : null}
          </p>
        </div>
      </div>
      {listening && id ? (
        // Reproductor oficial de Spotify (embed); no en fem cap de propi.
        <iframe
          title={`Playlist ${playlist.title} a Spotify`}
          src={`https://open.spotify.com/embed/playlist/${id}?utm_source=generator`}
          className="block h-[352px] w-full border-0 border-t border-linia-suau"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      ) : null}
    </li>
  );
}

function PlaylistForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function lookup() {
    if (!/open\.spotify\.com\/.*playlist\//.test(spotifyUrl)) return;
    const res = await previewMusicLink(spotifyUrl);
    if (res.ok && res.data) {
      setCover(res.data.thumbnail);
      if (!title && res.data.title) setTitle(res.data.title);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addPlaylist({ spotifyUrl, title, description });
      if (!res.ok) return setError(res.error);
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2 border border-linia-suau bg-fons p-2.5" noValidate>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="flex items-end gap-2">
        <Field
          className="flex-1"
          label="Enllaç de la playlist"
          name="spotifyUrl"
          type="url"
          inputMode="url"
          placeholder="https://open.spotify.com/playlist/…"
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
          onBlur={lookup}
          required
          autoFocus
        />
        <Cover src={cover} size="size-[26px]" emoji="🎶" />
      </div>
      <p className="-mt-1 text-xs text-tinta-suau">A Spotify: ⋯ → Comparteix → Copia l&apos;enllaç de la playlist.</p>
      <Field label="Títol" name="title" placeholder="gotta go fast" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
      <div>
        <Label htmlFor="pl-desc">Descripció</Label>
        <Textarea id="pl-desc" placeholder="música per anar a córrer" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !spotifyUrl || !title.trim()}>
          {pending ? "Afegint…" : "Afegeix"}
        </Button>
        <Button variant="secundari" disabled={pending} onClick={onDone}>
          Cancel·la
        </Button>
      </div>
    </form>
  );
}
