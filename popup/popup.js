
// this part shows the title of the problem in the popup.
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: "GET_TITLE" }, (response) => {
    if (chrome.runtime.lastError) return;
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

fetchBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (!username) {
    alert('Please enter a valid username');
    return;
  }
  fetchRepositories(username);
});

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

    if (!response.ok) throw new Error('User not found or API limit reached');

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

repoSelect.addEventListener('change', () => {
  chrome.storage.local.set({
    owner: usernameInput.value.trim(),
    repo: repoSelect.value
  });
});

const syncBtn = document.getElementById('syncBtn');
const syncStatus = document.getElementById('sync-status');

syncBtn.addEventListener('click', async () => {
  console.log("SYNC CLICKED");
  const { pat, owner, repo } = await chrome.storage.local.get(["pat", "owner", "repo"]);
  console.log("PAT:", pat, "OWNER:", owner, "REPO", repo);

  if (!pat || !owner || !repo) {
    syncStatus.innerText = "❌ Missing PAT, username or repo.";
    return;
  }

  syncStatus.innerText = "Syncing...";

  const sendMessage = (type) => new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type }, (response) => {
        if (chrome.runtime.lastError) resolve(null);
        else resolve(response);
      });
    });
    if (type === "GET_CODE") setTimeout(() => resolve(null), 3000)
  });

  const titleRes = await sendMessage("GET_TITLE");
  console.log("titleRes:", titleRes);

  const descRes = await sendMessage("GET_DESCRIPTION");
  console.log("descRes:", descRes);

  const codeRes = await sendMessage("GET_CODE");
  console.log("codeRes:", codeRes);

  console.log({ titleRes, descRes, codeRes });

  const title = titleRes?.title;
  const description = descRes?.description;
  const code = codeRes?.code;
  const lang = codeRes?.lang;

  if (!title || !description || !code) {
    syncStatus.innerText = "❌ Could not fetch problem data.";
    return;
  }

  const folderName = title.toLowerCase().replace(/ /g, "-");
  const mdPath = `solutions/${folderName}/Problem.md`;
  const langExtensions = { "C++": "cpp", "Python3": "py", "Python": "py", "Java": "java", "JavaScript": "js" };
  const ext = langExtensions[lang] || "txt";
  const codePath = `solutions/${folderName}/Solution.${ext}`;

  try {
    await pushFile(pat, owner, repo, mdPath, description, `add: ${title} problem`);
    await pushFile(pat, owner, repo, codePath, code, `add: ${title} solution`);
    syncStatus.innerText = "✅ Pushed successfully!";
  } catch (error) {
    syncStatus.innerText = `❌ ${error.message}`;
  }
});



async function pushFile(pat, owner, repo, path, content, commitMessage) {
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
    content: btoa(unescape(encodeURIComponent(content)))
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
