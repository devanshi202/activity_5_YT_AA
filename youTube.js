let puppeteer=require("puppeteer");
let playlist = "https://www.youtube.com/playlist?list=PLzkuLC6Yvumv_Rd5apfPRWEcjf9b1JRnq";

let browserObj = puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"]
})

let page, browser;

(async function fn(){
    browser = await browserObj;
    page = await browser.newPage();
     await page.goto(playlist);


    //name of playlist
    await page.waitForSelector("h1[id='title']");
    // let element = await page.$("h1[id='title']")
    // let value = await page.evaluate(el => el.textContent, element)
    let nameElem= await page.$("h1[id='title']");
    let name= await page.evaluate(function(element){ return element.textContent}, nameElem);
    console.log(name);


    //number of videos
    await page.waitForSelector(".style-scope.ytd-playlist-sidebar-primary-info-renderer");
    let vidViewElem= await page.$$(".style-scope.ytd-playlist-sidebar-primary-info-renderer");
    let vidCount= await page.evaluate(function(element){ return element.textContent}, vidViewElem[5]);
    console.log(vidCount);
    let videos = vidCount.split(" ")[0].trim();


    //number of views
    let views= await page.evaluate(function(element){ return element.textContent}, vidViewElem[6]);
    console.log(views);

    //invisible loader ka count(there were 8 invisible loaders one for each 100 videos and total videos were 792)
    let loopCount = Math.floor(videos/100);
    console.log(loopCount);
    //loop on loopCount to load all the videos in browser 
    for(let i=0; i<loopCount; i++){
        await page.click(".circle.style-scope.tp-yt-paper-spinner");
        //waiting and checking if the new content has been loading after clicking above selector
        await waitTillHTMLRendered(page);
        console.log("loaded new 100 videos");
    }

    //title of each video coz for safety title loads firsts 
    let videosTitle= await page.$$("a[id='video-title']");//.style-scope ytd-playlist-video-renderer h3
    

    await page.evaluate(function(elem){elem.scrollIntoView()}, videosTitle[videosTitle.length-1]);

    //time of each video
    let videosTime= await page.$$('span[id="text"]');
    console.log(videosTime.length);
    //putting time and title in array
    let videoArr=[];
    for(let i=0; i<videosTime.length; i++){
        let timeTitleObj = await page.evaluate(getTimeAndTitle,videosTitle[i], videosTime[i] );
        videoArr.push(timeTitleObj);
    }
    console.table(videoArr);
})();

function getTimeAndTitle(elem1, elem2){
    return {
        Time: elem2.textContent.trim(),
        Title: elem1.textContent.trim()
    }
}

const waitTillHTMLRendered = async (page, timeout = 10000) => {
    const checkDurationMsecs = 1000;
    const maxChecks = timeout / checkDurationMsecs;
    let lastHTMLSize = 0;
    let checkCounts = 1;
    let countStableSizeIterations = 0;
    const minStableSizeIterations = 3;

    while (checkCounts++ <= maxChecks) {
        let html = await page.content();
        let currentHTMLSize = html.length;

        let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

        console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);

        if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize)
            countStableSizeIterations++;
        else
            countStableSizeIterations = 0; //reset the counter

        if (countStableSizeIterations >= minStableSizeIterations) {
            console.log("Page rendered fully..");
            break;
        }

        lastHTMLSize = currentHTMLSize;
        await page.waitFor(checkDurationMsecs);
    }
};