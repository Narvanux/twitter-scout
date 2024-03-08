import { localDatabase } from "./content";
import { scoutButtonEvent } from "./scout-buttons";

var observed = []

export function startObserving() {
  
    // Config and callback
    const config = {childList: true};
    const callback = (mutationList, observer) => {
      const scouted = document.querySelectorAll('article[tabindex="0"]:not([scout-stored]), article[tabindex="-1"]:not([scout-stored])');
      
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
    }
  
    callback()

    observed = document.querySelectorAll('div[aria-label*="Timeline:"] > div:not([observed])');
  
    // Create an observer and observe
    const observer = new MutationObserver(callback);
    observer.observe(observed, config);
  }