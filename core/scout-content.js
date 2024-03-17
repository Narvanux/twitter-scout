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
    browser.runtime.sendMessage({ type: "getDB" })
    .then(response => {
        // Log the variable value received from the background script
        if (response.status == true) {
        localDatabase = response.database
        checkExistance()
        } else {
        window.setTimeout(checkUploaded, 1000);
        }
    })
    .catch(error => {
        console.error("Error receiving variable from background:", error);
        window.setTimeout(checkUploaded, 1000);
    });
}

function checkExistance() {
    var element = document.querySelector('article, div[data-testid="cellInnerDiv"] li')
    if(element === null) {
        window.setTimeout(checkExistance, 1500);
    } else {
        window.setTimeout(startObserving, 750);
    }
}

function startObserving() {
    console.log('ha')
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

        const potentialButton = articleScouted[i].querySelector('div[role="button"][tabindex="0"]>div>span>span')
        if (potentialButton !== null) { potentialButton.click() }

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

            const potentialButton = mediaScouted[j].querySelector('div[role="button"] > span')
            if (potentialButton !== null) { potentialButton.click() }

            const [author, status, isInDb] = checkHref(mediaScouted[j], 'a');
            
            const parent = mediaScouted[j].querySelector('div');
            if (mediaScouted[j].querySelector('svg') === null) {
                parent.appendChild(createScoutButton(true, isInDb, author, status))
            }
        }
    }
}

function checkHref(_parentObj, _selector) {
    let isInDB

    const parts = _parentObj.querySelector(_selector).getAttribute('href').split('/');
    const [, author, , status] = parts;
    if (Object.keys(localDatabase).includes(author)) {
        if (Object.keys(localDatabase[author]).includes(status)) { isInDB = true }
    } else {isInDB = false}

    return [author, status, isInDB]
}

checkUploaded()