chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log(message);
    // for (i in args) {
    //     let url = args[i];
    //     chrome.downloads.download({
    //         url: url,
    //         filename: "newfile",
    //         saveAs: false,
    //         conflictAction: "uniquify",
    //     });
    // }
});
