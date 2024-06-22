observed = []

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message == true) {
        checkUploaded()
    }
});

function checkUploaded() {
    // check existance of database
    browser.runtime.sendMessage({ type: "getDB" })
    .then(response => {
        if (response.status == true) {
            localDatabase = response.database
            checkExistance()
        } else {
            window.setTimeout(checkUploaded, 1000);
        }
    })
    .catch(error => {
        console.error("Error receiving db from background:", error);
        window.setTimeout(checkUploaded, 1000);
    });
}

function checkExistance() {
    //loop until tweets or grid elements of media tab found
    select = 'article, div[data-testid="cellInnerDiv"] li, ' + 
        'a[href*="/following"][aria-selected="true"]'
    var element = document.querySelector(select)
    if(element === null) {
        window.setTimeout(checkExistance, 1500);
    } else {
        // also create buttons for following parser
        const inFollow = document.querySelector('a[href*="/following"][aria-selected="true"]')
        if (document.getElementById('followGroup') === null && inFollow !== null) {
            createFollowButtons()
        }

        window.setTimeout(startObserving, 750);
    }
}

function startObserving() {

    const isOwnTimeline = document.querySelector('div[aria-label*="Timeline: "][aria-label*="posts"]')
    if (!isOwnTimeline && document.querySelector('style#own')) {
        removeStyle('own')
    }

    // add buttons to toggle display of collected tweets
    const areNavButtons = document.querySelector('input#displayTrue')
    if (areNavButtons == null) {
        createNavChecks()
    }

    // add buttons to toggle display of own tweets
    const areHeadButtons = document.querySelector('input#displayOwn')
    const headerExists = document.querySelector('div.r-1gn8etr')
    if (areHeadButtons == null && headerExists && isOwnTimeline) {
        createHeaderChecks()
    }

    // Config and callback
    const config = {childList: true};
    TMNTObserver()
    observed = document.querySelectorAll('div[aria-label*="Timeline:"]:not([aria-label*="Trending"]) > div:not([observed])');

    // Create an observer and observe
    const observer = new MutationObserver(TMNTObserver);
    for (let x = 0; x < observed.length; x++) {
        observer.observe(observed[x], config);
        observed[x].setAttribute('observed', '');
    }
    observed = []
}

function TMNTObserver(mutationList, observer) {
    const articleScouted = document.querySelectorAll(
        'article[tabindex="0"]:not([scout-stored]), article[tabindex="-1"][data-testid="tweet"]:not([scout-stored])');
    if (articleScouted !== null) {
        for (let i = 0; i < articleScouted.length; i++) {
            articleScouted[i].setAttribute('scout-stored', '');

            // deletes tweets without attachments
            const hasAttachs = articleScouted[i].querySelector('div.css-175oi2r.r-9aw3ui.r-1s2bzr4 > div.css-175oi2r.r-9aw3ui')
            // deletes sponsored
            const hasSponsor = articleScouted[i].querySelector('a[href*="justfor.fans"]')
            if ((hasAttachs === null || hasSponsor !== null) && articleScouted[i].getAttribute('tabindex') != '-1') {
                // articleScouted[i].closest('div[data-testid="cellInnerDiv"]').remove()
                articleScouted[i].closest('div[data-testid="cellInnerDiv"]').style.display = 'none'
            }

            // reveals sensitive content automatically to prevent further bugs
            const potentialButton = articleScouted[i].querySelector('div[role="button"][tabindex="0"]>div>span>span')
            if (potentialButton !== null) { potentialButton.click() }

            // extracts data from link in analytics button
            const [author, status, isInDb] = checkHref(articleScouted[i], 'a[href*="status"]');

            const hasFullscreen = articleScouted[i].closest('div[aria-labelledby="modal-header"]') !== null
            const negIndex = articleScouted[i].getAttribute('tabindex') == '-1'
            const isHeader = (negIndex && hasFullscreen) ? true : false

            // extract if and who retweeted
            const potentialRetweet = articleScouted[i].querySelector('span[data-testid="socialContext"]')
            var rtwLink = ""
            if (potentialRetweet !== null) {
                rtwLink = potentialRetweet.closest('a').getAttribute('href').split('/')[1]
                // don't show self-retweets
                if (rtwLink == author) {
                    // articleScouted[i].closest('div[data-testid="cellInnerDiv"]').remove()
                    articleScouted[i].closest('div[data-testid="cellInnerDiv"]').style.display = 'none'
                    continue
                }
            } else {
                articleScouted[i].setAttribute('own', '')
            }

            articleScouted[i].querySelector('div[data-testid="User-Name"]').appendChild(
                createScoutButton(false, isInDb, author, status, isHeader));
        }
    }

    const mediaScouted = document.querySelectorAll('div[data-testid="cellInnerDiv"] li[id*="verticalGridItem"]:not([scout-stored])');
    if (mediaScouted !== null) {
        for (let j = 0; j < mediaScouted.length; j++) {
            mediaScouted[j].setAttribute('scout-stored', '');

            // reveals sensitive content automatically to prevent further bugs
            const potentialButton = mediaScouted[j].querySelector('div[role="button"] > span')
            if (potentialButton !== null) { potentialButton.click() }

            const [author, status, isInDb] = checkHref(mediaScouted[j], 'a');
            
            // if grid item is a grouped tweet, then dont show the button
            const parent = mediaScouted[j].querySelector('div');
            if (mediaScouted[j].querySelector('svg') === null) {
                parent.appendChild(createScoutButton(true, isInDb, author, status))
            }
        }
    }
}

function checkHref(_parentObj, _selector) {
    let isInDB

    //deconstruct status link
    const parts = _parentObj.querySelector(_selector).getAttribute('href').split('/');
    const [, author, , status] = parts;

    //check existance of tweet based on author and status in db
    if (Object.keys(localDatabase).includes(author)) {
        if (Object.keys(localDatabase[author]).includes(status)) { isInDB = true }
    } else {isInDB = false}

    return [author, status, isInDB]
}

checkUploaded()