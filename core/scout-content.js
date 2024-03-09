var styles = `
    article[scout-stored], li[scout-stored] {
      border: dashed 1px red
    }

    button.scout-btn[in-db="true"] {
      background-color: green
    }
    button.scout-btn[in-db="false"] {
      background-color: red
    }

    button.scout-btn {
      margin-left: 4px
      color: white
      font-weight: bold
    }
`

observed = []
localDatabase = {}

//div[data-testid="cellInnerDiv"] li svg
//section[aria-labelledby="accessible-list-12"]

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

function scoutButtonEvent(event) {
  const caller = event.target;
  const [author, status] = caller.getAttribute("origin").split('/');
  const isDB = caller.getAttribute('in-db') === 'true' ? true : false
  const isMedia = caller.getAttribute('is-media') === 'true' ? true : false
  const isHeader = caller.getAttribute('is-header') === 'true' ? true : false

  if (!isDB) {
    caller.setAttribute('in-db', 'true');
    attachments = []

    if (isMedia) {

      var origin = caller.closest('div').querySelector('a');
      if (origin.querySelector('img[src*="video_thumb"]')) { attachments.push('v') }
      else {
        const stro = origin.querySelector('img[src*="media"]').getAttribute(
          "src").split('?')[0].split('media/')[1]
        attachments.push('p/' + stro)
      }

    } else {
      var origin = caller.closest('article');
      if (isHeader) { origin = origin.closest('div[aria-labelledby="modal-header"]').querySelector('div[data-testid="swipe-to-dismiss"] ') }

      const potentialVideo = origin.querySelector('div[data-testid="videoComponent"]')
      if (potentialVideo !== null) {
        // check if video isn't inside quote tweet
        if (potentialVideo.closest('div.css-175oi2r.r-adacv') === null) { attachments.push('v')} }
      
      const photos = origin.querySelectorAll('img[alt="Image"]');
      if (photos.length !== 0) {
        for (var i = 0; i < photos.length; i++) {
          // check if photo isn't inside quote tweet
          if (photos[i].closest('div.css-175oi2r.r-adacv') === null) {
            attachments.push('p/' + photos[i].getAttribute("src").split('?')[0].split('media/')[1]);
          }
        }
      }
    }

    if (!Object.keys(localDatabase).includes(author)) {localDatabase[author] = {}}
    localDatabase[author][status] = attachments

    browser.runtime.sendMessage({ 
      type: "addPost", author: author, tweetId: status,
      data: attachments
    })
  } else {
    caller.setAttribute('in-db', 'false');
    delete localDatabase[author][status]

    browser.runtime.sendMessage({ 
      type: "removePost", author: author, tweetId: status
    })
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
      
      if (mediaScouted[j].querySelector('svg') === null) {
        const parent = mediaScouted[j].querySelector('div');
        // parent.insertBefore(createScoutButton(true, isInDb, author, status), parent.firstChild);
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

function createScoutButton(_isMediaTab, _inDb, _author, _status, _isHeader = false) {
  const btn = document.createElement('button');
  btn.appendChild(document.createTextNode('Stored'));
  btn.classList.add('scout-btn');
  btn.setAttribute('in-db', _inDb ? 'true' : 'false');
  btn.setAttribute("is-media", _isMediaTab ? 'true' : 'false');
  btn.setAttribute('is-header', _isHeader ? 'true' : 'false');
  btn.setAttribute('origin', _author + '/' + _status);
  btn.addEventListener("click", scoutButtonEvent)
  return btn
}

checkUploaded()