const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const webpush = require('web-push')
const mongoose = require('mongoose');
const config = require('config');
const Subs = require('./models/subs');

const db = config.get('mongoURI');

mongoose
  .connect(db, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false, useUnifiedTopology: true  })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));


const app = express()
app.use(cors())
app.use(bodyParser.json())



const port = process.env.PORT ||4000;



const dummyDb = { subscription: null } //dummy in memory store

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const saveToDatabase =async (subscription) => {
  try{
    const newsub = new Subs({subscription : JSON.stringify(subscription)});
  await newsub.save();
  // Since this is a demo app, I am going to save this in a dummy in memory store. Do not do this in your apps.
  // Here you should be writing your db logic to save it.
  
  }catch(err){
    console.log(err)
  }
}

// The new /save-subscription endpoint
app.post('/save-subscription', async (req, res) => {
  try{
    const subscription = req.body
  await saveToDatabase(subscription) //Method to save the subscription to Database
  res.json({ message: 'success' })
  }catch(err){
    console.log(err);
  }
  
})

const vapidKeys = {
  publicKey:
    'BMUfUMOy_XSQz3z-FcoUd3L8upcfq_gwg8732Edc5HcsJAWeu1Nhww-1zzRqu31Xlw1GzVGdl-KZ7Ytj8kThAwo',
  privateKey: 'r8X2Mi5F0y1Q4TebhJLQtsXjs6ElGeoYOvRxp2jyPlk',
}

//setting our previously generated VAPID keys
webpush.setVapidDetails(
  'https://nkview.me',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

//function to send the notification to the subscribed device
const sendNotification = async(subscription, dataToSend) => {
  try{
    await webpush.sendNotification(subscription, dataToSend)

  }catch(err){
    console.log(err);
  }
}

const sendNotificationWithData = async(message)=>{
  try{
    const subarr = await Subs.find();
    subarr.forEach(async sub=>{
      await sendNotification(JSON.parse(sub.subscription), message)
    });
    
    }catch(err){
      console.log(err);
    }
}

//route to test send notification
app.get('/send-notification', async(req, res) => {
  const message = JSON.stringify(req.body);
  await sendNotificationWithData(message);
  res.json({ 'message': 'message sent m2' })
  
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))