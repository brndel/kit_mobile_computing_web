const pages = {
    "connection-page": document.getElementById("connection-page"),
    "game-page": document.getElementById("game-page"),
    "game-play-page": document.getElementById("game-play-page"),
    "game-restart-page": document.getElementById("game-restart-page"),
    "connection-lost-page": document.getElementById("connection-lost-page")
}

/**
 * Shows the page element with the given id and hides the current page
 * @param {string} id the html id of the page to show
 */
function setPage(id) {
    for (const pageId in pages) {
        pages[pageId].style.display = pageId === id ? "" : "none";
    }
}


const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

function init() {
    const body = document.getElementsByTagName("body")[0];

    if (isMobile) {
        body.classList.add("mobile");
    } else {
        body.classList.add("pc");
    }

    peer = createPeer();
    initConnectionPage();
}

