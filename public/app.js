const analyzeForm = document.getElementById('analyze-form');
const compareForm = document.getElementById('compare-form');
const statusBar = document.getElementById('status-bar');
const resultSection = document.getElementById('result-section');
const compareSection = document.getElementById('compare-section');
const profileResult = document.getElementById('profile-result');
const compareResult = document.getElementById('compare-result');

function setStatus(message, type = 'info') {
  statusBar.textContent = message;
  statusBar.classList.remove('success', 'error');
  if (type === 'success') statusBar.classList.add('success');
  if (type === 'error') statusBar.classList.add('error');
}

function formatNumber(value) {
  return value === null || value === undefined ? '-' : value.toLocaleString();
}

function createProfileCard(profile) {
  const card = document.createElement('div');
  card.className = 'profile-card';

  const header = document.createElement('header');
  header.innerHTML = `
    <img src="${profile.avatar_url}" alt="${profile.username} avatar" />
    <div>
      <h3><a href="${profile.html_url}" target="_blank">${profile.name || profile.username}</a></h3>
      <p>${profile.bio || 'No bio available.'}</p>
      <p><strong>Username:</strong> ${profile.username}</p>
    </div>
  `;

  const metrics = document.createElement('div');
  metrics.className = 'profile-meta';
  metrics.innerHTML = `
    <span><strong>Followers</strong><strong>${formatNumber(profile.followers)}</strong></span>
    <span><strong>Following</strong><strong>${formatNumber(profile.following)}</strong></span>
    <span><strong>Public repos</strong><strong>${formatNumber(profile.public_repos)}</strong></span>
    <span><strong>Profile score</strong><strong>${profile.profile_score?.toFixed(1) || '-'}</strong></span>
    <span><strong>Trending score</strong><strong>${profile.trending_score?.toFixed(1) || '-'}</strong></span>
    <span><strong>Most used language</strong><strong>${profile.most_used_language || 'N/A'}</strong></span>
  `;

  const repoTitle = document.createElement('h3');
  repoTitle.textContent = 'Top repositories';

  const repoList = document.createElement('div');
  repoList.className = 'repo-list';
  const repos = profile.top_repositories || [];
  if (repos.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No top repositories available yet.';
    repoList.appendChild(empty);
  } else {
    repos.slice(0, 5).forEach((repo) => {
      const item = document.createElement('div');
      item.className = 'repo-item';
      item.innerHTML = `
        <a href="${repo.html_url}" target="_blank"><strong>${repo.name}</strong></a>
        <p>${repo.description || 'No description provided.'}</p>
        <p><strong>Language:</strong> ${repo.language || 'N/A'} · <strong>⭐</strong> ${repo.stars || 0} · <strong>🍴</strong> ${repo.forks || 0}</p>
      `;
      repoList.appendChild(item);
    });
  }

  card.appendChild(header);
  card.appendChild(metrics);
  card.appendChild(repoTitle);
  card.appendChild(repoList);
  return card;
}

function createCompareCard(comparison) {
  const card = document.createElement('div');
  card.className = 'compare-card-result';

  const winner = comparison.winner?.username ? `Overall Winner: ${comparison.winner.username}` : 'No overall winner determined';
  card.innerHTML = `
    <h3>${winner}</h3>
    <p>Comparison metrics are based on the highest profile score and selected GitHub profile statistics.</p>
  `;

  const metricList = document.createElement('ul');
  metricList.className = 'compare-metrics';

  Object.entries(comparison.metrics || {}).forEach(([metric, data]) => {
    const item = document.createElement('li');
    const rows = data.values
      .map((value) => `<div>${value.username}: <strong>${formatNumber(value.value)}</strong></div>`)
      .join('');
    item.innerHTML = `<strong>${metric.replace(/_/g, ' ')}</strong>${rows}`;
    metricList.appendChild(item);
  });

  card.appendChild(metricList);
  return card;
}

async function fetchApi(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Unexpected API response');
  }
  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.message || 'API error');
  }
  return payload.data;
}

analyzeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  if (!username) return;

  setStatus('Analyzing profile…', 'info');
  resultSection.classList.add('hidden');
  compareSection.classList.add('hidden');

  try {
    const profile = await fetchApi(`/api/github/analyze/${encodeURIComponent(username)}`);
    profileResult.innerHTML = '';
    profileResult.appendChild(createProfileCard(profile));
    resultSection.classList.remove('hidden');
    setStatus(`Profile for ${profile.username} loaded successfully.`, 'success');
  } catch (error) {
    setStatus(error.message || 'Failed to analyze profile.', 'error');
  }
});

compareForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const raw = document.getElementById('compare-users').value.trim();
  if (!raw) return;

  setStatus('Comparing profiles…', 'info');
  resultSection.classList.add('hidden');
  compareSection.classList.add('hidden');

  try {
    const users = raw.split(',').map((value) => value.trim()).filter(Boolean);
    if (users.length < 2) {
      throw new Error('Enter at least two usernames separated by commas.');
    }
    const params = new URLSearchParams({ users: users.join(',') });
    const comparison = await fetchApi(`/api/github/compare?${params.toString()}`);
    compareResult.innerHTML = '';
    compareResult.appendChild(createCompareCard(comparison));
    compareSection.classList.remove('hidden');
    setStatus(`Comparison completed for ${users.length} profiles.`, 'success');
  } catch (error) {
    setStatus(error.message || 'Failed to compare profiles.', 'error');
  }
});
