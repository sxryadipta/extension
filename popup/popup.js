// this part shows the title of the problem in the popup.
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: "GET_TITLE" }, (response) => {
    if (response?.title) {
      document.getElementById("problem-name").innerText = response.title;
    } else {
      document.getElementById("problem-name").innerText = "Could not fetch title.";
    }
  });
});

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
  const url = `https://api.github.com/users/${username}/repos`;

  try {
    repoSelect.innerHTML = '<option value="">Loading...</option>';

    const { pat } = await chrome.storage.local.get("pat"); // 👈 retrieve PAT from storage

    if (!pat) {
      alert('No PAT found. Please set your GitHub token first.');
      repoSelect.innerHTML = '<option value="">No PAT set</option>';
      return;
    }

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${pat}`,  // 👈 use PAT from storage
        "Accept": "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      throw new Error('User not found or API limit reached');
    }

    const repos = await response.json();

    repoSelect.innerHTML = '<option value="">-- Select a Repo --</option>';

    if (repos.length === 0) {
      repoSelect.innerHTML = '<option value="">No public repos found</option>';
      return;
    }

    repos.forEach(repo => {
      const option = document.createElement('option');
      option.value = repo.name;       // 👈 store repo NAME not URL (needed for API calls later)
      option.textContent = repo.name;
      repoSelect.appendChild(option);
    });

  } catch (error) {
    alert(error.message);
    repoSelect.innerHTML = '<option value="">Error loading repos</option>';
  }
}