const fetch = require('node-fetch');

fetch("https://api.covid19india.org/data.json") // Call the fetch function passing the url of the API as a parameter
  .then(function(data) {
    return data.json();
  })
  .then(data=>{
    let data2 = data.cases_time_series.slice(-1)[0];
    console.log(data2);
  });