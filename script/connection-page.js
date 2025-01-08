const connectionPageHeader = document.getElementById("connection-page-header");

// const peerIdPcContainer = document.getElementById("peer-id-pc");
// const peerIdMobileContainer = document.getElementById("peer-id-mobile");

const peerIdQrCodeDisplay = document.getElementById("peer-id-qr-code-display");
const peerIdSpan = document.getElementById("peer-id-span");

const peerIdQrCodeScanner = document.getElementById("peer-id-qr-code-scanner");
const peerIdInput = document.getElementById("peer-id-input");

var qrCode;
var qrCodeScanner;

function initConnectionPage() {
    if (isMobile) {
        connectionPageHeader.textContent = "Open this page on a desktop and scan the code"
    } else {
        connectionPageHeader.textContent = "Scan this code with a mobile phone"
    }
}

function onPeerOpen(id) {
    setPeerIdDisplay(id);
    if (isMobile) {
        tryToConnectToPeerFromUrl();
    }
}

/**
 * Reads the `id` parameter from the url and tries to connect to the given id.
 * The `id` parameter is set, if the user scanned the qr code with the systems camera on their phone and opened the link from there
 */
function tryToConnectToPeerFromUrl() {
    let urlId = new URLSearchParams(window.location.search).get("id");

    if (urlId != null) {
        connectToPeer(urlId);
    }
}

/**
 * Creates and displays a qr code for the given id.
 * 
 * @param {string} id the id to display
 */
function setPeerIdDisplay(id) {
    let url = new URL(window.location.href);
    url.searchParams.append("id", id);
    qrCode = new QRCode(peerIdQrCodeDisplay, {
        text: url.toString(),
        width: 256,
        height: 256,
    });
    peerIdSpan.textContent = id;
}

/**
 * Starts the qr code scanner on mobile devices
 */
function startQrCodeScanner() {
    qrCodeScanner = new Html5QrcodeScanner(
        "peer-id-qr-code-scanner",
        {
            fps: 10
        }
    );

    qrCodeScanner.render(onQrCodeScanned);
}

function onQrCodeScanned(decodeText, decodeResult) {
    let id;
    try {
        let url = new URL(decodeText);
        id = url.searchParams.get("id");
    } catch (err) {
        alert("Invalid qr code");
        return;
    }

    qrCodeScanner.clear();
    peerIdInput.value = id;

    connectToPeer(id);
}


function copyPeerIdToClipboard() {
    navigator.clipboard.writeText(peer.id);
}
