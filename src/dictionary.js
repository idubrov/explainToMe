var decronymAPI = "http://www.decronym.xyz/acronyms/?section?.json";
var tries = {};

// Aho-Corasick trie construction
function buildTrie(dictionary) {
	var trie = { links: {} };
	for (var word in dictionary) {
  	if (dictionary.hasOwnProperty(word)) {
	    trieInsert(trie, word, dictionary[word]);
	  }
	}

	trieBuildSuffixes(trie, trie);
	return trie;
}

function trieInsert(trie, word, title) {
	var node = trie;
	for (var i = 0, len = word.length; i < len; i++) {
  	var parent = node;
  	var c = word[i];
  	if (!node.links[c]) {
  		node.links[c] = { links: {} };
  	}
  	node = node.links[c];
	}
	node.length = word.length;
  node.title = title;
}

function trieBuildSuffixes(root, node) {
	for (var c in node.links) {
  	if (node.links.hasOwnProperty(c)) {
      var child = node.links[c];

      var suffix = node.suffixLink;
      while (!!suffix && !suffix.links[c]) {
        suffix = suffix.suffixLink;
      }

      child.suffixLink = !suffix ? root : suffix.links[c];
      trieBuildSuffixes(root, child);
  	}
  }
}

function isWordTerminator(c) {
	return c == ' ' ||
				 c == ',' ||
				 c == '/' ||
				 c == ';' ||
				 c == ':' ||
				 c == '(' ||
				 c == ')' ||
				 c == '.' ||
				 c == '!' ||
				 c == '?' ||
				 c == '\'';
}

// Aho-Corasick search
function decronymizeText(trie, text) {
	var result = [];
	var start = 0;
	var current = trie;
	for (var i = 0, len = text.length; i < len; i++) {
		var c = text[i];
		while (!!current && !current.links[c]) {
        current = current.suffixLink;
    }
    if (!current) {
        current = trie;
    } else {
        current = current.links[c];
    }
    if (!!current.title && (i + 1 >= len || isWordTerminator(text[i + 1]))) {
    	var wordStart = i - current.length + 1;
    	if (start < wordStart) {
    		result.push(text.substring(start, wordStart));
    	}
    	result.push({text: text.substring(wordStart, i + 1), title: current.title});
    	start = i + 1;

    	// Reset, we don't allow overlapped words
    	current = trie;
    }
	}
	if (start == 0) {
		return null;
	}
	result.push(text.substring(start));
	return result;
}

// Loading dictionary from the decronym.xyz
function requestDictionary(section, callback) {
	var xhr = new XMLHttpRequest();
	xhr.responseType = "json";
	xhr.onreadystatechange = function() {
		if (xhr.readyState == xhr.DONE && xhr.status == 200) {
      callback(xhr.response);
    }
	};
	xhr.open("GET", decronymAPI.replace('?section?', section), true);
	xhr.send();
}

// (Re-)building trie for the given section
function loadTrie(section, callback) {
	section = section.toLowerCase();
	if (tries[section]) {
		// FIXME: check up-to-date!
		callback(tries[section]);
		return;
	}

	// FIXME: Load from the storage
	requestDictionary(section, function(dictionary) {
		if (dictionary) {
			tries[section] = buildTrie(dictionary);
			callback(tries[section]);
		} else {
			callback(false);
		}
	});
}

if (chrome.runtime && chrome.runtime.onMessage) {
	chrome.runtime.onMessage.addListener(
	  function(request, sender, sendResponse) {
	  	if (request.operation == "isSupported") {
	  		loadTrie(request.section, function(trie) {
	  			sendResponse({section: request.section, isSupported: !!trie});
	  		});
	  	} else if (request.operation == "decronymize") {
	  		loadTrie(request.section, function(trie) {
	  			sendResponse(decronymizeText(trie, request.text));
	  		});
	  	}
	  	return true;
  	}
  );
}
