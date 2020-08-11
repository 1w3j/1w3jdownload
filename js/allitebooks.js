const DATABASE_NAME = "allitebooksDB",
    DATABASE_VERSION = 1,
    ICONS_SIZE = 32;
let ALLITEBOOKS = {
    DB: null,
    IMAGES: {
        COPY: chrome.extension.getURL("images/copy-48.png"),
        DOWNLOAD: chrome.extension.getURL("images/download-48.png"),
        HIGHLIGHT_ON: chrome.extension.getURL("images/highlight-on-48.png"),
        HIGHLIGHT_OFF: chrome.extension.getURL("images/highlight-off-48.png"),
    },
};

/**
 * Initializes an indexedDB database
 * @param {*} dbObject                      The object that handles the database passed by reference
 * @param {IDBDatabase} dbObject.DB         The IDBDatabase object itself
 * @param {string} dbName                   The name for th database to be created
 * @tutorial https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase
 * @tutorial https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
 */
function initializeDB(dbObject, dbName) {
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
            DATABASE_NAME,
            DATABASE_VERSION
        );
        openAllitebooksDBRequest.onerror = (e) =>
            console.error(
                DATABASE_NAME +
                    "DB open request:\n" +
                    e.target +
                    "\nCheck if you didn't allow the website to indexedDB databases. The feature 'Already downloaded highlighting' won't be available"
            );
        openAllitebooksDBRequest.onsuccess = (e) => {
            dbObject.DB = openAllitebooksDBRequest.result;
        };
        openAllitebooksDBRequest.onupgradeneeded = function (e) {
            dbObject.DB = e.target.result;
            dbObject.DB.onerror = (e) =>
                console.error(
                    DATABASE_NAME +
                        "DB open request:\n" +
                        e +
                        "\nError on database upgrade. The feature 'Already downloaded highlighting' won't be available"
                );
            const objectStore = dbObject.DB.createObjectStore("visitedBooks", {
                keyPath: "bookURL",
            });
            const booksData = [
                {
                    bookURL:
                        "http://www.allitebooks.org/basic-linux-terminal-tips-and-tricks",
                    bookTitle: "Delphi Quick Syntax Reference",
                },
                {
                    bookURL:
                        "http://www.allitebooks.org/beginning-jakarta-ee-web-development-3rd-edition",
                    bookTitle: "Beginning Jakarta EE Web Development",
                },
                {
                    bookURL:
                        "http://www.allitebooks.org/basic-linux-terminal-tips-and-tricks",
                    bookTitle: "Basic Linux Terminal Tips and Tricks",
                },
            ];
            objectStore.transaction.oncomplete = (e) => {
                let booksVisitedStore = dbObject.DB.transaction(
                    "visitedBooks",
                    "readwrite"
                ).objectStore("visitedBooks");
                booksData.forEach((book) => {
                    booksVisitedStore.add(book);
                });
            };
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

function downloadBook(url, bookTitle) {
    chrome.downloads.download({
        url: url,
        filename: bookTitle,
        conflictAction: "uniquify",
        saveAs: false,
    });
}

/**
 * Checks if the book was marked as downloaded, which means the URL is already stored on the database
 * @param {string} url - The book URL
 * @returns {Promise}
 */
function checkIfBookAlreadyDownloaded(url) {
    return new Promise((resolve, reject) => {
        console.log("searching: " + cleanURL(url));
        let searchBookURLRequest = ALLITEBOOKS.DB.transaction(
            "visitedBooks",
            "readonly"
        )
            .objectStore("visitedBooks")
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
    let addBookRequest = ALLITEBOOKS.DB.transaction("visitedBooks", "readwrite")
        .objectStore("visitedBooks")
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
    let removeBookRequest = ALLITEBOOKS.DB.transaction(
        "visitedBooks",
        "readwrite"
    )
        .objectStore("visitedBooks")
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
            if (element.classList.contains("downloaded-book-1w3j"))
                element.classList.remove("downloaded-book-1w3j");
            highlightButton.src = ALLITEBOOKS.IMAGES.HIGHLIGHT_OFF;
            highlightButton.title = "Mark This Book";
        } else {
            addDownloadedBook(url, bookTitle);
            element.classList.add("downloaded-book-1w3j");
            highlightButton.src = ALLITEBOOKS.IMAGES.HIGHLIGHT_ON;
            highlightButton.title = "Unmark This Book";
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
    copyButton.className = "copy-button-1w3j";
    copyButton.src = ALLITEBOOKS.IMAGES.COPY;
    copyButton.title = 'Copy "' + textToCopy + '"';
    copyButton.height = ICONS_SIZE;
    copyButton.width = ICONS_SIZE;
    copyButton.style.top = cumulativeOffset(element).top + "px";
    copyButton.style.left =
        element.getBoundingClientRect().right - ICONS_SIZE / 2 + "px";
    copyButton.onclick = () => copy(textToCopy);
    document.body.appendChild(copyButton);
}

/**
 * Adds a button next to the element, when the user clicks the button, url will be automatically downloaded
 * without prompting any dialog, and using filename as the full base name for the file
 * @param element - the element to put the button next to
 * @param url - the url that will be downloaded
 * @param filename - a file name that the download file will have
 */
function putDownloadButtonOn(element, url, filename) {
    let downloadButton = document.createElement("img");
    downloadButton.className = "download-button-1w3j";
    downloadButton.src = ALLITEBOOKS.IMAGES.DOWNLOAD;
    downloadButton.title = 'Download "' + filename + '"';
    downloadButton.height = ICONS_SIZE;
    downloadButton.width = ICONS_SIZE;
    downloadButton.style.top = cumulativeOffset(element).top + "px";
    downloadButton.style.left =
        element.getBoundingClientRect().right - ICONS_SIZE * 1.5 + "px";
    downloadButton.onclick = () => downloadBook(url, filename);
    document.body.appendChild(downloadButton);
}

/**
 * Adds a button next to the element, when the user clicks the button, url will be searched on an indexeddb
 * database, if url does not exist on the database, then the element text color will change to whatever color was set
 * on .downloaded-book-1w3j class, then it will be added a new entry on the database using url as key and bookTitle as
 * a value. If url does exist on the database, then the respective entry will be removed from the database and the
 * .downloaded-book-1w3j class will be removed
 * @param element - the element to put the button next to
 * @param url - the url that will be searched for on the database
 * @param bookTitle - the book title that would be added together with the url
 */
function putHighlightButtonOn(element, url, bookTitle) {
    let highlightButton = document.createElement("img");
    highlightButton.className = "highlight-button-1w3j";
    checkIfBookAlreadyDownloaded(url).then((alreadyDownloaded) => {
        highlightButton.src = alreadyDownloaded
            ? ALLITEBOOKS.IMAGES.HIGHLIGHT_ON
            : ALLITEBOOKS.IMAGES.HIGHLIGHT_OFF;
        highlightButton.title = alreadyDownloaded
            ? "Unmark This Book"
            : "Mark This Book";
    });
    highlightButton.height = ICONS_SIZE;
    highlightButton.width = ICONS_SIZE;
    highlightButton.style.top =
        element.classList.contains("wp_rp_title") ||
        element.classList.contains("entry-title")
            ? cumulativeOffset(element).top + ICONS_SIZE + "px"
            : cumulativeOffset(element).top + "px";
    highlightButton.style.left =
        element.classList.contains("wp_rp_title") ||
        element.classList.contains("entry-title")
            ? element.getBoundingClientRect().right - ICONS_SIZE / 2 + "px"
            : element.getBoundingClientRect().right - ICONS_SIZE * 2.5 + "px";
    highlightButton.onclick = () =>
        highlightBook(
            element.classList.contains("entry-title")
                ? element.getElementsByTagName("a")[0]
                : element,
            url,
            bookTitle,
            highlightButton
        );
    document.body.appendChild(highlightButton);
}

initializeDB(ALLITEBOOKS, DATABASE_NAME);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
        if (
            cleanURL(window.location.href).match(
                /(http|https):\/\/www.allitebooks.org\/(?!page\/).*/
            )
        ) {
            // adding copy-download buttons to the book title on the book page
            let bookTitle = document.getElementsByClassName("single-title")[0], // The book title heading
                bookSubtitle =
                    bookTitle.nextElementSibling.tagName === "H4"
                        ? bookTitle.nextElementSibling.innerText
                        : false,
                relatedBooks = document.getElementsByClassName(
                    // The related books cards
                    "related_post wp_rp"
                )[0];
            putCopyButtonOn(bookTitle, bookTitle.innerText);
            checkIfBookAlreadyDownloaded(window.location.href).then(
                (alreadyDownloaded) => {
                    if (alreadyDownloaded)
                        bookTitle.classList.add("downloaded-book-1w3j");
                }
            );
            if (bookSubtitle)
                putCopyButtonOn(bookTitle.nextElementSibling, bookSubtitle);
            putDownloadButtonOn(
                bookTitle,
                bookTitle,
                bookSubtitle
                    ? bookTitle.innerText + " " + bookSubtitle
                    : bookTitle.innerText
            );
            putHighlightButtonOn(
                bookTitle,
                window.location.href,
                bookSubtitle
                    ? bookTitle.innerText + " " + bookSubtitle
                    : bookTitle.innerText
            );
            // adding copy-highlight buttons to the related books' little cards at the book page's bottom
            for (let i = 0; i < relatedBooks.childElementCount; i++) {
                let relatedBookTitle = relatedBooks
                    .getElementsByTagName("li")
                    [i].getElementsByClassName("wp_rp_title")[0];
                putCopyButtonOn(relatedBookTitle, relatedBookTitle.innerText);
                checkIfBookAlreadyDownloaded(relatedBookTitle.href).then(
                    (alreadyDownloaded) => {
                        if (alreadyDownloaded)
                            relatedBookTitle.classList.add(
                                "downloaded-book-1w3j"
                            );
                    }
                );
                putHighlightButtonOn(
                    relatedBookTitle,
                    relatedBookTitle.href,
                    relatedBookTitle.innerText
                );
            }
        } else {
            // adding a copy button to each book title on books lists type of pages
            let bookTitles = document.getElementsByClassName("entry-title");
            for (let i = 0; i < bookTitles.length; i++) {
                const bookURLElement = bookTitles[i].getElementsByTagName(
                    "a"
                )[0];
                putCopyButtonOn(bookTitles[i], bookTitles[i].innerText);
                checkIfBookAlreadyDownloaded(bookURLElement.href).then(
                    (alreadyDownloaded) => {
                        if (alreadyDownloaded)
                            bookURLElement.classList.add(
                                "downloaded-book-1w3j"
                            );
                    }
                );
                putHighlightButtonOn(
                    bookTitles[i],
                    bookURLElement.href,
                    bookTitles[i].innerText
                );
            }
        }
    });
}
