@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (
  echo Node.js belum terpasang. Membuka halaman download...
  start https://nodejs.org/en/download
  pause
  exit /b 1
)
if not exist node_modules (
  echo Menyiapkan SAVIOR untuk pertama kali...
  call npm install || goto :error
)
start "" http://localhost:5173
call npm run dev
exit /b 0
:error
echo Gagal menyiapkan SAVIOR. Foto layar ini lalu kirim ke saya.
pause
exit /b 1
