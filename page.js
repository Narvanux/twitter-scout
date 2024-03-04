var styles = `
    article[scout-stored] {
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

var localDatabase = {}

var styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

function scoutButtonEvent(event) {
  const caller = event.target;
  const origin = caller.closest('article')
  const [author, status] = caller.getAttribute("origin").split('/');
  const isDB = caller.getAttribute('in-db') === 'true' ? true : false

  if (!isDB) {
    caller.setAttribute('in-db', 'true');
    var textContent = ''
    const realText = origin.querySelector('div[data-testid="tweetText"]')
    if (realText !== null) {textContent = realText.innerText}

    attachments = []
    if (origin.querySelector('div[data-testid="videoComponent"]') !== null) {
      attachments.push('video')}
    
    const photos = origin.querySelectorAll('img[alt="Image"]')
    if (photos.length !== 0) {
      for (var i = 0; i < photos.length; i++) {
        attachments.push(photos[i].getAttribute("src"))
      }
    }

    const time = origin.querySelector('time').getAttribute('datetime').split('Z')[0].split('T').join('_')

    var postData = {
      'text': textContent,
      'attachments': attachments,
      'time': time
    }

    if (!Object.keys(localDatabase).includes(author)) {localDatabase[author] = {}}
    localDatabase[author][status] = postData

    browser.runtime.sendMessage({ 
      type: "addPost", author: author, tweetId: status,
      data: postData
    })
  } else {
    caller.setAttribute('in-db', 'false');
    delete localDatabase[author][status]

    browser.runtime.sendMessage({ 
      type: "removePost", author: author, tweetId: status
    })
  }
}

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
  var element = document.querySelector('article')
  if(element === null) {
    window.setTimeout(checkExistance, 1500);
  } else {
    startObserving()
  }
}

function startObserving() {
  const observed = document.querySelector('div[aria-label*="Timeline:"] > div');

  // Config and callback
  const config = {childList: true};
  const callback = (mutationList, observer) => {
    if (observed === null) {console.log('nain')}
    const scouted = document.querySelectorAll('article:not([scout-stored])');
    
    for (let i = 0; i < scouted.length; i++) {
      scouted[i].setAttribute('scout-stored', '');
      
      let isInDB
      // get words in a link from analytics button, which has tweet's author username and status id
      const parts = scouted[i].querySelector('a[aria-label*="analytics"]').getAttribute('href').split('/');
      // deconstruct them into variables
      const [, author, , status] = parts;
      if (Object.keys(localDatabase).includes(author)) {
        if (Object.keys(localDatabase[author]).includes(status)) { isInDB = true }
      } else {isInDB = false}

      //Constructing button near profile name, which adds tweet to database
      const btn = document.createElement('button');
      btn.appendChild(document.createTextNode('Stored'));
      btn.classList.add('scout-btn');
      btn.setAttribute('in-db', isInDB ? 'true' : 'false');
      btn.setAttribute('origin', author + '/' + status);
      btn.addEventListener("click", scoutButtonEvent)

      scouted[i].querySelector('div[data-testid="User-Name"]').appendChild(btn);
    }
  };

  callback()

  // Create an observer and observe
  const observer = new MutationObserver(callback);
  observer.observe(observed, config);
}

checkUploaded()
