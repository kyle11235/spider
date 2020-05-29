const puppeteer = require('puppeteer');
var config = require('./config.json');
const request = require('request');
var schedule = require('node-schedule');

const timeout = config.openPageTimeout * 1000;

var run = async () => {

  let data = {
      login_time: null,
      login_time_refresh: null,

      home_time: null,
      home_time_refresh: null,

      report_time: null,
      report_time_refresh: null,

      name: config.name,
      location: config.location,
  };
  
  // browser -> process, it has a single BrowserContext used by default
  // BrowserContext -> private window with independent session/cache
  const browser = await puppeteer.launch(
    {
        headless: !config.openBrowser, // show browser
        devtools: true,  // open devtool
        // slowMo: 100, // slow down
    }
  ).catch(async error => { await browser.close(); });;

  const page = await browser.newPage().catch(async error => { await browser.close(); }); // creates a page in the default browser context

  // open console log of page
  // page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // finish condition, page navigation(goto/forward/back...) is considered to be successful after all events have been fired
  const waitUntil = [
      'load', // default event is load
      'domcontentloaded', 
      'networkidle0', // no more than 0 network connections for at least 500 ms -> all requests finish downloading
  ];
  let d1, d2;

  // - open login page
  console.log('- open login page');
  d1 = new Date();
  await page.goto(config.homeUrl, {
    timeout: timeout,
    waitUntil: waitUntil
  }).catch(async error => { await browser.close(); });
  d2 = new Date();
  data.login_time = (d2.getTime() - d1.getTime()) / 1000;
  console.log(data.login_time);

  // - refresh login page
  d1 = new Date();
  console.log('- refresh login page');
  page.setDefaultNavigationTimeout(timeout); // pass timeout to repload does not work
  await page.reload(
    {
      waitUntil: waitUntil
    }
  ).catch(async error => { await browser.close(); });
  d2 = new Date();
  data.login_time_refresh = (d2.getTime() - d1.getTime()) / 1000;
  console.log(data.login_time_refresh);

  // - login -> home page
  console.log('- login begin');
  const txtName = await page.$('#idcs-signin-basic-signin-form-username').catch(async error => { await browser.close(); }); // page.$ -> document.querySelector('css selector'), return class: ElementHandle
  await txtName.type(config.name, {delay: 20}).catch(async error => { await browser.close(); });
  const txtPassword = await page.$('#idcs-signin-basic-signin-form-password', {delay: 20}).catch(async error => { await browser.close(); });
  await txtPassword.type(config.password).catch(async error => { await browser.close(); });

  let btnOk = await page.$('#idcs-signin-basic-signin-form-submit').catch(async error => { await browser.close(); }); // page.$('input[name="commit"]'); // -> document.querySelector('input[name="commit"]')
  
  await Promise.all([
      btnOk.click(),
      page.waitForNavigation()  
  ]).catch(async error => { await browser.close(); });
  console.log('- login success');

  // - open home page
  console.log('- open home page');
  d1 = new Date();
  await page.goto(config.homeUrl, {
    timeout: timeout,
    waitUntil: waitUntil
  }).catch(async error => { await browser.close(); });
  d2 = new Date();
  data.home_time = (d2.getTime() - d1.getTime()) / 1000;
  console.log(data.home_time);


  // - refresh home page
  console.log('- refresh home page');
  d1 = new Date();
  await page.reload(
    {
      waitUntil: waitUntil
    }
  ).catch(async error => { await browser.close(); });
  d2 = new Date();
  data.home_time_refresh = (d2.getTime() - d1.getTime()) / 1000;
  console.log(data.home_time_refresh);

  // - open report page
  console.log('- open report page');
  d1 = new Date();
  await page.goto(config.reportUrl, {
    timeout: timeout,
    waitUntil: waitUntil
  }).catch(async error => { await browser.close(); });
  d2 = new Date();
  data.report_time = (d2.getTime() - d1.getTime()) / 1000;
  console.log(data.report_time);

  // - refresh report page  
  d1 = new Date();
  console.log('- refresh report page');
  await page.reload(
    {
      waitUntil: waitUntil
    }
  ).catch(async error => { await browser.close(); });
  d2 = new Date();
  data.report_time_refresh = (d2.getTime() - d1.getTime()) / 1000;
  console.log(data.report_time_refresh);

  await browser.close();

  // send to api
  console.log('test result');
  console.log(JSON.stringify(data));

  const headers = {};
  headers['Content-Type'] = 'application/json; charset=utf-8';
  const options = {
    url: config.apiUrl,
    json: true,
    headers: headers,
    body: data
  };

  request.post(options, function (error, response, body) {
      if(error){
        console.log('api error=', error);
      }else{
        console.log('api success');
      }
  });
  
};

if(config.enableCron){
    console.log('cron job is scheduled');
    var j = schedule.scheduleJob(config.cron, function(){
    console.log('\n--- run cron job ---\n');
    run();
  });    
} else {
  console.log('disabled cron job, just run for 1 time');
  run();
}