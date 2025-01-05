const express = require('express');
const fs = require('fs');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

admin.initializeApp({
    credential: admin.credential.cert({
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.database();

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
                    pak_link: "example.com/codey_final_100.zip",
                    patch_notes_link: "example.com/codey_final_patch_notes_100.ybn"
                });
            }
            // для превью и сборок в разработке
            else if (releaseType == "preview")
            {
                return res.json({
                    version: "1.0.0",
                    pak_link: "example.com/codey_preview_100.zip",
                    patch_notes_link: "example.com/codey_preview_patch_notes_100.ybn"
                });
            }
            break;
        default:
            return res.status(400).json({error: `Unknown app '${app}'!`});
            break;
    }
});

// Получить кол-во голосов на посте
app.get('/get-votes', async (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: "Param 'name' is required!" });
    }

    const ref = db.ref('counters/' + name);
    try {
        const snapshot = await ref.once('value');
        const data = snapshot.val();

        if (!data) {
            return res.status(404).json({ error: "Counter not found!" });
        }

        return res.json({ name, votes: data.votes });
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching data', details: err.message });
    }
});

// Поставить лайк или дизлайк
app.post('/cast-vote', async (req, res) => {
    const { name, action, user } = req.body;

    if (!name || !action || !user) {
        return res.status(400).json({ error: "Params 'name', 'action', and 'user' are required!" });
    }

    // Ensure action is either "up" or "down"
    if (!['up', 'down'].includes(action)) {
        return res.status(400).json({ error: "Invalid action. Use 'up' or 'down'." });
    }

    const ref = db.ref('counters/' + name);
    const counterSnapshot = await ref.once('value');
    const counterData = counterSnapshot.val();

    if (!counterData) {
        return res.status(404).json({ error: "Counter not found!" });
    }

    // Check if user has already voted
    if (counterData.users && counterData.users[user]) {
        return res.status(400).json({ error: "User has already voted on this counter." });
    }

    // Update the vote count based on the action
    let votes = counterData.votes || 0;
    if (action === 'up') {
        votes += 1;
    } else if (action === 'down') {
        votes -= 1;
    }

    // Update the vote count and user vote in Firebase
    const updates = {};
    updates[`counters/${name}/votes`] = votes;
    updates[`counters/${name}/users/${user}`] = action;

    try {
        await ref.update(updates); // Update votes and user vote
        return res.json({ name, action, votes });
    } catch (err) {
        return res.status(500).json({ error: 'Error updating vote', details: err.message });
    }
});

app.get('/who-voted-what', async (req, res) => {
    const { name, user } = req.query;

    if (!name || !user) {
        return res.status(400).json({ error: "Params 'name' and 'user' are required!" });
    }

    const ref = db.ref('counters/' + name);
    const counterSnapshot = await ref.once('value');
    const counterData = counterSnapshot.val();

    if (!counterData || !counterData.users || !counterData.users[user]) {
        return res.status(404).json({ error: "User has not voted or counter not found!" });
    }

    return res.json({ user, voted: counterData.users[user] });
});

// Проверяем включено ли голосование за пост
app.get('/is-voting-enabled', (req, res) => {
    return res.json(
    {
        status: true
    }
);
});

// сервак
app.listen(port, () => {
    console.log(`API is running on port ${port}`);
});