let saveAsDocButton = document.getElementById('saveAsDocButton');
let saveAsTxtButton = document.getElementById('saveAsTxtButton');
let saveAsMarkdownButton = document.getElementById('saveAsMarkdownButton');
let saveAsPDFButton = document.getElementById('saveAsPDFButton');
let copyButton = document.getElementById('copyButton');
const button = document.querySelector('#copyButton');
const icon = button.querySelector('span');

import {saveAs} from 'file-saver';

saveAsDocButton.addEventListener("click", async () => {
    // Get current active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Execute script to parse chat on page and save as DOC
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: saveAsDoc,
    });
});

saveAsTxtButton.addEventListener("click", async () => {
    // Get current active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Execute script to parse chat on page and save as TXT
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: saveAsTxt,
    });
});

saveAsMarkdownButton.addEventListener("click", async () => {
    // Get current active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let includeInputCheckbox = document.getElementById('includeInput');
    // Execute script to parse chat on page and save as Markdown
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: saveAsMarkdown,
        args: [includeInputCheckbox.checked]
    });
});

saveAsPDFButton.addEventListener("click", async () => {
    // Get current active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Execute script to parse chat on page and save as PDF
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: saveAsPDF,
    });
});

copyButton.addEventListener("click", async () => {
    // Get current active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Wrap the executeScript in a Promise to be able to use .then()
    const executeScriptPromise = new Promise((resolve) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id },
                func: copyToClipboard,
            },
            ([result]) => resolve(result.result) // Resolve the Promise with success or failure
            );
    });

    // Wait for executeScriptPromise to resolve before running your logic
    executeScriptPromise.then((result) => {
        // Remove any existing success/failure icons
        icon.classList.remove('success-icon');
        icon.classList.remove('failure-icon');

        // Logic to change icon depending on status
        if (result.success){
            icon.classList.add('success-icon');
        } else {
            icon.classList.add('failure-icon');
        }

        // Revert the icon back to default after 2 seconds
        setTimeout(() => {
            icon.classList.remove('success-icon');
            icon.classList.remove('failure-icon');
        }, 2000);
    });
});


