const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

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

// сервак
app.listen(port, () => {
    console.log(`API is running on port ${port}`);
});