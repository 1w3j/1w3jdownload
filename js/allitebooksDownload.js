chrome.runtime.onMessage.addListener(function (arg, sender, sendResponse) {
    let args = arg.collection;
    console.log(args);
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
