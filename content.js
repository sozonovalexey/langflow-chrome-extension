/**
 * This listener gets messages from "background.js" when it is time to showing word card.
 */
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === 'showWord') {
            if (!document.webkitHidden) {
                chrome.runtime.sendMessage({type: 'wordCardShown'});
                drawCard(request.data, request.settingsArray);
            }
        }
    }
);