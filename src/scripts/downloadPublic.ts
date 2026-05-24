import appRoot from 'app-root-path'
import fs from 'node:fs'
import path from 'node:path'

import { downloadR2Folder } from '@/lib/cloudflareR2Client'
import {
  getMissingAudioBySchaledb,
  getMissingImageBySchaledb,
} from '@/lib/schaleDBClient'

const projectRoot = appRoot.path
const dataFolderPath = path.join(projectRoot, 'public/data')
const audioFolderPath = path.join(projectRoot, 'public/audio')
const imageFolderPath = path.join(projectRoot, 'public/image')
const isCIEnvironment =
  Boolean(process.env.CI) ||
  Boolean(process.env.GITHUB_ACTIONS) ||
  Boolean(process.env.COPILOT_WORKSPACE)

async function writeMockCacheFiles(): Promise<void> {
  await Promise.all([
    fs.promises.mkdir(dataFolderPath, { recursive: true }),
    fs.promises.mkdir(audioFolderPath, { recursive: true }),
    fs.promises.mkdir(imageFolderPath, { recursive: true }),
  ])
  const emptyJson = JSON.stringify([], null, 2)
  await Promise.all([
    fs.promises.writeFile(path.join(dataFolderPath, 'schaledb.json'), emptyJson),
    fs.promises.writeFile(path.join(dataFolderPath, 'final.json'), emptyJson),
    fs.promises.writeFile(path.join(dataFolderPath, 'extract.json'), emptyJson),
    fs.promises.writeFile(
      path.join(dataFolderPath, 'uniqueStudents.json'),
      emptyJson,
    ),
    fs.promises.writeFile(path.join(dataFolderPath, 'final.csv'), ''),
  ])
}

try {
  if (isCIEnvironment) {
    console.log('CI environment detected. Skipping remote fetch.')
    await writeMockCacheFiles()
  } else {
    console.log('Downloading R2 folders...')
    await Promise.all([
      downloadR2Folder('audio', 'public/audio'),
      downloadR2Folder('image', 'public/image'),
    ])
    console.log('Download completed for R2 folders')

    console.log('Downloading MissingFile By SchaleDB...')
    await Promise.all([getMissingAudioBySchaledb(), getMissingImageBySchaledb()])
    console.log('Download completed for MissingFile By SchaleDB...')
  }
  console.log('Exiting process...')
  process.exit(0)
} catch (error) {
  console.error('Failed to download public assets:', error)
  process.exit(1)
}
