function wrapWithAbbr(node, response) {
	var last = response[response.length - 1];
	var lastIsString = (typeof last === "string");
	var end = response.length;
	if (lastIsString) {
		end--; // Reuse existing element in this case
	}
	for (var i = 0; i < end; i++) {
		var n;
		var item = response[i];
		if (typeof item === "string") {
			n = document.createTextNode(item);
		} else {
			n = document.createElement("abbr");
			n.title = item.title;
			n.textContent = item.text;
			n.style.borderBottom = "1px dotted";
		}
		node.parentElement.insertBefore(n, node);
	}
	if (lastIsString) {
		node.data = last;
	} else {
		node.remove();
	}
}

function processNextNode(section, walker) {
	var node = walker.nextNode();
  if (node) {
  	chrome.runtime.sendMessage({operation: "decronymize", section: section, text: node.data}, function(response) {
			if (response) {
				wrapWithAbbr(node, response);
			}
			processNextNode(section, walker);
		});
  }
}

function isNodeOfInterest(node) {
	return node.parentElement.tagName == 'P' ||
	       node.parentElement.tagName == 'A';
}

function processTree(section, root) {
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: isNodeOfInterest }, false);
  processNextNode(section, walker);
}

function decronymizeElement(section, element) {
	chrome.runtime.sendMessage({operation: "isSupported", section: section}, function(response) {
		if (response.isSupported) {
			processTree(section, element);	
		}
	});
}

var sectionRe = new RegExp("^https?://www.reddit.com/r/([^/]+)/");
var match = sectionRe.exec(document.URL);
if (match) {
	decronymizeElement(match[1], document);
}
