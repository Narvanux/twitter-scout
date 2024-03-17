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

localDatabase = {}

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