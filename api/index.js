import express from 'express'
// Axios
import axios from 'axios'
// Db imports
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
const cors = require('cors')
const FormData = require('form-data')

// fetch
const fetch = require('node-fetch')
const Bluebird = require('bluebird')
fetch.Promise = Bluebird

// Parse token library
const parseTorrent = require('parse-torrent')

// Create express server
const app = express()
app.use(cors())
// Body parse
const bodyParser = require('body-parser')
app.use(bodyParser.json())
// Db init
const adapter = new FileSync('./api/db.json')
const db = low(adapter)

const config = db.get('config').value()

if (config.completed === 'true') {
  // Bull
  const Queue = require('bull')
  const torrentQueue = new Queue(
    'download and upload torrent',
    config.redis_server
  )

  torrentQueue.process(async (job, done) => {
    // Get torrent of db
    let torrentDb = db
      .get('torrents')
      .find({ hash: job.data.hash })
      .value()
    // Auth qbt
    const authRes = await auth()
    // Download
    const download = async () => {
      if (torrentDb.status === 'waiting') {
        // Add torrent to qbittorrent
        const formData = new FormData()
        formData.append('urls', torrentDb.torrent)
        formData.append('rename', torrentDb.name)
        formData.append('category', 'Movies')
        formData.append('autoTMM', 'true')
        await axios.post(`${config.qbt_server}/api/v2/torrents/add`, formData, {
          headers: {
            Cookie: authRes['set-cookie'][0],
            ...formData.getHeaders()
          }
        })
        updateTorrent(torrentDb.hash, { status: 'downloading' })
      }
    }
    await download()
    // Downloading
    const downloading = () => {
      if (!torrentDb.jobid) {
        return new Promise((resolve) => {
          const interval = setInterval(async () => {
            try {
              // Get torrent data
              const torrent = await axios.get(
                `${config.qbt_server}/api/v2/torrents/properties`,
                {
                  headers: {
                    Cookie: authRes['set-cookie'][0]
                  },
                  params: {
                    hash: job.data.hash
                  }
                }
              )
              console.log(
                torrent.data.total_downloaded,
                torrent.data.total_size
              )
              // Upload file
              if (torrent.data.total_downloaded >= torrent.data.total_size) {
                // Get torrent files
                const files = await axios.get(
                  `${config.qbt_server}/api/v2/torrents/files`,
                  {
                    params: {
                      hash: torrentDb.hash
                    },
                    headers: {
                      Cookie: authRes['set-cookie'][0]
                    }
                  }
                )
                console.log(
                  files.data[0].name,
                  torrentDb.name,
                  torrent.data.save_path
                )
                // Upload file
                const upload = await fetch(
                  `${config.rclone_server}/operations/movefile`,
                  {
                    method: 'POST',
                    body: JSON.stringify({
                      srcFs: `local:${torrent.data.save_path}`,
                      srcRemote: files.data[0].name,
                      dstFs: `jellyfin:/Movies/${torrentDb.name}/`,
                      dstRemote: `${torrentDb.name} - 1080P.mp4`,
                      _async: true
                    }),
                    headers: { 'Content-Type': 'application/json' }
                  }
                ).then((response) => response.json())
                // Update torrent db
                updateTorrent(torrentDb.hash, {
                  status: 'uploading',
                  jobid: upload.jobid
                })
                clearInterval(interval)
                resolve()
              }
            } catch (error) {
              console.log(error)
            }
          }, 10000)
        })
      }
    }
    await downloading()
    // Get torrent of db
    torrentDb = db
      .get('torrents')
      .find({ hash: torrentDb.hash })
      .value()
    // Uploading
    const uploading = () => {
      return new Promise((resolve) => {
        const interval = setInterval(async () => {
          // Get job rclone data
          const rcloneJob = await fetch(`${config.rclone_server}/job/status`, {
            method: 'POST',
            body: JSON.stringify({
              jobid: torrentDb.jobid
            }),
            headers: { 'Content-Type': 'application/json' }
          }).then((response) => response.json())
          console.log(rcloneJob)
          if (rcloneJob.finished) {
            // Auth qbt
            const authRes = await auth()
            // Delete torrent
            await axios.get(`${config.qbt_server}/api/v2/torrents/delete`, {
              params: {
                hashes: torrentDb.hash,
                deleteFiles: true
              },
              headers: {
                Cookie: authRes['set-cookie'][0]
              }
            })
            // Update libratys jellyfin
            await axios.post(
              `${config.jellyfin_server}/Library/Refresh`,
              null,
              {
                params: {
                  api_key: config.jellyfin_key
                }
              }
            )
            updateTorrent(torrentDb.hash, { status: 'finished' })
            clearInterval(interval)
            resolve()
          }
        }, 10000)
      })
    }
    await uploading()
    done()
  })

  // Clean queue
  app.get('/clean', (_, res) => {
    torrentQueue.clean()
    res.send('Ok')
  })

  // getAll torrents
  app.get('/getTorrents', (req, res) => {
    db.read()
    if (req.query.type === 'activated') {
      const torrents = db
        .get('torrents')
        .filter((item) => {
          return ['downloading', 'uploading', 'waiting'].includes(item.status)
        })
        .value()
      res.json(torrents)
    } else if (req.query.type === 'finished') {
      const torrents = db
        .get('torrents')
        .filter({ status: 'finished' })
        .orderBy(['date'], ['desc'])
        .value()
      res.json(torrents)
    }
  })

  // addTorrent
  app.post('/addTorrent', (req, res) => {
    try {
      const torrent = parseTorrent(req.body.torrent)
      // Add torrent to db
      db.get('torrents')
        .push({
          hash: torrent.infoHash,
          torrent: req.body.torrent,
          id: req.body.tmdb.id,
          name: `${req.body.tmdb.title} (${req.body.tmdb.release_date.slice(
            0,
            4
          )})`,
          status: 'waiting',
          type: 'Movies',
          date: Date.now()
        })
        .write()
      // Add torrent to queue
      torrentQueue.add({
        hash: torrent.infoHash
      })
      res.send('Add ok')
    } catch (error) {
      console.log(error)
      res.sendStatus(403, 'error')
    }
  })
}

// Set config
app.post('/config', (req, res) => {
  db.set('config', { completed: 'true', ...req.body }).write()
  res.json('Set config ok')
})

// get config
app.get('/config', (_, res) => {
  res.json(db.get('config').value())
})

const updateTorrent = (hash, data) => {
  db.get('torrents')
    .find({ hash })
    .assign(data)
    .write()
}

const auth = async () => {
  const result = await axios.get(`${config.qbt_server}/api/v2/auth/login`, {
    params: {
      username: config.qbt_user,
      password: config.qbt_pass
    },
    withCredentials: true
  })
  return result.headers
}

export const path = '/api'
export const handler = app
