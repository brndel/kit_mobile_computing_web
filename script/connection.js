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
        // peerIdPcContainer.style.display = "none";
    } else {
        connectionPageHeader.textContent = "Scan this code with a mobile phone"
        // peerIdMobileContainer.style.display = "none";
    }
}

function onPeerOpen(id) {
    setPeerIdDisplay(id);
    if (isMobile) {
        tryToConnectToPeerFromUrl();
    }
}

function tryToConnectToPeerFromUrl() {
    let urlId = new URLSearchParams(window.location.search).get("id");

    if (urlId != null) {
        connectToPeer(urlId);
    }
}

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
