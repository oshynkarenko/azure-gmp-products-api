import express from 'express';
import 'dotenv/config';

const app = express();
const port = process.env.PORT;

app.get("*", (req, res) => {
    res.send(process.env.CONTAINER_REGISTRY_NAME);
});

app.listen(port, () => {
    console.log(`Server is running on port ${ port }`);
});
