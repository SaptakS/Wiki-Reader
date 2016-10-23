//var CHUNK_SIZE = 125;
var DEFAULT_CHUNK_SIZE = 125;
var US_CHUNK_SIZE = 1024;

function parsePhase0(s) {
	var out = "";
        s = s.replace(/\u00AD/g, '-');

	// Convert currency like "$1,000" to "$1000"
	for(var i = 0; i < s.length; i++) {
		var ch = s.charAt(i);
		if(ch == ',' && i > 0 && (i+1) < s.length) {
			// If we are "surrounded" by numbers, simply remove the commas....
			var prevChar = s.charAt(i-1);
			var nextChar = s.charAt(i+1);
			out += ch;
		} else if(false) {
		} else {
			out += ch;
		}
	}
	return out;
}

function parsePhase1(s) {
	var out = "";

	// Take out URLs
	var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	out = s.replace(urlRegex, "{LINK}");

	return out;
}

function getChunkSize() {
	var cs = DEFAULT_CHUNK_SIZE;
	var selectedVoice = 'Google US English';
	if(selectedVoice == 'native') {
		cs = US_CHUNK_SIZE;
	}
	return cs;
}

function getChunks(s) {
	// First pass, convert/handle commas around currency, and various special characters
	s = parsePhase0(s);

	// Second pass, take out URLs, etc
	s = parsePhase1(s);

	// Chunk up the data
	var chunkList = [];
	chunkList = chunker(s, getChunkSize());
	return chunkList;
}

function chunker(s, max) {
	var chunks = [];
	var l = [];
	//l = s.split(/\.\s+|\n|,/);  // Split on: (period, comma, carriage-return)
	l = s.split(/\n/);  // Split on <CR>
	for(var i = 0; i < l.length; i++) {
		var chunk = l[i];
		if(chunk == '') {
	    	continue;
	  }
	  var siz = chunk.length;
	  if(siz <= max) {
	  	chunks.push(chunk);
	  } else {
	  	while(chunk.length > 0) {
	  		var smallerChunk = subChunker(chunk, max);
	  		chunks.push(smallerChunk);
	  		chunk = chunk.substr(smallerChunk.length);
	  	}
	  }
	}
	return chunks;
}

function subChunker(s, max) {
	var chunk = s.substr(0, max);

	if(chunk.charAt(max) == ' ') {  // Lucky...
		return chunk;
	}

	// Start 'rewinding' until a space is found{hopefully}
	for(var i = chunk.length; i > 0; i--) {
		if(chunk.charAt(i) == ' ') {	// Stop!
			return chunk.substr(0, i);
		}
	}

	// No space found-- last resort have to cut in mid-word
	return chunk;
}

function initSpeech() {
	var msg = new SpeechSynthesisUtterance('');
	window.speechSynthesis.cancel(); // Cancel previous

	var smsg = '';
	if('speechSynthesis' in window) {
		smsg = "Your browser <strong>supports</strong> speech synthesis.";
	} else {
    smsg = 'Sorry your browser <strong>does not support</strong> speech synthesis.<br>Try this in <a href="http://www.google.co.uk/intl/en/chrome/browser/canary.html">Chrome Canary</a>.';
	}
	return false;
}

function doTTS(read_content) {
	//starting for the text to speech conversion using web speech api
	var t = read_content.toLowerCase();	
	var chunkList = getChunks(read_content);
	chunkList.forEach(function(chunk) {
		doSpeak(chunk);
	});

	console.log('Reading Complete.');

	return false;
}

function doSpeak(s) {
	var selectedVoice = 'Google UK English Female';
	var msg = new SpeechSynthesisUtterance();

	// If the user had selected a voice, use it...
  	if(selectedVoice) {
		msg.voice = window.speechSynthesis.getVoices().filter(function(voice) {
	  		return voice.name == selectedVoice;
	  	})[0];
	}

	msg.rate = 1; // 0.1 to 10
	msg.pitch = 1; // 0 to 2
	msg.text = s;

	// Now speak...
	window.speechSynthesis.speak(msg);
	return false;
}


function initMain() {
	// Starting function
	if (localStorage.state == 'speaking') {
		localStorage.state = 'stopped';
		window.speechSynthesis.cancel();
	} else {
		localStorage.state = 'speaking';
		window.speechSynthesis.getVoices();
		var readable_text = initParagraphParsing();
		console.log(readable_text);
		doTTS(readable_text);
	}
}

function initParagraphParsing() {
	console.log('Parsing Paragraphs');

	/* The entire content of a Wikipedia page is written inside mw-content-text id.
	   We extract the content inside the paragraphs within this id. */
	var mw_content_text = document.getElementById('mw-content-text');
	var main_content_paragraphs = mw_content_text.getElementsByTagName('p');
	var cleaned_content = '';
	for (var i = 0; i < main_content_paragraphs.length; i++) {
		//Loop over every paragraph element inside the id and clean them.
		var paragraph_content = main_content_paragraphs[i].innerHTML;
		//console.log(paragraph_content);
		cleaned_content += cleanContent(main_content_paragraphs[i]);
		//console.log(cleaned_content);
	}
	return cleaned_content.toLowerCase();
}

function cleanContent(content) {
	//Clean paragraph content and make it ready to read.
	var cleanedHTML = cleanHTMLTag(content);
	var cleanedRef = cleanRefs(cleanedHTML);
	return cleanedRef;
}

function cleanHTMLTag(html_elements) {
	//Cleaning HTML tags from the content inside the paragraph
	return html_elements.textContent || html_elements.innerText || "";
}

function cleanRefs(cleaned_html) {
	/*In Wikipedia we have reference numbers to external contents. 
	We need to clean the content from that.*/
	return cleaned_html.replace(/\[\d+\]/gi, '');
}

initMain();
//doTTS('Hello World');