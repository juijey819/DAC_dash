# Push Vocation Paradox ke DAC_dash

Tujuannya [juijey819/DAC_dash](https://github.com/juijey819/DAC_dash). Repo masih kosong dan GitHub mencatat `main` sebagai branch default saat diperiksa pada 19 November 2026. Panduan ini memakai PowerShell di Windows.

## 1. Siapkan proyek

Ekstrak ZIP. Folder sumber yang benar berisi `package.json`, `src`, `data`, dan `public`. Siapkan Git for Windows dan Node.js versi 22.13 atau lebih baru.

## 2. Clone repo dan salin file

Jalankan ini dari folder tempat kamu ingin menyimpan checkout GitHub. Ubah nilai `$source` sesuai **folder hasil ekstrak yang langsung berisi `package.json`**. Kalau kamu sudah punya checkout `DAC_dash`, buka folder itu dan cek URL-nya lewat `git remote -v`.

```powershell
git clone https://github.com/juijey819/DAC_dash.git
Set-Location DAC_dash
git remote -v
$source = "$HOME\Downloads\Vocation_Paradox_Source"
if (-not (Test-Path -LiteralPath (Join-Path $source 'package.json'))) {
    throw 'Ubah $source ke folder hasil ekstrak yang langsung berisi package.json.'
}
Get-ChildItem -LiteralPath $source -Force | Copy-Item -Destination . -Recurse
```

Jika Git menampilkan pesan bahwa repo kosong saat clone, itu normal untuk push pertama. Opsi `-Force` di `Get-ChildItem` memastikan `.gitignore` ikut tersalin.

## 3. Tes, commit, dan push

```powershell
npm ci
npm test
npm run build
```

Untuk melihat dashboard, jalankan `npm run dev`, buka alamat yang ditampilkan Vite, lalu tekan Ctrl+C di terminal untuk kembali ke prompt.

Setelah tes lulus, jalankan tahap berikut dari folder `DAC_dash`.

```powershell
git add .
git diff --cached --stat
git commit -m "Add Vocation Paradox dashboard"
git branch -M main
git push -u origin main
```

Setelah push berhasil, buka branch `main` di GitHub. Folder `src`, `data`, `public`, dan file `README.md` akan muncul. Langkah ini mengunggah source code ke GitHub. Dashboard sudah tersedia di tautan situs yang terpisah.

## Jika muncul kendala

- **Git meminta identitas commit**. Jalankan `git config user.name "Nama kamu"` dan `git config user.email "Email GitHub kamu"` di folder repo, lalu ulangi commit.
- **GitHub meminta login**. Selesaikan login di browser melalui Git Credential Manager. Akun yang dipakai perlu izin tulis pada repo.
- **Repo sudah terisi ketika kamu clone**. Buat branch `git switch -c feat/vocation-paradox` sebelum menyalin. Jika nama file bertabrakan dengan proyek yang sudah ada, salin ke subfolder `dashboard1` dan jalankan perintah npm dari subfolder tersebut. Commit dari root, push dengan `git push -u origin feat/vocation-paradox`, lalu buka pull request.
- **Push ditolak karena `non-fast-forward`**. Jika orang lain sudah membuat commit pertama setelah kamu clone, mulai dari clone baru dan gunakan alur branch di atas.

Rujukan resmi: [menambahkan kode lokal ke GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github) dan [autentikasi Git dengan remote HTTPS](https://docs.github.com/en/get-started/git-basics/about-remote-repositories).
