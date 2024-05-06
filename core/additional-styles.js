const trueShownStyle = `
    div[data-testid="cellInnerDiv"]:has(article):has(button.scout-btn[in-db="true"]) {
        display: none
    }
`

const ownShownStyle = `
    div[data-testid="cellInnerDiv"]:has(article:not([own])) {
        display: none
    }
`

const mainStyle = `
    div[aria-label="Home timeline"] > div.css-175oi2r.r-14lw9ot.r-184en5c,
    nav[aria-label*="Profile"],
    div[data-testid="cellInnerDiv"]:has(article[text-empty]),
    div.css-175oi2r.r-1adg3ll.r-6gpygo:has(span[data-testid="UserJoinDate"]) {
        display: none
    }

    article[scout-stored], li[scout-stored] {
      border: dashed 1px red }

    button.scout-btn[in-db="true"] {
      background-color: green }
    button.scout-btn[in-db="false"] {
      background-color: red }

    button.scout-btn {
      margin-left: 4px
      color: white
      font-weight: bold
    }
`

function toggleShow(event) {
    const caller = event.target;
    const type = caller.styleType;

    if (caller.checked) {
        createStyle(type);
    } else { removeStyle(type); }
}

function createStyle(type) {
    const stl = document.createElement('style')
    stl.id = type
    console.log(type)
    console.log(stl.id)
    if (type == 'true') {
        stl.innerText = trueShownStyle
    } else { stl.innerText = ownShownStyle }
    document.head.appendChild(stl)
}
function removeStyle(type) {
    const stl = document.querySelector('style#' + type)
    console.log(type)
    console.log(stl.id)
    stl.remove()
}

const styleSheet = document.createElement("style");
styleSheet.id = 'main'
styleSheet.innerText = mainStyle;
document.head.appendChild(styleSheet);