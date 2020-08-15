/**
 * Main constant object for the allitebooks plugin
 * @type {
 *          {
 *              DB: {
 *                  INSTANCE: IDBDatabase,
 *                  NAME: string
 *                  VERSION: number,
 *                  OBJECT_STORE: string,
 *                  KEY_PATH: string
 *              },
 *              ICONS: {
 *                  SIZE: number,
 *                  COPY: string,
 *                  DOWNLOAD: string,
 *                  HIGHLIGHT_ON: string
 *                  HIGHLIGHT_OFF: string,
 *              },
 *              CLASSES: {
 *                  DOWNLOADED: string,
 *                  HIGHLIGHT_BUTTON: string
 *              },
 *              TEXT:{
 *                  MARK_THIS_BOOK: string,
 *                  UNMARK_THIS_BOOK: string
 *              }
 *          }
 *       }
 */
const ALLITEBOOKS = {
    DB: {
        INSTANCE: null,
        NAME: "allitebooksDB",
        VERSION: 1,
        OBJECT_STORE: "visitedBooks",
        KEY_PATH: "bookURL",
    },
    ICONS: {
        SIZE: 32,
        COPY: chrome.extension.getURL("images/copy-48.png"),
        DOWNLOAD: chrome.extension.getURL("images/download-48.png"),
        HIGHLIGHT_ON: chrome.extension.getURL("images/highlight-on-48.png"),
        HIGHLIGHT_OFF: chrome.extension.getURL("images/highlight-off-48.png"),
    },
    CLASSES: {
        DOWNLOADED: "downloaded-book-1w3j",
        BUTTONS: {
            COPY: "copy-button-1w3j",
            DOWNLOAD: "download-button-1w3j",
            HIGHLIGHT: "highlight-button-1w3j",
        },
        PUBLIC: {
            BOOK_PAGE: {
                BOOK_TITLE: "single-title",
                RELATED_BOOKS: "related_post wp_rp",
                RELATED_BOOK_TITLE: "wp_rp_title",
                DOWNLOAD_LINKS: "download-links",
            },
            LIST_PAGE: { BOOK_TITLE: "entry-title" },
        },
    },
    TEXT: {
        MARK_THIS_BOOK: "Mark This Book",
        UNMARK_THIS_BOOK: "Unmark This Book",
    },
};

/**
 * Initializes an indexedDB database
 * @tutorial https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase
 * @tutorial https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
 */
function initializeDB() {
    window.indexedDB =
        window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction ||
        window.webkitIDBTransaction ||
        window.msIDBTransaction || { READ_WRITE: "readwrite" };
    window.IDBKeyRange =
        window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    if (!window.indexedDB) {
        console.log(
            "Your browser doesn't support a stable version of IndexedDB. The feature 'Already downloaded highlighting' won't be available"
        );
    } else {
        let openAllitebooksDBRequest = window.indexedDB.open(
            ALLITEBOOKS.DB.NAME,
            ALLITEBOOKS.DB.VERSION
        );
        openAllitebooksDBRequest.onerror = (e) =>
            console.error(
                ALLITEBOOKS.DB.NAME +
                    "DB open request:\n" +
                    e.target +
                    "\nCheck if you didn't allow the website to indexedDB databases. The feature 'Already downloaded highlighting' won't be available"
            );
        openAllitebooksDBRequest.onsuccess = (e) => {
            ALLITEBOOKS.DB.INSTANCE = openAllitebooksDBRequest.result;
        };
        openAllitebooksDBRequest.onupgradeneeded = (e) => {
            ALLITEBOOKS.DB.INSTANCE = e.target.result;
            ALLITEBOOKS.DB.INSTANCE.onerror = (e) =>
                console.error(
                    ALLITEBOOKS.DB.NAME +
                        "DB open request:\n" +
                        e +
                        "\nError on database upgrade. The feature 'Already downloaded highlighting' won't be available"
                );
            ALLITEBOOKS.DB.INSTANCE.createObjectStore(
                ALLITEBOOKS.DB.OBJECT_STORE,
                {
                    keyPath: ALLITEBOOKS.DB.KEY_PATH,
                }
            );
        };
    }
}

