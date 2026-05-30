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


//this code syncs a hardcoded file to selected repo.

const syncBtn = document.getElementById('syncBtn');
const syncStatus = document.getElementById('sync-status');

syncBtn.addEventListener('click', async () => {
  const { pat, owner, repo } = await chrome.storage.local.get(["pat", "owner", "repo"]);

  if (!pat || !owner || !repo) {
    syncStatus.innerText = "❌ Missing PAT, username or repo.";
    return;
  }

  const path = "solutions/test.md";           
  const fileContent = "# Test\n\nThis is a test file."; 

  syncStatus.innerText = "Syncing...";

  try {
    // Step 1 — check if file already exists to get sha
    const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        "Authorization": `Bearer ${pat}`,
        "Accept": "application/vnd.github+json"
      }
    });

    let sha = undefined;
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      sha = checkData.sha; // needed if updating existing file
    }

    // Step 2 — push the file
    const body = {
      message: "test: push from GitSync",
      content: btoa(fileContent)  // must be base64 encoded
    };
    if (sha) body.sha = sha;      // include sha only if file already exists

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

    syncStatus.innerText = "✅ Pushed successfully!";

  } catch (error) {
    syncStatus.innerText = `❌ ${error.message}`;
  }
});