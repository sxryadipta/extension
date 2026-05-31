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

    const { pat } = await chrome.storage.local.get("pat"); 

    if (!pat) {
      alert('No PAT found. Please set your GitHub token first.');
      repoSelect.innerHTML = '<option value="">No PAT set</option>';
      return;
    }

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${pat}`,  
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
      option.value = repo.name;       
      option.textContent = repo.name;
      repoSelect.appendChild(option);
    });

  } catch (error) {
    alert(error.message);
    repoSelect.innerHTML = '<option value="">Error loading repos</option>';
  }
}

// this code stores the username and repository selected.

repoSelect.addEventListener('change', () => {
  chrome.storage.local.set({ 
    owner: usernameInput.value.trim(),
    repo: repoSelect.value 
  });
});




// this is the code for saving the files in the selected repo.


chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0].url.includes("leetcode.com/problems/")) {
    console.log("Not a LeetCode problem page");
    return;
  }


  chrome.tabs.sendMessage(tabs[0].id, { type: "GET_DESCRIPTION" }, (response) => {
    if (chrome.runtime.lastError) {
      console.log("Content script not ready:", chrome.runtime.lastError.message);
      return;
    }
    console.log(response.description);
  });
});


const syncBtn = document.getElementById('syncBtn');
const syncStatus = document.getElementById('sync-status');

syncBtn.addEventListener('click', async () => {
  const { pat, owner, repo } = await chrome.storage.local.get(["pat", "owner", "repo"]);

  if (!pat || !owner || !repo) {
    syncStatus.innerText = "❌ Missing PAT, username or repo.";
    return;
  }

  syncStatus.innerText = "Syncing...";

  // getting title and description from content script
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: "GET_TITLE" }, async (titleRes) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: "GET_DESCRIPTION" }, async (descRes) => {

        const title = titleRes?.title;
        const description = descRes?.description;

        if (!title || !description) {
          syncStatus.innerText = "❌ Could not fetch problem data.";
          return;
        }

        const folderName = title.toLowerCase().replace(/ /g, "-"); // e.g. "1. Two Sum" → "1.-two-sum"
        const mdPath = `solutions/${folderName}/Problem.md`;

        try {
          await pushFile(pat, owner, repo, mdPath, description, `add: ${title} problem`);
          syncStatus.innerText = "✅ Pushed successfully!";
        } catch (error) {
          syncStatus.innerText = `❌ ${error.message}`;
        }

      });
    });
  });
});

async function pushFile(pat, owner, repo, path, content, commitMessage) {
  // check if file exists to get sha
  const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: {
      "Authorization": `Bearer ${pat}`,
      "Accept": "application/vnd.github+json"
    }
  });

  let sha = undefined;
  if (checkRes.ok) {
    const checkData = await checkRes.json();
    sha = checkData.sha;
  }

  const body = {
    message: commitMessage,
    content: btoa(unescape(encodeURIComponent(content))) // handles special characters
  };
  if (sha) body.sha = sha;

  const pushRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${pat}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!pushRes.ok) {
    const err = await pushRes.json();
    throw new Error(err.message);
  }
}