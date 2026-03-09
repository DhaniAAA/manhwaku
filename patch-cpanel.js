const fs = require('fs');
const path = require('path');

const serverJsPath = path.join(__dirname, '.next', 'standalone', 'server.js');

try {
  if (fs.existsSync(serverJsPath)) {
    let content = fs.readFileSync(serverJsPath, 'utf8');

    // Mencegah Next.js mem-parsing process.env.PORT menjadi angka
    // karena cPanel Passenger mengirim string (Socket Path) ke process.env.PORT
    const searchTarget = 'const currentPort = parseInt(process.env.PORT, 10) || 3000';
    const replacement = 'const currentPort = process.env.PORT || 3000';

    if (content.includes(searchTarget)) {
      content = content.replace(searchTarget, replacement);
      fs.writeFileSync(serverJsPath, content, 'utf8');
      console.log('✅ patched server.js for cPanel compatibility (fixed 503 error)');
    } else if (content.includes(replacement)) {
      console.log('ℹ️ server.js is already patched for cPanel.');
    } else {
      console.warn('⚠️ could not find PORT string to patch in server.js');
    }
  } else {
    console.error('❌ standalone/server.js not found. Make sure next build finished.');
  }
} catch (error) {
  console.error('Error patching server.js:', error);
}

// === TAHAP 2: Buat File ZIP yang kompatibel dengan Linux / CPanel ===
const archiver = require('archiver');

const standaloneDir = path.join(__dirname, '.next', 'standalone');
const zipFilename = 'manhwaku-app.zip';
const zipFilePath = path.join(__dirname, zipFilename);

if (fs.existsSync(standaloneDir)) {
  console.log('📦 Membuat file ZIP cPanel yang kompatibel dengan Linux (Forward Slashes)...');

  // Hapus ZIP lama jika ada
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }

  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Level kompresi maksimal
  });

  output.on('close', function() {
    console.log(`✅ Berhasil membuat ${zipFilename}! (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`);
    console.log('🚀 Siap di-upload ke CPanel File Manager.');
  });

  archive.on('error', function(err) {
    console.error('❌ Gagal membuat file ZIP:', err);
    throw err;
  });

  archive.pipe(output);

  // Trik Cloudlinux: Masukkan seluruh isi instalasi standalone ke dalam sub-folder `server/`
  // CPanel akan membuat symlink `node_modules` di root (luar folder server), sehingga tidak tabrakan
  // dengan file `node_modules` produksi bawaan Next.js Standalone
  archive.directory(standaloneDir, 'server');

  // Berikan package.json pancingan di root agar CPanel NodeJS Selector tidak error/protes
  archive.append(Buffer.from(JSON.stringify({
    name: "cpanel-nextjs-wrapper",
    version: "1.0.0",
    description: "CloudLinux CPanel Node.js App Root",
    main: "server/server.js"
  }, null, 2)), { name: 'package.json' });

  // PENTING: Sertakan file static & public agar bisa diserve Next.js (Mencegah 404 CSS/JS)
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    archive.directory(publicDir, 'server/public');
  }

  const staticDir = path.join(__dirname, '.next', 'static');
  if (fs.existsSync(staticDir)) {
    archive.directory(staticDir, 'server/.next/static');
  }

  archive.finalize();
} else {
  console.error('❌ Folder .next/standalone tidak ditemukan. Proses ZIP dibatalkan.');
}
