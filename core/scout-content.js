observed = []

var styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

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
    var element = document.querySelector('article, div[data-testid="cellInnerDiv"] li')
    if(element === null) {
        window.setTimeout(checkExistance, 1500);
    } else {
        window.setTimeout(startObserving, 750);
    }
}

function startObserving() {
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
            if (hasAttachs === null && articleScouted[i].getAttribute('tabindex') != '-1') {
                articleScouted[i].style.display = 'none'
                continue
            }

            // reveals sensitive content automatically to prevent further bugs
            const potentialButton = articleScouted[i].querySelector('div[role="button"][tabindex="0"]>div>span>span')
            if (potentialButton !== null) { potentialButton.click() }

            // extracts data from link in analytics button
            const [author, status, isInDb] = checkHref(articleScouted[i], 'a[href*="status"]');
            const isHeader = articleScouted[i].getAttribute('tabindex') == '-1' ? true : false

            articleScouted[i].querySelector('div[data-testid="User-Name"]').appendChild(
                createScoutButton(false, isInDb, author, status, isHeader));
        }
    }

    const mediaScouted = document.querySelectorAll('div[data-testid="cellInnerDiv"] li:not([scout-stored])');
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