const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const path = require('path')
const fs = require('fs')

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyE2DHIJoTNTVmKPqttipyOlGhwpaDDNtwEBFqtMOM9XDqaaty2oZhTOEaFu3mCyUducQ/exec'

app.use(express.json({ limit: '2mb' }))
app.use('/', express.static(path.join(__dirname, 'public')))

app.get('/classes', async (req, res) => {
    try {
        const response = await fetch(GOOGLE_SHEET_URL)
        const data = await response.json()
        res.json(data)
    } catch (err) {
        console.log('Failed to fetch classes:', err)
        res.json({ sheets: [] })
    }
})

app.post('/log', async (req, res) => {
    const { className, name, distance, time, keyEvents, jointSamples } = req.body
    const line = `${new Date().toISOString()},${className},${name},${distance},${time}\n`

    fs.appendFileSync(path.join(__dirname, 'results.csv'), line)

    try {
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ className, name, distance, time, keyEvents, jointSamples })
        })
    } catch (err) {
        console.log('Failed to forward to Google Sheet:', err)
    }

    res.sendStatus(200)
})

app.get('/download', (req, res) => {
    const filePath = path.join(__dirname, 'results.csv')
    if (fs.existsSync(filePath)) {
        res.download(filePath)
    } else {
        res.status(404).send('No results yet')
    }
})

app.listen(port, () => console.log(`PORT: ${port}`))
