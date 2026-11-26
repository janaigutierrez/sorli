import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema, usernameSchema } from "../../src/features/auth/schemas.ts";
import { playlistSchema, songSchema, wishSchema } from "../../src/features/personal/schemas.ts";
import { profileSchema } from "../../src/features/profiles/schemas.ts";

describe("registre", () => {
  const ok = {
    token: "PqB2Wb4cYoEphe4stk7zieuOm0cQrEuRJIxVlWl5pm8",
    email: "  Marta@Exemple.CAT ",
    username: "Marta_P",
    password: "unacontrasenyallarga",
    passwordConfirm: "unacontrasenyallarga",
  };

  test("normalitza correu i usuari", () => {
    const r = registerSchema.parse(ok);
    assert.equal(r.email, "marta@exemple.cat");
    assert.equal(r.username, "marta_p");
  });
  test("contrasenyes diferents", () => {
    const r = registerSchema.safeParse({ ...ok, passwordConfirm: "una-altra" });
    assert.ok(!r.success);
    assert.deepEqual(r.error?.issues[0]?.path, ["passwordConfirm"]);
  });
  test("contrasenya curta", () => {
    assert.ok(!registerSchema.safeParse({ ...ok, password: "1234567", passwordConfirm: "1234567" }).success);
  });
  test("noms d'usuari", () => {
    for (const good of ["abc", "janai.ot", "a_b_c", "x".repeat(20)]) assert.ok(usernameSchema.safeParse(good).success, good);
    for (const bad of ["ab", "x".repeat(21), "amb espai", "accént", "<script>"]) {
      assert.ok(!usernameSchema.safeParse(bad).success, bad);
    }
  });
  test("login demana correu vàlid", () => {
    assert.ok(!loginSchema.safeParse({ email: "no-es-correu", password: "x" }).success);
  });
});

describe("perfil", () => {
  test("camps buits → null", () => {
    const r = profileSchema.parse({ display_name: " Janai ", bio: "", city: "", birthday: "" });
    assert.deepEqual(r, { display_name: "Janai", bio: null, city: null, birthday: null });
  });
  test("aniversari al futur no", () => {
    assert.ok(!profileSchema.safeParse({ display_name: "x", bio: "", city: "", birthday: "2999-01-01" }).success);
  });
});

describe("contingut personal", () => {
  test("wishlist: només enllaços http(s)", () => {
    assert.ok(wishSchema.safeParse({ name: "Bambes", description: "", url: "https://botiga.cat/x", imagePath: null }).success);
    assert.ok(wishSchema.safeParse({ name: "Bambes", description: "", url: "", imagePath: null }).success);
    assert.ok(!wishSchema.safeParse({ name: "Bambes", description: "", url: "javascript:alert(1)", imagePath: null }).success);
  });
  test("cançó requereix títol, artista i enllaç", () => {
    assert.ok(!songSchema.safeParse({ title: "", artist: "x", url: "https://y.com", coverPath: null }).success);
  });
  test("playlist: només Spotify", () => {
    const base = { title: "gotta go fast", description: "" };
    assert.ok(playlistSchema.safeParse({ ...base, spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP" }).success);
    assert.ok(!playlistSchema.safeParse({ ...base, spotifyUrl: "https://evil.com/playlist/37i9dQZF1DX76Wlfdnj7AP" }).success);
  });
});
