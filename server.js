const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const path = require('path')
const fs = require('fs')

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzEdzWNCkrciBgPrI93zAcYPbAOmi0TyuYqN9KX5FvW4TRJwfBW3WVKaxM1VAbyqW4RQw/exec'

app.use(express.json())
app.use('/', express.static(path.join(__dirname, 'public')))

app.post('/log', async (req, res) => {
    const { name, score, time } = req.body
    const line = `${new Date().toISOString()},${name},${score},${time}\n`

    fs.appendFileSync(path.join(__dirname, 'results.csv'), line)

    try {
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score, time })
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
