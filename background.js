let apiKey = JSON.parse(localStorage.getItem('apiKey'));
let settingsArray;
let intervalIdShowing;
let timeoutIdNotification;
let intervalTime;
let isMac = navigator.userAgent.indexOf("Mac") >= 0;
let dev = false;

// Chrome version in format: [59, 0, 3071, 115]. From major to minor.
let chromeVersion = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\s/)[2].split(".").map(Number);

checkStorage();
settingsArray = checkSettings();

if (dev) {
    intervalTime = settingsArray.selectInterval * 1000 * 5;
}
else {
    intervalTime = settingsArray.selectInterval * 1000 * 60 + settingsArray.selectDelay * 1000;
}

intervalIdShowing = setInterval(showWord, intervalTime);

function checkStorage() {
    let settingsArray = localStorage.getItem('settingsArray');

    if (!settingsArray) {
        settingsArray = {};
    } else {
        settingsArray = JSON.parse(settingsArray);
    }

    if (!(settingsArray.hasOwnProperty('collectionIds'))) {
        settingsArray.collectionIds = [0];
    }

    if (!(settingsArray.hasOwnProperty('selectInterval'))) {
        settingsArray.selectInterval = 5;
    }

    if (!(settingsArray.hasOwnProperty('selectDelay'))) {
        settingsArray.selectDelay = 1;
    }

    if (!(settingsArray.hasOwnProperty('theme'))) {
        settingsArray.theme = 1;
    }

    if (!(settingsArray.hasOwnProperty('showNativeCardsChecked'))) {
        settingsArray.showNativeCardsChecked = true;
    }

    if (!(settingsArray.hasOwnProperty('showNotificationCardsChecked'))) {
        settingsArray.showNotificationCardsChecked = true;
    }

    localStorage.setItem('settingsArray', JSON.stringify(settingsArray));

    if (!apiKey) {
        localStorage.setItem('apiKey', JSON.stringify(''));
    }
}

function checkSettings() {
    return JSON.parse(localStorage.getItem('settingsArray'));
}

/**
 * This function will be executed when the time to show comes.
 */
function showWord() {
    if (apiKey === '') {
        return false;
    }

    $.post('https://langflow.ru/api/v1/translation', {
        apiKey: apiKey,
        collectionIds: settingsArray.collectionIds,
    }, function (translation) {
        if (typeof translation.source === 'undefined' || !translation.source) {
            return false;
        }

        if (settingsArray.showNotificationCardsChecked) {
            timeoutIdNotification = setTimeout(function () {
                showNotification(translation, settingsArray);
            }, 1000);
        }

        if (settingsArray.showNativeCardsChecked) {
            chrome.tabs.query({'active': true, 'currentWindow': true},
                function (tabs) {
                    if (typeof tabs !== "undefined" && tabs.length) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: 'showWord',
                            settingsArray: settingsArray,
                            data: translation
                        });
                    }
                }
            );
        }
    });
}

/**
 * Listener will be activated when user makes different kind of changes of settings.
 */
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === 'changeSettings') {
            settingsArray = JSON.parse(localStorage.getItem('settingsArray'));
            if (dev) {
                intervalTime = settingsArray.selectInterval * 1000 * 5;
            }
            else {
                intervalTime = settingsArray.selectInterval * 1000 * 60 + settingsArray.selectDelay * 1000;
            }
            clearInterval(intervalIdShowing);
            intervalIdShowing = setInterval(showWord, intervalTime);
        }
    }
);

/**
 * Listener will be activated when "content.js" sends message to make sure that word card
 * will be shown as native card and it may disable push notification showing.
 */
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === 'wordCardShown') {
            clearTimeout(timeoutIdNotification);
        }
    }
);

/**
 * Listener will be activated when user presses "Listen".
 */
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === 'playWord') {
            playWord(request.source, request.translateFrom);
        }
    }
);

/**
 * Listener will be activated when user presses "Show Notification" in "options.js".
 */
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === 'showNotification') {
            showNotification({
                'source': 'Word',
                'translation': 'Translation',
                'translateFrom': 'en',
            }, settingsArray);
        }
    }
);

function showNotification(data, settingsArray) {
    let { source, translation } = data;
    let options;
    let _notificationId;
    let progressCounter;
    let intervalIdNotification;
    let typeFlag = isMac && chromeVersion[0] >= 59;

    if (typeFlag) {
        options = {
            type: 'basic',
            title: 'LangFlow',
            message: source + ' — ' + translation,
            iconUrl: 'images/icons/icon128.png',
            priority: 2
        };
    } else {
        options = {
            type: 'progress',
            title: 'LangFlow',
            message: source + ' — ' + translation,
            iconUrl: 'images/icons/iconNotification128.png',
            priority: 2,
            progress: 0,
        };
    }

    _notificationId = 'wordCard' + Math.floor(Math.random() * 9999999);
    chrome.notifications.create(_notificationId, options);
    progressCounter = 0;
    intervalIdNotification = setInterval(function () {
        if (progressCounter < 100) {
            progressCounter++;

            if (!typeFlag) {
                options.progress++;
                chrome.notifications.update(_notificationId, options);
            }
        } else {
            chrome.notifications.clear(_notificationId);
            clearInterval(intervalIdNotification);
        }

        // In order to reduce losses in the division: settingsArray.selectDelay * 10 == settingsArray.selectDelay / 100 * 1000.
    }, settingsArray.selectDelay * 10);

    chrome.notifications.onClosed.addListener(function (notificationId, byUser) {
        if (notificationId === _notificationId) {
            chrome.notifications.clear(_notificationId);
            clearInterval(intervalIdNotification);
        }
    });
}