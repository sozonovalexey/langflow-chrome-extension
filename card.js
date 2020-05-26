let disappearingStarted;
let drawingStarted;
let timeoutIdTimer;
let translationCardDelay = 1000;

// Works as semaphore for "disappearing()".
disappearingStarted = false;

// Works as semaphore for "drawCard()".
drawingStarted = false;

/**
 * Hide a translation card from the web page.
 */
function disappearing() {
    let translationCard = document.getElementById('langFlowTranslationCard8730011');

    translationCard.classList.add('langFlowDisappearing8730011');

    disappearingStarted = true;

    setTimeout(function () {
        translationCard.remove();
        document.getElementsByTagName( 'html' )[0].classList.remove('langFlowHtml8730011');

        disappearingStarted = false;
        drawingStarted = false;
    }, translationCardDelay);
}

/**
 * Action that executes when close button on the translation card is pressed.
 *
 * @param {Object} event
 */
function closeButtonAction(event) {
    event.preventDefault();
    event.stopPropagation();
    clearTimeout(timeoutIdTimer);

    if (!disappearingStarted) {
        disappearing();
    }
}

/**
 * Show a translation card on the web page.
 *
 * @param {Object} data
 * @param {Object} settingsArray array of the settings fetched from the "background.js"
 */
function appearing(data, settingsArray) {
    let { source, translation, translateFrom } = data;
    let selectDelay = settingsArray.selectDelay;
    let showClose = settingsArray.showClose;
    let translationCard;
    let closeButton;

    drawingStarted = true;
    translationCard = document.createElement('div');
    translationCard.id = 'langFlowTranslationCard8730011';
    translationCard.className = parseInt(settingsArray.theme) === 1 ? 'black' : 'white';
    translationCard.innerHTML =
        "<div id='langFlowTimer8730011' style='animation-duration: " + selectDelay + "\s'></div>" +
        "<a href='' id='langFlowCloseButton8730011' tabindex='-1'></a>" +
        "<a href='' id='langFlowPlayButton8730011' tabindex='-1'></a>" +
        "<div id='langFlowSource8730011'>" + source + "</div>" +
        "<div id='langFlowTranslation8730011'>" + translation + "</div>";

    document.getElementsByTagName( 'html' )[0].classList.add('langFlowHtml8730011');

    document.documentElement.insertBefore(translationCard, document.documentElement.firstChild);
    closeButton = document.getElementById('langFlowCloseButton8730011');
    closeButton.onclick = closeButtonAction;

    document.getElementById('langFlowPlayButton8730011').onclick = function () {
        chrome.runtime.sendMessage({type: 'playWord', source: source, translateFrom: translateFrom});
        return false;
    };

    timeoutIdTimer = setTimeout(function () {
        if (!disappearingStarted) {
            disappearing();
        }
    }, selectDelay * 1000);
}

/**
 * Start appearing of the card and pass the parameters to the "appearing" function.
 *
 * @param {Object} data
 * @param {Object} settingsArray Array of the settings fetched from the "background.js"
 */
function drawCard(data, settingsArray) {
    if (!drawingStarted) {
        appearing(data, settingsArray);
    }
}

/**
 * Function that transfer text to speech.
 *
 * @param {string} source Text to transfer.
 * @param {string} language Language to transfer.
 */
function playWord(source, language) {
    //noinspection JSUnresolvedFunction
    let audio = new Audio("https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=" +
        language + "&q=" + encodeURIComponent(source));
    audio.play();
}