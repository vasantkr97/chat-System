import express from "express";
import cors from "cors"
import { getMe, signin, signup } from "./controllers/authController";
import { authentication } from "./middleware/auth";
const app = express();

app.use(cors())

app.use(express.json())


app.get("/", (req, res) => {
    res.send('healthy')
})

app.post("/auth/login", signin);

app.post("/auth/signup", signup);

app.get("/auth/me",authentication, getMe);




app.listen(3000, () => {
    console.log("server running at http://localhost:3000")
})