/**
 * Removes a trailing slash on url, then trims any trailing or leading whitespaces
 * @param url - the URL
 * @returns {string} - the 'cleaned' URL
 */
function cleanURL(url) {
    const regex = /\/$/;
    return url.replace(regex, "").trim();
}

function downloadBooks(downloadLinks, bookTitle) {
    for (let i = 0; i < downloadLinks.length; i++)
        chrome.runtime.sendMessage(downloadLinks.href);
    // chrome.downloads.download({
    //     url: url,
    //     filename: bookTitle,
    //     conflictAction: "uniquify",
    //     saveAs: false,
    // });
}

/**
 * Checks if the book was marked as downloaded, which means the URL is already stored on the database
 * @param {string} url - The book URL
 * @returns {Promise}
 */
function checkIfBookAlreadyDownloaded(url) {
    return new Promise((resolve, reject) => {
        console.log("searching: " + cleanURL(url));
        let searchBookURLRequest = ALLITEBOOKS.DB.INSTANCE.transaction(
            ALLITEBOOKS.DB.OBJECT_STORE,
            "readonly"
        )
            .objectStore(ALLITEBOOKS.DB.OBJECT_STORE)
            .get(cleanURL(url));
        searchBookURLRequest.onerror = (e) => {
            console.log("Search Book URL Request Error:\n" + e);
            reject("reject: Search Book URL Request Error:\n" + e);
        };
        searchBookURLRequest.onsuccess = (e) => {
            resolve(typeof searchBookURLRequest.result !== "undefined");
        };
    });
}

function addDownloadedBook(url, bookTitle) {
    console.log("adding: " + url);
    let addBookRequest = ALLITEBOOKS.DB.INSTANCE.transaction(
        ALLITEBOOKS.DB.OBJECT_STORE,
        "readwrite"
    )
        .objectStore(ALLITEBOOKS.DB.OBJECT_STORE)
        .add({ bookURL: cleanURL(url), bookTitle: bookTitle });
    addBookRequest.onerror = (e) => {
        console.log("Add Book Request Error:");
        console.log(e);
    };
    addBookRequest.onsuccess = (e) => {
        console.log("just added book");
        console.log(addBookRequest.result);
    };
}

function removeBook(url) {
    console.log("removing: " + url);
    let removeBookRequest = ALLITEBOOKS.DB.INSTANCE.transaction(
        ALLITEBOOKS.DB.OBJECT_STORE,
        "readwrite"
    )
        .objectStore(ALLITEBOOKS.DB.OBJECT_STORE)
        .delete(cleanURL(url));
    removeBookRequest.onerror = (e) => {
        console.log("Add Book Request Error:");
        console.log(e);
    };
    removeBookRequest.onsuccess = (e) => {
        console.log("just removed book");
        console.log(removeBookRequest.result);
    };
}

function highlightBook(element, url, bookTitle, highlightButton) {
    checkIfBookAlreadyDownloaded(url).then((alreadyDownloaded) => {
        if (alreadyDownloaded) {
            removeBook(url);
            element.classList.remove(ALLITEBOOKS.CLASSES.DOWNLOADED);
            highlightButton.src = ALLITEBOOKS.ICONS.HIGHLIGHT_OFF;
            highlightButton.title = ALLITEBOOKS.TEXT.MARK_THIS_BOOK;
        } else {
            addDownloadedBook(url, bookTitle);
            element.classList.add(ALLITEBOOKS.CLASSES.DOWNLOADED);
            highlightButton.src = ALLITEBOOKS.ICONS.HIGHLIGHT_ON;
            highlightButton.title = ALLITEBOOKS.TEXT.UNMARK_THIS_BOOK;
        }
    });
}

