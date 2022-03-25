const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jswt = require("jsonwebtoken");
const secret = "AkYeHoPkd";
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const URL = "mongodb+srv://praveen:prmdb123@cluster0.gszjf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";


app.use(express.json())
app.use(cors({
    origin: "*"
}))

//authentication
let authenticate = function(req,res,next){
    if(req.headers.authorization){
        let result = jswt.verify(req.headers.authorization,secret);
        if(result){
            next();
        }
        else{
            res.status(401).json({message:"token invalid"})
        }
    }
    else{
        res.status(401).json({message:"not authorized"})
    }
}


//registeration
app.post('/register', async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("zendashboard");
        let user = await db.collection("registeration").findOne({ email: req.body.email });
        if(user){
            res.json({ message: "Email/UserID already exist!" });
            connection.close();
        }
        else{
            let salt = await bcrypt.genSalt(10);
            let hash = await bcrypt.hash(req.body.password, salt);
            req.body.password = hash;
            await db.collection("registeration").insertOne(req.body)
            res.json({ message: "registered" });
            connection.close();
        }
        
       
    } catch (error) {
        console.log(error)
        res.json(["error"])
    }
})


//login
app.get("/login", async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("zendashboard");
        let attendancedata = await db.collection("registeration").find({}).project({ "_id": 0 }).toArray();
        await connection.close();
        res.json(attendancedata);
    } catch (error) {
        console.log(error)
    }

});

app.post('/login', async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("zendashboard");
        let user = await db.collection("registeration").findOne({ email: req.body.email });
        if (user) {
            let passwordcheck = await bcrypt.compare(req.body.password, user.password)
            if (passwordcheck) {
                let token = jswt.sign({userid:user._id},secret,{expiresIn: '1h'});
                res.json({ message: "login",user,token });
            }
            else {
                res.json({ message: "email id or password incorrect" });
            }
        }
        else {
            res.json({ message: "email id or password incorrect" });
        }
        connection.close();

    } catch (error) {
        res.json(["email id or password incorrect"])
    }
})


//task
app.post("/task", async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("zendashboard")
        let user = await db.collection("task").findOne({ classnumber: req.body.classnumber });
        if(user){
            res.json({ message: "Task already Submitted!" });
            connection.close();
        }
        else{
            await db.collection("task").insertOne(req.body)
        await connection.close();
        res.json({ message: "submitted :)" })
        }
        
    } catch (error) {
        console.log(error)
    }
});

app.get("/task",authenticate,async function (req, res) {
    try {
        console.log(req.params.id);
        let connection = await mongoClient.connect(URL);
        let db = connection.db("zendashboard");
        let taskdata = await db.collection("task").find({}).toArray();
        await connection.close();
        res.json(taskdata);
    } catch (error) {
        console.log(error)
    }

});

// task/id
app.get("/task/:id",authenticate,async function (req, res) {
    try {
        console.log(req.params.id);
        let connection = await mongoClient.connect(URL);
        let db = connection.db("zendashboard");
        let taskdata = await db.collection("task").find({"userid":req.params.id}).toArray();
        await connection.close();
        res.json(taskdata);
    } catch (error) {
        console.log(error)
    }

});

// mytask/id
app.get("/mytask/:id",authenticate, async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("zendashboard");
        console.log(req.params.id);
        let attendancedata = await db.collection("task").find({"userid":req.params.id}).toArray();
        console.log(attendancedata)
        await connection.close();
        res.json(attendancedata);
    } catch (error) {
        console.log(error)
    }

});


//gradetask
app.get("/gradetask/:id",authenticate,async function (req, res) {
    try {
        console.log(req.params.id);
        let connection = await mongoClient.connect(URL);
        let db = connection.db("zendashboard");
        let objId = mongodb.ObjectId(req.params.id)
        let taskdata = await db.collection("task").find({_id:objId}).toArray();
        await connection.close();
        res.json(taskdata);
    } catch (error) {
        console.log(error)
    }

});

app.put("/gradetask/:id", async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("zendashboard");
        let objId = mongodb.ObjectId(req.params.id)
         var updatedarr = await db.collection("task").updateOne({ _id: objId }, { $set: req.body })
         await connection.close();
        res.json({ message: "Task Graded" })
    } catch (error) {
        res.json(error);
        console.log(error)
    }
});

//attendance
app.post("/attendance", async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("zendashboard")
        let user = await db.collection("attendance").findOne({ classnumber: req.body.classnumber });
        if(user){
            res.json({ message: "Attendance already Submitted Can't Change :(" });
            connection.close();
        }
        else{
            await db.collection("attendance").insertOne(req.body)
        await connection.close();
        res.json({ message: "User Added" })
        }
    } catch (error) {
        console.log(error)
    }
});

app.get("/attendance/:id",authenticate, async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("zendashboard");
        let attendancedata = await db.collection("attendance").find({"userid":req.params.id}).project({ "_id": 0 }).toArray();
        await connection.close();
        res.json(attendancedata);
    } catch (error) {
        console.log(error)
    }

});


app.listen(process.env.PORT || 3000)
