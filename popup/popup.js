//this part shows the title of the problem in the popup.
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: "GET_TITLE" }, (response) => {
    if (response?.title) {
      document.getElementById("problem-name").innerText = response.title;
    } else {
      document.getElementById("problem-name").innerText = "Could not fetch title.";
    }
  });
});



// this part is for the github username and repository fetching from input.

// selecting the DOM elements
const usernameInput = document.getElementById('usernameInput');
const fetchBtn = document.getElementById('fetchBtn');
const repoSelect = document.getElementById('repoSelect');

// adding click event listener to the button
fetchBtn.addEventListener('click', () => {
const username = usernameInput.value.trim();

if (!username) {
    alert('Please enter a valid username');
    return;
}

fetchRepositories(username);
});

// fetching data from GitHub API and populate dropdown
async function fetchRepositories(username) {
const url = `https://github.com{username}/repos`;

try {
    repoSelect.innerHTML = '<option value="">Loading...</option>';

    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error('User not found or API limit reached');
    }

    const repos = await response.json();

    // Clear loading text
    repoSelect.innerHTML = '<option value="">-- Select a Repo --</option>';

    // Check if user has public repos
    if (repos.length === 0) {
        repoSelect.innerHTML = '<option value="">No public repos found</option>';
        return;
    }

    // Loop through repos and add them to the select element
    repos.forEach(repo => {
        const option = document.createElement('option');
        option.value = repo.html_url; // Stores repo URL as the value
        option.textContent = repo.name; // Displays repo name to the user
        repoSelect.appendChild(option);
    });

} catch (error) {
    alert(error.message);
    repoSelect.innerHTML = '<option value="">Error loading repos</option>';
}
}
