let mediaRecorder;
let audioChunks = [];
let audioQueryResponse;
let speechSynthesisUtterance;


function speakText(text) {
    var voices = speechSynthesis.getVoices();
    speechSynthesisUtterance = new SpeechSynthesisUtterance(text);
    speechSynthesisUtterance.default = false;
    speechSynthesisUtterance.localservice = true;
    speechSynthesisUtterance.lang = "en-GB";
    speechSynthesis.speak(speechSynthesisUtterance);
}

async function startRecording() {
    // audioElement.play();
    stopSong();
    document.querySelector(".start").style.display = 'none'
    document.querySelector(".stop").style.display = 'flex';
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        const audioFile = new File([audioBlob], "recording.mp3", { type: 'audio/mp3' });

        const formData = new FormData();
        formData.append('audio', audioFile);

        uploadAudio(formData);
    };

    mediaRecorder.start();


    recordButton.disabled = true;
    recordButton.classList.add('active');
    stopButton.disabled = false;


}

function stopRecording() {
    document.querySelector(".start").style.display = 'flex'
    document.querySelector(".stop").style.display = 'none';
    mediaRecorder.stop();

    const recordButton = document.querySelector('.record-button');
    const stopButton = document.querySelector('.stop-button');

    recordButton.disabled = false;
    recordButton.classList.remove('active');
    stopButton.disabled = true;

}

let audioElement;
let song_image = 'https://c.saavncdn.com/601/Pushpa-Pushpa-From-Pushpa-2-The-Rule-Telugu-Telugu-2024-20240501161044-500x500.jpg';

        async function containsSongAndCallAPI(str) {
            const apiUrl = `https://luna-music-ai.vercel.app/api/search/songs?query=${str}`;

            try {
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data.results.length > 0) {
                        // Extract the URL of the song with the desired quality (320kbps)
                        const song = data.data.results[0];
                        song_image = song.image.find(urlObj => urlObj.quality === '500x500').url;
                        const songUrl = song.downloadUrl.find(urlObj => urlObj.quality === '320kbps').url;
                        
                        // Create an audio element and append it to the body
                        // if (audioElement) {
                        //     // Stop the current audio if one is playing
                        //     audioElement.pause();
                        //     audioElement.remove();
                        // }
                        // audioElement = document.createElement('audio');
                        // audioElement.controls = true;
                        // audioElement.src = songUrl;
                        // document.body.appendChild(audioElement);
                        // audioElement.play();  
                        const variable_image = document.getElementById('song_image');
                        variable_image.src = song_image;
                        const videoElement = document.getElementById('myVideo');
                        videoElement.src = songUrl;
                        videoElement.load();
                        const video_display = document.getElementById('myVideodiv');
                        video_display.style.display = 'flex';
                        
                    } else {
                        console.log("No songs found or API returned no results.");
                        speakText("No songs found");
                    }
                } else {
                    console.error("API Error:", response.statusText);
                }
            } catch (error) {
                console.error("Fetch Error:", error);
            }
        }

function containsKeywords(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
}

function removeKeywords(text, keywords) {
    keywords.forEach(keyword => {
        text = text.replace(new RegExp(keyword, 'gi'), '');
    });
    return text;
}

function stopSong() {
    const videoElement = document.getElementById('myVideo');
    videoElement.src = "";
    videoElement.load();
    const video_display = document.getElementById('myVideodiv');
    video_display.style.display = 'none';
}
async function uploadAudio(formData) {
    try {
        const response = await fetch('https://luna-voice.vercel.app/transcribe', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        const responseText = result.response;
        // speakText(responseText);
        const keywords = ["song", "Song", "Playing", "playing", "sung by", "Sung By", "Namaskaram."];
        // Display the response
        const messageElement = document.createElement('p');
        messageElement.className = 'user';
        document.querySelector('.messages').appendChild(messageElement);
        //messageElement.innerText = responseText;
        //document.querySelector('.messages').innerText = responseText;
        audioQueryResponse = responseText;

        // Speak out the response
        speakText(responseText);
        // Type the response along with the audio
        speechSynthesisUtterance.onstart = () => {
            typeWriteResponseText();
        }
        if (containsKeywords(responseText, keywords)) {
            console.log(responseText);
            const cleanedResponseText = removeKeywords(responseText, keywords);
            // Play the song only after the audio response is spoken out completely
            speechSynthesisUtterance.onend = () => {
                containsSongAndCallAPI(cleanedResponseText);
            }
        }
    } catch (error) {
        const errorElement = document.createElement('p');
        errorElement.className = 'user';
        errorElement.innerText = `Error: ${error.message}`;
        document.querySelector('.messages').appendChild(errorElement);
    } finally {
        // Clear audio chunks and reset form after upload
        audioChunks = [];
    }
}

let index = 0;
function typeWriteResponseText() {
  if (index < audioQueryResponse.length) {
    document.querySelector('.messages').innerHTML +=
      audioQueryResponse.charAt(index);
    index++;
  }
  setTimeout(typeWriteResponseText, 120);
}