/**
 * Determine the accumulated offset between the element and the farthest parent available
 * @param element - the html element to be handled
 * @returns {{top: number, left: number}} - an object containing two items, top and left, both integers
 */
function cumulativeOffset(element) {
    let top = 0,
        left = 0;
    do {
        top += element.offsetTop || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while (element);
    return {
        top: top,
        left: left,
    };
}

/**
 * Will copy text to the main clipboard using whichever of the to ways it can be handled.
 * @param text - the text to copy
 */
function copy(text) {
    if (typeof navigator.clipboard == "undefined") {
        const fakeTextArea = document.createElement("textarea");
        fakeTextArea.value = text;
        fakeTextArea.style.position = "fixed"; //avoid scrolling to bottom
        document.body.appendChild(fakeTextArea);
        fakeTextArea.focus();
        fakeTextArea.select();
        try {
            const successful = document.execCommand("copy"),
                msg = successful
                    ? "successful copy with textarea\ntext: " + text
                    : "unsuccessful copy with text are method";
            console.log(msg);
        } catch (err) {
            console.log("Was not possible to copy to clipboard: ", err);
        }
        document.body.removeChild(fakeTextArea);
    } else {
        navigator.clipboard.writeText(text).then(
            function () {
                console.log("copied successfully\ntext: " + text);
            },
            function (err) {
                console.log("unsuccessful copy button: " + err);
            }
        );
    }
}

/**
 *  Adds a button next to the element, when the user clicks the button, textToCopy is copied to clipboard
 *  @param {Element} element - the element to but the button next to
 *  @param {string} textToCopy - the text that the button will copy to clipboard
 */
function putCopyButtonOn(element, textToCopy) {
    let copyButton = document.createElement("img"),
        regex = /®|!|:|,|(\s–\s)|(\s-\s)|(1st Edition)|(First Edition)|(2nd Edition)|(Second Edition)|(3rd Edition)|(Third Edition)|(4th Edition)|(Fourth Edition)|(5th Edition)|(Fifth Edition)|(6th Edition)|(Sixth Edition)|(7th Edition)|(8th Edition)|(9th Edition)|(10th Edition)|(11th Edition)|(12th Edition)|(13th Edition)|(14th Edition)|(15th Edition)|(16th Edition)|(17th Edition)|(18th Edition)|(19th Edition)|(20th Edition)/g;
    textToCopy = textToCopy.replace(regex, "").trim();
    copyButton.className = ALLITEBOOKS.CLASSES.BUTTONS.COPY;
    copyButton.src = ALLITEBOOKS.ICONS.COPY;
    copyButton.title = 'Copy "' + textToCopy + '"';
    copyButton.height = ALLITEBOOKS.ICONS.SIZE;
    copyButton.width = ALLITEBOOKS.ICONS.SIZE;
    copyButton.style.top = cumulativeOffset(element).top + "px";
    copyButton.style.left =
        element.getBoundingClientRect().right -
        ALLITEBOOKS.ICONS.SIZE / 2 +
        "px";
    copyButton.onclick = () => copy(textToCopy);
    document.body.appendChild(copyButton);
}

/**
 * Adds a button next to the element, when the user clicks the button, url will be automatically downloaded
 * without prompting any dialog, and using filename as the full base name for the file
 * @param element - the element to put the button next to
 * @param downloadLinks - the download links elements (html tag '<a>') that have the urls to be downloaded
 * @param filename - a file name that the download file will have
 */
function putDownloadButtonOn(element, downloadLinks, filename) {
    let downloadButton = document.createElement("img");
    downloadButton.className = ALLITEBOOKS.CLASSES.BUTTONS.DOWNLOAD;
    downloadButton.src = ALLITEBOOKS.ICONS.DOWNLOAD;
    downloadButton.title = 'Download "' + filename + '"';
    downloadButton.height = ALLITEBOOKS.ICONS.SIZE;
    downloadButton.width = ALLITEBOOKS.ICONS.SIZE;
    downloadButton.style.top = cumulativeOffset(element).top + "px";
    downloadButton.style.left =
        element.getBoundingClientRect().right -
        ALLITEBOOKS.ICONS.SIZE * 1.5 +
        "px";
    downloadButton.onclick = () => downloadBooks(downloadLinks, filename);
    document.body.appendChild(downloadButton);
}

/**
 * Adds a button next to the element, when the user clicks the button, url will be searched on an indexeddb
 * database, if url does not exist on the database, then the element text color will change to whatever color was set
 * on {@link ALLITEBOOKS.CLASSES.DOWNLOADED}, then it will be added a new entry on the database using url as key and bookTitle as
 * a value. If url does exist on the database, then the respective entry will be removed from the database and the
 * {@link ALLITEBOOKS.CLASSES.DOWNLOADED} class will be removed
 * @param {Element} element - the element to put the button next to
 * @param {string} url - the url that will be searched for on the database
 * @param {string} bookTitle - the book title that would be added together with the `url`
 * @param {boolean} [doNotCheckIfDownloaded=false] - if passed as true, then it causes the function to recheck if the
 * book was already downloaded. Otherwise it will assume `bookTitle` and `url` are already on the database. This was
 * added just to avoid double-checking the same `url` on the database. First check it's done when looking for
 * `window.href` and the second time {@link checkIfBookAlreadyDownloaded} was called happens inside this function
 * for toggling the highlight button. So we just avoid double calling it using a `boolean`.
 */
function putHighlightButtonOn(
    element,
    url,
    bookTitle,
    doNotCheckIfDownloaded = false
) {
    let highlightButton = document.createElement("img");
    highlightButton.className = ALLITEBOOKS.CLASSES.BUTTONS.HIGHLIGHT;
    if (doNotCheckIfDownloaded) {
        highlightButton.src = ALLITEBOOKS.ICONS.HIGHLIGHT_ON;
        highlightButton.title = ALLITEBOOKS.TEXT.UNMARK_THIS_BOOK;
    } else {
        checkIfBookAlreadyDownloaded(url).then((alreadyDownloaded) => {
            highlightButton.src = alreadyDownloaded
                ? ALLITEBOOKS.ICONS.HIGHLIGHT_ON
                : ALLITEBOOKS.ICONS.HIGHLIGHT_OFF;
            highlightButton.title = alreadyDownloaded
                ? ALLITEBOOKS.TEXT.UNMARK_THIS_BOOK
                : ALLITEBOOKS.TEXT.MARK_THIS_BOOK;
        });
    }
    highlightButton.height = ALLITEBOOKS.ICONS.SIZE;
    highlightButton.width = ALLITEBOOKS.ICONS.SIZE;
    highlightButton.style.top =
        element.classList.contains(
            ALLITEBOOKS.CLASSES.PUBLIC.BOOK_PAGE.RELATED_BOOK_TITLE
        ) ||
        element.classList.contains(
            ALLITEBOOKS.CLASSES.PUBLIC.LIST_PAGE.BOOK_TITLE
        )
            ? cumulativeOffset(element).top + ALLITEBOOKS.ICONS.SIZE + "px"
            : cumulativeOffset(element).top + "px";
    highlightButton.style.left =
        element.classList.contains(
            ALLITEBOOKS.CLASSES.PUBLIC.BOOK_PAGE.RELATED_BOOK_TITLE
        ) ||
        element.classList.contains(
            ALLITEBOOKS.CLASSES.PUBLIC.LIST_PAGE.BOOK_TITLE
        )
            ? element.getBoundingClientRect().right -
              ALLITEBOOKS.ICONS.SIZE / 2 +
              "px"
            : element.getBoundingClientRect().right -
              ALLITEBOOKS.ICONS.SIZE * 2.5 +
              "px";
    highlightButton.onclick = () =>
        highlightBook(
            element.classList.contains(
                ALLITEBOOKS.CLASSES.PUBLIC.LIST_PAGE.BOOK_TITLE
            )
                ? element.getElementsByTagName("a")[0]
                : element,
            url,
            bookTitle,
            highlightButton
        );
    document.body.appendChild(highlightButton);
}

initializeDB();

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
        if (
            cleanURL(window.location.href).match(
                /(http|https):\/\/www.allitebooks.org\/(?!page\/).*/
            )
        ) {
            // adding copy-download buttons to the book title on the book page
            let bookTitle = document.getElementsByClassName(
                    ALLITEBOOKS.CLASSES.PUBLIC.BOOK_PAGE.BOOK_TITLE
                )[0], // The book title heading
                bookSubtitle =
                    bookTitle.nextElementSibling.tagName === "H4"
                        ? bookTitle.nextElementSibling.innerText
                        : false,
                relatedBooks = document.getElementsByClassName(
                    // The related books small cards at the bottom of the page
                    ALLITEBOOKS.CLASSES.PUBLIC.BOOK_PAGE.RELATED_BOOKS
                )[0],
                downloadLinks = document.getElementsByClassName(
                    ALLITEBOOKS.CLASSES.PUBLIC.BOOK_PAGE.DOWNLOAD_LINKS
                );
            putCopyButtonOn(bookTitle, bookTitle.innerText);
            checkIfBookAlreadyDownloaded(window.location.href).then(
                (alreadyDownloaded) => {
                    if (alreadyDownloaded)
                        bookTitle.classList.add(ALLITEBOOKS.CLASSES.DOWNLOADED);
                    putHighlightButtonOn(
                        bookTitle,
                        window.location.href,
                        bookSubtitle
                            ? bookTitle.innerText + " " + bookSubtitle
                            : bookTitle.innerText,
                        alreadyDownloaded
                    );
                }
            );
            if (bookSubtitle)
                putCopyButtonOn(bookTitle.nextElementSibling, bookSubtitle);
            putDownloadButtonOn(
                bookTitle,
                downloadLinks,
                bookSubtitle
                    ? bookTitle.innerText + " " + bookSubtitle
                    : bookTitle.innerText
            );
            // adding copy-highlight buttons to the related books' little cards at the book page's bottom
            for (let i = 0; i < relatedBooks.childElementCount; i++) {
                let relatedBookTitle = relatedBooks
                    .getElementsByTagName("li")
                    [i].getElementsByClassName(
                        ALLITEBOOKS.CLASSES.PUBLIC.BOOK_PAGE.RELATED_BOOK_TITLE
                    )[0];
                putCopyButtonOn(relatedBookTitle, relatedBookTitle.innerText);
                checkIfBookAlreadyDownloaded(relatedBookTitle.href).then(
                    (alreadyDownloaded) => {
                        if (alreadyDownloaded)
                            relatedBookTitle.classList.add(
                                ALLITEBOOKS.CLASSES.DOWNLOADED
                            );
                        putHighlightButtonOn(
                            relatedBookTitle,
                            relatedBookTitle.href,
                            relatedBookTitle.innerText,
                            alreadyDownloaded
                        );
                    }
                );
            }
        } else {
            // adding a copy button to each book title on books lists type of pages
            let bookTitles = document.getElementsByClassName(
                ALLITEBOOKS.CLASSES.PUBLIC.LIST_PAGE.BOOK_TITLE
            );
            for (let i = 0; i < bookTitles.length; i++) {
                const bookURLElement = bookTitles[i].getElementsByTagName(
                    "a"
                )[0];
                putCopyButtonOn(bookTitles[i], bookTitles[i].innerText);
                checkIfBookAlreadyDownloaded(bookURLElement.href).then(
                    (alreadyDownloaded) => {
                        if (alreadyDownloaded)
                            bookURLElement.classList.add(
                                ALLITEBOOKS.CLASSES.DOWNLOADED
                            );
                        putHighlightButtonOn(
                            bookTitles[i],
                            bookURLElement.href,
                            bookTitles[i].innerText,
                            alreadyDownloaded
                        );
                    }
                );
            }
        }
    });
}
