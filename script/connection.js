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
        connectionPageHeader.textContent = "Open this page on a mobile phone and scan this code"
        // peerIdMobileContainer.style.display = "none";
    }
}


function setPeerIdDisplay(id) {
    qrCode = new QRCode(peerIdQrCodeDisplay, {
        text: id,
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
    qrCodeScanner.clear();
    peerIdInput.value = decodeText;

    connectToPeer(decodeText);
}



function copyPeerIdToClipboard() {
    navigator.clipboard.writeText(peer.id);
}