// Function to save text to chatData as Doc
async function saveAsDoc() {
    let element = document.querySelector(".text-base");
        if (!element || element.innerText === undefined) {
            alert("Nothing found");
            return;
        }
        const elements = document.querySelectorAll(".text-base");
        let chatData = "";
        for (const element of elements) {
            if (element.querySelector('.whitespace-pre-wrap')) {
                let innerText = element.querySelector(".whitespace-pre-wrap").innerText;
                chatData += `<w:p><w:r><w:t>${element.querySelectorAll('img').length > 1 ? 'You:' : 'ChatGPT:'}</w:t></w:r></w:p>`;
                chatData += `<w:p><w:r><w:t>${innerText}</w:t></w:r></w:p>`;
                chatData += `<w:p><w:r><w:t>------------------</w:t></w:r></w:p>`;
            }
        }

        let docxContent = `
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                <w:body>${chatData}</w:body>
            </w:document>`;

        const zip = new JSZip();
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                <Default Extension="xml" ContentType="application/xml"/>
                <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
            </Types>`);

        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
            </Relationships>`);

        zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
            </Relationships>`);

        zip.file('word/document.xml', docxContent);

        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, 'Saved_ChatGPT_.docx');
}

// Function to save text to chatData as TXT
async function saveAsTxt() {
    let element = document.querySelector(".text-base");
    if (!element || element.innerText === undefined) {
        alert("Nothing found");
        return;
    }
    const elements = document.querySelectorAll(".text-base");
    let chatData = "";
    for (const element of elements) {
        if (element.querySelector('.whitespace-pre-wrap')) {
            let innerText = element.querySelector(".whitespace-pre-wrap").innerText;
            chatData += `${element.querySelectorAll('img').length > 1 ? '**You:**' : '**ChatGPT:**'}\n\n\n${innerText}\n------------------\n`;
        }
    }
    let handle = await window.showSaveFilePicker({ suggestedName: "Saved_ChatGPT_.txt" });
    let stream = await handle.createWritable();
    await stream.write(chatData);
    await stream.close();
}

//Function to save text to chatData as pdf
function saveAsPDF() {
    const elements = document.querySelectorAll(".text-base");
    let content = "";
    for (const element of elements) {
        if (element.querySelector('.whitespace-pre-wrap')) {
            let innerHtml = element.querySelector(".whitespace-pre-wrap").innerHTML;
            content += `${element.querySelectorAll('img').length > 1 ? `**You:**` : `**ChatGPT:**`}<br><br><br>${innerHtml}<br>------------------<br>`
        }
    }

    if (content.trim() === "") {
        alert("Nothing found");
        return;
    }


    // Create a new printable HTML
    function createPrintableHtml(content) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    @media print {
                        body {
                            font-size: 12pt;
                        }
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;
    }
    const printableHtml = createPrintableHtml(content);

    // Create a new hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Set up a listener for the iframe load event
    iframe.onload = function() {
        // Invoke the print functionality of the browser
        try {
            iframe.contentWindow.print();
        } catch (error) {
            console.error('Printing failed:', error);
        }

        // Remove the hidden iframe after a short delay
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 100);
    };

    // Write the printable HTML to the iframe
    iframe.contentDocument.write(printableHtml);
    iframe.contentDocument.close();
}



// Function to save text to chatData as Markdown
async function saveAsMarkdown(checked) {

    // Function to convert HTML to Markdown
function htmlToMarkdown(html) {
    let markdown = html;
    markdown = markdown.replace(/<\/?div[^>]*>/g, '');
    markdown = markdown.replace(/<br[^>]*>/g, '\n');

    markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
    markdown = markdown.replace(/<u>(.*?)<\/u>/g, '__$1__');
    markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`');
    markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');
    markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n');
    markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
    markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
    markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n');
    markdown = markdown.replace(/<h5>(.*?)<\/h5>/g, '##### $1\n');
    markdown = markdown.replace(/<h6>(.*?)<\/h6>/g, '###### $1\n');
    markdown = markdown.replace(/<code class="[^"]*">/g, '\n'); // remove code tags
    markdown = markdown.replace(/<\/code>/g, ''); // remove pre tags
    markdown = markdown.replace(/<pre><span class="">(.*?)<\/span>/g, '<pre>$1\n'); // remove language tag portion
    markdown = markdown.replace(/<pre>/g, '```'); // replace pre tags with code blocks
    markdown = markdown.replace(/<\/pre>/g, '\n```\n'); // replace pre tags with code blocks
    markdown = markdown.replace(/<button class="flex ml-auto gap-2">(.*?)<\/button>/g, ''); // Remove copy button SVG
    markdown = markdown.replace(/<span(?: class="[^"]*")?>|<\/span>/g, ''); // Remove span tags with or without a class
    markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n');
    markdown = markdown.replace(/<span class="" data-state="closed">.*Copy code<\/button>/g, ''); // Remove the "Copy" button

    // Add these lines to convert &lt; and &gt; to < and >, respectively
    markdown = markdown.replace(/&lt;/g, '<');
    markdown = markdown.replace(/&gt;/g, '>');

    const unorderedRegex = /<ul>(.*?)<\/ul>/gs;
    let match;
    let indent = 0;
    while ((match = unorderedRegex.exec(markdown))) {
        const list = match[1];
        const items = list.split('<li>');
        let itemStr = '';
        items.forEach((item, i) => {
            if (i === 0) return;
            item = item.replace('</li>', '');
            if (item.indexOf('<ul>') !== -1) {
                indent++;
            }
            itemStr += `${'  '.repeat(indent)}* ${item}`;
            if (item.indexOf('</ul>') !== -1) {
                indent--;
            }
        });
        markdown = markdown.replace(match[0], `${itemStr}`);
    }

    const orderedRegex = /<ol.*?>(.*?)<\/ol>/gs;
    const orderedLists = markdown.match(orderedRegex);
    if (orderedLists) {
        orderedLists.forEach((orderedList) => {
            let mdOrderedList = '\n';
            const listItems = orderedList.match(/<li.*?>(.*?)<\/li>/g);
            if (listItems) {
                listItems.forEach((listItem, index) => {
                    if (listItem.indexOf('<ul>') !== -1) {
                        indent++;
                    }
                    mdOrderedList += `${'  '.repeat(indent)}${index + 1
                        }. ${listItem.replace(/<li.*?>(.*?)<\/li>/g, '$1\n')}`;
                    if (listItem.indexOf('</ul>') !== -1) {
                        indent--;
                    }
                });
            }
            mdOrderedList += '\n'; // New line added after the list ends
            markdown = markdown.replace(orderedList, mdOrderedList);
        });
    }

    markdown = markdown.replace(/<ul>(.*?)<\/ul>/gs, function (match, p1) {
        return (
            '\n' +
            p1.replace(/<li>(.*?)<\/li>/g, function (match, p2) {
                return '\n- ' + p2;
            })
        );
    });
    const tableRegex = /<table>.*?<\/table>/g;
    const tableRowRegex = /<tr>.*?<\/tr>/g;
    const tableHeaderRegex = /<th.*?>(.*?)<\/th>/g;
    const tableDataRegex = /<td.*?>(.*?)<\/td>/g;

    const tables = html.match(tableRegex);
    if (tables) {
        tables.forEach((table) => {
            let markdownTable = '\n';
            const rows = table.match(tableRowRegex);
            if (rows) {
                rows.forEach((row) => {
                    let markdownRow = '\n';
                    const headers = row.match(tableHeaderRegex);
                    if (headers) {
                        headers.forEach((header) => {
                            markdownRow += `| ${header.replace(tableHeaderRegex, '$1')} `;
                        });
                        markdownRow += '|\n';
                        markdownRow += '| --- '.repeat(headers.length) + '|';
                    }
                    const data = row.match(tableDataRegex);
                    if (data) {
                        data.forEach((d) => {
                            markdownRow += `| ${d.replace(tableDataRegex, '$1')} `;
                        });
                        markdownRow += '|';
                    }
                    markdownTable += markdownRow;
                });
            }
            markdown = markdown.replace(table, markdownTable);
        });
    }
    return markdown;
}


    let element = document.querySelector(".text-base");
    if (!element || element.innerText === undefined) {
        alert("Nothing found");
        return;
    }
    const elements = document.querySelectorAll(".text-base.group");
    let chatData = "";
    for (const element of elements) {
        if (element.querySelector('.whitespace-pre-wrap')) {
            const isAgent = element.querySelectorAll('.agent-turn').length > 0;
            // If is not the agent and i dont want my input to be included, skip
            if (!isAgent && !checked) {
                continue;
            }
            let innerHTML = element.querySelector(".whitespace-pre-wrap").innerHTML;
            if (checked) {
                chatData += htmlToMarkdown(isAgent ? '**ChatGPT:**\n' : '**Me:**\n');
            }
            chatData += `${htmlToMarkdown(innerHTML)}\n\n------------------\n\n`;
        }
    }
    const name = `ChatGPT ${document.querySelector('.bg-token-surface-secondary.group').innerText}.md`
    let handle = await window.showSaveFilePicker({ suggestedName: name });
    let stream = await handle.createWritable();
    await stream.write(chatData);
    await stream.close();
}




// function to copy the text to clipboard
async function copyToClipboard() {
    const elements = document.querySelectorAll(".text-gray-800");
    let chatData = "";
    for (const element of elements) {
        if (element.querySelector('.whitespace-pre-wrap')) {
            let innerText = element.querySelector(".whitespace-pre-wrap").innerText;
            chatData += `${element.querySelectorAll('img').length > 1 ? '**You:**' : '**ChatGPT:**'}\n\n\n${innerText}\n\n------------------\n\n`;
        }
    }

    if (!chatData || chatData === "") {
        return { success: false };
    }

    // Create a textarea element, copy the text, and remove the textarea
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.value = chatData;
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return { success: true };
}