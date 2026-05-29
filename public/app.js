// DOM Elements
const navHome = document.getElementById('nav-home');
const navCompare = document.getElementById('nav-compare');
const viewDashboard = document.getElementById('view-dashboard');
const viewCompare = document.getElementById('view-compare');

const analyzeForm = document.getElementById('analyze-form');
const compareForm = document.getElementById('compare-form');
const usernameInput = document.getElementById('username');
const compareInput = document.getElementById('compare-users');

const statusMessage = document.getElementById('status-message');
const profileContainer = document.getElementById('profile-result-container');
const compareContainer = document.getElementById('compare-result-container');

// Navigation Logic
function switchView(view) {
  if (view === 'home') {
    navHome.classList.add('active');
    navCompare.classList.remove('active');
    viewDashboard.classList.remove('hidden');
    viewCompare.classList.add('hidden');
    statusMessage.classList.add('hidden');
  } else {
    navCompare.classList.add('active');
    navHome.classList.remove('active');
    viewCompare.classList.remove('hidden');
    viewDashboard.classList.add('hidden');
    statusMessage.classList.add('hidden');
  }
}

navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
navCompare.addEventListener('click', (e) => { e.preventDefault(); switchView('compare'); });

// Helpers
function setStatus(msg, type = 'info') {
  if (!msg) {
    statusMessage.classList.add('hidden');
    return;
  }
  statusMessage.className = `status-message ${type}`;
  let icon = 'info';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'warning-circle';
  statusMessage.innerHTML = `<i class="ph-fill ph-${icon}"></i> <span>${msg}</span>`;
  statusMessage.classList.remove('hidden');
}

function formatNumber(num) {
  return num === null || num === undefined ? '-' : num.toLocaleString();
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

// Render Profile
function renderProfile(profile) {
  let reposHtml = '';
  const repos = profile.top_repositories || [];
  if (repos.length === 0) {
    reposHtml = '<p class="repo-desc">No repositories available.</p>';
  } else {
    reposHtml = repos.slice(0, 6).map(repo => `
      <div class="repo-card">
        <div class="repo-name"><a href="${repo.html_url}" target="_blank">${repo.name}</a></div>
        <p class="repo-desc">${repo.description || 'No description'}</p>
        <div class="repo-meta">
          <span><i class="ph-fill ph-star"></i> ${formatNumber(repo.stars)}</span>
          <span><i class="ph-fill ph-git-fork"></i> ${formatNumber(repo.forks)}</span>
          ${repo.language ? `<span><i class="ph-fill ph-code"></i> ${repo.language}</span>` : ''}
        </div>
      </div>
    `).join('');
  }

  const html = `
    <div class="profile-dashboard">
      <div class="profile-sidebar">
        <div class="card user-card">
          <img src="${profile.avatar_url}" alt="Avatar" />
          <h3><a href="${profile.html_url}" target="_blank">${profile.name || profile.username}</a></h3>
          <p class="username">@${profile.username}</p>
          <p class="bio">${profile.bio || ''}</p>
        </div>
        <div class="card stat-box highlight">
          <span class="stat-label">Profile Score</span>
          <span class="stat-value">${profile.profile_score?.toFixed(1) || '-'}</span>
        </div>
        <div class="card stat-box">
          <span class="stat-label">Trending Score</span>
          <span class="stat-value">${profile.trending_score?.toFixed(1) || '-'}</span>
        </div>
      </div>
      <div class="profile-main">
        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-label">Followers</span>
            <span class="stat-value">${formatNumber(profile.followers)}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Following</span>
            <span class="stat-value">${formatNumber(profile.following)}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Public Repos</span>
            <span class="stat-value">${formatNumber(profile.public_repos)}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Top Language</span>
            <span class="stat-value">${profile.most_used_language || 'N/A'}</span>
          </div>
        </div>
        <div class="repos-container">
          <h3><i class="ph ph-book-bookmark"></i> Top Repositories</h3>
          <div class="repo-grid">
            ${reposHtml}
          </div>
        </div>
      </div>
    </div>
  `;
  profileContainer.innerHTML = html;
  profileContainer.classList.remove('hidden');
}

// Render Comparison
function renderCompare(comparison) {
  const users = Object.keys(comparison.metrics?.followers?.values || {}).map(k => comparison.metrics.followers.values[k].username);
  
  const headers = users.map(u => `<th>${u}</th>`).join('');
  
  const rows = Object.entries(comparison.metrics || {}).map(([metric, data]) => {
    const metricName = metric.replace(/_/g, ' ');
    const cells = data.values.map(v => `<td><strong>${formatNumber(v.value)}</strong></td>`).join('');
    return `<tr><td>${metricName}</td>${cells}</tr>`;
  }).join('');

  const winnerHtml = comparison.winner?.username 
    ? `<div class="compare-winner"><i class="ph-fill ph-trophy"></i> <strong>Winner: ${comparison.winner.username}</strong></div>`
    : '';

  const html = `
    <div class="compare-table-wrapper">
      ${winnerHtml}
      <table class="compare-table">
        <thead>
          <tr>
            <th>Metric</th>
            ${headers}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
  compareContainer.innerHTML = html;
  compareContainer.classList.remove('hidden');
}

// Event Listeners
analyzeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return;

  switchView('home');
  document.querySelector('.hero-section').style.display = 'none'; // hide hero once searched
  profileContainer.classList.add('hidden');
  setStatus(`Analyzing @${username}...`, 'info');

  try {
    const profile = await fetchApi(`/api/github/analyze/${encodeURIComponent(username)}`, { method: 'POST' });
    renderProfile(profile);
    setStatus(`Successfully analyzed @${profile.username}`, 'success');
  } catch (err) {
    setStatus(err.message, 'error');
  }
});

compareForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const raw = compareInput.value.trim();
  if (!raw) return;

  compareContainer.classList.add('hidden');
  setStatus(`Comparing profiles...`, 'info');

  try {
    const users = raw.split(',').map(v => v.trim()).filter(Boolean);
    if (users.length < 2) throw new Error('Enter at least two usernames');
    const params = new URLSearchParams({ users: users.join(',') });
    const comparison = await fetchApi(`/api/github/compare?${params.toString()}`);
    renderCompare(comparison);
    setStatus('Comparison complete', 'success');
  } catch (err) {
    setStatus(err.message, 'error');
  }
});
