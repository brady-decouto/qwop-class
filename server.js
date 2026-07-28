const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const path = require('path')
const fs = require('fs')

app.use(express.json())
app.use('/', express.static(path.join(__dirname, 'public')))

app.post('/log', (req, res) => {
    const { name, score, time } = req.body
    const line = `${new Date().toISOString()},${name},${score},${time}\n`
    fs.appendFileSync(path.join(__dirname, 'results.csv'), line)
    res.sendStatus(200)
})

app.listen(port, () => console.log(`PORT: ${port}`))
