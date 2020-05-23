const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const webpush = require('web-push')
const mongoose = require('mongoose');
const config = require('config');
const Subs = require('./models/subs');
const fetch = require("node-fetch");
const db = config.get('mongoURI');

 var dummydata = {
  body: "Stay Home, Stay Safe",
  icon: "stay_home.png"
}
var count = 0;
const cron = require('node-cron');

const recoveryRate =(info)=>{
  if(info){
      const rate = (info.totalrecovered / info.totalconfirmed) * 100
      return rate.toFixed(2);
  }else{
      return null;
  }
}

cron.schedule('0 0 12 * * *', async() => {
  fetch("https://api.covid19india.org/data.json") // Call the fetch function passing the url of the API as a parameter
  .then(function(data) {
    return data.json();
  })
  .then(async data=>{
    dummydata.body=recoveryRate(data.cases_time_series.slice(-1)[0])+"% people got recovered till date.";
    const message = JSON.stringify(dummydata);
    await sendNotificationWithData(message);
    console.log('running a task every hour');
   
  })
  .catch(function(err) {
    console.log(err);
  });  
});


cron.schedule('0 11 8,16,20 * * *', async() => {
  var newcount;
  fetch("https://api.covid19india.org/data.json") // Call the fetch function passing the url of the API as a parameter
  .then(function(data) {
    return data.json();
  })
  .then(async data=>{
    newcount = data.statewise[0].confirmed;
    if (count!=newcount){
      dummydata.body="Total Confirmed cases: "+newcount+ "\nTotal Recovered: "+data.statewise[0].recovered;
      count = newcount;
      const message = JSON.stringify(dummydata);
      await sendNotificationWithData(message);
      console.log('running a task every hour');
    }
  })
  .catch(function(err) {
    console.log(err);
  });  
});




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
    if(err.body==='push subscription has unsubscribed or expired.\n');
        {
          var substr = JSON.stringify(subscription);
          Subs.deleteOne({subscription : substr},function (err) {
            if(err) console.log(err);
            else console.log("Successful deletion");
          });
        }
  }
}

const sendNotificationWithData = async(message)=>{
  try{
    const subarr = await Subs.find();
    subarr.forEach(async sub=>{
      await sendNotification(JSON.parse(sub.subscription), message)
    });
    
    }catch(err){
      if(err.body==='push subscription has unsubscribed or expired.\n');
        {
          console.log('expired')
        }
    }
}

//route to test send notification
app.get('/send-notification', async(req, res) => {
  const message = JSON.stringify(req.body);
  await sendNotificationWithData(message);
  res.json({ 'message': 'message sent m2' })
  
})





app.listen(port, () => console.log(`Example app listening on port ${port}!`))