const fs = require('fs');
const path = require('path');

const DEFAULT_AUDIO_DIR = 'E:\\MaharajLectures';
let currentAudioDir = DEFAULT_AUDIO_DIR;

const getCurrentAudioDir = () => currentAudioDir;

const setCurrentAudioDir = (dir) => {
  if (dir && String(dir).trim()) currentAudioDir = String(dir).trim();
  return currentAudioDir;
};

const findAudioFile = (lectureId, dirOverride = null) => {
  if (!lectureId) return null;
  const idStr = String(lectureId).trim();
  const targetDir = (dirOverride && String(dirOverride).trim()) ? String(dirOverride).trim() : currentAudioDir;
  if (!fs.existsSync(targetDir)) return null;

  const candidateNames = [
    `${idStr}.mp3`,
    `${idStr.padStart(4, '0')}.mp3`,
    `${idStr.padStart(3, '0')}.mp3`,
    `${idStr.replace(/^0+/, '')}.mp3`,
    `Lecture_${idStr}.mp3`,
    `Lecture-${idStr}.mp3`
  ];

  for (const name of candidateNames) {
    const fullPath = path.join(targetDir, name);
    if (fs.existsSync(fullPath)) return { filePath: fullPath, fileName: name };
  }
  return null;
};

const checkDriveStatus = (queryDir) => {
  if (queryDir) setCurrentAudioDir(queryDir);
  const targetDir = currentAudioDir || DEFAULT_AUDIO_DIR;
  const parsed = path.parse(targetDir);
  const rootDrive = parsed.root || (targetDir.includes(':') ? targetDir.slice(0, 3) : '');
  const drivePresent = rootDrive ? fs.existsSync(rootDrive) : true;
  const directoryPresent = fs.existsSync(targetDir);

  let fileCount = 0;
  if (directoryPresent) {
    try {
      fileCount = fs.readdirSync(targetDir).filter(f => f.toLowerCase().endsWith('.mp3')).length;
    } catch (err) {
      console.warn(`Could not read directory ${targetDir}:`, err.message);
    }
  }

  return {
    success: true,
    connected: directoryPresent,
    drivePresent,
    directoryPresent,
    drive: rootDrive,
    directory: targetDir,
    fileCount
  };
};

const streamAudioFile = (lectureId, dirOverride, req, res) => {
  const targetDir = dirOverride ? String(dirOverride).trim() : currentAudioDir;
  const fileInfo = findAudioFile(lectureId, targetDir);

  if (!fileInfo) {
    return res.status(404).json({
      success: false,
      message: `Audio file for ID "${lectureId}" not found in ${targetDir}`,
      expectedPath: path.join(targetDir, `${lectureId}.mp3`)
    });
  }

  const stat = fs.statSync(fileInfo.filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
      return;
    }

    const chunksize = (end - start) + 1;
    const fileStream = fs.createReadStream(fileInfo.filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg'
    });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(fileInfo.filePath).pipe(res);
  }
};

const getAudioFilesSet = (targetDir) => {
  if (targetDir && fs.existsSync(targetDir)) {
    try {
      return new Set(fs.readdirSync(targetDir).map(f => f.toLowerCase()));
    } catch (e) {
      return null;
    }
  }
  return null;
};

const checkHasAudio = (audioFilesSet, lecId) => {
  if (!audioFilesSet || !lecId) return false;
  const idStr = String(lecId).trim().toLowerCase();
  return (
    audioFilesSet.has(`${idStr}.mp3`) ||
    audioFilesSet.has(`${idStr.padStart(4, '0')}.mp3`) ||
    audioFilesSet.has(`${idStr.padStart(3, '0')}.mp3`) ||
    audioFilesSet.has(`${idStr.replace(/^0+/, '')}.mp3`)
  );
};

module.exports = {
  DEFAULT_AUDIO_DIR,
  getCurrentAudioDir,
  setCurrentAudioDir,
  findAudioFile,
  checkDriveStatus,
  streamAudioFile,
  getAudioFilesSet,
  checkHasAudio
};
