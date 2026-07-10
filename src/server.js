// src/server.js
import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`OCMS API listening on port ${PORT}`);
});