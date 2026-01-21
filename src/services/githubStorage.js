// GitHub API service for storing data in a repository
const GITHUB_API = 'https://api.github.com';
const DATA_FILE = 'todo-data.json';

class GitHubStorage {
  constructor() {
    this.token = null;
    this.repo = null;
    this.owner = null;
    this.fileSha = null;
    this.saveTimeout = null;
  }

  configure(token, repo) {
    this.token = token;
    if (repo) {
      const [owner, repoName] = repo.split('/');
      this.owner = owner;
      this.repo = repoName;
    }
  }

  isConfigured() {
    return !!(this.token && this.owner && this.repo);
  }

  async testConnection() {
    if (!this.isConfigured()) {
      throw new Error('GitHub not configured');
    }

    const response = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Repository not found. Make sure the repo exists and you have access.');
      }
      if (response.status === 401) {
        throw new Error('Invalid token. Please check your Personal Access Token.');
      }
      throw new Error('Failed to connect to GitHub');
    }

    return true;
  }

  async load() {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(
        `${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${DATA_FILE}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.status === 404) {
        // File doesn't exist yet
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to load data from GitHub');
      }

      const fileData = await response.json();
      this.fileSha = fileData.sha;

      // Decode base64 content
      const content = atob(fileData.content);
      return JSON.parse(content);
    } catch (e) {
      console.error('Error loading from GitHub:', e);
      throw e;
    }
  }

  async save(data) {
    if (!this.isConfigured()) {
      throw new Error('GitHub not configured');
    }

    const content = btoa(JSON.stringify(data, null, 2));

    const body = {
      message: `Update todo data - ${new Date().toISOString()}`,
      content,
    };

    // Include SHA if updating existing file
    if (this.fileSha) {
      body.sha = this.fileSha;
    }

    const response = await fetch(
      `${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${DATA_FILE}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save to GitHub');
    }

    const result = await response.json();
    this.fileSha = result.content.sha;
    return result;
  }

  // Debounced save to avoid too many API calls
  debouncedSave(data, delay = 2000) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    return new Promise((resolve, reject) => {
      this.saveTimeout = setTimeout(async () => {
        try {
          const result = await this.save(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      }, delay);
    });
  }
}

const githubStorage = new GitHubStorage();
export default githubStorage;
