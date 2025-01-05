const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const countersFilePath = path.join(__dirname, 'counters.json');

// Инициализация файла счетчиков, если он не существует
if (!fs.existsSync(countersFilePath)) 
{
    fs.writeFileSync(countersFilePath, JSON.stringify({}, null, 2)); // Пустой объект для хранения счетчиков
}

function getCounters() 
{
    const data = fs.readFileSync(countersFilePath, 'utf8');
    return JSON.parse(data);
}

function setCounters(counters) 
{
    fs.writeFileSync(countersFilePath, JSON.stringify(counters, null, 2));
}

function getCounterByName(name)
{
    const counters = getCounters();
    return counters[name] || 0; // Если счетчик не существует, вернуть 0
}

function setCounterByName(name, value)
{
    const counters = getCounters();
    counters[name] = value;
    setCounters(counters);
}

app.get('/version-check', (req, res) => {
    // приложение, тип сборки
    const { app, releaseType } = req.query;

    if (app === "")
    {
        return res.status(400).json({error: "Param 'app' is not defined!"});
    }

    switch (app)
    {
        case 'codey':
            // для релизных сборок
            if (releaseType == "final")
            {
                return res.json({
                    version: "1.0.0",
                    pak_link: "example.com/codey_final_100.zip"
                });
            }
            // для превью и сборок в разработке
            else if (releaseType == "preview")
            {
                return res.json({
                    version: "1.0.0",
                    pak_link: "example.com/codey_preview_100.zip"
                });
            }
            break;
        default:
            return res.status(400).json({error: `Unknown app '${app}'!`});
            break;
    }
});

// Получить кол-во голосов на посте
app.get('/get-votes', (req, res) => {
    const { name } = req.query;

    if (!name) 
    {
        return res.status(400).json({ error: "Param 'name' is required!" });
    }

    const counter = getCounterByName(name);
    return res.json({ name, counter });
});

// Поставить лайк или дизлайк
app.post('cast-vote', (req, res) => {
    const { name, action } = req.body;

    if (!name) 
    {
        return res.status(400).json({ error: "Param 'name' is required!" });
    }

    if (!['up', 'down'].includes(action)) 
    {
        return res.status(400).json({ error: "Invalid action. Use 'up' or 'down'." });
    }

    let counter = getCounterByName(name);

    if (action === 'up') 
    {
        counter += 1;
    } 
    else if (action === 'down') 
    {
        counter -= 1;
    }

    setCounterByName(name, counter);

    return res.json({ name, counter });
});

// сервак
app.listen(port, () => {
    console.log(`API is running on port ${port}`);
});