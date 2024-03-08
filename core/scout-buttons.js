import { localDatabase } from "./content";

function scoutButtonEvent(event) {
    const caller = event.target;
    const origin = caller.closest('article')
    const [author, status] = caller.getAttribute("origin").split('/');
    const isDB = caller.getAttribute('in-db') === 'true' ? true : false
  
    if (!isDB) {
      caller.setAttribute('in-db', 'true');
  
      attachments = []
      if (origin.querySelector('div[data-testid="videoComponent"]') !== null) {
        attachments.push('video')}
      
      const photos = origin.querySelectorAll('img[alt="Image"]')
      if (photos.length !== 0) {
        for (var i = 0; i < photos.length; i++) {
          attachments.push(photos[i].getAttribute("src"))
        }
      }
  
      var postData = {
        'attachments': attachments
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