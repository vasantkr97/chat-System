import express from "express";
import http from "http"
import cors from "cors"
import * as authController from "./controllers/auth.controller"
import * as convController from "./controllers/conversation.controller"
import * as adminController from "./controllers/admin.controller"
import { authentication, authorize } from "./middleware/auth";
import { setupWebSocketServer } from "./websocket";


const app = express();

app.use(cors())

app.use(express.json())

app.get("/", (_, res) => {
    res.send('healthy')
})

app.post("/auth/login", authController.signin);
app.post("/auth/signup", authController.signup);
app.get("/auth/me", authentication, authController.getMe);


app.post("/conversations", authentication, authorize(["candidate"]), convController.createConversation)
app.post("/conversations/:id/assign", authentication, authorize(["supervisor"]), convController.assignAgent);
app.post("/conversations/:id", authentication, convController.getConversation );
app.post("/conversations/:id/close", authentication, authorize(["admin", "supervisor"]), convController.closeConversation)
app.post("/admin/analytics", authentication, authorize(["admin"]), adminController.getAnalytics)



const server = http.createServer(app)

//atttach web Socket
setupWebSocketServer(server);

export default server

server.listen(3000, () => {
    console.log("server running at http://localhost:3000")
})