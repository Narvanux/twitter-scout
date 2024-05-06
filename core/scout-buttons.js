localDatabase = {}

function scoutButtonEvent(event) {
    // get all data values from attributes of button
    const caller = event.target;
    const [author, status] = caller.getAttribute("origin").split('/');
    const isDB = caller.getAttribute('in-db') === 'true' ? true : false
    const isMedia = caller.getAttribute('is-media') === 'true' ? true : false
    const isHeader = caller.getAttribute('is-header') === 'true' ? true : false
  
    if (!isDB) {
        caller.setAttribute('in-db', 'true');
        attachments = []
        
        if (isMedia) {
            // button is a child of grid element in media tab
            var origin = caller.closest('div').querySelector('a');
            if (origin.querySelector('img[src*="video_thumb"]')) { attachments.push('v') }
            else {
                const stro = origin.querySelector('img[src*="media"]').getAttribute(
                    "src").split('?')[0].split('media/')[1]
                attachments.push('p/' + stro)
            }
    
        } else {
            var origin = caller.closest('article').querySelector('div.css-175oi2r.r-9aw3ui.r-1s2bzr4 > div.css-175oi2r.r-9aw3ui');
            if (isHeader) { origin = origin.closest('div[aria-labelledby="modal-header"]').querySelector('div[data-testid="swipe-to-dismiss"] ') }
    
            const potentialVideo = origin.querySelector('div[data-testid="videoComponent"]')
            if (potentialVideo !== null) { attachments.push('v') }
            
            const photos = origin.querySelectorAll('img[alt="Image"]');
            if (photos.length !== 0) {
                for (var i = 0; i < photos.length; i++) {
                    attachments.push('p/' + photos[i].getAttribute("src").split('?')[0].split('media/')[1]);
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

function createNavChecks() {
    const div = document.createElement('div')
    const chk1 = document.createElement('input');
    chk1.setAttribute('type', 'checkbox');
    chk1.id = 'displayTrue';
    const lbl1 = document.createElement('label');
    lbl1.appendChild(document.createTextNode('Hide stored'));
    lbl1.setAttribute('for', 'displayTrue');
    chk1.addEventListener("change", toggleShow);
    chk1.styleType = 'true';
    const nav = document.querySelector('.r-1rnoaur > div:nth-child(1)');
    div.appendChild(chk1);
    div.appendChild(lbl1);
    nav.appendChild(div);
}

function createHeaderChecks() {
    const div = document.createElement('div')
    const chk1 = document.createElement('input');
    chk1.setAttribute('type', 'checkbox');
    chk1.id = 'displayOwn';
    const lbl1 = document.createElement('label');
    lbl1.appendChild(document.createTextNode('Show only own tweets'));
    lbl1.setAttribute('for', 'displayOwn');
    chk1.addEventListener("change", toggleShow);
    chk1.styleType = 'own';
    const nav = document.querySelector('div.r-1gn8etr div.r-1jgb5lz');
    div.appendChild(chk1)
    div.appendChild(lbl1)
    nav.appendChild(div)
}